'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import ContainerList from '@/components/ContainerList';
import { apiService } from '@/services/apiService';

export default function Home() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      apiService.setToken(token);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <ContainerList />;
}
