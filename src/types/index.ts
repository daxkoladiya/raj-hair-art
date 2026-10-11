export interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  created_at?: string;
}

export interface Barber {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  telegram_chat_id?: string | null;
  experience_years: number;
  photo_url?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface Appointment {
  id: string;
  customer_id?: string | null;
  barber_id?: string | null;
  booking_date: string; // YYYY-MM-DD
  time_slot: string; // e.g. "10:00 AM"
  service_names: string[];
  total_amount: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  status: 'confirmed' | 'completed' | 'cancelled';
  created_at?: string;
  barbers?: Barber;
}

export const TIME_SLOTS = [
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
  "07:30 PM",
  "08:00 PM",
  "08:30 PM",
  "09:00 PM",
  "09:30 PM",
];

export const DEFAULT_SERVICES: Service[] = [
  { id: '1', name: 'Classic Haircut', price: 150, duration_minutes: 30 },
  { id: '2', name: 'Beard Trim & Shape', price: 100, duration_minutes: 20 },
  { id: '3', name: 'Haircut + Beard Combo', price: 220, duration_minutes: 45 },
  { id: '4', name: 'De-Tanning Pack', price: 300, duration_minutes: 30 },
  { id: '5', name: 'Hair Color / Dye', price: 350, duration_minutes: 40 },
  { id: '6', name: 'Head Massage', price: 120, duration_minutes: 20 },
];

export const DEFAULT_BARBERS: Barber[] = [
  {
    id: 'b1',
    name: 'Anil Kumar (Master Stylist)',
    phone: '+91 98765 43210',
    email: 'anil@rajhairart.com',
    telegram_chat_id: '12345678',
    experience_years: 12,
    photo_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 'b2',
    name: 'Rajesh Sharma',
    phone: '+91 98765 43211',
    email: 'rajesh@rajhairart.com',
    telegram_chat_id: '23456789',
    experience_years: 8,
    photo_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 'b3',
    name: 'Vikram Singh',
    phone: '+91 98765 43212',
    email: 'vikram@rajhairart.com',
    telegram_chat_id: '34567890',
    experience_years: 5,
    photo_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  }
];
