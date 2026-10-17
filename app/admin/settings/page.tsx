'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getCurrentUser, getOfficeSettings, saveOfficeSettings } from '@/lib/storage';
import { OfficeSettings } from '@/lib/types';
import {
  MapPin,
  Sliders,
  CheckCircle2,
  Navigation,
  RefreshCw,
  Clock,
  ArrowLeft,
  Save,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [officeName, setOfficeName] = useState('Main Office');
  const [latitude, setLatitude] = useState<number>(12.9716);
  const [longitude, setLongitude] = useState<number>(77.5946);
  const [radiusMeters, setRadiusMeters] = useState<number>(100);
  const [gracePeriodMins, setGracePeriodMins] = useState<number>(15);

  const [loadingGps, setLoadingGps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      router.replace('/login');
      return;
    }

    const loadSettings = async () => {
      const data = await getOfficeSettings();
      setOfficeName(data.name);
      setLatitude(data.latitude);
      setLongitude(data.longitude);
      setRadiusMeters(data.radius_meters);
      setGracePeriodMins(data.grace_period_mins ?? 15);
    };
    loadSettings();
  }, [router]);

  // Use current device GPS as Office coordinates
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLoadingGps(false);
        setSuccessMessage('Updated coordinates with your current GPS location!');
        setTimeout(() => setSuccessMessage(null), 3500);
      },
      (err) => {
        alert('Could not fetch GPS: ' + err.message);
        setLoadingGps(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated: OfficeSettings = {
        name: officeName,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius_meters: Number(radiusMeters),
        grace_period_mins: Number(gracePeriodMins),
      };
      await saveOfficeSettings(updated);
      setSuccessMessage('Office geofence and grace period settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Back navigation & Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Daily Monitor
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-400" />
              Office Geofence & Shift Settings
            </h1>
          </div>
        </div>

        {successMessage && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Configuration Form Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-2xl">
          <form onSubmit={handleSave} className="space-y-5">
            {/* Office Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Office / Campus Name
              </label>
              <input
                type="text"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* GPS Coordinates Section */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Office GPS Coordinates
                </span>

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={loadingGps}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 transition"
                >
                  <Navigation className={`w-3.5 h-3.5 ${loadingGps ? 'animate-spin' : ''}`} />
                  {loadingGps ? 'Detecting GPS...' : 'Use My Current Location'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Latitude (Decimal Degrees)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Longitude (Decimal Degrees)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Geofence Radius */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Allowed Geofence Radius (Meters)
                </label>
                <span className="text-xs font-bold text-blue-400">{radiusMeters} meters</span>
              </div>
              <input
                type="number"
                min="10"
                max="5000"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(parseInt(e.target.value) || 0)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Staff must be within this distance to punch in. Recommended: 50–150 meters for a physical office building.
              </p>
            </div>

            {/* Configurable Shift Grace Period */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Shift Start Grace Period (Minutes)
                </label>
                <span className="text-xs font-bold text-amber-400">{gracePeriodMins} mins</span>
              </div>
              <input
                type="number"
                min="0"
                max="120"
                value={gracePeriodMins}
                onChange={(e) => setGracePeriodMins(parseInt(e.target.value) || 0)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                E.g. If shift starts at 09:00 AM and grace is 15 mins, punching in before 09:15 AM is marked <strong>Present</strong>, and after 09:15 AM is marked <strong>Late</strong>.
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving Settings...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
