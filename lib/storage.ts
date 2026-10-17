import { UserProfile, OfficeSettings, AttendanceRecord } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

const DEFAULT_OFFICE: OfficeSettings = {
  name: 'Main Campus / Head Office',
  latitude: 12.9716, // Default Bangalore coordinates or sample coordinates
  longitude: 77.5946,
  radius_meters: 100, // 100 meters
  grace_period_mins: 15, // 15 mins grace period
};

export const SEED_USERS: UserProfile[] = [
  {
    id: 'staff-1',
    email: 'staff1@company.com',
    full_name: 'John Staff (Shift: 9:00 AM)',
    role: 'staff',
    shift_start: '09:00',
  },
  {
    id: 'staff-2',
    email: 'staff2@company.com',
    full_name: 'Sarah Connor (Shift: 8:30 AM)',
    role: 'staff',
    shift_start: '08:30',
  },
  {
    id: 'admin-1',
    email: 'admin@company.com',
    full_name: 'HR Admin Manager',
    role: 'admin',
    shift_start: '09:00',
  },
];

// Helper to get today's date string YYYY-MM-DD
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ----------------- Auth / Current User -----------------
const CURRENT_USER_KEY = 'attendance_current_user';

export function getCurrentUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  // Default to first staff in demo mode if not set
  return SEED_USERS[0];
}

export function setCurrentUser(user: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

// ----------------- Office Settings -----------------
const SETTINGS_KEY = 'attendance_office_settings';

export async function getOfficeSettings(): Promise<OfficeSettings> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('office_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        name: data.name,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        radius_meters: Number(data.radius_meters),
        grace_period_mins: Number(data.grace_period_mins ?? 15),
        updated_at: data.updated_at,
      };
    }
  }

  // LocalStorage Fallback
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
  }
  return DEFAULT_OFFICE;
}

export async function saveOfficeSettings(settings: OfficeSettings): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { data: existing } = await supabase
      .from('office_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('office_settings')
        .update({
          latitude: settings.latitude,
          longitude: settings.longitude,
          radius_meters: settings.radius_meters,
          grace_period_mins: settings.grace_period_mins,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('office_settings').insert({
        name: settings.name || 'Main Office',
        latitude: settings.latitude,
        longitude: settings.longitude,
        radius_meters: settings.radius_meters,
        grace_period_mins: settings.grace_period_mins,
      });
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}

// ----------------- Attendance Records -----------------
const ATTENDANCE_KEY = 'attendance_records_list';

export async function getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        *,
        profiles:user_id (full_name, email, shift_start)
      `)
      .order('punch_in_time', { ascending: false });

    if (!error && data) {
      return data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        user_name: item.profiles?.full_name || 'Staff User',
        user_email: item.profiles?.email || '',
        date: item.date,
        shift_start: item.profiles?.shift_start || '09:00',
        punch_in_time: item.punch_in_time,
        punch_in_lat: item.punch_in_lat,
        punch_in_lng: item.punch_in_lng,
        punch_in_distance: item.punch_in_distance,
        selfie_url: item.selfie_url,
        status: item.status,
        punch_out_time: item.punch_out_time,
        punch_out_lat: item.punch_out_lat,
        punch_out_lng: item.punch_out_lng,
        created_at: item.created_at,
      }));
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(ATTENDANCE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
  }
  return [];
}

export async function getTodayUserAttendance(userId: string): Promise<AttendanceRecord | null> {
  const today = getTodayDateString();
  const records = await getAllAttendanceRecords();
  return records.find((r) => r.user_id === userId && r.date === today) || null;
}

export async function savePunchIn(
  user: UserProfile,
  params: {
    lat: number;
    lng: number;
    distance: number;
    selfieDataUrl: string;
    status: 'Present' | 'Late';
  }
): Promise<AttendanceRecord> {
  const now = new Date();
  const dateStr = getTodayDateString();

  let finalSelfieUrl = params.selfieDataUrl;

  // If Supabase configured, upload image to storage bucket
  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const blob = await (await fetch(params.selfieDataUrl)).blob();

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('selfies')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (!uploadErr && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('selfies')
          .getPublicUrl(uploadData.path);
        finalSelfieUrl = publicUrlData.publicUrl;
      }
    } catch (e) {
      console.error('Supabase storage upload failed, falling back to data URL', e);
    }
  }

  const record: AttendanceRecord = {
    id: 'rec-' + Date.now(),
    user_id: user.id,
    user_name: user.full_name,
    user_email: user.email,
    date: dateStr,
    shift_start: user.shift_start,
    punch_in_time: now.toISOString(),
    punch_in_lat: params.lat,
    punch_in_lng: params.lng,
    punch_in_distance: params.distance,
    selfie_url: finalSelfieUrl,
    status: params.status,
    created_at: now.toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    await supabase.from('attendance_logs').insert({
      user_id: user.id,
      date: dateStr,
      punch_in_time: record.punch_in_time,
      punch_in_lat: record.punch_in_lat,
      punch_in_lng: record.punch_in_lng,
      punch_in_distance: record.punch_in_distance,
      selfie_url: record.selfie_url,
      status: record.status,
    });
  }

  // Also save to localStorage
  if (typeof window !== 'undefined') {
    const records = await getAllAttendanceRecords();
    const filtered = records.filter((r) => !(r.user_id === user.id && r.date === dateStr));
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([record, ...filtered]));
  }

  return record;
}

export async function savePunchOut(
  userId: string,
  params: { lat: number; lng: number }
): Promise<void> {
  const now = new Date();
  const dateStr = getTodayDateString();

  if (isSupabaseConfigured && supabase) {
    await supabase
      .from('attendance_logs')
      .update({
        punch_out_time: now.toISOString(),
        punch_out_lat: params.lat,
        punch_out_lng: params.lng,
      })
      .eq('user_id', userId)
      .eq('date', dateStr);
  }

  if (typeof window !== 'undefined') {
    const records = await getAllAttendanceRecords();
    const updated = records.map((r) => {
      if (r.user_id === userId && r.date === dateStr) {
        return {
          ...r,
          punch_out_time: now.toISOString(),
          punch_out_lat: params.lat,
          punch_out_lng: params.lng,
        };
      }
      return r;
    });
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(updated));
  }
}
