'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CameraCapture from '@/components/CameraCapture';
import {
  getCurrentUser,
  getOfficeSettings,
  getTodayUserAttendance,
  savePunchIn,
  savePunchOut,
} from '@/lib/storage';
import { calculateHaversineDistance } from '@/lib/haversine';
import { UserProfile, OfficeSettings, AttendanceRecord } from '@/lib/types';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Sparkles,
  RefreshCw,
  Navigation,
  ShieldCheck,
} from 'lucide-react';

export default function PunchScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [office, setOffice] = useState<OfficeSettings | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);

  // Geolocation State
  const [gpsLoading, setGpsLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Punch Action State
  const [selfieDataUrl, setSelfieDataUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Live digital clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial profile & office config
  useEffect(() => {
    const current = getCurrentUser();
    if (!current) {
      router.replace('/login');
      return;
    }
    setUser(current);

    const loadData = async () => {
      const officeData = await getOfficeSettings();
      setOffice(officeData);
      const att = await getTodayUserAttendance(current.id);
      setTodayAttendance(att);
    };
    loadData();
  }, [router]);

  // GPS Fetcher function
  const fetchGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setGpsLoading(false);
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserCoords({ lat, lng });

        if (office) {
          const dist = calculateHaversineDistance(lat, lng, office.latitude, office.longitude);
          setDistance(dist);
        }
        setGpsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Please enable GPS location in your browser settings.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsError('GPS location unavailable. Please ensure location services are turned on.');
        } else {
          setGpsError('Location request timed out. Please retry.');
        }
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  }, [office]);

  // Recalculate distance whenever office or coordinates change
  useEffect(() => {
    if (office) {
      fetchGPS();
    }
  }, [office, fetchGPS]);

  // Check if within geofence radius
  const isWithinGeofence =
    distance !== null && office !== null && distance <= office.radius_meters;

  // Determine status (Present vs Late)
  const calculatePunchStatus = (): { status: 'Present' | 'Late'; cutoffTimeStr: string } => {
    if (!user || !office) return { status: 'Present', cutoffTimeStr: '09:15' };

    const now = new Date();
    const [shiftHour, shiftMin] = user.shift_start.split(':').map(Number);

    // Calculate cutoff: shift_start + grace_period_mins
    const shiftDate = new Date();
    shiftDate.setHours(shiftHour, shiftMin, 0, 0);

    const cutoffDate = new Date(shiftDate.getTime() + office.grace_period_mins * 60 * 1000);
    const cutoffTimeStr = cutoffDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const isLate = now.getTime() > cutoffDate.getTime();
    return {
      status: isLate ? 'Late' : 'Present',
      cutoffTimeStr,
    };
  };

  // Handle Punch In
  const handlePunchIn = async () => {
    if (!user || !userCoords || distance === null || !selfieDataUrl) return;

    if (!isWithinGeofence) {
      alert(`Cannot punch in: You are ${distance}m away. Must be within ${office?.radius_meters}m of the office.`);
      return;
    }

    setSubmitting(true);
    try {
      const { status } = calculatePunchStatus();
      const record = await savePunchIn(user, {
        lat: userCoords.lat,
        lng: userCoords.lng,
        distance,
        selfieDataUrl,
        status,
      });
      setTodayAttendance(record);
    } catch (err: any) {
      alert('Punch-in failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Punch Out
  const handlePunchOut = async () => {
    if (!user || !userCoords) {
      fetchGPS();
      return;
    }

    if (!confirm('Are you sure you want to Punch Out for the day?')) return;

    setSubmitting(true);
    try {
      await savePunchOut(user.id, {
        lat: userCoords.lat,
        lng: userCoords.lng,
      });
      const updated = await getTodayUserAttendance(user.id);
      setTodayAttendance(updated);
    } catch (err: any) {
      alert('Punch-out failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || !office) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-slate-400">
        Loading punch screen...
      </div>
    );
  }

  const { status: expectedStatus, cutoffTimeStr } = calculatePunchStatus();

  return (
    <>
      <Navbar />

      <main className="flex-1 w-full max-w-md mx-auto p-4 sm:p-5 flex flex-col items-center space-y-4">
        {/* Realtime Clock Banner */}
        <div className="w-full text-center py-2 bg-slate-950/70 border border-slate-800/80 rounded-2xl shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Live Device Time
          </span>
          <div className="text-3xl font-black tracking-tight text-white mt-0.5">
            {currentTime || '--:--:--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-2">
            <span>Shift: <strong className="text-slate-200">{user.shift_start}</strong></span>
            <span>•</span>
            <span>Grace: <strong className="text-slate-200">+{office.grace_period_mins}m</strong> (Late after {cutoffTimeStr})</span>
          </div>
        </div>

        {/* Attendance Completed View if Already Punched In */}
        {todayAttendance ? (
          <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  todayAttendance.status === 'Present'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                Status: {todayAttendance.status}
              </span>
              <h2 className="text-lg font-bold text-white mt-2">
                Punched In Today
              </h2>
              <p className="text-xs text-slate-400">
                Time: {new Date(todayAttendance.punch_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>

            {/* Selfie Thumbnail */}
            <div className="mx-auto w-32 h-32 rounded-xl overflow-hidden border border-slate-700 shadow-md">
              <img
                src={todayAttendance.selfie_url}
                alt="Today Selfie"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              GPS Verified: {todayAttendance.punch_in_distance}m from office
            </div>

            {/* Punch Out Action */}
            {todayAttendance.punch_out_time ? (
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300">
                Punched Out at:{' '}
                <strong className="text-white">
                  {new Date(todayAttendance.punch_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </strong>
              </div>
            ) : (
              <button
                onClick={handlePunchOut}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 disabled:opacity-50 transition"
              >
                <LogOut className="w-4 h-4" />
                {submitting ? 'Recording Punch-Out...' : 'Punch Out Now'}
              </button>
            )}
          </div>
        ) : (
          /* Live Punch-In Flow */
          <div className="w-full space-y-4">
            {/* Geofence Status Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  Office Geofence Check
                </span>
                <button
                  onClick={fetchGPS}
                  disabled={gpsLoading}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                >
                  <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                  Refresh GPS
                </button>
              </div>

              {gpsLoading ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  Acquiring high-accuracy GPS coordinates...
                </div>
              ) : gpsError ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>GPS Permission Required</span>
                  </div>
                  <p className="text-[11px] text-rose-300/90">{gpsError}</p>
                  <button
                    onClick={fetchGPS}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 text-[11px] font-semibold text-white hover:bg-rose-500"
                  >
                    <RefreshCw className="w-3 h-3" /> Grant & Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
                      isWithinGeofence
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isWithinGeofence ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold">
                          {isWithinGeofence
                            ? `Within Geofence (${distance}m away)`
                            : `Outside Office Bounds (${distance}m away)`}
                        </div>
                        <div className="text-[10px] opacity-80">
                          Allowed radius: {office.radius_meters}m from {office.name}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!isWithinGeofence && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        Punch-in is locked until you are within {office.radius_meters}m of the office location.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Anti-spoofing Live Camera Capture */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Live Selfie Identity Verification
                </span>
                <span className="text-[10px] text-slate-400">Front Camera</span>
              </div>

              <CameraCapture
                onCapture={(dataUrl) => setSelfieDataUrl(dataUrl)}
                disabled={!isWithinGeofence}
              />
            </div>

            {/* Status Preview & Punch-In Button */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span>Calculated Punch Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    expectedStatus === 'Present'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {expectedStatus}
                </span>
              </div>

              <button
                type="button"
                onClick={handlePunchIn}
                disabled={
                  !isWithinGeofence ||
                  !selfieDataUrl ||
                  submitting ||
                  gpsLoading ||
                  Boolean(gpsError)
                }
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-xl shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Recording Punch-In...
                  </>
                ) : !isWithinGeofence ? (
                  'Distance Exceeded (Punch Locked)'
                ) : !selfieDataUrl ? (
                  'Take Live Selfie First'
                ) : (
                  `Punch In Now (${expectedStatus})`
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
