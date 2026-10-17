export type UserRole = 'admin' | 'manager' | 'supervisor' | 'staff';

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: UserRole;
  shift_start: string; // e.g. "09:00"
  shift_end?: string;   // e.g. "18:00"
  designation?: string; // e.g. "Sales Executive", "Accountant"
  pin?: string;         // 4-digit PIN e.g. "1234"
  organization?: string;
  created_at?: string;
}

export interface OfficeSettings {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  grace_period_mins: number;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_phone?: string;
  user_email: string;
  date: string; // YYYY-MM-DD
  shift_start: string;
  punch_in_time: string; // ISO string
  punch_in_lat: number;
  punch_in_lng: number;
  punch_in_distance: number; // in meters
  selfie_url: string; // data URL or Supabase storage URL
  status: 'Present' | 'Late';
  punch_out_time?: string | null;
  punch_out_lat?: number | null;
  punch_out_lng?: number | null;
  created_at: string;
}
