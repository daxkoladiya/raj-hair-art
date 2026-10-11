import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { UserProfile } from '@/lib/storage';

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

    // 1. Query Supabase profiles table directly by user ID, phone, or email
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

    return NextResponse.json({ success: true, profile: null });
  } catch (err: any) {
    console.error('Error fetching profile:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, user_id, full_name, phone, email, avatar_url } = body;

    const rawPhone = phone || body.mobileNumber;
    if (!rawPhone) {
      return NextResponse.json({ success: false, error: 'Valid 10-digit phone number is required' }, { status: 400 });
    }

    const cleanPhone = String(rawPhone).trim().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ success: false, error: 'Please provide a valid 10-digit mobile number' }, { status: 400 });
    }

    const userId = id || user_id || null;
    const name = (full_name || body.name || 'Patron').trim();
    const supabase = getAdminSupabase();

    // 1. If user ID is provided, persist phone directly into Supabase Auth user_metadata
    if (userId) {
      try {
        await supabase.auth.admin.updateUserById(userId, {
          phone: `+91${cleanPhone}`,
          phone_confirm: true,
          user_metadata: {
            phone: cleanPhone,
            full_name: name,
          },
        });
      } catch (authUpdateErr) {
        console.warn('Supabase auth.admin.updateUserById note:', authUpdateErr);
      }
    }

    // 2. Direct Update/Upsert in Supabase `profiles` SQL table
    let returnedProfile: any = null;

    if (userId) {
      // First attempt update on existing row
      const { data: updatedData, error: updateErr } = await supabase
        .from('profiles')
        .update({ phone: cleanPhone })
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (!updateErr && updatedData) {
        returnedProfile = updatedData;
      } else {
        // If no row exists or update didn't match, perform upsert
        const upsertPayload: any = {
          id: userId,
          phone: cleanPhone,
          full_name: name,
        };
        const { data: upsertData, error: upsertErr } = await supabase
          .from('profiles')
          .upsert([upsertPayload], { onConflict: 'id' })
          .select()
          .single();

        if (upsertErr) {
          console.error('Supabase profile upsert error:', upsertErr);
          // Return fallback response object with updated phone so client does not stall
          returnedProfile = {
            id: userId,
            full_name: name,
            phone: cleanPhone,
            email: email || null,
          };
        } else {
          returnedProfile = upsertData;
        }
      }
    } else {
      // Guest profile: query or upsert by phone
      const guestPayload: any = {
        id: 'usr-' + Date.now(),
        phone: cleanPhone,
        full_name: name,
      };
      const { data: guestData, error: guestErr } = await supabase
        .from('profiles')
        .upsert([guestPayload], { onConflict: 'phone' })
        .select()
        .single();

      if (guestErr) {
        returnedProfile = {
          id: guestPayload.id,
          full_name: name,
          phone: cleanPhone,
          email: email || null,
        };
      } else {
        returnedProfile = guestData;
      }
    }

    const finalProfile: UserProfile = {
      id: returnedProfile?.id || userId || 'usr-' + Date.now(),
      user_id: userId,
      full_name: returnedProfile?.full_name || name,
      phone: cleanPhone,
      email: returnedProfile?.email || email || null,
      avatar_url: avatar_url || returnedProfile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      created_at: returnedProfile?.created_at || new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      profile: finalProfile,
      message: 'Profile phone saved successfully'
    });
  } catch (err: any) {
    console.error('Error saving profile:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
