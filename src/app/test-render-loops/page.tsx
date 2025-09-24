'use client';

import { useState, useEffect } from 'react';
import { RenderLoopTest } from '@/components/test/RenderLoopTest';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import useRenderCounter from '@/hooks/useRenderCounter';

export default function TestRenderLoopsPage() {
  const [testMode, setTestMode] = useState<'normal' | 'stress' | 'emergency'>('normal');
  const [forceRender, setForceRender] = useState(0);
  
  // Performance monitoring
  const { currentMetrics, allMetrics, renderCount, reset: resetMetrics } = usePerformanceMonitor({
    intervalMs: 5000, // Every 5 seconds
    enableLogging: true,
    onMetricsUpdate: (metrics) => {
      console.log('📈 Performance Update:', metrics);
    }
  });

  // Render counter for this page
  const { renderCount: pageRenderCount } = useRenderCounter('TestRenderLoopsPage', {
    emergencyThreshold: 15,
    enableLogging: true
  });

  // Force re-render function for testing
  const triggerRender = () => {
    setForceRender(prev => prev + 1);
  };

  // Stress test - rapid renders
  const runStressTest = () => {
    setTestMode('stress');
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        triggerRender();
      }, i * 10);
    }
    
    // Reset after stress test
    setTimeout(() => {
      setTestMode('normal');
    }, 3000);
  };

  // Emergency test - trigger emergency mode
  const runEmergencyTest = () => {
    setTestMode('emergency');
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        triggerRender();
      }, i * 5);
    }
    
    // Reset after emergency test
    setTimeout(() => {
      setTestMode('normal');
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔧 Render Loop Testing & Performance Monitoring
        </h1>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={triggerRender}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Force Render (Count: {forceRender})
            </button>
            <button
              onClick={runStressTest}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Run Stress Test
            </button>
            <button
              onClick={runEmergencyTest}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Run Emergency Test
            </button>
            <button
              onClick={() => {
                resetMetrics();
                setForceRender(0);
                setTestMode('normal');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Page Status</h3>
            <div className="space-y-2">
              <p><strong>Test Mode:</strong> <span className={`px-2 py-1 rounded text-sm ${
                testMode === 'normal' ? 'bg-green-100 text-green-800' :
                testMode === 'stress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>{testMode.toUpperCase()}</span></p>
              <p><strong>Page Renders:</strong> {pageRenderCount}</p>
              <p><strong>Force Renders:</strong> {forceRender}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
            <div className="space-y-2">
              <p><strong>Memory Used:</strong> {currentMetrics?.usedJSHeapSize || 'N/A'}</p>
              <p><strong>Total Memory:</strong> {currentMetrics?.totalJSHeapSize || 'N/A'}</p>
              <p><strong>Render Count:</strong> {renderCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Test Components</h3>
            <div className="space-y-4">
              <RenderLoopTest />
            </div>
          </div>
        </div>

        {/* Performance History Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Performance History</h3>
          <div className="h-32 bg-gray-100 rounded p-4 overflow-x-auto">
            <div className="flex items-end h-full gap-1">
              {allMetrics.slice(-20).map((metric, index) => {
                const memoryUsage = parseFloat(metric.usedJSHeapSize) || 0;
                const height = Math.min((memoryUsage / 100) * 100, 100); // Scale to 100MB max
                return (
                  <div
                    key={index}
                    className="bg-blue-400 rounded-sm"
                    style={{
                      height: `${height}%`,
                      width: '20px',
                      minHeight: '2px'
                    }}
                    title={`${metric.usedJSHeapSize} at ${new Date(metric.timestamp).toLocaleTimeString()}`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Test Instructions</h3>
          <div className="space-y-2 text-sm">
            <p><strong>1. Normal Test:</strong> Click "Force Render" to test basic render counting</p>
            <p><strong>2. Stress Test:</strong> Click "Run Stress Test" to simulate rapid renders (should not trigger emergency)</p>
            <p><strong>3. Emergency Test:</strong> Click "Run Emergency Test" to trigger emergency mode (will show emergency handling)</p>
            <p><strong>4. Monitor:</strong> Watch the console for render logs and performance metrics</p>
            <p><strong>5. Memory:</strong> Check the performance history chart for memory usage patterns</p>
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-gray-100 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Recent Metrics:</h4>
              <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(allMetrics.slice(-5), null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2">Console Commands:</h4>
              <div className="space-y-1 text-xs">
                <p><code>console.log('Current metrics:', {JSON.stringify(currentMetrics, null, 2)})</code></p>
                <p><code>console.log('All metrics:', {JSON.stringify(allMetrics, null, 2)})</code></p>
                <p><code>console.log('Render count:', {renderCount})</code></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
