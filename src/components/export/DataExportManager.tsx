'use client';

import React, { useState, useCallback, useRef } from 'react';
import { DataExportIntegrationManager, type ExportOptions, type VideoExportOptions } from '@/lib/data-export-integration';
import type { SwingMetrics } from '@/lib/data-export-integration';
import type { PoseResult } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export interface DataExportManagerProps {
  swingMetrics: SwingMetrics[];
  poses: PoseResult[];
  phases: EnhancedSwingPhase[];
  annotations: any[];
  voiceNotes: any[];
  onExportComplete?: (format: string, data: any) => void;
  onExportError?: (error: string) => void;
  className?: string;
}

export default function DataExportManager({
  swingMetrics,
  poses,
  phases,
  annotations,
  voiceNotes,
  onExportComplete,
  onExportError,
  className = ''
}: DataExportManagerProps) {
  const [exportManager] = useState(() => new DataExportIntegrationManager());
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'csv' | 'api' | 'health' | 'video'>('csv');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includePhases: true,
    includeFaults: true,
    includeDrills: true,
    includeProgress: true,
    includeHealth: true,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    },
    compression: false,
    encryption: false
  });
  const [videoOptions, setVideoOptions] = useState<VideoExportOptions>({
    format: 'mp4',
    quality: 'high',
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    includeOverlays: true,
    overlaySettings: {
      showPose: true,
      showPhases: true,
      showMetrics: true,
      showAnnotations: true,
      showVoiceNotes: true
    },
    compression: true,
    watermark: false
  });
  const [availableIntegrations, setAvailableIntegrations] = useState<{
    api: any[];
    health: string[];
  }>({ api: [], health: [] });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize available integrations
  React.useEffect(() => {
    const integrations = exportManager.getAvailableIntegrations();
    setAvailableIntegrations(integrations);
  }, [exportManager]);

  // Handle CSV export
  const handleCSVExport = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      let csvData = '';
      
      if (exportOptions.includePhases) {
        csvData += exportManager.exportPhasesToCSV(phases, exportOptions) + '\n\n';
      }
      
      if (exportOptions.includeFaults) {
        const faults = swingMetrics.flatMap(metric => metric.faults);
        csvData += exportManager.exportFaultsToCSV(faults, exportOptions) + '\n\n';
      }
      
      if (exportOptions.includeDrills) {
        const drills = swingMetrics.flatMap(metric => metric.drills);
        csvData += exportManager.exportDrillsToCSV(drills, exportOptions) + '\n\n';
      }
      
      if (exportOptions.includeProgress) {
        csvData += exportManager.exportSwingMetricsToCSV(swingMetrics, exportOptions);
      }

      clearInterval(progressInterval);
      setExportProgress(100);

      // Download CSV file
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `swing-metrics-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      onExportComplete?.('csv', csvData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'CSV export failed';
      onExportError?.(errorMessage);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [exportManager, exportOptions, swingMetrics, phases, onExportComplete, onExportError]);

  // Handle API integration
  const handleAPIIntegration = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const exportData = {
        swingMetrics,
        poses,
        phases,
        annotations,
        voiceNotes,
        timestamp: new Date().toISOString()
      };

      const results = await exportManager.syncWithIntegrations(exportData);
      
      clearInterval(progressInterval);
      setExportProgress(100);

      onExportComplete?.('api', results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API integration failed';
      onExportError?.(errorMessage);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [exportManager, swingMetrics, poses, phases, annotations, voiceNotes, onExportComplete, onExportError]);

  // Handle health integration
  const handleHealthIntegration = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const healthData = {
        heartRate: 75,
        caloriesBurned: 250,
        steps: 5000,
        distance: 3.5,
        duration: 45,
        intensity: 'moderate',
        recoveryTime: 24
      };

      const success = await exportManager.syncWithHealthApps(healthData);
      
      clearInterval(progressInterval);
      setExportProgress(100);

      onExportComplete?.('health', { success, data: healthData });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Health integration failed';
      onExportError?.(errorMessage);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [exportManager, onExportComplete, onExportError]);

  // Handle video export
  const handleVideoExport = useCallback(async () => {
    if (!canvasRef.current || !videoRef.current) {
      onExportError?.('Canvas or video element not available');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Initialize video exporter
      exportManager.initializeVideoExporter(canvasRef.current, videoRef.current);

      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const videoBlob = await exportManager.exportVideoWithOverlays(
        videoOptions,
        poses,
        phases,
        annotations,
        voiceNotes
      );

      clearInterval(progressInterval);
      setExportProgress(100);

      // Download video file
      const url = URL.createObjectURL(videoBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `swing-analysis-${new Date().toISOString().split('T')[0]}.${videoOptions.format}`;
      link.click();
      URL.revokeObjectURL(url);

      onExportComplete?.('video', videoBlob);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Video export failed';
      onExportError?.(errorMessage);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [exportManager, videoOptions, poses, phases, annotations, voiceNotes, onExportComplete, onExportError]);

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return '📊';
      case 'json': return '📄';
      case 'xml': return '📋';
      case 'excel': return '📈';
      case 'mp4': return '🎥';
      case 'mov': return '🎬';
      case 'avi': return '📹';
      case 'webm': return '🌐';
      default: return '📁';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'low': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-green-500';
      case 'ultra': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Data Export & Integration</h3>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-white">{swingMetrics.length}</div>
            <div className="text-sm text-gray-400">Sessions</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4">
          {[
            { id: 'csv', label: 'CSV Export', icon: '📊' },
            { id: 'api', label: 'API Integration', icon: '🔗' },
            { id: 'health', label: 'Health Apps', icon: '❤️' },
            { id: 'video', label: 'Video Export', icon: '🎥' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'csv' && (
          <div className="space-y-6">
            {/* CSV Export Options */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-semibold text-white mb-4">CSV Export Options</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Format</label>
                  <select
                    value={exportOptions.format}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                    <option value="excel">Excel</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Date Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={exportOptions.dateRange.start.toISOString().split('T')[0]}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: new Date(e.target.value) }
                      }))}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="date"
                      value={exportOptions.dateRange.end.toISOString().split('T')[0]}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: new Date(e.target.value) }
                      }))}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="text-sm font-medium text-white mb-2">Include Data</h5>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'includePhases', label: 'Swing Phases' },
                    { key: 'includeFaults', label: 'Faults' },
                    { key: 'includeDrills', label: 'Drills' },
                    { key: 'includeProgress', label: 'Progress' },
                    { key: 'includeHealth', label: 'Health Data' }
                  ].map(option => (
                    <label key={option.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          [option.key]: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="text-sm font-medium text-white mb-2">Export Options</h5>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.compression}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, compression: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Compression</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.encryption}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, encryption: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Encryption</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleCSVExport}
              disabled={isExporting}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            {/* API Integration Status */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-semibold text-white mb-4">API Integrations</h4>
              
              <div className="space-y-3">
                {availableIntegrations.api.map(integration => (
                  <div key={integration.id} className="flex justify-between items-center p-3 bg-gray-600 rounded-lg">
                    <div>
                      <h5 className="text-sm font-medium text-white">{integration.name}</h5>
                      <p className="text-xs text-gray-400">{integration.type}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        integration.status === 'active' ? 'bg-green-100 text-green-800' :
                        integration.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {integration.status}
                      </span>
                      <button
                        onClick={() => setExportOptions(prev => ({ ...prev, format: 'json' }))}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* API Export Button */}
            <button
              onClick={handleAPIIntegration}
              disabled={isExporting}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Syncing...' : 'Sync with APIs'}
            </button>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
            {/* Health Integration Status */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-semibold text-white mb-4">Health App Integrations</h4>
              
              <div className="space-y-3">
                {availableIntegrations.health.map(integration => (
                  <div key={integration} className="flex justify-between items-center p-3 bg-gray-600 rounded-lg">
                    <div>
                      <h5 className="text-sm font-medium text-white">{integration}</h5>
                      <p className="text-xs text-gray-400">Health & Fitness</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                        Available
                      </span>
                      <button
                        onClick={() => setExportOptions(prev => ({ ...prev, format: 'json' }))}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Export Button */}
            <button
              onClick={handleHealthIntegration}
              disabled={isExporting}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Syncing...' : 'Sync with Health Apps'}
            </button>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="space-y-6">
            {/* Video Export Options */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-semibold text-white mb-4">Video Export Options</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Format</label>
                  <select
                    value={videoOptions.format}
                    onChange={(e) => setVideoOptions(prev => ({ ...prev, format: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="mp4">MP4</option>
                    <option value="mov">MOV</option>
                    <option value="avi">AVI</option>
                    <option value="webm">WebM</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Quality</label>
                  <select
                    value={videoOptions.quality}
                    onChange={(e) => setVideoOptions(prev => ({ ...prev, quality: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="text-sm font-medium text-white mb-2">Overlay Settings</h5>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'showPose', label: 'Pose Overlay' },
                    { key: 'showPhases', label: 'Phase Indicators' },
                    { key: 'showMetrics', label: 'Metrics Display' },
                    { key: 'showAnnotations', label: 'Annotations' },
                    { key: 'showVoiceNotes', label: 'Voice Notes' }
                  ].map(option => (
                    <label key={option.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={videoOptions.overlaySettings[option.key as keyof typeof videoOptions.overlaySettings] as boolean}
                        onChange={(e) => setVideoOptions(prev => ({
                          ...prev,
                          overlaySettings: {
                            ...prev.overlaySettings,
                            [option.key]: e.target.checked
                          }
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Video Export Button */}
            <button
              onClick={handleVideoExport}
              disabled={isExporting}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Export Video'}
            </button>
          </div>
        )}

        {/* Export Progress */}
        {isExporting && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Export Progress</span>
              <span>{exportProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Hidden Canvas and Video Elements */}
        <canvas ref={canvasRef} className="hidden" />
        <video ref={videoRef} className="hidden" />
      </div>
    </div>
  );
}
