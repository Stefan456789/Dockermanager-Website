'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ContainerInfo } from '../types';
import { apiService } from '../services/apiService';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import {
  RefreshCw,
  Play,
  Square,
  RotateCcw,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ContainerList() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performingAction, setPerformingAction] = useState<string | null>(null);

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getContainers();
      setContainers(data);
    } catch (err) {
      setError('Failed to fetch containers');
      console.error('Error fetching containers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContainerAction = async (containerId: string, action: 'start' | 'stop' | 'restart') => {
    try {
      setPerformingAction(`${action}-${containerId}`);
      switch (action) {
        case 'start':
          await apiService.startContainer(containerId);
          break;
        case 'stop':
          await apiService.stopContainer(containerId);
          break;
        case 'restart':
          await apiService.restartContainer(containerId);
          break;
      }
      // Refresh the container list
      await fetchContainers();
    } catch (err) {
      console.error(`Error ${action}ing container:`, err);
      setError(`Failed to ${action} container`);
    } finally {
      setPerformingAction(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'running':
        return 'text-green-600';
      case 'exited':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Docker Containers
            </h1>

            <div className="flex items-center space-x-4">
              <Button
                onClick={fetchContainers}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              {/* User Menu */}
              <div className="relative">
                <div className="flex items-center space-x-2 cursor-pointer">
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt="Profile"
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user?.name || user?.email || 'Anonymous'}
                  </span>
                </div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border">
                  <div className="py-1">
                    <button
                      onClick={() => {/* Show profile */}}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </button>
                    <button
                      onClick={() => {/* Show settings */}}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {containers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No containers found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {containers.map((container) => (
              <Card key={container.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`h-3 w-3 rounded-full ${getStateColor(container.state)}`} />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {container.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {container.image}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {container.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Action Buttons */}
                      {container.state === 'running' ? (
                        <>
                          <Button
                            onClick={() => handleContainerAction(container.id, 'stop')}
                            variant="outline"
                            size="sm"
                            disabled={performingAction === `stop-${container.id}`}
                          >
                            {performingAction === `stop-${container.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleContainerAction(container.id, 'restart')}
                            variant="outline"
                            size="sm"
                            disabled={performingAction === `restart-${container.id}`}
                          >
                            {performingAction === `restart-${container.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleContainerAction(container.id, 'start')}
                          variant="outline"
                          size="sm"
                          disabled={performingAction === `start-${container.id}`}
                        >
                          {performingAction === `start-${container.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}

                      {/* Details Button */}
                      <Button
                        onClick={() => router.push(`/container/${container.id}`)}
                        variant="ghost"
                        size="sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
