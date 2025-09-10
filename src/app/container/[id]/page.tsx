'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RouteGuard } from '../../../components/RouteGuard';
import { ContainerInfo } from '../../../types';
import { apiService, updateApiServiceSettings } from '../../../services/apiService';
import { getToken } from '../../../lib/auth';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Input } from '../../../components/ui/input';
import {
  ArrowLeft,
  Play,
  Square,
  RotateCcw,
  Terminal,
  Loader2,
  Send
} from 'lucide-react';

function ContainerDetailContent() {
  const params = useParams();
  const router = useRouter();
  const containerId = params.id as string;

  const [container, setContainer] = useState<ContainerInfo | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performingAction, setPerformingAction] = useState<string | null>(null);
  const [command, setCommand] = useState('');
  const [isFullscreenTerminal, setIsFullscreenTerminal] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const scrollToBottom = useCallback(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  const fetchContainerDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getContainerDetails(containerId);
      setContainer(data);
    } catch (err) {
      setError('Failed to fetch container details');
      console.error('Error fetching container details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [containerId]);

  const setupWebSocket = useCallback(() => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = apiService.getContainerLogsWebSocket(containerId);
    if (!ws) {
      setError('Failed to connect to logs stream');
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setError(null); // Clear any previous errors
      setIsWsConnected(true);
      setLogs(prev => [...prev, 'Connected to container logs...']);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data); // Debug log
        
        if (data.type === 'logs') {
          setLogs(prev => [...prev, data.log]);
        } else if (data.type === 'commandOutput') {
          setLogs(prev => [...prev, `> ${data.output}`]);
        } else if (data.type === 'error') {
          setLogs(prev => [...prev, `ERROR: ${data.message}`]);
          setError(`WebSocket error: ${data.message}`);
        }
      } catch (parseError) {
        console.error('Error parsing WebSocket message:', parseError);
        // If it's not JSON, treat as plain log message
        setLogs(prev => [...prev, event.data]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
      setIsWsConnected(false);
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setIsWsConnected(false);
      setLogs(prev => [...prev, 'Disconnected from container logs']);
      if (event.code !== 1000) { // Not a normal closure
        setError('WebSocket connection lost');
      }
    };
  }, [containerId]);

  useEffect(() => {
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

    // Set authentication token
    const token = getToken();
    if (token) {
      apiService.setToken(token);
    }

    fetchContainerDetails();
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [containerId]); // Only depend on containerId, not the callback functions

  const handleContainerAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      setPerformingAction(action);
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
      // Refresh container details
      await fetchContainerDetails();
    } catch (err) {
      console.error(`Error ${action}ing container:`, err);
      setError(`Failed to ${action} container`);
    } finally {
      setPerformingAction(null);
    }
  };

  const sendCommand = () => {
    if (!command.trim() || !wsRef.current || !isWsConnected) {
      if (!isWsConnected) {
        setLogs(prev => [...prev, 'ERROR: Not connected to container']);
      }
      return;
    }

    const commandData = {
      type: 'command',
      containerId: containerId,
      command: command.trim(),
    };

    wsRef.current.send(JSON.stringify(commandData));
    setLogs(prev => [...prev, `> ${command.trim()}`]);
    setCommand('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendCommand();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-500 dark:border-t-blue-400 mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-purple-500 dark:border-t-purple-400 mx-auto"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading container details...</p>
        </div>
      </div>
    );
  }

  if (!container) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 rounded-full flex items-center justify-center mb-6">
            <Terminal className="h-12 w-12 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Container not found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            The container you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/dashboard')} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Containers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="ghost"
                size="sm"
                className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className={`h-3 w-3 rounded-full ${container.state === 'running' ? 'bg-green-500' : container.state === 'exited' ? 'bg-red-500' : 'bg-yellow-500'} ring-2 ring-white dark:ring-gray-800`} />
                <div>
                  <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {container.name}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {container.image}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {container.state === 'running' ? (
                <>
                  <Button
                    onClick={() => handleContainerAction('stop')}
                    variant="outline"
                    size="sm"
                    disabled={performingAction === 'stop'}
                    className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200"
                  >
                    {performingAction === 'stop' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Square className="h-4 w-4 mr-2" />
                    )}
                    Stop
                  </Button>
                  <Button
                    onClick={() => handleContainerAction('restart')}
                    variant="outline"
                    size="sm"
                    disabled={performingAction === 'restart'}
                    className="hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-300 dark:hover:border-yellow-600 transition-all duration-200"
                  >
                    {performingAction === 'restart' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Restart
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => handleContainerAction('start')}
                  variant="outline"
                  size="sm"
                  disabled={performingAction === 'start'}
                  className="hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200"
                >
                  {performingAction === 'start' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 backdrop-blur-sm">
            <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Container Info */}
          <div className="lg:col-span-1">
            <Card className="group relative overflow-hidden bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                    <Terminal className="h-3 w-3 text-white" />
                  </div>
                  <span>Container Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {container.state} - {container.status}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Image
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {container.image}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Created
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(container.created).toLocaleString()}
                  </p>
                </div>
                {container.ports.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Ports
                    </label>
                    <div className="space-y-1">
                      {container.ports.map((port, index) => (
                        <p key={index} className="text-sm text-gray-900 dark:text-white">
                          {port.privatePort}:{port.publicPort || 'N/A'} ({port.type})
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Logs and Terminal */}
          <div className="lg:col-span-2">
            <Card className="group relative overflow-hidden bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-500 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-teal-600 rounded-md flex items-center justify-center">
                      <Terminal className="h-3 w-3 text-white" />
                    </div>
                    <span>Logs & Terminal</span>
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${isWsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-gray-500">
                        {isWsConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setLogs([])}
                      variant="outline"
                      size="sm"
                      disabled={logs.length === 0}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/20 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                    >
                      Clear Logs
                    </Button>
                    {!isWsConnected && (
                      <Button
                        onClick={setupWebSocket}
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                      >
                        Reconnect
                      </Button>
                    )}
                    <Button
                      onClick={() => setIsFullscreenTerminal(!isFullscreenTerminal)}
                      variant="outline"
                      size="sm"
                      className="hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200"
                    >
                      {isFullscreenTerminal ? 'Exit Fullscreen' : 'Fullscreen'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                {/* Logs */}
                <div className={`bg-black text-green-400 p-4 rounded-md font-mono text-sm overflow-auto ${
                  isFullscreenTerminal ? 'h-96' : 'h-64'
                }`}>
                  {logs.length === 0 ? (
                    <div className="text-gray-500">
                      {isWsConnected ? 'Waiting for logs...' : 'Not connected to container logs'}
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="whitespace-pre-wrap">
                        {log}
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>

                {/* Command Input */}
                <div className="flex items-center space-x-3 mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex-1 relative">
                    <Input
                      value={command}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommand(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isWsConnected ? "Enter command to execute in container..." : "Connect to WebSocket to execute commands..."}
                      disabled={!isWsConnected}
                      className="pr-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 font-mono">
                      ↵ Enter
                    </div>
                  </div>
                  <Button
                    onClick={sendCommand}
                    size="sm"
                    disabled={!command.trim() || !isWsConnected}
                    className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContainerDetail() {
  return (
    <RouteGuard>
      <ContainerDetailContent />
    </RouteGuard>
  );
}
