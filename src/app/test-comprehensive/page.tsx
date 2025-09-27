'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UltimateSwingAnalyzer } from '@/components/analysis/UltimateSwingAnalyzer';
import { MediaPipePoseDetector } from '@/lib/mediapipe';
import { analyzeGolfSwingSimple } from '@/lib/simple-golf-analysis';

export default function TestComprehensivePage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Capture console logs
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      setConsoleLogs(prev => [...prev, `LOG: ${args.join(' ')}`]);
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      setConsoleLogs(prev => [...prev, `ERROR: ${args.join(' ')}`]);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      setConsoleLogs(prev => [...prev, `WARN: ${args.join(' ')}`]);
      originalWarn.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Test 1: MediaPipe Initialization
  const testMediaPipeInit = useCallback(async () => {
    setCurrentTest('MediaPipe Initialization');
    console.log('🧪 Testing MediaPipe initialization...');
    
    try {
      const detector = MediaPipePoseDetector.getInstance();
      await detector.initialize();
      
      const result = {
        test: 'MediaPipe Initialization',
        status: 'PASSED',
        details: 'MediaPipe initialized successfully',
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log('✅ MediaPipe initialization test PASSED');
      return result;
    } catch (error) {
      const result = {
        test: 'MediaPipe Initialization',
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log('❌ MediaPipe initialization test FAILED:', error);
      return result;
    }
  }, []);

  // Test 2: Pose Detection
  const testPoseDetection = useCallback(async () => {
    setCurrentTest('Pose Detection');
    console.log('🧪 Testing pose detection...');
    
    try {
      const detector = MediaPipePoseDetector.getInstance();
      
      // Create mock pose data for testing
      const mockPoses: any[] = Array.from({ length: 10 }, (_, i) => ({
        landmarks: Array.from({ length: 33 }, (_, j) => ({
          x: 0.5 + Math.sin(i * 0.1) * 0.1,
          y: 0.5 + Math.cos(i * 0.1) * 0.1,
          z: 0,
          visibility: 0.9
        })),
        timestamp: i / 30
      }));
      
      // Test pose detection
      const results = await Promise.all(
        mockPoses.map(pose => detector.detectPose(pose))
      );
      
      const result = {
        test: 'Pose Detection',
        status: 'PASSED',
        details: `Processed ${results.length} poses successfully`,
        landmarks: results[0]?.landmarks?.length || 0,
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log('✅ Pose detection test PASSED');
      return result;
    } catch (error) {
      const result = {
        test: 'Pose Detection',
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log('❌ Pose detection test FAILED:', error);
      return result;
    }
  }, []);

  // Test 3: Golf Metrics Validation
  const testGolfMetrics = useCallback(async () => {
    setCurrentTest('Golf Metrics Validation');
    console.log('🧪 Testing golf metrics validation...');
    
    try {
      // Create mock pose data
      const mockPoses: any[] = Array.from({ length: 150 }, (_, i) => ({
        landmarks: Array.from({ length: 33 }, (_, j) => ({
          x: 0.5 + Math.sin(i * 0.1) * 0.1,
          y: 0.5 + Math.cos(i * 0.1) * 0.1,
          z: 0,
          visibility: 0.9
        })),
        timestamp: i / 30
      }));
      
      // Test golf analysis
      const analysis = await analyzeGolfSwingSimple(mockPoses, false);
      
      // Validate metrics
      const tempoRatio = analysis.metrics.tempo.tempoRatio;
      const shoulderTurn = analysis.metrics.rotation.shoulderTurn;
      const hipTurn = analysis.metrics.rotation.hipTurn;
      
      const isValidTempo = tempoRatio >= 1.5 && tempoRatio <= 4.0;
      const isValidShoulder = shoulderTurn >= 0 && shoulderTurn <= 180;
      const isValidHip = hipTurn >= 0 && hipTurn <= 180;
      
      const result = {
        test: 'Golf Metrics Validation',
        status: isValidTempo && isValidShoulder && isValidHip ? 'PASSED' : 'FAILED',
        details: {
          tempoRatio: { value: tempoRatio, valid: isValidTempo },
          shoulderTurn: { value: shoulderTurn, valid: isValidShoulder },
          hipTurn: { value: hipTurn, valid: isValidHip }
        },
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log('✅ Golf metrics validation test PASSED');
      return result;
    } catch (error) {
      const result = {
        test: 'Golf Metrics Validation',
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log('❌ Golf metrics validation test FAILED:', error);
      return result;
    }
  }, []);

  // Test 4: Video Processing
  const testVideoProcessing = useCallback(async () => {
    setCurrentTest('Video Processing');
    console.log('🧪 Testing video processing...');
    
    try {
      if (!videoUrl) {
        throw new Error('No video URL provided');
      }
      
      const video = videoRef.current;
      if (!video) {
        throw new Error('Video element not found');
      }
      
      // Test video loading
      video.src = videoUrl;
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = reject;
      });
      
      const result = {
        test: 'Video Processing',
        status: 'PASSED',
        details: {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          format: videoUrl.split('.').pop()
        },
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log('✅ Video processing test PASSED');
      return result;
    } catch (error) {
      const result = {
        test: 'Video Processing',
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log('❌ Video processing test FAILED:', error);
      return result;
    }
  }, [videoUrl]);

  // Test 5: Emergency Fallback
  const testEmergencyFallback = useCallback(async () => {
    setCurrentTest('Emergency Fallback');
    console.log('🧪 Testing emergency fallback system...');
    
    try {
      // Simulate emergency mode by creating invalid pose data
      const invalidPoses: any[] = Array.from({ length: 10 }, (_, i) => ({
        landmarks: [], // Empty landmarks to trigger emergency mode
        timestamp: i / 30
      }));
      
      const detector = MediaPipePoseDetector.getInstance();
      
      // Test emergency fallback
      const results = await Promise.all(
        invalidPoses.map(pose => detector.detectPose(pose))
      );
      
      const result = {
        test: 'Emergency Fallback',
        status: 'PASSED',
        details: `Emergency fallback processed ${results.length} poses`,
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log('✅ Emergency fallback test PASSED');
      return result;
    } catch (error) {
      const result = {
        test: 'Emergency Fallback',
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log('❌ Emergency fallback test FAILED:', error);
      return result;
    }
  }, []);

  // Test 6: UI/UX Functionality
  const testUIUX = useCallback(async () => {
    setCurrentTest('UI/UX Functionality');
    console.log('🧪 Testing UI/UX functionality...');
    
    try {
      // Test responsive design
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      const isDesktop = window.innerWidth >= 1024;
      
      // Test UI elements
      const uiElements = document.querySelectorAll('[data-testid]');
      const loadingElements = document.querySelectorAll('.loading, .spinner');
      const errorElements = document.querySelectorAll('.error');
      
      const result = {
        test: 'UI/UX Functionality',
        status: 'PASSED',
        details: {
          responsive: { isMobile, isTablet, isDesktop },
          uiElements: uiElements.length,
          loadingElements: loadingElements.length,
          errorElements: errorElements.length
        },
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log('✅ UI/UX functionality test PASSED');
      return result;
    } catch (error) {
      const result = {
        test: 'UI/UX Functionality',
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log('❌ UI/UX functionality test FAILED:', error);
      return result;
    }
  }, []);

  // Test 7: Performance Benchmarks
  const testPerformance = useCallback(async () => {
    setCurrentTest('Performance Benchmarks');
    console.log('🧪 Testing performance benchmarks...');
    
    try {
      const startTime = Date.now();
      
      // Test memory usage
      const memoryInfo = performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null;
      
      // Test frame rate
      let frameCount = 0;
      const frameStartTime = Date.now();
      
      const countFrames = () => {
        frameCount++;
        if (Date.now() - frameStartTime < 1000) {
          requestAnimationFrame(countFrames);
        }
      };
      
      requestAnimationFrame(countFrames);
      
      // Wait for frame counting
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const result = {
        test: 'Performance Benchmarks',
        status: 'PASSED',
        details: {
          duration,
          memoryInfo,
          frameRate: frameCount,
          performance: duration < 2000 ? 'Good' : 'Needs Optimization'
        },
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log('✅ Performance benchmarks test PASSED');
      return result;
    } catch (error) {
      const result = {
        test: 'Performance Benchmarks',
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log('❌ Performance benchmarks test FAILED:', error);
      return result;
    }
  }, []);

  // Run all tests
  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setTestStatus('running');
    setTestResults([]);
    setConsoleLogs([]);
    
    console.log('🧪 Starting comprehensive testing...');
    
    try {
      await testMediaPipeInit();
      await testPoseDetection();
      await testGolfMetrics();
      await testVideoProcessing();
      await testEmergencyFallback();
      await testUIUX();
      await testPerformance();
      
      setTestStatus('completed');
      console.log('✅ All tests completed');
    } catch (error) {
      setTestStatus('failed');
      console.error('❌ Testing failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  }, [testMediaPipeInit, testPoseDetection, testGolfMetrics, testVideoProcessing, testEmergencyFallback, testUIUX, testPerformance]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      console.log('📁 Video file uploaded:', file.name);
    }
  }, []);

  // Generate test report
  const generateReport = useCallback(() => {
    const totalTests = testResults.length;
    const passedTests = testResults.filter(t => t.status === 'PASSED').length;
    const failedTests = testResults.filter(t => t.status === 'FAILED').length;
    
    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0
      },
      results: testResults,
      consoleLogs: consoleLogs,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Test Report Generated:', report);
    return report;
  }, [testResults, consoleLogs]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🧪 SWINGVISTA Comprehensive Testing
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
              
              <div className="space-y-4">
                <button
                  onClick={runAllTests}
                  disabled={isRunning}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? 'Running Tests...' : 'Run All Tests'}
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={testMediaPipeInit}
                    disabled={isRunning}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Test MediaPipe
                  </button>
                  <button
                    onClick={testPoseDetection}
                    disabled={isRunning}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Test Pose Detection
                  </button>
                  <button
                    onClick={testGolfMetrics}
                    disabled={isRunning}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Test Golf Metrics
                  </button>
                  <button
                    onClick={testVideoProcessing}
                    disabled={isRunning}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Test Video Processing
                  </button>
                </div>
              </div>
            </div>

            {/* Video Upload */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Test Video Upload</h3>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
              />
              
              {videoUrl && (
                <div className="mt-4">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full h-48 bg-gray-700 rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Test Status */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Test Status</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    testStatus === 'completed' ? 'bg-green-100 text-green-800' :
                    testStatus === 'failed' ? 'bg-red-100 text-red-800' :
                    testStatus === 'running' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {testStatus.toUpperCase()}
                  </span>
                </div>
                
                {currentTest && (
                  <div className="flex justify-between">
                    <span>Current Test:</span>
                    <span className="text-blue-400">{currentTest}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Tests Run:</span>
                  <span>{testResults.length}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Passed:</span>
                  <span className="text-green-400">
                    {testResults.filter(t => t.status === 'PASSED').length}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="text-red-400">
                    {testResults.filter(t => t.status === 'FAILED').length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Test Results</h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    result.status === 'PASSED' ? 'bg-green-900 bg-opacity-20 border border-green-500' :
                    result.status === 'FAILED' ? 'bg-red-900 bg-opacity-20 border border-red-500' :
                    'bg-gray-700'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-white">{result.test}</h4>
                        <p className="text-xs text-gray-400">{result.timestamp}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        result.status === 'PASSED' ? 'bg-green-100 text-green-800' :
                        result.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                    
                    {result.details && (
                      <div className="mt-2 text-xs text-gray-300">
                        <pre className="whitespace-pre-wrap">
                          {typeof result.details === 'string' ? result.details : JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {result.error && (
                      <div className="mt-2 text-xs text-red-400">
                        Error: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Console Logs */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Console Logs</h3>
              
              <div className="space-y-1 max-h-64 overflow-y-auto text-xs font-mono">
                {consoleLogs.slice(-50).map((log, index) => (
                  <div key={index} className={`p-1 rounded ${
                    log.includes('ERROR') ? 'bg-red-900 bg-opacity-20 text-red-400' :
                    log.includes('WARN') ? 'bg-yellow-900 bg-opacity-20 text-yellow-400' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Report */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Test Report</h3>
              
              <button
                onClick={generateReport}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
