'use client';

import { useEffect } from 'react';
import { RouteGuard } from '@/components/RouteGuard';
import ContainerList from '@/components/ContainerList';
import { apiService, updateApiServiceSettings } from '@/services/apiService';

export default function Dashboard() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
    }

    // Apply saved settings to API service
    const savedSettings = localStorage.getItem('docker-manager-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        updateApiServiceSettings(settings.baseUrl, settings.baseWsUrl);
      } catch (error) {
        console.error('Error applying saved settings:', error);
      }
    }
  }, []);

  return (
    <RouteGuard>
      <ContainerList />
    </RouteGuard>
  );
}