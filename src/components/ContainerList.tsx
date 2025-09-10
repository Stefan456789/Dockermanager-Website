'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
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
  ChevronDown,
  Package,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ContainerList() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performingAction, setPerformingAction] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetchContainers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

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

  const handleSignOut = () => {
    signOut();
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-500 dark:border-t-blue-400 mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-purple-500 dark:border-t-purple-400 mx-auto ring-2 ring-background"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading containers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 shadow-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Docker Containers
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={fetchContainers}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              {/* User Menu */}
              <div className="relative">
                <div
                  className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 group"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {user?.picture ? (
                    <Image
                      src={user.picture}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full ring-2 ring-border group-hover:ring-blue-300 dark:group-hover:ring-blue-500 transition-all duration-200"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-border group-hover:ring-blue-300 dark:group-hover:ring-blue-500 transition-all duration-200">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user?.name || user?.email || 'Anonymous'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700 user-menu">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            // TODO: Implement profile view
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            router.push('/settings');
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </button>
                        <button
                          onClick={() => {
                            signOut();
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {containers.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mb-6">
              <Package className="h-12 w-12 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No containers found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Get started by creating your first Docker container. Your containers will appear here once they're running.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {containers.map((container) => (
              <Card key={container.id} className="group relative overflow-hidden bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`h-4 w-4 rounded-full ${getStateColor(container.state)} shadow-lg ring-2 ring-background`} />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                          {container.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {container.image}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 font-medium">
                          {container.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Action Buttons */}
                      {container.state === 'running' ? (
                        <>
                          <Button
                            onClick={() => handleContainerAction(container.id, 'stop')}
                            variant="outline"
                            size="sm"
                            disabled={performingAction === `stop-${container.id}`}
                            className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200"
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
                            className="hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-300 dark:hover:border-yellow-600 transition-all duration-200"
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
                          className="hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200"
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
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 group/details"
                      >
                        <ChevronRight className="h-4 w-4 group-hover/details:translate-x-1 transition-transform duration-200" />
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
