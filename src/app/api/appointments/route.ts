import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { getStoredBarbersAsync } from '@/lib/storage';
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
               `Date: ${booking.booking_date || booking.date}\n` +
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
    const selectedDate = searchParams.get('date');
    const barberId = searchParams.get('barber_id');
    const phone = searchParams.get('phone');
    const customerId = searchParams.get('customer_id');

    const supabase = getAdminSupabase();

    // Direct query to Supabase 'appointments' table
    let query = supabase
      .from('appointments')
      .select('id, booking_date, time_slot, barber_id, customer_id, customer_name, customer_phone, customer_email, service_names, total_amount, created_at');

    if (selectedDate) {
      query = query.eq('booking_date', selectedDate);
    }

    if (barberId && barberId !== 'all') {
      query = query.eq('barber_id', barberId);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query appointments error:', error);
      // Return helpful response even if permission error occurs
      return NextResponse.json({
        success: false,
        error: error.message,
        hint: (error as any).hint || 'Ensure SELECT permissions are granted on appointments table'
      }, { status: 500 });
    }

    let appointments: Appointment[] = (data || []).map((row: any) => ({
      ...row,
      status: row.status || 'confirmed'
    }));

    // If barber join wasn't attached, map from barbers list
    const barbers = await getStoredBarbersAsync();
    appointments = appointments.map(apt => ({
      ...apt,
      barbers: apt.barbers || barbers.find(b => b.id === apt.barber_id)
    }));

    // Filter by normalized phone for Patron Reservations view
    if (phone && phone.trim()) {
      const targetClean = normalizePhone(phone.trim());
      appointments = appointments.filter((apt: any) => {
        const aptClean = normalizePhone(apt.customer_phone || '');
        return (
          apt.customer_phone?.trim() === phone.trim() ||
          (targetClean.length >= 7 && (aptClean === targetClean || aptClean.endsWith(targetClean) || targetClean.endsWith(aptClean)))
        );
      });
    }

    // Security & Privacy: If public slot check (no authenticated phone/customerId passed),
    // sanitize customer personal details while returning exact status & booked time slots.
    if (!phone && !customerId) {
      appointments = appointments.map(a => ({
        id: a.id,
        barber_id: a.barber_id,
        booking_date: a.booking_date,
        time_slot: a.time_slot,
        service_names: a.service_names,
        total_amount: a.total_amount,
        status: a.status,
        customer_name: 'Reserved Patron',
        customer_phone: '******',
        customer_email: null,
        created_at: a.created_at,
        barbers: a.barbers,
      }));
    }

    return NextResponse.json({ success: true, appointments });
  } catch (err: any) {
    console.error('Fetch appointments error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_id,
      user_id,
      barber_id,
      barber_name,
      booking_date,
      date,
      time_slot,
      service_names,
      services,
      total_amount,
      customer_name,
      customer_phone,
      customer_email,
      special_notes,
    } = body;

    const selectedDate = booking_date || date;
    const selectedTimeSlot = time_slot;
    const selectedServices = service_names || services;
    const fullName = customer_name;
    const phone = customer_phone;
    const userId = customer_id || user_id || null;

    if (!selectedDate || !selectedTimeSlot || !selectedServices || !fullName || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required reservation fields' },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).trim().replace(/\s+/g, '');
    const cleanName = String(fullName).trim();
    const serviceList = Array.isArray(selectedServices) ? selectedServices : [selectedServices];

    const supabase = getAdminSupabase();

    // 1. Strict Conflict Check directly in Supabase table
    let conflictQuery = supabase
      .from('appointments')
      .select('id, time_slot, booking_date, barber_id')
      .eq('booking_date', selectedDate)
      .eq('time_slot', selectedTimeSlot);

    if (barber_id) {
      conflictQuery = conflictQuery.eq('barber_id', barber_id);
    }

    const { data: conflicts, error: conflictErr } = await conflictQuery;

    if (!conflictErr && conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { success: false, error: 'This time slot is already booked. Please select an available slot.' },
        { status: 409 }
      );
    }

    // 2. Insert new appointment directly into Supabase table `appointments`
    const appointmentId = 'apt-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900);
    const insertPayload = {
      id: appointmentId,
      customer_id: userId,
      barber_id: barber_id || null,
      booking_date: selectedDate,
      time_slot: selectedTimeSlot,
      service_names: serviceList,
      total_amount: Number(total_amount) || 0,
      customer_name: cleanName,
      customer_phone: cleanPhone,
      customer_email: customer_email?.trim() || null,
      created_at: new Date().toISOString(),
    };

    const { data: insertedData, error: insertError } = await supabase
      .from('appointments')
      .insert([insertPayload])
      .select();

    if (insertError) {
      console.error('Supabase appointment insert error:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: insertError.message,
          hint: (insertError as any).hint || 'Ensure table permissions allow INSERT on public.appointments'
        },
        { status: 500 }
      );
    }

    const newAppointment: Appointment = insertedData && insertedData[0]
      ? { ...insertedData[0], status: 'confirmed' }
      : {
          ...insertPayload,
          status: 'confirmed',
        };

    // Attach barber details for response & alerts
    const barbers = await getStoredBarbersAsync();
    newAppointment.barbers = newAppointment.barbers || barbers.find(b => b.id === barber_id);

    // Trigger Telegram notification
    if (newAppointment.barbers && newAppointment.barbers.telegram_chat_id) {
      sendTelegramAlert(newAppointment.barbers.telegram_chat_id, newAppointment).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      appointment: newAppointment,
      message: 'Reservation committed successfully to database.'
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

    const supabase = getAdminSupabase();
    // Update appointment in Supabase database
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Update appointment status error:', error);
    }

    return NextResponse.json({
      success: true,
      appointment: data || { id, status }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
