import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { getStoredAppointments, saveStoredAppointments, getStoredBarbers } from '@/lib/storage';
import { Appointment } from '@/types';

// Helper to normalize phone numbers (strip spaces, dashes, +91 etc. for 100% accurate matching)
export function normalizePhone(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.replace(/\D/g, ''); // keep only digits
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.slice(2);
  }
  return cleaned;
}

// Telegram Bot Alert Helper
async function sendTelegramAlert(barberChatId: string, booking: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === 'YOUR_BOT_TOKEN_HERE') {
    return;
  }

  const text = `✂️ RAJ HAIR ART APPOINTMENT ALERT!\n\n` +
               `Customer: ${booking.customer_name}\n` +
               `Phone: ${booking.customer_phone}\n` +
               `Email: ${booking.customer_email || 'N/A'}\n` +
               `Date: ${booking.booking_date}\n` +
               `Time: ${booking.time_slot}\n` +
               `Services: ${Array.isArray(booking.service_names) ? booking.service_names.join(', ') : booking.service_names}\n` +
               `Total: ₹${booking.total_amount}`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: barberChatId, text })
    });
  } catch (err) {
    console.error('[Telegram Send Failed]:', err);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const barberId = searchParams.get('barber_id');
    const phone = searchParams.get('phone');
    const customerId = searchParams.get('customer_id');

    // 1. Try Supabase first
    const supabase = getAdminSupabase();
    let supabaseAppointments: Appointment[] | null = null;

    try {
      let query = supabase
        .from('appointments')
        .select('*, barbers(name, photo_url, phone, experience_years)')
        .order('booking_date', { ascending: false })
        .order('time_slot', { ascending: true });

      if (date) query = query.eq('booking_date', date);
      if (barberId && barberId !== 'all') query = query.eq('barber_id', barberId);
      if (customerId) query = query.eq('customer_id', customerId);

      const { data, error } = await query;
      if (!error && data) {
        supabaseAppointments = data;
      }
    } catch (e) {
      console.warn('Supabase query failed, switching to local store.');
    }

    // 2. Load from dual store (Supabase or local JSON storage)
    let appointments: Appointment[] = [];

    if (supabaseAppointments && supabaseAppointments.length > 0) {
      appointments = supabaseAppointments;
    } else {
      const stored = getStoredAppointments();
      const barbers = getStoredBarbers();

      appointments = stored.map(apt => ({
        ...apt,
        barbers: barbers.find(b => b.id === apt.barber_id)
      }));

      if (date) {
        appointments = appointments.filter(a => a.booking_date === date);
      }
      if (barberId && barberId !== 'all') {
        appointments = appointments.filter(a => a.barber_id === barberId);
      }
      if (customerId) {
        appointments = appointments.filter(a => a.customer_id === customerId);
      }
    }

    // Filter by normalized phone for Patron Reservations view
    if (phone && phone.trim()) {
      const targetClean = normalizePhone(phone.trim());
      appointments = appointments.filter((apt: any) => {
        const aptClean = normalizePhone(apt.customer_phone);
        return (
          apt.customer_phone?.trim() === phone.trim() ||
          (targetClean.length >= 7 && (aptClean === targetClean || aptClean.endsWith(targetClean) || targetClean.endsWith(aptClean)))
        );
      });
    }

    return NextResponse.json({ success: true, appointments });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_id,
      barber_id,
      booking_date,
      time_slot,
      service_names,
      total_amount,
      customer_name,
      customer_phone,
      customer_email,
    } = body;

    if (!booking_date || !time_slot || !service_names || !customer_name || !customer_phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required reservation fields' },
        { status: 400 }
      );
    }

    const cleanPhone = String(customer_phone).trim().replace(/\s+/g, '');
    const cleanName = String(customer_name).trim();

    // 1. Check slot conflict in Supabase first, then local storage
    let isConflict = false;
    const supabase = getAdminSupabase();

    try {
      let supaQuery = supabase
        .from('appointments')
        .select('id')
        .eq('booking_date', booking_date)
        .eq('time_slot', time_slot)
        .neq('status', 'cancelled');

      if (barber_id) {
        supaQuery = supaQuery.eq('barber_id', barber_id);
      }

      const { data: conflictData, error: conflictErr } = await supaQuery;
      if (!conflictErr && conflictData && conflictData.length > 0) {
        isConflict = true;
      }
    } catch (e) {}

    if (!isConflict) {
      const allStored = getStoredAppointments();
      isConflict = allStored.some(
        a =>
          a.booking_date === booking_date &&
          a.time_slot === time_slot &&
          (barber_id ? a.barber_id === barber_id : true) &&
          a.status !== 'cancelled'
      );
    }

    if (isConflict) {
      return NextResponse.json(
        { success: false, error: 'This time slot is already reserved. Please choose another time slot.' },
        { status: 409 }
      );
    }

    const newAppointment: Appointment = {
      id: 'apt-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
      customer_id: customer_id || null,
      barber_id: barber_id || null,
      booking_date,
      time_slot,
      service_names: Array.isArray(service_names) ? service_names : [service_names],
      total_amount: Number(total_amount) || 0,
      customer_name: cleanName,
      customer_phone: cleanPhone,
      customer_email: customer_email?.trim() || null,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };

    // 2. Commit to Supabase first
    try {
      const { data: supaData, error: supaErr } = await supabase
        .from('appointments')
        .insert([{
          customer_id: newAppointment.customer_id,
          barber_id: newAppointment.barber_id,
          booking_date: newAppointment.booking_date,
          time_slot: newAppointment.time_slot,
          service_names: newAppointment.service_names,
          total_amount: newAppointment.total_amount,
          customer_name: newAppointment.customer_name,
          customer_phone: newAppointment.customer_phone,
          customer_email: newAppointment.customer_email,
          status: newAppointment.status,
        }])
        .select('*, barbers(*)');

      if (!supaErr && supaData && supaData[0]) {
        newAppointment.id = supaData[0].id;
        newAppointment.barbers = supaData[0].barbers;
      }
    } catch (e) {
      console.warn('Supabase mirror skipped:', e);
    }

    // 3. Save to safe storage fallback (in-memory or /tmp on Vercel)
    try {
      const allStored = getStoredAppointments();
      const updated = [newAppointment, ...allStored.filter(a => a.id !== newAppointment.id)];
      saveStoredAppointments(updated);
    } catch (e) {}

    // Attach barber metadata for instant UI display
    const barbers = getStoredBarbers();
    newAppointment.barbers = barbers.find(b => b.id === barber_id);

    // Trigger Telegram notification
    if (newAppointment.barbers && newAppointment.barbers.telegram_chat_id) {
      sendTelegramAlert(newAppointment.barbers.telegram_chat_id, newAppointment).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      appointment: newAppointment,
      message: 'Reservation committed successfully.'
    });
  } catch (err: any) {
    console.error('Create appointment error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Appointment id and status required' }, { status: 400 });
    }

    const allStored = getStoredAppointments();
    let updatedAppt: Appointment | null = null;

    const modified = allStored.map(apt => {
      if (apt.id === id) {
        updatedAppt = { ...apt, status };
        return updatedAppt;
      }
      return apt;
    });

    saveStoredAppointments(modified);

    // Also update Supabase
    try {
      const supabase = getAdminSupabase();
      await supabase.from('appointments').update({ status }).eq('id', id);
    } catch (e) {}

    return NextResponse.json({ success: true, appointment: updatedAppt });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
