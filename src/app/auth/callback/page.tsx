'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  useEffect(() => {
    // Handle OAuth callback - redirect to dashboard
    window.location.href = '/dashboard';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}