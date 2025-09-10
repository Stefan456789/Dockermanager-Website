'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/lib/settings';
import { updateApiServiceSettings } from '@/services/apiService';
import { RouteGuard } from '@/components/RouteGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

function SettingsContent() {
  const router = useRouter();
  const { settings, updateSettings, resetSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSettingChange = (key: keyof typeof settings, value: string) => {
    if (key === 'theme') {
      // Apply theme immediately
      const root = document.documentElement;
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const appliedTheme = value === 'system' ? systemTheme : value;
      if (appliedTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = () => {
    setSaveStatus('saving');
    try {
      updateSettings(localSettings);
      // Update API service with new settings
      updateApiServiceSettings(localSettings.baseUrl, localSettings.baseWsUrl);
      setHasChanges(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
    setSaveStatus('idle');
  };

  const handleResetToDefaults = () => {
    resetSettings();
    setLocalSettings({
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://felicit.at/dockermanager/api',
      baseWsUrl: process.env.NEXT_PUBLIC_BASE_WS_URL || 'wss://felicit.at/dockermanager',
      theme: 'system',
    });
    setHasChanges(true);
    setSaveStatus('idle');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="ghost"
                size="sm"
                className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Settings
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {saveStatus === 'saved' && (
                <div className="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Saved</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Error saving</span>
                </div>
              )}
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                disabled={!hasChanges}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Changes
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                disabled={!hasChanges || saveStatus === 'saving'}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* API Configuration */}
          <Card className="group relative overflow-hidden bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xs">API</span>
                </div>
                <span>API Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-6">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base API URL</Label>
                <Input
                  id="baseUrl"
                  value={localSettings.baseUrl}
                  onChange={(e) => handleSettingChange('baseUrl', e.target.value)}
                  placeholder="https://your-api.com/api"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  The base URL for API requests to your Docker Manager backend.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseWsUrl">WebSocket URL</Label>
                <Input
                  id="baseWsUrl"
                  value={localSettings.baseWsUrl}
                  onChange={(e) => handleSettingChange('baseWsUrl', e.target.value)}
                  placeholder="wss://your-api.com"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  The WebSocket URL for real-time container logs and updates.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="group relative overflow-hidden bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xs">🎨</span>
                </div>
                <span>Appearance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="space-y-2">
                <label htmlFor="theme" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Theme
                </label>
                <div className="relative">
                  <select
                    id="theme"
                    value={localSettings.theme}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSettingChange('theme', e.target.value as 'light' | 'dark' | 'system')}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="light">🌞 Light</option>
                    <option value="dark">🌙 Dark</option>
                    <option value="system">💻 System</option>
                  </select>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose your preferred theme or follow your system setting.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reset to Defaults */}
          <Card className="group relative overflow-hidden bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-500 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-orange-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xs">⚠️</span>
                </div>
                <span>Reset Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reset all settings to their default values. This action cannot be undone.
                </p>
                <Button
                  onClick={handleResetToDefaults}
                  variant="destructive"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Status Alert */}
          {saveStatus === 'saved' && (
            <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 backdrop-blur-sm">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
                Settings saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {saveStatus === 'error' && (
            <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
                Failed to save settings. Please try again.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <RouteGuard>
      <SettingsContent />
    </RouteGuard>
  );
}
