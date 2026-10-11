import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { DEFAULT_BARBERS } from '@/types';

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from('barbers').select('*').order('experience_years', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: true, barbers: DEFAULT_BARBERS });
    }

    return NextResponse.json({ success: true, barbers: data });
  } catch (err: any) {
    return NextResponse.json({ success: true, barbers: DEFAULT_BARBERS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, telegram_chat_id, experience_years, photo_url } = body;

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('barbers')
      .insert([{
        name,
        phone,
        email: email || null,
        telegram_chat_id: telegram_chat_id || null,
        experience_years: Number(experience_years) || 1,
        photo_url: photo_url || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, barber: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, is_active } = body;

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('barbers')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, barber: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Barber ID is required' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { error } = await supabase.from('barbers').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Barber removed' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
