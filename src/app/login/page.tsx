'use client';


import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Server } from 'lucide-react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { BASE_PATH } from '@/lib/constants';


export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    console.log('Google auth success:', credentialResponse);
    setIsLoading(true);
    setError(null);

    try {
      // Send the token to your backend
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://felicit.at/dockermanager/api';
      console.log('Sending request to:', `${baseUrl}/auth/google-signin`);

      const response = await fetch(`${baseUrl}/auth/google-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
        }),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data);

      // Store authentication data in localStorage
      if (data.token && data.user) {
        console.log('Storing auth data:', { token: data.token.substring(0, 20) + '...', user: data.user });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Auth data stored successfully');

        // Verify storage
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        console.log('Verification - stored data:', { hasToken: !!storedToken, hasUser: !!storedUser });
      } else {
        console.error('API response missing token or user:', data);
        throw new Error('Invalid authentication response');
      }

      // Handle successful login (store tokens, redirect, etc.)
      console.log('Redirecting to dashboard...');
      window.location.href = `${BASE_PATH}/dashboard`; // Use full path with basePath
    } catch (error) {
      console.error('Login error:', error);
      setError(`Sign in failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign in was unsuccessful. Please try again.');
  };

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
        <Card className="relative w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Server className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
              Docker Manager
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-lg">
              Manage your Docker containers with ease
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            {error && (
              <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 backdrop-blur-sm">
                <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
              {isLoading ? (
                <Button disabled className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg" size="lg">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </Button>
              ) : (
                <div className="w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                    theme="outline"
                    size="large"
                    width="100%"
                    text="signin_with"
                    shape="rectangular"
                  />
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Secure authentication powered by Google OAuth
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </GoogleOAuthProvider>
  );
}
