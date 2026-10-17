'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SelfieModal from '@/components/SelfieModal';
import {
  getCurrentUser,
  getAllAttendanceRecords,
  SEED_USERS,
  getTodayDateString,
  getOfficeSettings,
} from '@/lib/storage';
import { UserProfile, AttendanceRecord, OfficeSettings } from '@/lib/types';
import {
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  Sliders,
  Download,
  Eye,
  RefreshCw,
  MapPin,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [office, setOffice] = useState<OfficeSettings | null>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [activeModalRecord, setActiveModalRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      router.replace('/login');
      return;
    }
    setCurrentUser(user);

    const [officeData, records] = await Promise.all([
      getOfficeSettings(),
      getAllAttendanceRecords(),
    ]);

    setOffice(officeData);
    setAllRecords(records);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [router]);

  // Filter staff members (excluding admin)
  const staffList = SEED_USERS.filter((u) => u.role === 'staff');

  // Filter attendance records for the selected date
  const dateRecords = allRecords.filter((r) => r.date === selectedDate);

  // Group staff into Present, Late, Absent
  const rows = staffList.map((staff) => {
    const record = dateRecords.find((r) => r.user_id === staff.id || r.user_email === staff.email);
    return {
      staff,
      record: record || null,
      status: record ? record.status : 'Absent',
    };
  });

  const totalStaff = staffList.length;
  const presentCount = rows.filter((r) => r.status === 'Present').length;
  const lateCount = rows.filter((r) => r.status === 'Late').length;
  const absentCount = rows.filter((r) => r.status === 'Absent').length;

  return (
    <>
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Daily Attendance Monitor</span>
              <button
                onClick={loadData}
                disabled={loading}
                title="Refresh Records"
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </h1>
            <p className="text-xs text-slate-400">
              Live tracking with GPS geofencing & verified selfie capture
            </p>
          </div>

          {/* Date Picker & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 shadow-sm">
              <Calendar className="w-4 h-4 text-blue-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none"
              />
            </div>

            <Link
              href="/admin/settings"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Office Geofence</span>
            </Link>

            <Link
              href="/admin/export"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Link>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Staff</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalStaff}</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
            <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
              <span>Present (On-Time)</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">{presentCount}</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
            <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
              <span>Late</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{lateCount}</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
            <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
              <span>Absent</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400">{absentCount}</div>
          </div>
        </div>

        {/* Daily Attendance Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Staff Attendance Records for {selectedDate}
            </span>
            {office && (
              <span className="text-[11px] text-slate-400">
                Geofence: {office.radius_meters}m • Grace: {office.grace_period_mins} mins
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Shift Start</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Punch In</th>
                  <th className="px-4 py-3">Punch Out</th>
                  <th className="px-4 py-3">GPS Distance</th>
                  <th className="px-4 py-3 text-center">Live Selfie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map(({ staff, record, status }) => {
                  const punchInFormatted = record
                    ? new Date(record.punch_in_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '--';

                  const punchOutFormatted = record?.punch_out_time
                    ? new Date(record.punch_out_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '--';

                  return (
                    <tr key={staff.id} className="hover:bg-slate-800/40 transition">
                      {/* Employee details */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{staff.full_name.split(' (')[0]}</div>
                        <div className="text-[10px] text-slate-400">{staff.email}</div>
                      </td>

                      {/* Shift Start */}
                      <td className="px-4 py-3.5 text-slate-300 font-medium">
                        {staff.shift_start}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            status === 'Present'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : status === 'Late'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {status === 'Present' && <CheckCircle className="w-3 h-3" />}
                          {status === 'Late' && <AlertCircle className="w-3 h-3" />}
                          {status === 'Absent' && <XCircle className="w-3 h-3" />}
                          {status}
                        </span>
                      </td>

                      {/* Punch In */}
                      <td className="px-4 py-3.5 text-slate-200 font-mono">
                        {punchInFormatted}
                      </td>

                      {/* Punch Out */}
                      <td className="px-4 py-3.5 text-slate-300 font-mono">
                        {punchOutFormatted}
                      </td>

                      {/* GPS Distance */}
                      <td className="px-4 py-3.5 text-slate-300">
                        {record ? (
                          <div className="flex items-center gap-1 font-medium text-emerald-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{record.punch_in_distance}m</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>

                      {/* Selfie Thumbnail */}
                      <td className="px-4 py-3.5 text-center">
                        {record?.selfie_url ? (
                          <button
                            onClick={() => setActiveModalRecord(record)}
                            className="group relative inline-block h-10 w-10 rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500 transition shadow"
                          >
                            <img
                              src={record.selfie_url}
                              alt="Selfie"
                              className="h-full w-full object-cover group-hover:scale-110 transition duration-200"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">No Photo</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Selfie High-Resolution Modal */}
      <SelfieModal
        record={activeModalRecord}
        onClose={() => setActiveModalRecord(null)}
      />
    </>
  );
}
