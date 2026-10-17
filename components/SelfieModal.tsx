'use client';

import React from 'react';
import { X, Calendar, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { AttendanceRecord } from '@/lib/types';

interface SelfieModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
}

export default function SelfieModal({ record, onClose }: SelfieModalProps) {
  if (!record) return null;

  const punchTimeFormatted = new Date(record.punch_in_time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950">
          <div>
            <h3 className="text-sm font-bold text-white">{record.user_name}</h3>
            <p className="text-xs text-slate-400">{record.user_email}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selfie Photo */}
        <div className="relative aspect-square w-full bg-black flex items-center justify-center">
          <img
            src={record.selfie_url}
            alt={`Selfie of ${record.user_name}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-lg ${
                record.status === 'Present'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-slate-950'
              }`}
            >
              {record.status === 'Present' ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {record.status}
            </span>
          </div>
        </div>

        {/* Details Footer */}
        <div className="p-4 space-y-2 bg-slate-900 text-xs">
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/60 p-2 rounded-lg border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Date: <strong className="text-white">{record.date}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/60 p-2 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Punched: <strong className="text-white">{punchTimeFormatted}</strong></span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-800/60 p-2 rounded-lg border border-slate-800 text-slate-300">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>GPS Distance from Office:</span>
            </div>
            <span className="font-semibold text-emerald-400">{record.punch_in_distance} meters</span>
          </div>

          <div className="text-[11px] text-slate-500 text-center pt-1">
            Lat: {record.punch_in_lat.toFixed(6)}, Lng: {record.punch_in_lng.toFixed(6)} • Verified Live Stream
          </div>
        </div>
      </div>
    </div>
  );
}
