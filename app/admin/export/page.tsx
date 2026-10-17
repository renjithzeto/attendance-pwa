'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getCurrentUser, getAllAttendanceRecords } from '@/lib/storage';
import { AttendanceRecord } from '@/lib/types';
import {
  Download,
  Calendar,
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function ExportCsvPage() {
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      router.replace('/login');
      return;
    }

    const loadRecords = async () => {
      const data = await getAllAttendanceRecords();
      setRecords(data);
    };
    loadRecords();
  }, [router]);

  // Filter records by selected month (YYYY-MM)
  const filteredRecords = records.filter((r) => r.date.startsWith(selectedMonth));

  const presentCount = filteredRecords.filter((r) => r.status === 'Present').length;
  const lateCount = filteredRecords.filter((r) => r.status === 'Late').length;

  const handleExportCsv = () => {
    setDownloading(true);
    try {
      // Define CSV headers
      const headers = [
        'Employee Name',
        'Email',
        'Date',
        'Shift Start',
        'Punch In Time',
        'Punch Out Time',
        'Status',
        'Distance (Meters)',
        'Selfie Verification URL',
      ];

      // Convert rows to CSV strings
      const csvRows = filteredRecords.map((r) => {
        const punchIn = new Date(r.punch_in_time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const punchOut = r.punch_out_time
          ? new Date(r.punch_out_time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : 'N/A';

        // Escape fields to prevent CSV injection or comma breaking
        const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

        return [
          escape(r.user_name),
          escape(r.user_email),
          escape(r.date),
          escape(r.shift_start),
          escape(punchIn),
          escape(punchOut),
          escape(r.status),
          escape(r.punch_in_distance),
          escape(r.selfie_url.startsWith('data:') ? 'Live Captured Snapshot (Stored locally)' : r.selfie_url),
        ].join(',');
      });

      const csvContent = [headers.join(','), ...csvRows].join('\r\n');

      // Create download blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_summary_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert('Failed to generate CSV: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Back navigation & Header */}
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Daily Monitor
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-400" />
            Monthly Attendance CSV Export
          </h1>
          <p className="text-xs text-slate-400">
            Export monthly attendance summaries with verified timestamps and GPS distances.
          </p>
        </div>

        {/* Month Selection Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-2xl space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Month & Year
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 p-2.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Monthly Stats Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
              <span className="text-[11px] text-slate-400 block mb-0.5">Total Punches</span>
              <span className="text-xl font-black text-white">{filteredRecords.length}</span>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
              <span className="text-[11px] text-emerald-400 block mb-0.5">Present</span>
              <span className="text-xl font-black text-emerald-400">{presentCount}</span>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-center">
              <span className="text-[11px] text-amber-400 block mb-0.5">Late</span>
              <span className="text-xl font-black text-amber-400">{lateCount}</span>
            </div>
          </div>

          {/* Export Action */}
          <button
            onClick={handleExportCsv}
            disabled={downloading || filteredRecords.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-xs font-bold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Download className="w-4 h-4" />
            {downloading
              ? 'Generating CSV...'
              : filteredRecords.length === 0
              ? `No records found for ${selectedMonth}`
              : `Download attendance_summary_${selectedMonth}.csv`}
          </button>

          {/* CSV Column description */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              Included Columns in CSV:
            </div>
            <p>
              • Employee Name & Email<br />
              • Attendance Date (YYYY-MM-DD)<br />
              • Shift Start Time<br />
              • Punch In & Punch Out Timestamps<br />
              • Status (Present / Late based on grace period)<br />
              • GPS Distance from Office (meters)<br />
              • Selfie Verification URL / Reference
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
