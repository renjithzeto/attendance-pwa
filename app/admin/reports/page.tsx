'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  getCurrentUser,
  getAllStaff,
  getAllAttendanceRecords,
  getTodayDateString,
} from '@/lib/storage';
import { UserProfile, AttendanceRecord } from '@/lib/types';
import {
  BarChart3,
  Calendar,
  Users,
  Download,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  ArrowLeft,
  FileSpreadsheet,
  User,
  Printer,
} from 'lucide-react';
import Link from 'next/link';

export default function AllReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'matrix' | 'daily' | 'individual'>('matrix');
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      router.replace('/login');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      const [staffData, recordsData] = await Promise.all([
        getAllStaff(),
        getAllAttendanceRecords(),
      ]);
      const onlyStaff = staffData.filter((s) => s.role === 'staff');
      setStaffList(onlyStaff);
      if (onlyStaff.length > 0) {
        setSelectedStaffId(onlyStaff[0].id);
      }
      setAllRecords(recordsData);
      setLoading(false);
    };
    loadData();
  }, [router]);

  // Calculate days in selected month
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

  // Helper to get record for employee and day
  const getRecordForDay = (userId: string, day: number) => {
    const dayStr = String(day).padStart(2, '0');
    const targetDate = `${selectedMonth}-${dayStr}`;
    return allRecords.find((r) => r.user_id === userId && r.date === targetDate);
  };

  // Export Matrix to CSV
  const exportMatrixCsv = () => {
    const headers = ['Employee Name', 'Phone', 'Shift', ...daysArray.map((d) => `Day ${d}`), 'Total Present', 'Total Late', 'Total Absent'];
    const rows = staffList.map((staff) => {
      let pCount = 0;
      let lCount = 0;
      let aCount = 0;

      const dayCells = daysArray.map((day) => {
        const rec = getRecordForDay(staff.id, day);
        if (!rec) {
          aCount++;
          return 'A';
        }
        if (rec.status === 'Present') {
          pCount++;
          return 'P';
        } else {
          lCount++;
          return 'L';
        }
      });

      return [
        `"${staff.full_name}"`,
        `"${staff.phone}"`,
        `"${staff.shift_start}"`,
        ...dayCells,
        pCount,
        lCount,
        aCount,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Attendance_Register_Matrix_${selectedMonth}.csv`;
    link.click();
  };

  const selectedStaffMember = staffList.find((s) => s.id === selectedStaffId);
  const staffMonthlyRecords = allRecords.filter(
    (r) => r.user_id === selectedStaffId && r.date.startsWith(selectedMonth)
  );

  return (
    <>
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Daily Monitor
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              Comprehensive Attendance Reports
            </h1>
            <p className="text-xs text-slate-400">
              SalaryBox-style Monthly Matrix Register, Daily Summaries & Staff-wise Analytics
            </p>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-blue-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Report Tabs */}
        <div className="flex border-b border-slate-800 gap-2 text-xs font-bold overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Monthly Register (Matrix View)
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'individual'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            Individual Staff Report
          </button>
        </div>

        {/* TAB 1: Monthly Register Matrix View */}
        {activeTab === 'matrix' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden space-y-4 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Monthly Attendance Register — {selectedMonth}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                    {totalDaysInMonth} Days
                  </span>
                </h3>
                <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> P = Present</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> L = Late</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> A = Absent</span>
                </div>
              </div>

              <button
                onClick={exportMatrixCsv}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Register CSV</span>
              </button>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-center text-[11px]">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase">
                  <tr>
                    <th className="px-3 py-2.5 text-left sticky left-0 bg-slate-950 z-20 min-w-[140px] border-r border-slate-800">
                      Staff Member
                    </th>
                    {daysArray.map((day) => (
                      <th key={day} className="px-2 py-2 min-w-[28px] border-r border-slate-800/60 font-mono">
                        {day}
                      </th>
                    ))}
                    <th className="px-2.5 py-2 text-emerald-400 min-w-[35px]">P</th>
                    <th className="px-2.5 py-2 text-amber-400 min-w-[35px]">L</th>
                    <th className="px-2.5 py-2 text-rose-400 min-w-[35px]">A</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {staffList.map((staff) => {
                    let pCount = 0;
                    let lCount = 0;
                    let aCount = 0;

                    return (
                      <tr key={staff.id} className="hover:bg-slate-800/50 transition">
                        {/* Fixed Left Name Column */}
                        <td className="px-3 py-2 text-left sticky left-0 bg-slate-900 z-10 border-r border-slate-800">
                          <div className="font-bold text-white truncate max-w-[130px]">{staff.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{staff.phone}</div>
                        </td>

                        {/* Day Cells 1-31 */}
                        {daysArray.map((day) => {
                          const record = getRecordForDay(staff.id, day);
                          if (!record) {
                            aCount++;
                            return (
                              <td key={day} className="p-1 border-r border-slate-800/40 text-slate-600 font-mono">
                                -
                              </td>
                            );
                          }
                          if (record.status === 'Present') {
                            pCount++;
                            return (
                              <td key={day} className="p-1 border-r border-slate-800/40">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                                  P
                                </span>
                              </td>
                            );
                          } else {
                            lCount++;
                            return (
                              <td key={day} className="p-1 border-r border-slate-800/40">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                                  L
                                </span>
                              </td>
                            );
                          }
                        })}

                        {/* Totals */}
                        <td className="px-2 py-2 font-bold text-emerald-400 bg-slate-950/40">{pCount}</td>
                        <td className="px-2 py-2 font-bold text-amber-400 bg-slate-950/40">{lCount}</td>
                        <td className="px-2 py-2 font-bold text-rose-400 bg-slate-950/40">{aCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Individual Staff Detailed Report */}
        {activeTab === 'individual' && (
          <div className="space-y-4">
            {/* Staff Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-300">Select Employee:</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStaffMember && (
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Shift: <strong className="text-white">{selectedStaffMember.shift_start} - {selectedStaffMember.shift_end || '18:00'}</strong></span>
                </div>
              )}
            </div>

            {/* Individual Records Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 text-xs">
                <span className="font-bold text-white">
                  Monthly Punch Log for {selectedStaffMember?.full_name} ({selectedMonth})
                </span>
                <span className="text-slate-400">Total Days Punched: {staffMonthlyRecords.length}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Shift Start</th>
                      <th className="px-4 py-3">Punch In</th>
                      <th className="px-4 py-3">Punch Out</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">GPS Distance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {staffMonthlyRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                          No attendance records found for this employee in {selectedMonth}.
                        </td>
                      </tr>
                    ) : (
                      staffMonthlyRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-semibold text-white">{r.date}</td>
                          <td className="px-4 py-3 text-slate-400">{r.shift_start}</td>
                          <td className="px-4 py-3 font-mono text-slate-200">
                            {new Date(r.punch_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {r.punch_out_time
                              ? new Date(r.punch_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                              : '--'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.status === 'Present'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-emerald-400 font-medium">
                            {r.punch_in_distance}m
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
