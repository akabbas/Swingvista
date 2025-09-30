'use client';

import React, { useState, useRef, useCallback } from 'react';
import MobileCameraRecorder from '@/components/mobile/MobileCameraRecorder';
import TouchVideoPlayer from '@/components/mobile/TouchVideoPlayer';
import MobilePoseVisualizer from '@/components/mobile/MobilePoseVisualizer';
import OfflineAnalysisManager from '@/components/mobile/OfflineAnalysisManager';
import { MobilePerformanceMonitor, type MobilePerformanceMetrics } from '@/lib/mobile-optimization';
import type { PoseResult } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export default function TestMobileOptimizationPage() {
  const [activeTab, setActiveTab] = useState<'camera' | 'player' | 'visualization' | 'offline' | 'performance'>('camera');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [poses, setPoses] = useState<PoseResult[]>([]);
  const [phases, setPhases] = useState<EnhancedSwingPhase[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState<MobilePerformanceMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const performanceMonitor = useRef(new MobilePerformanceMonitor());

  // Handle camera recording
  const handleRecordingComplete = useCallback((videoBlob: Blob) => {
    const videoUrl = URL.createObjectURL(videoBlob);
    setRecordedVideo(videoUrl);
    setIsRecording(false);
  }, []);

  const handleFrameCapture = useCallback((imageBlob: Blob) => {
    console.log('Frame captured:', imageBlob);
  }, []);

  const handleCameraError = useCallback((error: string) => {
    console.error('Camera error:', error);
  }, []);

  // Handle video playback
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleVolumeChange = useCallback((volume: number) => {
    console.log('Volume changed:', volume);
  }, []);

  const handleFullscreenToggle = useCallback((isFullscreen: boolean) => {
    console.log('Fullscreen toggled:', isFullscreen);
  }, []);

  const handlePlayPause = useCallback((isPlaying: boolean) => {
    console.log('Play/pause:', isPlaying);
  }, []);

  // Handle pose visualization
  const handleLandmarkSelect = useCallback((landmarkIndex: number, landmark: any) => {
    console.log('Landmark selected:', landmarkIndex, landmark);
  }, []);

  const handlePhaseSelect = useCallback((phase: EnhancedSwingPhase) => {
    console.log('Phase selected:', phase);
  }, []);

  // Handle offline analysis
  const handleAnalysisComplete = useCallback((result: any) => {
    console.log('Analysis complete:', result);
  }, []);

  const handleSyncComplete = useCallback((syncedItems: number) => {
    console.log('Sync complete:', syncedItems);
  }, []);

  const handleOfflineError = useCallback((error: string) => {
    console.error('Offline error:', error);
  }, []);

  // Performance monitoring
  const startPerformanceMonitoring = useCallback(() => {
    setIsMonitoring(true);
    performanceMonitor.current.startMonitoring();
    
    // Update metrics every second
    const interval = setInterval(() => {
      const metrics = performanceMonitor.current.getMetrics();
      setPerformanceMetrics(metrics.slice(-10)); // Keep last 10 metrics
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const stopPerformanceMonitoring = useCallback(() => {
    setIsMonitoring(false);
    performanceMonitor.current.stopMonitoring();
  }, []);

  // Generate mock data for testing
  const generateMockPoses = useCallback(() => {
    const mockPoses: PoseResult[] = [];
    for (let i = 0; i < 150; i++) {
      mockPoses.push({
        landmarks: Array.from({ length: 33 }, (_, index) => ({
          x: 0.5 + Math.sin(i * 0.1) * 0.1,
          y: 0.5 + Math.cos(i * 0.1) * 0.1,
          visibility: 0.9
        })),
        timestamp: i / 30,
        confidence: 0.9,

        worldLandmarks: landmarks.map(lm => ({ ...lm, z: 0,

        worldLandmarks: landmarks.map(lm => ({ ...lm, z: 0 })) }))
      });
    }
    setPoses(mockPoses);
  }, []);

  const generateMockPhases = useCallback(() => {
    const mockPhases: EnhancedSwingPhase[] = [
      {
        name: 'address',
        startTime: 0,
        endTime: 1,
        startFrame: 0,
        endFrame: 30,
        duration: 1,
        confidence: 0.95,
        grade: 'A',
        color: '#00ff00',
        keyPoints: [0],
        metrics: { tempo: 0.8, balance: 0.9, posture: 0.85 },
        recommendations: ['Maintain steady posture'],

        description: "Phase description",

        professionalBenchmark: {

          idealDuration: 1.0,

          keyPositions: [],

          commonMistakes: []

        }
      },
      {
        name: 'backswing',
        startTime: 1,
        endTime: 2.5,
        startFrame: 30,
        endFrame: 75,
        duration: 1.5,
        confidence: 0.9,
        grade: 'B+',
        color: '#ffff00',
        keyPoints: [45],
        metrics: { tempo: 0.7, balance: 0.8, posture: 0.75 },
        recommendations: ['Smooth tempo transition'],

        description: "Phase description",

        professionalBenchmark: {

          idealDuration: 1.0,

          keyPositions: [],

          commonMistakes: []

        }
      },
      {
        name: 'downswing',
        startTime: 2.5,
        endTime: 4,
        startFrame: 75,
        endFrame: 120,
        duration: 1.5,
        confidence: 0.88,
        grade: 'A',
        color: '#ff0000',
        keyPoints: [105],
        metrics: { tempo: 0.85, balance: 0.9, posture: 0.88 },
        recommendations: ['Great power generation'],

        description: "Phase description",

        professionalBenchmark: {

          idealDuration: 1.0,

          keyPositions: [],

          commonMistakes: []

        }
      },
      {
        name: 'follow-through',
        startTime: 4,
        endTime: 5,
        startFrame: 120,
        endFrame: 150,
        duration: 1,
        confidence: 0.87,
        grade: 'B+',
        color: '#00ffff',
        keyPoints: [135],
        metrics: { tempo: 0.8, balance: 0.85, posture: 0.82 },
        recommendations: ['Hold finish position longer'],

        description: "Phase description",

        professionalBenchmark: {

          idealDuration: 1.0,

          keyPositions: [],

          commonMistakes: []

        }
      }
    ];
    setPhases(mockPhases);
  }, []);

  // Initialize mock data
  React.useEffect(() => {
    generateMockPoses();
    generateMockPhases();
  }, [generateMockPoses, generateMockPhases]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Mobile Optimization Testing
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('camera')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'camera' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Camera Recording
              </button>
              <button
                onClick={() => setActiveTab('player')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'player' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Touch Video Player
              </button>
              <button
                onClick={() => setActiveTab('visualization')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'visualization' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Pose Visualization
              </button>
              <button
                onClick={() => setActiveTab('offline')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'offline' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Offline Analysis
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === 'performance' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Performance
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'camera' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Mobile Camera Recording</h3>
                  <MobileCameraRecorder
                    onRecordingComplete={handleRecordingComplete}
                    onFrameCapture={handleFrameCapture}
                    onError={handleCameraError}
                    className="h-96"
                  />
                </div>
              </div>
            )}

            {activeTab === 'player' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Touch Video Player</h3>
                  <TouchVideoPlayer
                    videoSrc={recordedVideo || '/sample-golf-swing.mp4'}
                    onTimeUpdate={handleTimeUpdate}
                    onVolumeChange={handleVolumeChange}
                    onFullscreenToggle={handleFullscreenToggle}
                    onPlayPause={handlePlayPause}
                    className="h-96"
                  />
                </div>
              </div>
            )}

            {activeTab === 'visualization' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Mobile Pose Visualization</h3>
                  <MobilePoseVisualizer
                    poses={poses}
                    phases={phases}
                    currentTime={currentTime}
                    onLandmarkSelect={handleLandmarkSelect}
                    onPhaseSelect={handlePhaseSelect}
                    className="h-96"
                  />
                </div>
              </div>
            )}

            {activeTab === 'offline' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Offline Analysis</h3>
                  <OfflineAnalysisManager
                    onAnalysisComplete={handleAnalysisComplete}
                    onSyncComplete={handleSyncComplete}
                    onError={handleOfflineError}
                    className="h-96"
                  />
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Mobile Performance Monitoring</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={isMonitoring ? stopPerformanceMonitoring : startPerformanceMonitoring}
                      className={`px-4 py-2 rounded-lg ${
                        isMonitoring 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                    >
                      {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                    </button>
                    <button
                      onClick={() => setPerformanceMetrics([])}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Clear Metrics
                    </button>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-white mb-2">Frame Rate</h4>
                      <div className="text-2xl font-bold text-white">
                        {performanceMetrics.length > 0 
                          ? performanceMetrics[performanceMetrics.length - 1]?.frameRate.toFixed(1) || '0'
                          : '0'
                        } FPS
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-white mb-2">Memory Usage</h4>
                      <div className="text-2xl font-bold text-white">
                        {performanceMetrics.length > 0 
                          ? (performanceMetrics[performanceMetrics.length - 1]?.memoryUsage || 0 / 1024 / 1024).toFixed(1)
                          : '0'
                        } MB
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-white mb-2">Battery Level</h4>
                      <div className="text-2xl font-bold text-white">
                        {performanceMetrics.length > 0 
                          ? ((performanceMetrics[performanceMetrics.length - 1]?.batteryLevel || 0) * 100).toFixed(0)
                          : '0'
                        }%
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-white mb-2">Network Status</h4>
                      <div className="text-2xl font-bold text-white">
                        {performanceMetrics.length > 0 
                          ? performanceMetrics[performanceMetrics.length - 1]?.networkStatus || 'online'
                          : 'online'
                        }
                      </div>
                    </div>
                  </div>

                  {/* Performance History */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-2">Performance History</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {performanceMetrics.map((metric, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-300">
                            {new Date().toLocaleTimeString()}
                          </span>
                          <span className="text-white">
                            {metric.frameRate.toFixed(1)} FPS, {metric.memoryUsage.toFixed(0)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mobile Features */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Mobile Features</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Camera integration for live recording</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Touch-friendly video controls</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Mobile-optimized pose visualization</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Offline analysis capability</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Performance monitoring</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Responsive design</span>
                </div>
              </div>
            </div>

            {/* Touch Controls */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Touch Controls</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div>👆 Single tap: Play/pause</div>
                <div>👆👆 Double tap: Fullscreen</div>
                <div>👈👉 Swipe: Seek video</div>
                <div>👆👇 Swipe: Volume control</div>
                <div>🤏 Pinch: Zoom video</div>
                <div>👆 Tap landmarks: Show info</div>
              </div>
            </div>

            {/* Performance Tips */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Tips</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div>• Use WiFi for better performance</div>
                <div>• Close other apps to free memory</div>
                <div>• Enable offline mode for analysis</div>
                <div>• Use lower quality for faster processing</div>
                <div>• Keep device charged during analysis</div>
                <div>• Use landscape mode for better view</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('camera')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Test Camera
                </button>
                <button
                  onClick={() => setActiveTab('player')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Test Video Player
                </button>
                <button
                  onClick={() => setActiveTab('visualization')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Test Visualization
                </button>
                <button
                  onClick={() => setActiveTab('offline')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Test Offline Mode
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Monitor Performance
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
