'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/storage';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
    } else if (user.role === 'admin') {
      router.replace('/admin');
    } else {
      router.replace('/punch');
    }
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center p-6 text-slate-400 text-sm">
      Loading WorkPulse Attendance...
    </div>
  );
}
