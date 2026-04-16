'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Login page is no longer needed — auto anonymous auth handles session creation.
// Redirect to home for any existing links.
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="px-4 pt-12 flex justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
