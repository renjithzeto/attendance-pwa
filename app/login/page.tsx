'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllStaff,
  setCurrentUser,
  authenticateByIdentifier,
} from '@/lib/storage';
import { UserProfile } from '@/lib/types';
import {
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Smartphone,
  Sparkles,
  AlertCircle,
  Building2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [staffDirectory, setStaffDirectory] = useState<UserProfile[]>([]);

  useEffect(() => {
    getAllStaff().then(setStaffDirectory);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your registered mobile number or email.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await authenticateByIdentifier(identifier, pin);
      if (!result.success || !result.user) {
        setError(result.message || 'Login failed.');
        setLoading(false);
        return;
      }

      setCurrentUser(result.user);
      if (result.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/punch');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
      setLoading(false);
    }
  };

  const handleQuickSelect = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/punch');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-slate-950">
      <div className="w-full max-w-md space-y-5">
        {/* App Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 font-extrabold text-2xl text-white shadow-xl shadow-blue-500/20">
            WP
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">WorkPulse Attendance</h1>
          <p className="text-xs text-slate-400">
            Staff Attendance & Geofenced Time Tracking Portal
          </p>
        </div>

        {/* Main Login Form Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400" />
              Sign In to Your Workspace
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Enter the Mobile Number or Email registered by your Admin
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Mobile / Email Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Registered Mobile Number or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 9876543210 or staff@company.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Security PIN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-300">
                  4-Digit Security PIN
                </label>
                <span className="text-[10px] text-slate-500">Default: 1234</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white tracking-widest focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition"
            >
              <span>{loading ? 'Verifying...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* SalaryBox Style Registered Staff Directory (Quick Login) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Sparkles className="w-4 h-4" />
              Registered Accounts (Tap to Login Instantly)
            </span>
            <span className="text-[10px] text-slate-500">{staffDirectory.length} Profiles</span>
          </div>

          <div className="space-y-2">
            {staffDirectory.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleQuickSelect(member)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800 hover:border-slate-700 transition text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ${
                      member.role === 'admin'
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                        : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {member.role === 'admin' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300 transition flex items-center gap-1.5">
                      <span>{member.full_name}</span>
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          member.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>📱 {member.phone}</span>
                      <span>•</span>
                      <span>Shift: {member.shift_start}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition" />
              </button>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 text-center pt-1">
            New employees must be added by the Admin in the <strong>Staff Members</strong> dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
