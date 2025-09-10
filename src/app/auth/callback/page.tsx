'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          setError(`Authentication failed: ${error}`);
          return;
        }

        if (!code) {
          setError('No authorization code received');
          return;
        }

        const baseUrl = state || process.env.NEXT_PUBLIC_BASE_URL || 'https://felicit.at/dockermanager/api';

        // Exchange the authorization code for a JWT token
        const response = await fetch(`${baseUrl}/auth/google-signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirectUri: `${window.location.origin}/auth/callback`,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to authenticate with backend');
        }

        const data = await response.json();
        const { token, user } = data;

        // Store authentication data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Set token in API service
        import('@/services/apiService').then(({ apiService }) => {
          apiService.setToken(token);
        });

        // Redirect to main page
        router.push('/');
      } catch (err) {
        console.error('Authentication callback failed:', err);
        setError('Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Authentication Error</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Completing authentication...</p>
      </div>
    </div>
  );
}
