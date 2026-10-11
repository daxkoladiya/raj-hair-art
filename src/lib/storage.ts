import fs from 'fs';
import path from 'path';
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

const DATA_DIR = path.join(process.cwd(), '.data');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');
const BARBERS_FILE = path.join(DATA_DIR, 'barbers.json');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(APPOINTMENTS_FILE)) {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(BARBERS_FILE)) {
    fs.writeFileSync(BARBERS_FILE, JSON.stringify(DEFAULT_BARBERS, null, 2));
  }
  if (!fs.existsSync(SERVICES_FILE)) {
    fs.writeFileSync(SERVICES_FILE, JSON.stringify(DEFAULT_SERVICES, null, 2));
  }
  if (!fs.existsSync(PROFILES_FILE)) {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify([], null, 2));
  }
}

// Storage Helpers
export function getStoredAppointments(): Appointment[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(APPOINTMENTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function saveStoredAppointments(appts: Appointment[]) {
  ensureDataDir();
  fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appts, null, 2));
}

export function getStoredBarbers(): Barber[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(BARBERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return DEFAULT_BARBERS;
  }
}

export function saveStoredBarbers(barbers: Barber[]) {
  ensureDataDir();
  fs.writeFileSync(BARBERS_FILE, JSON.stringify(barbers, null, 2));
}

export function getStoredServices(): Service[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(SERVICES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return DEFAULT_SERVICES;
  }
}

export function saveStoredServices(services: Service[]) {
  ensureDataDir();
  fs.writeFileSync(SERVICES_FILE, JSON.stringify(services, null, 2));
}

export function getStoredProfiles(): UserProfile[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(PROFILES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function saveStoredProfiles(profiles: UserProfile[]) {
  ensureDataDir();
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2));
}
