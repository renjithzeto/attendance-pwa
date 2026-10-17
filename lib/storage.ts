import { UserProfile, OfficeSettings, AttendanceRecord } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

const DEFAULT_OFFICE: OfficeSettings = {
  name: 'Main Campus / Head Office',
  latitude: 12.9716, // Default Bangalore coordinates
  longitude: 77.5946,
  radius_meters: 100, // 100 meters
  grace_period_mins: 15, // 15 mins grace period
};

export const INITIAL_STAFF_MEMBERS: UserProfile[] = [
  {
    id: 'admin-1',
    full_name: 'HR Admin Manager',
    phone: '9999999999',
    email: 'admin@company.com',
    role: 'admin',
    shift_start: '09:00',
    shift_end: '18:00',
    designation: 'Managing Director',
    pin: '1234',
    created_at: new Date().toISOString(),
  },
  {
    id: 'staff-1',
    full_name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul@company.com',
    role: 'staff',
    shift_start: '09:00',
    shift_end: '18:00',
    designation: 'Operations Lead',
    pin: '1234',
    created_at: new Date().toISOString(),
  },
  {
    id: 'staff-2',
    full_name: 'Priya Patel',
    phone: '9123456789',
    email: 'priya@company.com',
    role: 'staff',
    shift_start: '08:30',
    shift_end: '17:30',
    designation: 'Executive Officer',
    pin: '1234',
    created_at: new Date().toISOString(),
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

// ----------------- Staff Directory Storage (Admin Created) -----------------
const STAFF_LIST_KEY = 'attendance_staff_list_v2';

export async function getAllStaff(): Promise<UserProfile[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        full_name: d.full_name,
        phone: d.phone || '',
        email: d.email || '',
        role: d.role,
        shift_start: d.shift_start || '09:00',
        shift_end: d.shift_end || '18:00',
        designation: d.designation || 'Staff',
        pin: d.pin || '1234',
        created_at: d.created_at,
      }));
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STAFF_LIST_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    // Initialize with seed staff
    localStorage.setItem(STAFF_LIST_KEY, JSON.stringify(INITIAL_STAFF_MEMBERS));
  }
  return INITIAL_STAFF_MEMBERS;
}

export async function addStaffMember(staff: Omit<UserProfile, 'id' | 'created_at'>): Promise<UserProfile> {
  const newStaff: UserProfile = {
    ...staff,
    id: 'staff-' + Date.now(),
    pin: staff.pin || '1234',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    await supabase.from('profiles').insert({
      id: newStaff.id,
      full_name: newStaff.full_name,
      phone: newStaff.phone,
      email: newStaff.email,
      role: newStaff.role,
      shift_start: newStaff.shift_start,
      shift_end: newStaff.shift_end,
      designation: newStaff.designation,
      pin: newStaff.pin,
    });
  }

  if (typeof window !== 'undefined') {
    const current = await getAllStaff();
    const updated = [newStaff, ...current.filter((u) => u.id !== newStaff.id)];
    localStorage.setItem(STAFF_LIST_KEY, JSON.stringify(updated));
  }

  return newStaff;
}

export async function updateStaffMember(staff: UserProfile): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase
      .from('profiles')
      .update({
        full_name: staff.full_name,
        phone: staff.phone,
        email: staff.email,
        shift_start: staff.shift_start,
        shift_end: staff.shift_end,
        designation: staff.designation,
        pin: staff.pin,
      })
      .eq('id', staff.id);
  }

  if (typeof window !== 'undefined') {
    const current = await getAllStaff();
    const updated = current.map((s) => (s.id === staff.id ? staff : s));
    localStorage.setItem(STAFF_LIST_KEY, JSON.stringify(updated));
  }
}

export async function deleteStaffMember(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('profiles').delete().eq('id', id);
  }

  if (typeof window !== 'undefined') {
    const current = await getAllStaff();
    const updated = current.filter((s) => s.id !== id);
    localStorage.setItem(STAFF_LIST_KEY, JSON.stringify(updated));
  }
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
  return null;
}

export function setCurrentUser(user: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

/**
 * SalaryBox-style login: Authenticates by either Phone Number OR Email
 * that was registered/created by the Admin.
 */
export async function authenticateByIdentifier(
  identifier: string,
  pin: string
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const cleanId = identifier.trim().toLowerCase().replace(/[\s-]/g, '');
  const staffList = await getAllStaff();

  const found = staffList.find((member) => {
    const memberPhone = (member.phone || '').trim().replace(/[\s-]/g, '');
    const memberEmail = (member.email || '').trim().toLowerCase();
    return memberPhone === cleanId || memberEmail === cleanId;
  });

  if (!found) {
    return {
      success: false,
      message: 'No account found with this phone number or email. Please ask your Admin to register you first.',
    };
  }

  // Validate PIN (Default is 1234 if not customized)
  const expectedPin = found.pin || '1234';
  if (pin && pin !== expectedPin) {
    return {
      success: false,
      message: 'Incorrect 4-digit PIN. (Default PIN is 1234).',
    };
  }

  return { success: true, user: found };
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
        profiles:user_id (full_name, phone, email, shift_start)
      `)
      .order('punch_in_time', { ascending: false });

    if (!error && data) {
      return data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        user_name: item.profiles?.full_name || 'Staff User',
        user_phone: item.profiles?.phone || '',
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
    user_phone: user.phone,
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
