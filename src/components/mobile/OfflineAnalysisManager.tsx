'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { OfflineAnalysisManager as OfflineAnalysisManagerClass, type OfflineAnalysisConfig } from '@/lib/mobile-optimization';

export interface OfflineAnalysisManagerProps {
  onAnalysisComplete?: (result: any) => void;
  onSyncComplete?: (syncedItems: number) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function OfflineAnalysisManager({
  onAnalysisComplete,
  onSyncComplete,
  onError,
  className = ''
}: OfflineAnalysisManagerProps) {
  const [offlineManager] = useState(() => new OfflineAnalysisManagerClass());
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [cachedItems, setCachedItems] = useState(0);
  const [syncQueue, setSyncQueue] = useState(0);
  const [offlineConfig, setOfflineConfig] = useState<OfflineAnalysisConfig>({
    enableOfflineMode: true,
    cacheSize: 100 * 1024 * 1024, // 100MB
    syncOnConnect: true,
    compressionLevel: 6,
    encryptionEnabled: false
  });

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (offlineConfig.syncOnConnect) {
        handleSync();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineConfig.syncOnConnect]);

  // Perform offline analysis
  const performOfflineAnalysis = useCallback(async (input: any) => {
    if (!offlineConfig.enableOfflineMode) {
      onError?.('Offline analysis not enabled');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await offlineManager.performOfflineAnalysis(input);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      onAnalysisComplete?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Offline analysis failed';
      onError?.(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [offlineManager, offlineConfig.enableOfflineMode, onAnalysisComplete, onError]);

  // Store data offline
  const storeOfflineData = useCallback(async (key: string, data: any) => {
    try {
      await offlineManager.storeOfflineData(key, data);
      setCachedItems(prev => prev + 1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to store offline data';
      onError?.(errorMessage);
    }
  }, [offlineManager, onError]);

  // Retrieve offline data
  const getOfflineData = useCallback(async (key: string) => {
    try {
      return await offlineManager.getOfflineData(key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve offline data';
      onError?.(errorMessage);
      return null;
    }
  }, [offlineManager, onError]);

  // Sync offline data
  const handleSync = useCallback(async () => {
    if (isOffline) return;

    try {
      // Simulate sync process
      setSyncQueue(prev => prev + 1);
      
      // Simulate sync completion
      setTimeout(() => {
        setSyncQueue(prev => Math.max(0, prev - 1));
        onSyncComplete?.(1);
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      onError?.(errorMessage);
    }
  }, [isOffline, onSyncComplete, onError]);

  // Clear offline cache
  const clearOfflineCache = useCallback(async () => {
    try {
      // Clear cache implementation would go here
      setCachedItems(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear cache';
      onError?.(errorMessage);
    }
  }, [onError]);

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Offline Analysis</h3>
      
      {/* Network Status */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isOffline ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <span className="text-sm text-white">
            {isOffline ? 'Offline Mode' : 'Online Mode'}
          </span>
        </div>
      </div>

      {/* Offline Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">{cachedItems}</div>
          <div className="text-sm text-gray-400">Cached Items</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">{syncQueue}</div>
          <div className="text-sm text-gray-400">Sync Queue</div>
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Analyzing...</span>
            <span>{analysisProgress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Offline Controls */}
      <div className="space-y-3">
        <button
          onClick={() => performOfflineAnalysis({ test: 'data' })}
          disabled={isAnalyzing}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? 'Analyzing...' : 'Start Offline Analysis'}
        </button>
        
        <button
          onClick={() => storeOfflineData('test_' + Date.now(), { test: 'data' })}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Store Data Offline
        </button>
        
        <button
          onClick={handleSync}
          disabled={isOffline}
          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sync When Online
        </button>
        
        <button
          onClick={clearOfflineCache}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Clear Offline Cache
        </button>
      </div>

      {/* Offline Settings */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-medium text-white mb-3">Offline Settings</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={offlineConfig.enableOfflineMode}
              onChange={(e) => setOfflineConfig(prev => ({
                ...prev,
                enableOfflineMode: e.target.checked
              }))}
              className="rounded"
            />
            <span className="text-sm text-gray-300">Enable Offline Mode</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={offlineConfig.syncOnConnect}
              onChange={(e) => setOfflineConfig(prev => ({
                ...prev,
                syncOnConnect: e.target.checked
              }))}
              className="rounded"
            />
            <span className="text-sm text-gray-300">Sync on Connect</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={offlineConfig.encryptionEnabled}
              onChange={(e) => setOfflineConfig(prev => ({
                ...prev,
                encryptionEnabled: e.target.checked
              }))}
              className="rounded"
            />
            <span className="text-sm text-gray-300">Enable Encryption</span>
          </label>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Cache Size (MB)</label>
            <input
              type="range"
              min="10"
              max="500"
              value={offlineConfig.cacheSize / (1024 * 1024)}
              onChange={(e) => setOfflineConfig(prev => ({
                ...prev,
                cacheSize: parseInt(e.target.value) * 1024 * 1024
              }))}
              className="w-full"
            />
            <div className="text-xs text-gray-400">
              {Math.floor(offlineConfig.cacheSize / (1024 * 1024))} MB
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Compression Level</label>
            <input
              type="range"
              min="1"
              max="9"
              value={offlineConfig.compressionLevel}
              onChange={(e) => setOfflineConfig(prev => ({
                ...prev,
                compressionLevel: parseInt(e.target.value)
              }))}
              className="w-full"
            />
            <div className="text-xs text-gray-400">
              Level {offlineConfig.compressionLevel} (1 = Fast, 9 = Best)
            </div>
          </div>
        </div>
      </div>

      {/* Offline Features */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-medium text-white mb-3">Offline Features</h4>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
            <span>Local data storage and retrieval</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
            <span>Automatic sync when connection restored</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
            <span>Data compression for storage efficiency</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
            <span>Encryption for data security</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
            <span>Background processing capabilities</span>
          </div>
        </div>
      </div>
    </div>
  );
}
