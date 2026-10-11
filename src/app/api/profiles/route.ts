import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { getStoredProfiles, saveStoredProfiles, UserProfile } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    if (!phone && !email) {
      return NextResponse.json({ success: false, error: 'Phone or email required' }, { status: 400 });
    }

    const cleanPhone = phone ? phone.trim().replace(/\D/g, '').slice(-10) : null;

    // 1. Check Supabase first
    try {
      const supabase = getAdminSupabase();
      let query = supabase.from('profiles').select('*');
      if (cleanPhone) query = query.eq('phone', cleanPhone);
      else if (email) query = query.eq('email', email);

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, profile: data });
      }
    } catch (e) {
      // Supabase query error, fallback to stored profiles
    }

    // 2. Safe storage fallback
    const profiles = getStoredProfiles();
    const found = profiles.find(p => (cleanPhone && p.phone === cleanPhone) || (email && p.email === email));

    return NextResponse.json({ success: true, profile: found || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, phone, email, avatar_url, user_id } = body;

    if (!full_name || !phone) {
      return NextResponse.json({ success: false, error: 'Full name and 10-digit phone number are required' }, { status: 400 });
    }

    const cleanPhone = String(phone).trim().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ success: false, error: 'Please provide a valid 10-digit mobile number' }, { status: 400 });
    }

    const newProfile: UserProfile = {
      id: 'usr-' + Date.now(),
      user_id: user_id || null,
      full_name: full_name.trim(),
      phone: cleanPhone,
      email: email?.trim() || null,
      avatar_url: avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name.trim())}`,
      created_at: new Date().toISOString(),
    };

    // 1. Try saving to Supabase first
    try {
      const supabase = getAdminSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .upsert([newProfile], { onConflict: 'phone' })
        .select()
        .single();

      if (!error && data) {
        // Also sync in-memory / local store safely
        const profiles = getStoredProfiles();
        const existingIdx = profiles.findIndex(p => p.phone === cleanPhone);
        if (existingIdx >= 0) {
          profiles[existingIdx] = { ...profiles[existingIdx], ...data };
        } else {
          profiles.unshift(data);
        }
        saveStoredProfiles(profiles);
        return NextResponse.json({ success: true, profile: data });
      }
    } catch (e) {
      // Continue to fallback
    }

    // 2. Fallback to safe local/memory storage (handles read-only Vercel environment)
    const profiles = getStoredProfiles();
    const existingIndex = profiles.findIndex(p => p.phone === cleanPhone);

    if (existingIndex >= 0) {
      profiles[existingIndex] = { ...profiles[existingIndex], ...newProfile, id: profiles[existingIndex].id };
      saveStoredProfiles(profiles);
      return NextResponse.json({ success: true, profile: profiles[existingIndex] });
    } else {
      profiles.unshift(newProfile);
      saveStoredProfiles(profiles);
    }

    return NextResponse.json({ success: true, profile: newProfile });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
