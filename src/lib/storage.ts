import fs from 'fs';
import path from 'path';
import os from 'os';
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

// In serverless environments like Vercel, the project root is read-only (/var/task).
// We use os.tmpdir() (/tmp) which is always writable, or fallback to in-memory state.
const isServerless = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const DATA_DIR = isServerless
  ? path.join(os.tmpdir(), 'raj_barber_data')
  : path.join(process.cwd(), '.data');

const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');
const BARBERS_FILE = path.join(DATA_DIR, 'barbers.json');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');

// In-memory runtime fallbacks if filesystem is unavailable or restricted
let memoryAppointments: Appointment[] = [];
let memoryBarbers: Barber[] = [...DEFAULT_BARBERS];
let memoryServices: Service[] = [...DEFAULT_SERVICES];
let memoryProfiles: UserProfile[] = [];

function ensureDataDir() {
  try {
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
  } catch (err) {
    // If filesystem write fails (e.g. read-only env), operate purely in memory
    // console.warn('Local filesystem write restricted, using in-memory state:', err);
  }
}

// Storage Helpers
export function getStoredAppointments(): Appointment[] {
  ensureDataDir();
  try {
    if (fs.existsSync(APPOINTMENTS_FILE)) {
      const raw = fs.readFileSync(APPOINTMENTS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {}
  return memoryAppointments;
}

export function saveStoredAppointments(appts: Appointment[]) {
  memoryAppointments = appts;
  ensureDataDir();
  try {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appts, null, 2));
  } catch (err) {}
}

export function getStoredBarbers(): Barber[] {
  ensureDataDir();
  try {
    if (fs.existsSync(BARBERS_FILE)) {
      const raw = fs.readFileSync(BARBERS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {}
  return memoryBarbers;
}

export function saveStoredBarbers(barbers: Barber[]) {
  memoryBarbers = barbers;
  ensureDataDir();
  try {
    fs.writeFileSync(BARBERS_FILE, JSON.stringify(barbers, null, 2));
  } catch (err) {}
}

export function getStoredServices(): Service[] {
  ensureDataDir();
  try {
    if (fs.existsSync(SERVICES_FILE)) {
      const raw = fs.readFileSync(SERVICES_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {}
  return memoryServices;
}

export function saveStoredServices(services: Service[]) {
  memoryServices = services;
  ensureDataDir();
  try {
    fs.writeFileSync(SERVICES_FILE, JSON.stringify(services, null, 2));
  } catch (err) {}
}

export function getStoredProfiles(): UserProfile[] {
  ensureDataDir();
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const raw = fs.readFileSync(PROFILES_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {}
  return memoryProfiles;
}

export function saveStoredProfiles(profiles: UserProfile[]) {
  memoryProfiles = profiles;
  ensureDataDir();
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2));
  } catch (err) {}
}

