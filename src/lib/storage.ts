import { getAdminSupabase } from './supabase';
import { Appointment, Barber, Service, DEFAULT_SERVICES, DEFAULT_BARBERS } from '@/types';

export interface UserProfile {
  id: string;
  user_id?: string | null;
  full_name: string;
  phone: string;
  email?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

const BUCKET_NAME = 'atelier_db';

// Ensure Supabase Storage bucket exists
let bucketChecked = false;
async function ensureBucket() {
  if (bucketChecked) return;
  try {
    const supabase = getAdminSupabase();
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some(b => b.name === BUCKET_NAME)) {
      await supabase.storage.createBucket(BUCKET_NAME, { public: false });
    }
    bucketChecked = true;
  } catch (err) {
    // console.warn('Bucket check error:', err);
  }
}

// Download JSON object from Supabase Storage
async function downloadJson<T>(filename: string, defaultValue: T): Promise<T> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(filename);
    if (!error && data) {
      const text = await data.text();
      return JSON.parse(text) as T;
    }
  } catch (err) {
    console.warn(`Error downloading ${filename}:`, err);
  }
  return defaultValue;
}

// Upload JSON object to Supabase Storage
async function uploadJson<T>(filename: string, value: T): Promise<boolean> {
  try {
    const supabase = getAdminSupabase();
    const content = JSON.stringify(value, null, 2);
    const { error } = await supabase.storage.from(BUCKET_NAME).upload(filename, content, {
      upsert: true,
      contentType: 'application/json',
    });
    if (error) {
      console.error(`Supabase upload error for ${filename}:`, error);
      throw new Error(`Failed to upload ${filename}: ${error.message}`);
    }
    return true;
  } catch (err: any) {
    console.error(`Error uploading ${filename}:`, err);
    throw err;
  }
}

// ==========================================
// APPOINTMENTS
// ==========================================
export async function getStoredAppointmentsAsync(): Promise<Appointment[]> {
  // 1. Try Supabase Table first
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('appointments')
      .select('*, barbers(name, photo_url, phone, experience_years)')
      .order('booking_date', { ascending: false });
    if (!error && data && data.length > 0) {
      return data as Appointment[];
    }
  } catch (e) {}

  // 2. Fallback to Supabase Cloud Storage (Global across all accounts & instances)
  return await downloadJson<Appointment[]>('appointments.json', []);
}

export async function saveStoredAppointmentsAsync(appts: Appointment[]): Promise<void> {
  // Always persist into Supabase Cloud Storage
  await uploadJson('appointments.json', appts);
}

// Synchronous fallbacks for backwards compatibility if needed
export function getStoredAppointments(): Appointment[] {
  return [];
}
export function saveStoredAppointments(_appts: Appointment[]): void {}

// ==========================================
// PROFILES
// ==========================================
export async function getStoredProfilesAsync(): Promise<UserProfile[]> {
  // 1. Check Supabase profiles table
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data && data.length > 0) {
      return data as UserProfile[];
    }
  } catch (e) {}

  // 2. Fallback to Supabase Cloud Storage
  return await downloadJson<UserProfile[]>('profiles.json', []);
}

export async function saveStoredProfilesAsync(profiles: UserProfile[]): Promise<void> {
  await uploadJson('profiles.json', profiles);
}

export function getStoredProfiles(): UserProfile[] {
  return [];
}
export function saveStoredProfiles(_profiles: UserProfile[]): void {}

// ==========================================
// BARBERS
// ==========================================
export async function getStoredBarbersAsync(): Promise<Barber[]> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from('barbers').select('*');
    if (!error && data && data.length > 0) {
      return data as Barber[];
    }
  } catch (e) {}
  return await downloadJson<Barber[]>('barbers.json', DEFAULT_BARBERS);
}

export async function saveStoredBarbersAsync(barbers: Barber[]): Promise<void> {
  await uploadJson('barbers.json', barbers);
}

export function getStoredBarbers(): Barber[] {
  return DEFAULT_BARBERS;
}
export function saveStoredBarbers(_barbers: Barber[]): void {}

// ==========================================
// SERVICES
// ==========================================
export async function getStoredServicesAsync(): Promise<Service[]> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from('services').select('*');
    if (!error && data && data.length > 0) {
      return data as Service[];
    }
  } catch (e) {}
  return await downloadJson<Service[]>('services.json', DEFAULT_SERVICES);
}

export async function saveStoredServicesAsync(services: Service[]): Promise<void> {
  await uploadJson('services.json', services);
}

export function getStoredServices(): Service[] {
  return DEFAULT_SERVICES;
}
export function saveStoredServices(_services: Service[]): void {}
