import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { DEFAULT_SERVICES } from '@/types';

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from('services').select('*').order('price', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: true, services: DEFAULT_SERVICES });
    }

    return NextResponse.json({ success: true, services: data });
  } catch (err: any) {
    return NextResponse.json({ success: true, services: DEFAULT_SERVICES });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, duration_minutes } = body;

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('services')
      .insert([{ name, price: Number(price), duration_minutes: Number(duration_minutes) || 30 }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, service: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
