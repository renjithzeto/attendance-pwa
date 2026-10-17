'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Always navigate to the Login Portal on launch (Admin vs Staff selection)
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-slate-950 p-6 text-slate-400 text-xs">
      Loading WorkPulse Portal...
    </div>
  );
}
