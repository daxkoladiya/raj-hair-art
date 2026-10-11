import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { getStoredProfilesAsync, saveStoredProfilesAsync, UserProfile } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    if (!id && !phone && !email) {
      return NextResponse.json({ success: false, error: 'User id, phone, or email required' }, { status: 400 });
    }

    const cleanPhone = phone ? phone.trim().replace(/\D/g, '').slice(-10) : null;
    const supabase = getAdminSupabase();

    // 1. Try querying Supabase profiles table directly by user ID, phone, or email
    try {
      let query = supabase.from('profiles').select('*');
      if (id) query = query.eq('id', id);
      else if (cleanPhone) query = query.eq('phone', cleanPhone);
      else if (email) query = query.eq('email', email);

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, profile: data });
      }
    } catch (e) {}

    // 2. Also check Supabase Auth User record (user_metadata and user.phone)
    if (id || email) {
      try {
        let authUser: any = null;
        if (id) {
          const { data: userData } = await supabase.auth.admin.getUserById(id);
          authUser = userData?.user;
        } else if (email) {
          const { data: usersData } = await supabase.auth.admin.listUsers();
          authUser = usersData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        }

        if (authUser) {
          const rawPhone = authUser.phone || authUser.user_metadata?.phone || '';
          const metaPhone = rawPhone.replace(/\D/g, '').slice(-10);

          if (metaPhone) {
            const profileFromAuth: UserProfile = {
              id: authUser.id,
              user_id: authUser.id,
              full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Patron',
              phone: metaPhone,
              email: authUser.email || null,
              avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
              created_at: authUser.created_at,
            };
            return NextResponse.json({ success: true, profile: profileFromAuth });
          }
        }
      } catch (e) {}
    }

    // 3. Fallback to Supabase Cloud Storage (profiles.json)
    const profiles = await getStoredProfilesAsync();
    const found = profiles.find(p =>
      (id && (p.id === id || p.user_id === id)) ||
      (cleanPhone && p.phone === cleanPhone) ||
      (email && p.email?.toLowerCase() === email.toLowerCase())
    );

    return NextResponse.json({ success: true, profile: found || null });
  } catch (err: any) {
    console.error('Error fetching profile:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, user_id, full_name, phone, email, avatar_url } = body;

    if (!full_name || !phone) {
      return NextResponse.json({ success: false, error: 'Full name and 10-digit phone number are required' }, { status: 400 });
    }

    const cleanPhone = String(phone).trim().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ success: false, error: 'Please provide a valid 10-digit mobile number' }, { status: 400 });
    }

    const userId = id || user_id || null;
    const supabase = getAdminSupabase();

    const newProfile: UserProfile = {
      id: userId || 'usr-' + Date.now(),
      user_id: userId,
      full_name: full_name.trim(),
      phone: cleanPhone,
      email: email?.trim() || null,
      avatar_url: avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name.trim())}`,
      created_at: new Date().toISOString(),
    };

    // 1. If user ID is provided, persist phone directly into Supabase Auth user_metadata & phone field
    if (userId) {
      try {
        await supabase.auth.admin.updateUserById(userId, {
          phone: `+91${cleanPhone}`,
          phone_confirm: true,
          user_metadata: {
            phone: cleanPhone,
            full_name: full_name.trim(),
          },
        });
      } catch (authUpdateErr) {
        console.warn('Supabase auth.admin.updateUserById note:', authUpdateErr);
      }
    }

    // 2. Attempt upsert into Supabase `profiles` table
    try {
      const { data: supaProfile, error: supaErr } = await supabase
        .from('profiles')
        .upsert([newProfile], { onConflict: userId ? 'id' : 'phone' })
        .select()
        .single();

      if (!supaErr && supaProfile) {
        // Also sync cloud storage
        const allProfiles = await getStoredProfilesAsync();
        const existingIdx = allProfiles.findIndex(p => p.id === supaProfile.id || p.phone === cleanPhone);
        if (existingIdx >= 0) {
          allProfiles[existingIdx] = { ...allProfiles[existingIdx], ...supaProfile };
        } else {
          allProfiles.unshift(supaProfile);
        }
        await saveStoredProfilesAsync(allProfiles);
        return NextResponse.json({ success: true, profile: supaProfile });
      }
    } catch (e) {}

    // 3. Fallback to Supabase Cloud Storage (profiles.json in atelier_db)
    const profiles = await getStoredProfilesAsync();
    const existingIndex = profiles.findIndex(p =>
      (userId && (p.id === userId || p.user_id === userId)) ||
      p.phone === cleanPhone
    );

    if (existingIndex >= 0) {
      profiles[existingIndex] = { ...profiles[existingIndex], ...newProfile, id: profiles[existingIndex].id };
      await saveStoredProfilesAsync(profiles);
      return NextResponse.json({ success: true, profile: profiles[existingIndex] });
    } else {
      profiles.unshift(newProfile);
      await saveStoredProfilesAsync(profiles);
      return NextResponse.json({ success: true, profile: newProfile });
    }
  } catch (err: any) {
    console.error('Error saving profile:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
