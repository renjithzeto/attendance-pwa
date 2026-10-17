'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllStaff,
  setCurrentUser,
  authenticateByIdentifier,
  registerAdminAccount,
} from '@/lib/storage';
import { UserProfile, UserRole } from '@/lib/types';
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
  UserPlus,
  X,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [portalType, setPortalType] = useState<'admin' | 'staff'>('staff');
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [staffDirectory, setStaffDirectory] = useState<UserProfile[]>([]);

  // Setup Admin Modal
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [setupOrg, setSetupOrg] = useState('');
  const [setupName, setSetupName] = useState('');
  const [setupPhone, setSetupPhone] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPin, setSetupPin] = useState('1234');
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    getAllStaff().then(setStaffDirectory);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your mobile number or email.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await authenticateByIdentifier(identifier, pin, portalType);
      if (!result.success || !result.user) {
        setError(result.message || 'Login failed.');
        setLoading(false);
        return;
      }

      setCurrentUser(result.user);
      if (portalType === 'admin') {
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
    if (user.role === 'admin' || user.role === 'manager') {
      router.push('/admin');
    } else {
      router.push('/punch');
    }
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);

    if (!setupName.trim() || !setupPhone.trim() || !setupOrg.trim()) {
      setSetupError('Please fill in your Organization, Name, and Mobile Number.');
      return;
    }

    try {
      const newAdmin = await registerAdminAccount({
        organization: setupOrg.trim(),
        full_name: setupName.trim(),
        phone: setupPhone.trim(),
        email: setupEmail.trim().toLowerCase() || `${setupPhone.trim()}@company.com`,
        pin: setupPin.trim() || '1234',
      });

      setCurrentUser(newAdmin);
      setIsSetupOpen(false);
      router.push('/admin');
    } catch (err: any) {
      setSetupError(err.message || 'Failed to create Admin account.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-slate-950">
      <div className="w-full max-w-md space-y-4">
        {/* App Branding */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 font-extrabold text-2xl text-white shadow-xl shadow-blue-500/20">
            WP
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">WorkPulse Attendance</h1>
          <p className="text-xs text-slate-400">
            Mobile-First Employee Attendance & Verified Geofence System
          </p>
        </div>

        {/* Portal Type Switcher: Admin vs Staff */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <button
            type="button"
            onClick={() => {
              setPortalType('staff');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
              portalType === 'staff'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Staff Portal (Punch)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPortalType('admin');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
              portalType === 'admin'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin / Manager</span>
          </button>
        </div>

        {/* Main Login Form Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl space-y-4">
          <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                {portalType === 'admin' ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    Admin & Manager Login
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    Staff Punch-In Login
                  </>
                )}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {portalType === 'admin'
                  ? 'Access staff directory, all reports & geofence'
                  : 'Enter phone or email registered by your admin'}
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Mobile / Email Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                {portalType === 'admin' ? 'Admin Phone Number or Email' : 'Staff Phone Number or Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={portalType === 'admin' ? 'e.g. 9999999999 or admin@company.com' : 'e.g. 9876543210'}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Security PIN */}
            <div>
              <div className="flex items-center justify-between mb-1">
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
              <span>{loading ? 'Verifying...' : `Sign In as ${portalType === 'admin' ? 'Admin / Manager' : 'Staff'}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* First Time Admin Setup Link */}
          <div className="pt-2 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setIsSetupOpen(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              New Organization? Set up Business Admin
            </button>
          </div>
        </div>

        {/* SalaryBox Style Registered Profiles (Quick Switch) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Sparkles className="w-4 h-4" />
              Registered Accounts (Tap to Sign In)
            </span>
            <span className="text-[10px] text-slate-500">{staffDirectory.length} Profiles</span>
          </div>

          <div className="space-y-1.5">
            {staffDirectory.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleQuickSelect(member)}
                className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-800/80 bg-slate-950/70 hover:bg-slate-800 hover:border-slate-700 transition text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold text-xs ${
                      member.role === 'admin'
                        ? 'bg-purple-600/20 text-purple-400'
                        : member.role === 'manager'
                        ? 'bg-indigo-600/20 text-indigo-400'
                        : 'bg-blue-600/20 text-blue-400'
                    }`}
                  >
                    {member.role === 'admin' ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300 transition flex items-center gap-1.5">
                      <span>{member.full_name}</span>
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          member.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-400'
                            : member.role === 'manager'
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span>📱 {member.phone}</span>
                      <span>•</span>
                      <span>{member.designation || 'Staff'}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Initial Admin Setup Modal */}
      {isSetupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-950">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Set Up Business Admin Account
              </h2>
              <button
                onClick={() => setIsSetupOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterAdmin} className="p-5 space-y-3.5">
              {setupError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                  {setupError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={setupOrg}
                  onChange={(e) => setSetupOrg(e.target.value)}
                  placeholder="e.g. Acme Industries Ltd"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Admin Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Mobile Number * (Login)
                  </label>
                  <input
                    type="tel"
                    required
                    value={setupPhone}
                    onChange={(e) => setSetupPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Admin PIN (4-Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={setupPin}
                    onChange={(e) => setSetupPin(e.target.value)}
                    placeholder="1234"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSetupOpen(false)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
                >
                  Create & Launch Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
