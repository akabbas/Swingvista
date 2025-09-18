'use client';

import React, { useState, useCallback } from 'react';
import { SwingAnalysisDebugger } from '@/lib/swing-analysis-debugger';

export interface DebugControlsProps {
  debugger: SwingAnalysisDebugger;
  className?: string;
}

const DebugControls: React.FC<DebugControlsProps> = ({ debugger: debuggerInstance, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [verboseLogging, setVerboseLogging] = useState(false);

  // Toggle debug visibility
  const toggleDebug = useCallback(() => {
    debuggerInstance.toggleVisibility();
  }, [debuggerInstance]);

  // Run validation suite
  const runValidation = useCallback(async () => {
    console.log('🔧 Debug: Running validation suite...');
    const results = await debuggerInstance.runValidationSuite();
    console.log('🔧 Debug: Validation results:', results);
  }, [debuggerInstance]);

  // Export debug data
  const exportData = useCallback(() => {
    debuggerInstance.downloadDebugData();
  }, [debuggerInstance]);

  // Toggle verbose logging
  const toggleVerboseLogging = useCallback((enabled: boolean) => {
    setVerboseLogging(enabled);
    debuggerInstance.setVerboseLogging(enabled);
  }, [debuggerInstance]);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    const components = debuggerInstance.getAllComponents();
    components.forEach((_, name) => {
      debuggerInstance.clearIssues(name);
    });
    console.log('🔧 Debug: Cleared all errors and warnings');
  }, [debuggerInstance]);

  // Force refresh all components
  const forceRefresh = useCallback(() => {
    console.log('🔧 Debug: Force refreshing all components...');
    // This would trigger a re-analysis of all components
    // Implementation depends on your specific analysis pipeline
  }, []);

  // Get debug summary
  const getSummary = useCallback(() => {
    const summary = debuggerInstance.getDebugSummary();
    console.log('🔧 Debug: System Summary:', summary);
    return summary;
  }, [debuggerInstance]);

  if (!isExpanded) {
    return (
      <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg font-bold text-sm"
        >
          🛠️ Debug Controls
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 left-4 w-80 bg-gray-900 text-white rounded-lg shadow-2xl z-50 ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 p-3 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">🛠️ Debug Controls</h3>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-3">
        {/* Main Controls */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleDebug}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-semibold"
          >
            🔍 Toggle Debug
          </button>
          <button
            onClick={runValidation}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-semibold"
          >
            ✅ Validate All
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={exportData}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-semibold"
          >
            💾 Export Data
          </button>
          <button
            onClick={getSummary}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm font-semibold"
          >
            📊 Summary
          </button>
        </div>

        {/* Utility Controls */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={clearAllErrors}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-semibold"
          >
            🗑️ Clear Errors
          </button>
          <button
            onClick={forceRefresh}
            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm font-semibold"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Settings */}
        <div className="border-t border-gray-700 pt-3">
          <h4 className="text-sm font-semibold mb-2">Settings</h4>
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={verboseLogging}
              onChange={(e) => toggleVerboseLogging(e.target.checked)}
              className="rounded"
            />
            Verbose Logging
          </label>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-gray-700 pt-3">
          <h4 className="text-sm font-semibold mb-2">Quick Actions</h4>
          
          <div className="space-y-2">
            <button
              onClick={() => {
                console.log('🔧 Debug: Component Status:', debuggerInstance.getAllComponents());
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
            >
              📋 Log Component Status
            </button>
            
            <button
              onClick={() => {
                const metrics = debuggerInstance.getPerformanceMetrics();
                console.log('🔧 Debug: Performance Metrics:', metrics);
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
            >
              📈 Log Performance
            </button>
            
            <button
              onClick={() => {
                const results = debuggerInstance.getValidationResults();
                console.log('🔧 Debug: Validation Results:', results);
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
            >
              ✅ Log Validation
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="border-t border-gray-700 pt-3">
          <h4 className="text-sm font-semibold mb-2">System Info</h4>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Platform: {navigator.platform}</div>
            <div>User Agent: {navigator.userAgent.substring(0, 50)}...</div>
            <div>Language: {navigator.language}</div>
            <div>Online: {navigator.onLine ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugControls;
