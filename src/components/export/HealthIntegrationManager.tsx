'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { HealthIntegrationManager as HealthManager } from '@/lib/data-export-integration';
import type { HealthMetrics } from '@/lib/data-export-integration';

export interface HealthIntegrationManagerProps {
  onHealthDataUpdate?: (data: HealthMetrics) => void;
  onIntegrationStatusChange?: (status: string) => void;
  className?: string;
}

export default function HealthIntegrationManager({
  onHealthDataUpdate,
  onIntegrationStatusChange,
  className = ''
}: HealthIntegrationManagerProps) {
  const [healthManager] = useState(() => new HealthManager());
  const [availableIntegrations, setAvailableIntegrations] = useState<string[]>([]);
  const [healthData, setHealthData] = useState<HealthMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [permissions, setPermissions] = useState<{
    read: string[];
    write: string[];
  }>({ read: [], write: [] });

  // Initialize available integrations
  useEffect(() => {
    const integrations = healthManager.getAvailableIntegrations();
    setAvailableIntegrations(integrations);
  }, [healthManager]);

  // Request HealthKit permissions
  const requestPermissions = useCallback(async () => {
    try {
      const granted = await healthManager.requestHealthKitPermissions();
      if (granted) {
        setIsConnected(true);
        setPermissions({
          read: ['heartRate', 'steps', 'calories', 'distance'],
          write: ['workout', 'heartRate', 'steps', 'calories']
        });
        onIntegrationStatusChange?.('connected');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      onIntegrationStatusChange?.('error');
    }
  }, [healthManager, onIntegrationStatusChange]);

  // Read health data
  const readHealthData = useCallback(async () => {
    if (!isConnected) return;

    try {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const endDate = new Date();
      
      const data = await healthManager.readHealthData(startDate, endDate);
      setHealthData(data);
      onHealthDataUpdate?.(data);
    } catch (error) {
      console.error('Failed to read health data:', error);
    }
  }, [healthManager, isConnected, onHealthDataUpdate]);

  // Write workout data
  const writeWorkoutData = useCallback(async (workoutData: any) => {
    if (!isConnected) return false;

    try {
      const success = await healthManager.writeWorkoutToHealthKit(workoutData);
      if (success) {
        setLastSync(new Date());
      }
      return success;
    } catch (error) {
      console.error('Failed to write workout data:', error);
      return false;
    }
  }, [healthManager, isConnected]);

  // Sync with Garmin Connect
  const syncWithGarmin = useCallback(async () => {
    setIsSyncing(true);
    setSyncProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const workoutData = {
        activity: 'golf',
        duration: 45,
        calories: 250,
        heartRate: 75,
        steps: 5000,
        distance: 3.5
      };

      const success = await healthManager.syncWithGarminConnect(workoutData);
      
      clearInterval(progressInterval);
      setSyncProgress(100);

      if (success) {
        setLastSync(new Date());
      }
      
      return success;
    } catch (error) {
      console.error('Garmin sync failed:', error);
      return false;
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  }, [healthManager]);

  // Auto-sync health data
  useEffect(() => {
    if (isConnected && healthData) {
      const interval = setInterval(() => {
        readHealthData();
      }, 60000); // Sync every minute

      return () => clearInterval(interval);
    }
  }, [isConnected, healthData, readHealthData]);

  const getIntegrationIcon = (integration: string) => {
    switch (integration) {
      case 'Apple Health': return '🍎';
      case 'Garmin Connect': return '🏃';
      default: return '❤️';
    }
  };

  const getIntegrationColor = (integration: string) => {
    switch (integration) {
      case 'Apple Health': return 'text-blue-500';
      case 'Garmin Connect': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDistance = (miles: number) => {
    return `${miles.toFixed(1)} mi`;
  };

  const formatCalories = (calories: number) => {
    return `${calories} cal`;
  };

  const formatHeartRate = (bpm: number) => {
    return `${bpm} bpm`;
  };

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Health Integration</h3>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-white">
              {availableIntegrations.length}
            </div>
            <div className="text-sm text-gray-400">Available</div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(isConnected ? 'connected' : 'disconnected')}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {lastSync && (
            <span className="text-xs text-gray-400">
              Last sync: {lastSync.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Available Integrations */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-white mb-4">Available Integrations</h4>
          <div className="space-y-3">
            {availableIntegrations.map(integration => (
              <div key={integration} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getIntegrationIcon(integration)}</span>
                  <div>
                    <h5 className="text-sm font-medium text-white">{integration}</h5>
                    <p className="text-xs text-gray-400">Health & Fitness</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${getIntegrationColor(integration)}`}>
                    Available
                  </span>
                  {integration === 'Apple Health' && (
                    <button
                      onClick={requestPermissions}
                      disabled={isConnected}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnected ? 'Connected' : 'Connect'}
                    </button>
                  )}
                  {integration === 'Garmin Connect' && (
                    <button
                      onClick={syncWithGarmin}
                      disabled={isSyncing}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSyncing ? 'Syncing...' : 'Sync'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Health Data Display */}
        {healthData && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-white mb-4">Current Health Data</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">❤️</span>
                  <h5 className="text-sm font-medium text-white">Heart Rate</h5>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatHeartRate(healthData.heartRate)}
                </div>
                <div className="text-xs text-gray-400">Average BPM</div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">🔥</span>
                  <h5 className="text-sm font-medium text-white">Calories</h5>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatCalories(healthData.caloriesBurned)}
                </div>
                <div className="text-xs text-gray-400">Burned</div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">👣</span>
                  <h5 className="text-sm font-medium text-white">Steps</h5>
                </div>
                <div className="text-2xl font-bold text-white">
                  {healthData.steps.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Total Steps</div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">📏</span>
                  <h5 className="text-sm font-medium text-white">Distance</h5>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatDistance(healthData.distance)}
                </div>
                <div className="text-xs text-gray-400">Total Distance</div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">⏱️</span>
                  <h5 className="text-sm font-medium text-white">Duration</h5>
                </div>
                <div className="text-xl font-bold text-white">
                  {formatDuration(healthData.duration)}
                </div>
                <div className="text-xs text-gray-400">Session Time</div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">💪</span>
                  <h5 className="text-sm font-medium text-white">Intensity</h5>
                </div>
                <div className="text-xl font-bold text-white capitalize">
                  {healthData.intensity}
                </div>
                <div className="text-xs text-gray-400">Workout Level</div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">🔄</span>
                  <h5 className="text-sm font-medium text-white">Recovery</h5>
                </div>
                <div className="text-xl font-bold text-white">
                  {healthData.recoveryTime}h
                </div>
                <div className="text-xs text-gray-400">Recovery Time</div>
              </div>
            </div>
          </div>
        )}

        {/* Permissions */}
        {isConnected && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-white mb-4">Permissions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-sm font-medium text-white mb-2">Read Access</h5>
                <div className="space-y-1">
                  {permissions.read.map(permission => (
                    <div key={permission} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-300 capitalize">
                        {permission.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-sm font-medium text-white mb-2">Write Access</h5>
                <div className="space-y-1">
                  {permissions.write.map(permission => (
                    <div key={permission} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-xs text-gray-300 capitalize">
                        {permission.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sync Progress */}
        {isSyncing && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Sync Progress</span>
              <span>{syncProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={readHealthData}
            disabled={!isConnected}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Refresh Data
          </button>
          
          <button
            onClick={() => writeWorkoutData({
              activity: 'golf',
              duration: 45,
              calories: 250,
              heartRate: 75
            })}
            disabled={!isConnected}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Write Workout
          </button>
        </div>
      </div>
    </div>
  );
}
