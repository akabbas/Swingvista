'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { runComprehensiveTests, TestSuite, TestResult } from '@/lib/test-implementation';
import { PoseNetDetector } from '@/lib/posenet-detector';
import { HybridPoseDetector } from '@/lib/hybrid-pose-detector';

export default function TestImplementationPage() {
  const [testResults, setTestResults] = useState<TestSuite | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [posenetStatus, setPoseNetStatus] = useState<any>(null);
  const [hybridStatus, setHybridStatus] = useState<any>(null);

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

  // Test PoseNet specifically
  const testPoseNet = useCallback(async () => {
    console.log('🎯 Testing PoseNet specifically...');
    setCurrentTest('PoseNet Configuration');
    
    try {
      const detector = PoseNetDetector.getInstance();
      await detector.initialize();
      
      const status = {
        initialized: detector.getInitializationStatus(),
        emergency: detector.getEmergencyModeStatus(),
        timestamp: new Date().toISOString()
      };
      
      setPoseNetStatus(status);
      console.log('✅ PoseNet test completed:', status);
      
    } catch (error) {
      console.error('❌ PoseNet test failed:', error);
      setPoseNetStatus({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, []);

  // Test Hybrid Detector specifically
  const testHybridDetector = useCallback(async () => {
    console.log('🔄 Testing Hybrid Detector specifically...');
    setCurrentTest('Hybrid Detector');
    
    try {
      const detector = HybridPoseDetector.getInstance();
      await detector.initialize();
      
      const status = detector.getDetectorStatus();
      setHybridStatus(status);
      console.log('✅ Hybrid Detector test completed:', status);
      
    } catch (error) {
      console.error('❌ Hybrid Detector test failed:', error);
      setHybridStatus({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, []);

  // Test PoseNet vs MediaPipe comparison
  const testDetectorComparison = useCallback(async () => {
    console.log('⚖️ Testing PoseNet vs MediaPipe comparison...');
    setCurrentTest('Detector Comparison');
    
    try {
      // Test PoseNet
      const posenetDetector = PoseNetDetector.getInstance();
      const posenetStart = Date.now();
      await posenetDetector.initialize();
      const posenetTime = Date.now() - posenetStart;
      
      // Test MediaPipe
      const { MediaPipePoseDetector } = await import('@/lib/mediapipe');
      const mediapipeDetector = MediaPipePoseDetector.getInstance();
      const mediapipeStart = Date.now();
      await mediapipeDetector.initialize();
      const mediapipeTime = Date.now() - mediapipeStart;
      
      const comparison = {
        posenet: {
          time: posenetTime,
          initialized: posenetDetector.getInitializationStatus(),
          emergency: posenetDetector.getEmergencyModeStatus()
        },
        mediapipe: {
          time: mediapipeTime,
          initialized: mediapipeDetector.getInitializationStatus(),
          emergency: mediapipeDetector.getEmergencyModeStatus()
        },
        winner: posenetTime < mediapipeTime ? 'PoseNet' : 'MediaPipe'
      };
      
      console.log('📊 Detector Comparison Results:', comparison);
      
    } catch (error) {
      console.error('❌ Detector comparison failed:', error);
    }
  }, []);

  // Run comprehensive tests
  const runTests = useCallback(async () => {
    setIsRunning(true);
    setTestStatus('running');
    setTestResults(null);
    setConsoleLogs([]);
    
    console.log('🧪 Starting SWINGVISTA Implementation Tests...');
    
    try {
      const results = await runComprehensiveTests();
      setTestResults(results);
      setTestStatus('completed');
      console.log('✅ All tests completed');
    } catch (error) {
      setTestStatus('failed');
      console.error('❌ Testing failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  }, []);

  // Run individual test
  const runIndividualTest = useCallback(async (testName: string) => {
    setIsRunning(true);
    setTestStatus('running');
    setCurrentTest(testName);
    
    console.log(`🧪 Running individual test: ${testName}`);
    
    try {
      // This would run individual tests
      // For now, we'll run the full suite
      const results = await runComprehensiveTests();
      setTestResults(results);
      setTestStatus('completed');
    } catch (error) {
      setTestStatus('failed');
      console.error(`❌ Test ${testName} failed:`, error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  }, []);

  // Generate test report
  const generateReport = useCallback(() => {
    if (!testResults) return;
    
    const report = {
      timestamp: new Date().toISOString(),
      suite: testResults,
      consoleLogs: consoleLogs,
      summary: {
        totalTests: testResults.totalTests,
        passedTests: testResults.passedTests,
        failedTests: testResults.failedTests,
        errorTests: testResults.errorTests,
        successRate: (testResults.passedTests / testResults.totalTests) * 100,
        duration: testResults.duration
      }
    };
    
    console.log('📊 Test Report Generated:', report);
    return report;
  }, [testResults, consoleLogs]);

  // Clear results
  const clearResults = useCallback(() => {
    setTestResults(null);
    setConsoleLogs([]);
    setTestStatus('idle');
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🧪 SWINGVISTA Implementation Tests
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
              
              <div className="space-y-4">
                <button
                  onClick={runTests}
                  disabled={isRunning}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? 'Running Tests...' : 'Run All Implementation Tests'}
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => runIndividualTest('MediaPipe Configuration')}
                    disabled={isRunning}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Test MediaPipe
                  </button>
                  <button
                    onClick={() => runIndividualTest('Tempo Validation')}
                    disabled={isRunning}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Test Tempo
                  </button>
                  <button
                    onClick={() => runIndividualTest('Emergency Poses')}
                    disabled={isRunning}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Test Emergency
                  </button>
                  <button
                    onClick={() => runIndividualTest('Video Preparation')}
                    disabled={isRunning}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Test Video
                  </button>
                </div>
                
                {/* PoseNet Specific Tests */}
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold mb-3 text-green-400">🎯 PoseNet Tests</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={testPoseNet}
                      disabled={isRunning}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Test PoseNet
                    </button>
                    <button
                      onClick={testHybridDetector}
                      disabled={isRunning}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Test Hybrid
                    </button>
                    <button
                      onClick={testDetectorComparison}
                      disabled={isRunning}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 col-span-2"
                    >
                      Compare PoseNet vs MediaPipe
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={clearResults}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Clear Results
                </button>
              </div>
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
                
                {testResults && (
                  <>
                    <div className="flex justify-between">
                      <span>Total Tests:</span>
                      <span>{testResults.totalTests}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Passed:</span>
                      <span className="text-green-400">{testResults.passedTests}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span className="text-red-400">{testResults.failedTests}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Errors:</span>
                      <span className="text-yellow-400">{testResults.errorTests}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="text-blue-400">
                        {((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{testResults.duration}ms</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* PoseNet Status */}
            {posenetStatus && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-400">🎯 PoseNet Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Initialized:</span>
                    <span className={posenetStatus.initialized ? 'text-green-400' : 'text-red-400'}>
                      {posenetStatus.initialized ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Emergency Mode:</span>
                    <span className={posenetStatus.emergency ? 'text-yellow-400' : 'text-green-400'}>
                      {posenetStatus.emergency ? '⚠️ Yes' : '✅ No'}
                    </span>
                  </div>
                  {posenetStatus.timestamp && (
                    <div className="flex justify-between">
                      <span>Tested:</span>
                      <span className="text-blue-400">{new Date(posenetStatus.timestamp).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {posenetStatus.error && (
                    <div className="text-red-400 text-sm">
                      Error: {posenetStatus.error}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Hybrid Detector Status */}
            {hybridStatus && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-blue-400">🔄 Hybrid Detector Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Initialized:</span>
                    <span className={hybridStatus.initialized ? 'text-green-400' : 'text-red-400'}>
                      {hybridStatus.initialized ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Detector:</span>
                    <span className="text-blue-400">{hybridStatus.detector}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PoseNet Status:</span>
                    <span className={hybridStatus.posenetStatus ? 'text-green-400' : 'text-red-400'}>
                      {hybridStatus.posenetStatus ? '✅ Available' : '❌ Failed'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>MediaPipe Status:</span>
                    <span className={hybridStatus.mediapipeStatus ? 'text-green-400' : 'text-red-400'}>
                      {hybridStatus.mediapipeStatus ? '✅ Available' : '❌ Failed'}
                    </span>
                  </div>
                  {hybridStatus.error && (
                    <div className="text-red-400 text-sm">
                      Error: {hybridStatus.error}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Test Report */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Test Report</h3>
              
              <button
                onClick={generateReport}
                disabled={!testResults}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Report
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Test Results</h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testResults?.results.map((result, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    result.status === 'PASS' ? 'bg-green-900 bg-opacity-20 border border-green-500' :
                    result.status === 'FAIL' ? 'bg-red-900 bg-opacity-20 border border-red-500' :
                    'bg-yellow-900 bg-opacity-20 border border-yellow-500'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-white">{result.testName}</h4>
                        <p className="text-xs text-gray-400">{result.details}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        result.status === 'PASS' ? 'bg-green-100 text-green-800' :
                        result.status === 'FAIL' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                    
                    {result.error && (
                      <div className="mt-2 text-xs text-red-400">
                        Error: {result.error}
                      </div>
                    )}
                    
                    <div className="mt-1 text-xs text-gray-500">
                      Duration: {result.duration}ms
                    </div>
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

            {/* Test Summary */}
            {testResults && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Test Summary</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Tests:</span>
                    <span>{testResults.totalTests}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Passed:</span>
                    <span className="text-green-400">{testResults.passedTests}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <span className="text-red-400">{testResults.failedTests}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Errors:</span>
                    <span className="text-yellow-400">{testResults.errorTests}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="text-blue-400">
                      {((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{testResults.duration}ms</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(testResults.passedTests / testResults.totalTests) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
