'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SEED_USERS, setCurrentUser } from '@/lib/storage';
import { UserProfile, UserRole } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { ShieldCheck, User, ArrowRight, Lock, Mail, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick 1-click login for preset accounts
  const handleQuickLogin = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/punch');
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        // Authenticate with Supabase Auth
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authErr) throw authErr;

        if (data.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const loggedInUser: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: profile?.full_name || email.split('@')[0],
            role: (profile?.role as UserRole) || selectedRole,
            shift_start: profile?.shift_start || '09:00',
          };

          setCurrentUser(loggedInUser);
          if (loggedInUser.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/punch');
          }
          return;
        }
      }

      // Demo Mode login fallback
      const found = SEED_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() || u.role === selectedRole
      );

      const demoUser: UserProfile = found || {
        id: 'user-' + Date.now(),
        email: email || `${selectedRole}@company.com`,
        full_name: email ? email.split('@')[0] : `${selectedRole.toUpperCase()} User`,
        role: selectedRole,
        shift_start: '09:00',
      };

      setCurrentUser(demoUser);
      if (demoUser.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/punch');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 font-extrabold text-2xl text-white shadow-xl shadow-blue-500/20">
            WP
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">WorkPulse Attendance</h1>
          <p className="text-xs text-slate-400">
            Mobile-First GPS Geofenced & Live Selfie Punch-In System
          </p>
        </div>

        {/* Quick Demo Login Preset Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Instant Role Login (One-Click)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SEED_USERS.map((seed) => (
              <button
                key={seed.id}
                onClick={() => handleQuickLogin(seed)}
                className="flex flex-col items-start p-2.5 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-750 hover:border-blue-500/50 transition text-left group"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                      seed.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {seed.role}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition" />
                </div>
                <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                  {seed.full_name.split(' (')[0]}
                </span>
                <span className="text-[10px] text-slate-400">
                  {seed.role === 'admin' ? 'Dashboard' : `Shift: ${seed.shift_start}`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl">
          {/* Role Tabs */}
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedRole('staff')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                selectedRole === 'staff'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" /> Staff View
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                selectedRole === 'admin'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Admin View
            </button>
          </div>

          <form onSubmit={handleManualLogin} className="space-y-3.5">
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedRole === 'admin' ? 'admin@company.com' : 'staff@company.com'}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition"
            >
              {loading ? 'Authenticating...' : `Enter as ${selectedRole === 'admin' ? 'Admin' : 'Staff'}`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Mode indicator */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Backend Status:</span>
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSupabaseConfigured ? 'Supabase Connected' : 'Demo / Local Mode'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
