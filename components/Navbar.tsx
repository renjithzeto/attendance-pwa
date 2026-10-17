'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, setCurrentUser } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { LogOut, MapPin, User, ShieldCheck, ShieldAlert, Sliders, Calendar, Download } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState(getCurrentUser());

  React.useEffect(() => {
    setUser(getCurrentUser());
  }, [pathname]);

  const handleLogout = () => {
    setCurrentUser(null);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href={user?.role === 'admin' ? '/admin' : '/punch'} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 font-bold text-white shadow-md shadow-blue-500/20">
            WP
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white">WorkPulse</span>
            <span className="text-[10px] font-medium text-slate-400">Attendance PWA</span>
          </div>
        </Link>

        {/* Right action / Profile info */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Role-based navigation */}
              {user.role === 'admin' ? (
                <div className="hidden sm:flex items-center gap-1 mr-2 text-xs">
                  <Link
                    href="/admin"
                    className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      pathname === '/admin' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Daily Monitor
                  </Link>
                  <Link
                    href="/admin/settings"
                    className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      pathname === '/admin/settings' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Geofence & Grace
                  </Link>
                  <Link
                    href="/admin/export"
                    className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      pathname === '/admin/export' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV Export
                  </Link>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1 mr-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Shift: {user.shift_start}
                  </span>
                </div>
              )}

              {/* User badge */}
              <div className="flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1.5 border border-slate-700/80">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                  {user.role === 'admin' ? <ShieldCheck className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                </div>
                <div className="flex flex-col text-left">
                  <span className="max-w-[110px] sm:max-w-[150px] truncate text-xs font-semibold text-slate-200">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Logout / Switch */}
              <button
                onClick={handleLogout}
                title="Switch User / Logout"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-red-400 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav subbar for Admin */}
      {user?.role === 'admin' && (
        <div className="flex sm:hidden border-t border-slate-800 bg-slate-900/95 px-4 py-2 gap-2 text-xs overflow-x-auto">
          <Link
            href="/admin"
            className={`px-3 py-1 rounded-md whitespace-nowrap ${
              pathname === '/admin' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            Daily Monitor
          </Link>
          <Link
            href="/admin/settings"
            className={`px-3 py-1 rounded-md whitespace-nowrap ${
              pathname === '/admin/settings' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            Geofence & Grace
          </Link>
          <Link
            href="/admin/export"
            className={`px-3 py-1 rounded-md whitespace-nowrap ${
              pathname === '/admin/export' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            CSV Export
          </Link>
        </div>
      )}
    </header>
  );
}
