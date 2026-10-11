import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAdminSupabase } from '@/lib/supabase';
import PDFDocument from 'pdfkit';

export async function GET() {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const resend = new Resend(resendApiKey);
    const supabase = getAdminSupabase();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // 1. Fetch barbers and their bookings for tomorrow
    const { data: barbers, error: barberErr } = await supabase
      .from('barbers')
      .select('*')
      .eq('is_active', true);

    const dispatchLog: any[] = [];

    if (barbers && barbers.length > 0) {
      for (const barber of barbers) {
        const { data: appts } = await supabase
          .from('appointments')
          .select('*')
          .eq('barber_id', barber.id)
          .eq('booking_date', tomorrowStr)
          .order('time_slot', { ascending: true });

        if (!appts || appts.length === 0 || !barber.email) {
          dispatchLog.push({
            barber: barber.name,
            status: 'skipped',
            reason: !barber.email ? 'No email configured' : 'No appointments scheduled for tomorrow',
          });
          continue;
        }

        // 2. Generate PDF in memory
        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
          const doc = new PDFDocument({ margin: 36, size: 'A4' });
          const buffers: Buffer[] = [];
          doc.on('data', (chunk) => buffers.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(buffers)));
          doc.on('error', (err) => reject(err));

          // Stylized Luxury Header
          doc.fillColor('#0A0A0A').rect(0, 0, doc.page.width, 100).fill();
          doc.fillColor('#C8102E').fontSize(22).font('Helvetica-Bold').text('RAJ HAIR ART BY ANIL', 40, 30);
          doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica').text('ATELIER DE COIFFURE & ROYAL GROOMING', 40, 58);
          doc.fillColor('#E5E5E5').fontSize(10).text(`Date: ${tomorrowStr} | Barber: ${barber.name}`, 40, 75);

          doc.moveDown(4);
          doc.fillColor('#0A0A0A').fontSize(14).font('Helvetica-Bold').text(`Daily Schedule Overview (${appts.length} Appointments Scheduled)`, 40, 120);
          doc.strokeColor('#C8102E').lineWidth(1.5).moveTo(40, 140).lineTo(550, 140).stroke();

          let yPosition = 160;
          appts.forEach((apt, idx) => {
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 50;
            }

            doc.fillColor('#1F1F1F').roundedRect(40, yPosition, 515, 65, 6).fillAndStroke('#E5E5E5', '#C8102E');
            doc.fillColor('#0A0A0A').fontSize(12).font('Helvetica-Bold').text(`${idx + 1}. [${apt.time_slot}] - ${apt.customer_name}`, 55, yPosition + 12);
            doc.fillColor('#444444').fontSize(10).font('Helvetica').text(`Phone: ${apt.customer_phone}  |  Email: ${apt.customer_email || 'N/A'}`, 55, yPosition + 28);
            
            const servicesStr = Array.isArray(apt.service_names) ? apt.service_names.join(', ') : apt.service_names;
            doc.fillColor('#C8102E').fontSize(10).font('Helvetica-Bold').text(`Services: ${servicesStr}  |  Total: Rs. ${apt.total_amount}`, 55, yPosition + 44);

            yPosition += 75;
          });

          // Footer
          doc.fontSize(8).fillColor('#888888').text(`Generated automatically by RAJ Hair Art System • Generated at ${new Date().toLocaleString()}`, 40, doc.page.height - 30, { align: 'center' });

          doc.end();
        });

        // 3. Send email with attached PDF
        if (resendApiKey && resendApiKey !== 're_iipjGMmM_8aFDQ6qcTM8fJx4G7fRmjwgX') {
          try {
            await resend.emails.send({
              from: 'RAJ Hair Art <onboarding@resend.dev>',
              to: barber.email,
              subject: `Schedule for Tomorrow (${tomorrowStr}) - RAJ Hair Art`,
              text: `Hello ${barber.name},\n\nPlease find attached your appointment schedule for tomorrow (${tomorrowStr}).\n\nBest regards,\nRAJ Hair Art by Anil`,
              attachments: [{ filename: `Schedule-${tomorrowStr}.pdf`, content: pdfBuffer }],
            });
            dispatchLog.push({ barber: barber.name, status: 'dispatched', email: barber.email, apptCount: appts.length });
          } catch (mailErr: any) {
            dispatchLog.push({ barber: barber.name, status: 'email_error', error: mailErr.message });
          }
        } else {
          dispatchLog.push({ barber: barber.name, status: 'pdf_generated_mock_send', apptCount: appts.length });
        }
      }
    }

    // 4. Execute 15-day data retention purge via RPC or raw query
    try {
      await supabase.rpc('purge_old_appointments');
    } catch (purgeErr) {
      console.warn('Auto purge RPC note:', purgeErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Daily schedule processing finished and 15-day data retention executed.',
      tomorrowDate: tomorrowStr,
      dispatchLog,
    });
  } catch (err: any) {
    console.error('Dispatch PDF Cron Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
