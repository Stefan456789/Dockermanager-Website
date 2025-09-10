'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { ContainerInfo } from '../../../types';
import { apiService } from '../../../services/apiService';
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

export default function ContainerDetail() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const containerId = params.id as string;

  const [container, setContainer] = useState<ContainerInfo | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performingAction, setPerformingAction] = useState<string | null>(null);
  const [command, setCommand] = useState('');
  const [isFullscreenTerminal, setIsFullscreenTerminal] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchContainerDetails();
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [containerId, isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchContainerDetails = async () => {
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
  };

  const setupWebSocket = () => {
    const ws = apiService.getContainerLogsWebSocket(containerId);
    if (!ws) {
      setError('Failed to connect to logs stream');
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'log') {
          setLogs(prev => [...prev, data.message]);
        }
      } catch (err) {
        // If it's not JSON, treat as plain log message
        setLogs(prev => [...prev, event.data]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };
  };

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
    if (!command.trim() || !wsRef.current) return;

    const commandData = {
      type: 'command',
      containerId: containerId,
      command: command.trim(),
    };

    wsRef.current.send(JSON.stringify(commandData));
    setCommand('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendCommand();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!container) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Container not found</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Containers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/')}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {container.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {container.image}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {container.state === 'running' ? (
                <>
                  <Button
                    onClick={() => handleContainerAction('stop')}
                    variant="outline"
                    size="sm"
                    disabled={performingAction === 'stop'}
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
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Container Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Container Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Terminal className="h-5 w-5 mr-2" />
                    Logs & Terminal
                  </CardTitle>
                  <Button
                    onClick={() => setIsFullscreenTerminal(!isFullscreenTerminal)}
                    variant="outline"
                    size="sm"
                  >
                    {isFullscreenTerminal ? 'Exit Fullscreen' : 'Fullscreen'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Logs */}
                <div className={`bg-black text-green-400 p-4 rounded-md font-mono text-sm overflow-auto ${
                  isFullscreenTerminal ? 'h-96' : 'h-64'
                }`}>
                  {logs.length === 0 ? (
                    <p className="text-gray-500">No logs available</p>
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
                <div className="flex items-center space-x-2 mt-4">
                  <Input
                    value={command}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommand(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter command..."
                    className="flex-1"
                  />
                  <Button onClick={sendCommand} size="sm">
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
