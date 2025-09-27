'use client';

import React, { useState, useCallback, useRef } from 'react';
import BackgroundProcessingManager from '@/components/processing/BackgroundProcessingManager';
import VideoCompressionManager from '@/components/processing/VideoCompressionManager';
import CacheManager from '@/components/processing/CacheManager';
import { 
  FrameSampler, 
  BackgroundProcessor, 
  VideoCompressor, 
  AnalysisCache,
  PerformanceMonitor 
} from '@/lib/performance-optimization';
import type { 
  FrameSamplingConfig, 
  VideoCompressionConfig,
  PerformanceMetrics 
} from '@/lib/performance-optimization';

export default function TestPerformanceOptimizationPage() {
  const [activeTab, setActiveTab] = useState<'sampling' | 'processing' | 'compression' | 'caching' | 'monitoring'>('sampling');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // Performance components
  const frameSampler = useRef(new FrameSampler());
  const backgroundProcessor = useRef(new BackgroundProcessor());
  const videoCompressor = useRef(new VideoCompressor());
  const analysisCache = useRef(new AnalysisCache());
  const performanceMonitor = useRef(new PerformanceMonitor());

  // Video elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleJobComplete = useCallback((jobId: string, result: any) => {
    console.log('Job completed:', jobId, result);
  }, []);

  const handleJobError = useCallback((jobId: string, error: string) => {
    console.error('Job failed:', jobId, error);
  }, []);

  const handleCompressionComplete = useCallback((compressedBlob: Blob, originalSize: number, compressedSize: number) => {
    console.log('Compression complete:', {
      originalSize,
      compressedSize,
      compressionRatio: (1 - compressedSize / originalSize) * 100
    });
  }, []);

  const handleCompressionError = useCallback((error: string) => {
    console.error('Compression error:', error);
  }, []);

  const handleCacheHit = useCallback((key: string, data: any) => {
    console.log('Cache hit:', key, data);
  }, []);

  const handleCacheMiss = useCallback((key: string) => {
    console.log('Cache miss:', key);
  }, []);

  const startPerformanceMonitoring = useCallback(() => {
    setIsMonitoring(true);
    performanceMonitor.current.startMonitoring();
    
    // Record metrics every second
    const interval = setInterval(() => {
      const report = performanceMonitor.current.getReport();
      setPerformanceMetrics(prev => [...prev, {
        processingTime: report.averageProcessingTime,
        memoryUsage: report.averageMemoryUsage,
        frameRate: report.averageFrameRate,
        compressionRatio: report.averageCompressionRatio,
        cacheHitRate: report.averageCacheHitRate
      }].slice(-100)); // Keep last 100 metrics
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const stopPerformanceMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const testFrameSampling = useCallback(async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const totalFrames = Math.floor(video.duration * 30); // Assuming 30fps

    try {
      const { frameIndices, timestamps } = await frameSampler.current.sampleFrames(video, totalFrames);
      console.log('Frame sampling result:', { frameIndices, timestamps });
    } catch (error) {
      console.error('Frame sampling error:', error);
    }
  }, []);

  const testBackgroundProcessing = useCallback(async () => {
    // Test pose detection job
    const poseJobId = await backgroundProcessor.current.addJob(
      'pose_detection',
      { video: videoRef.current, frameIndices: [0, 30, 60, 90, 120] },
      (progress) => console.log('Pose detection progress:', progress),
      (result) => console.log('Pose detection complete:', result),
      (error) => console.error('Pose detection error:', error)
    );

    // Test phase analysis job
    const phaseJobId = await backgroundProcessor.current.addJob(
      'phase_analysis',
      { poses: [] },
      (progress) => console.log('Phase analysis progress:', progress),
      (result) => console.log('Phase analysis complete:', result),
      (error) => console.error('Phase analysis error:', error)
    );

    // Test metrics calculation job
    const metricsJobId = await backgroundProcessor.current.addJob(
      'metrics_calculation',
      { poses: [], phases: [] },
      (progress) => console.log('Metrics calculation progress:', progress),
      (result) => console.log('Metrics calculation complete:', result),
      (error) => console.error('Metrics calculation error:', error)
    );

    console.log('Background processing jobs started:', { poseJobId, phaseJobId, metricsJobId });
  }, []);

  const testCaching = useCallback(() => {
    // Test cache operations
    const testKey = 'test_analysis_' + Date.now();
    const testData = { 
      poses: [], 
      phases: [], 
      metrics: { score: 0.85 },
      timestamp: new Date()
    };

    // Set cache
    analysisCache.current.set(testKey, testData, 5000); // 5 second TTL
    console.log('Cache set:', testKey);

    // Get cache
    const retrieved = analysisCache.current.get(testKey);
    console.log('Cache get:', retrieved);

    // Test cache miss
    const missKey = 'nonexistent_key';
    const missResult = analysisCache.current.get(missKey);
    console.log('Cache miss test:', missResult);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Performance Optimization Testing
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('sampling')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'sampling' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Frame Sampling
              </button>
              <button
                onClick={() => setActiveTab('processing')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'processing' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Background Processing
              </button>
              <button
                onClick={() => setActiveTab('compression')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'compression' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Video Compression
              </button>
              <button
                onClick={() => setActiveTab('caching')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'caching' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Caching System
              </button>
              <button
                onClick={() => setActiveTab('monitoring')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'monitoring' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Performance Monitoring
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'sampling' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Frame Sampling for Longer Videos</h3>
                  
                  {/* Video Player */}
                  <div className="mb-6">
                    <video
                      ref={videoRef}
                      className="w-full h-auto rounded-lg"
                      controls
                      muted
                    >
                      <source src="/sample-golf-swing.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  {/* Sampling Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sampling Strategy
                      </label>
                      <select className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600">
                        <option value="uniform">Uniform</option>
                        <option value="adaptive">Adaptive</option>
                        <option value="keyframe">Keyframe</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Frames
                      </label>
                      <input
                        type="number"
                        defaultValue={1000}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quality Threshold
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        defaultValue={0.7}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <button
                    onClick={testFrameSampling}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Test Frame Sampling
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'processing' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Background Processing</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={testBackgroundProcessing}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Start Test Jobs
                    </button>
                    <button
                      onClick={() => console.log('Background processor jobs:', backgroundProcessor.current.getAllJobs())}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View All Jobs
                    </button>
                  </div>

                  <BackgroundProcessingManager
                    onJobComplete={handleJobComplete}
                    onJobError={handleJobError}
                    className="h-96"
                  />
                </div>
              </div>
            )}

            {activeTab === 'compression' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Video Compression</h3>
                  
                  <VideoCompressionManager
                    onCompressionComplete={handleCompressionComplete}
                    onCompressionError={handleCompressionError}
                    className="h-96"
                  />
                </div>
              </div>
            )}

            {activeTab === 'caching' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Analysis Caching</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={testCaching}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Test Cache Operations
                    </button>
                    <button
                      onClick={() => console.log('Cache stats:', analysisCache.current.getStats())}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View Cache Stats
                    </button>
                  </div>

                  <CacheManager
                    onCacheHit={handleCacheHit}
                    onCacheMiss={handleCacheMiss}
                    className="h-96"
                  />
                </div>
              </div>
            )}

            {activeTab === 'monitoring' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Performance Monitoring</h3>
                  
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

                  {/* Performance Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-white mb-2">Memory Usage</h4>
                      <div className="h-32 bg-gray-800 rounded">
                        {/* Memory usage chart would go here */}
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-white mb-2">Processing Time</h4>
                      <div className="h-32 bg-gray-800 rounded">
                        {/* Processing time chart would go here */}
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics Table */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-2">Recent Metrics</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-600">
                            <th className="text-left py-2">Time</th>
                            <th className="text-left py-2">Memory (MB)</th>
                            <th className="text-left py-2">Processing (ms)</th>
                            <th className="text-left py-2">Frame Rate</th>
                            <th className="text-left py-2">Cache Hit Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {performanceMetrics.slice(-10).map((metric, index) => (
                            <tr key={index} className="border-b border-gray-600">
                              <td className="py-2">{new Date().toLocaleTimeString()}</td>
                              <td className="py-2">{(metric.memoryUsage / 1024 / 1024).toFixed(1)}</td>
                              <td className="py-2">{metric.processingTime.toFixed(1)}</td>
                              <td className="py-2">{metric.frameRate.toFixed(1)}</td>
                              <td className="py-2">{metric.cacheHitRate.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Frame Sampling:</span>
                  <span className="text-sm text-green-400">✓ Implemented</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Background Processing:</span>
                  <span className="text-sm text-green-400">✓ Implemented</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Video Compression:</span>
                  <span className="text-sm text-green-400">✓ Implemented</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Caching System:</span>
                  <span className="text-sm text-green-400">✓ Implemented</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Performance Monitoring:</span>
                  <span className="text-sm text-green-400">✓ Implemented</span>
                </div>
              </div>
            </div>

            {/* Optimization Features */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Optimization Features</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Frame sampling for longer videos</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Background processing with progress indicators</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Video compression for faster uploads</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Caching for repeated analyses</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Performance monitoring and metrics</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Memory management and optimization</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('sampling')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Test Frame Sampling
                </button>
                <button
                  onClick={() => setActiveTab('processing')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Start Background Jobs
                </button>
                <button
                  onClick={() => setActiveTab('compression')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Compress Video
                </button>
                <button
                  onClick={() => setActiveTab('caching')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Test Caching
                </button>
                <button
                  onClick={() => setActiveTab('monitoring')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  View Performance
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
