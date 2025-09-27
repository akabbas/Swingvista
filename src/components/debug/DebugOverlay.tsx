'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SwingAnalysisDebugger, DebugComponent, ValidationResult } from '@/lib/swing-analysis-debugger';

export interface DebugOverlayProps {
  debugger: SwingAnalysisDebugger;
  className?: string;
}

const DebugOverlay: React.FC<DebugOverlayProps> = ({ debugger: debuggerInstance, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [components, setComponents] = useState<Map<string, DebugComponent>>(new Map());
  const [performanceMetrics, setPerformanceMetrics] = useState(debuggerInstance.getPerformanceMetrics());
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Status colors
  const statusColors = {
    ok: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    unknown: '#9E9E9E'
  };

  // Health colors
  const healthColors = {
    excellent: '#4CAF50',
    good: '#8BC34A',
    warning: '#FF9800',
    critical: '#F44336'
  };

  // Update components data
  const updateComponents = useCallback(() => {
    setComponents(debuggerInstance.getAllComponents());
    setPerformanceMetrics(debuggerInstance.getPerformanceMetrics());
    setValidationResults(debuggerInstance.getValidationResults());
  }, [debuggerInstance]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(updateComponents, 1000); // Update every second
    return () => clearInterval(interval);
  }, [autoRefresh, updateComponents]);

  // Toggle visibility
  const toggleVisibility = useCallback(() => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    debuggerInstance.setVisibility(newVisibility);
  }, [isVisible, debuggerInstance]);

  // Run validation suite
  const runValidation = useCallback(async () => {
    const results = await debuggerInstance.runValidationSuite();
    setValidationResults(results);
  }, [debuggerInstance]);

  // Export debug data
  const exportData = useCallback(() => {
    debuggerInstance.downloadDebugData();
  }, [debuggerInstance]);

  // Get debug summary
  const summary = debuggerInstance.getDebugSummary();

  if (!isVisible) {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <button
          onClick={toggleVisibility}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg font-bold"
        >
          🛠️ Debug
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed top-4 right-4 w-96 max-h-96 overflow-y-auto bg-gray-900 text-white rounded-lg shadow-2xl z-50 ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 p-4 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">🛠️ Swing Analysis Debugger</h3>
          <button
            onClick={toggleVisibility}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
        
        {/* Summary */}
        <div className="mt-2 text-sm">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: healthColors[summary.overallHealth] }}
            />
            <span className="font-semibold">
              {summary.overallHealth.toUpperCase()}
            </span>
            <span className="text-gray-400">
              ({summary.okComponents}/{summary.totalComponents} OK)
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Performance: {summary.performanceScore.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 bg-gray-700 border-b border-gray-600">
        <div className="flex gap-2 mb-2">
          <button
            onClick={runValidation}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            🔍 Validate
          </button>
          <button
            onClick={exportData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            💾 Export
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm ${
              autoRefresh 
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-500 text-white'
            }`}
          >
            {autoRefresh ? '⏸️ Pause' : '▶️ Auto'}
          </button>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
        </div>
      </div>

      {/* Components */}
      <div className="p-3 space-y-2">
        {Array.from(components.entries()).map(([name, component]) => (
          <DebugComponentPanel
            key={name}
            component={component}
            statusColors={statusColors}
          />
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="p-3 bg-gray-800 border-t border-gray-600">
        <h4 className="text-sm font-bold mb-2">📊 Performance</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>Frame Rate: {performanceMetrics.frameRate.toFixed(1)} fps</div>
          <div>Confidence: {(performanceMetrics.confidenceScore * 100).toFixed(1)}%</div>
          <div>Data Quality: {performanceMetrics.dataQuality.toFixed(1)}%</div>
          <div>Processing: {performanceMetrics.processingTime.toFixed(1)}ms</div>
        </div>
      </div>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <div className="p-3 bg-gray-800 border-t border-gray-600">
          <h4 className="text-sm font-bold mb-2">✅ Validation Results</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Passed:</span>
              <span className="text-green-400">
                {validationResults.filter(r => r.passed).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Failed:</span>
              <span className="text-red-400">
                {validationResults.filter(r => !r.passed).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total:</span>
              <span>{validationResults.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Debug Component Panel
interface DebugComponentPanelProps {
  component: DebugComponent;
  statusColors: Record<string, string>;
}

const DebugComponentPanel: React.FC<DebugComponentPanelProps> = ({ 
  component, 
  statusColors 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const statusEmoji = {
    ok: '✅',
    warning: '⚠️',
    error: '❌',
    unknown: '❓'
  };

  const getLastUpdateText = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    return `${Math.floor(diff / 60000)}m ago`;
  };

  return (
    <div 
      className="border rounded p-2"
      style={{ borderColor: statusColors[component.status] }}
    >
      {/* Component Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{statusEmoji[component.status]}</span>
          <span className="font-semibold text-sm">{component.name}</span>
          <span 
            className="text-xs px-2 py-1 rounded"
            style={{ 
              backgroundColor: statusColors[component.status] + '20',
              color: statusColors[component.status]
            }}
          >
            {component.status.toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-400 hover:text-white"
          >
            {showDetails ? '📋' : '📄'}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-400 hover:text-white"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Last Update */}
      <div className="text-xs text-gray-400 mt-1">
        Last update: {getLastUpdateText(component.lastUpdate)}
      </div>

      {/* Errors and Warnings */}
      {(component.errors.length > 0 || component.warnings.length > 0) && (
        <div className="mt-2 space-y-1">
          {component.errors.map((error, index) => (
            <div key={index} className="text-xs text-red-400 bg-red-900 bg-opacity-20 p-1 rounded">
              ❌ {error}
            </div>
          ))}
          {component.warnings.map((warning, index) => (
            <div key={index} className="text-xs text-yellow-400 bg-yellow-900 bg-opacity-20 p-1 rounded">
              ⚠️ {warning}
            </div>
          ))}
        </div>
      )}

      {/* Metrics */}
      {isExpanded && (
        <div className="mt-2 space-y-1">
          <h5 className="text-xs font-semibold text-gray-300">Metrics:</h5>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(component.metrics).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-400">{key}:</span>
                <span className="text-white">
                  {typeof value === 'number' ? value.toFixed(2) : 
                   typeof value === 'object' && value !== null ? 
                     (value.tempoRatio ? `${value.tempoRatio.toFixed(1)}:1` :
                      value.shoulderTurn ? `${value.shoulderTurn.toFixed(0)}°` :
                      value.impact ? `${value.impact.toFixed(1)}%` :
                      value.planeDeviation ? `${value.planeDeviation.toFixed(1)}°` :
                      value.spineAngle ? `${value.spineAngle.toFixed(1)}°` :
                      'Object data') : 
                   String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      {showDetails && component.details && (
        <div className="mt-2">
          <h5 className="text-xs font-semibold text-gray-300 mb-1">Details:</h5>
          <pre className="text-xs bg-gray-800 p-2 rounded overflow-x-auto">
            {JSON.stringify(component.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugOverlay;
