import React, { useRef, useEffect, useState, useCallback } from 'react';

interface PerformanceMonitorProps {
  componentName: string;
  renderCount: number;
  isEmergencyMode: boolean;
  onReset?: () => void;
}

/**
 * Performance monitoring component for debugging render loops
 * Provides real-time performance metrics and debugging tools
 */
export default function PerformanceMonitor({ 
  componentName, 
  renderCount, 
  isEmergencyMode, 
  onReset 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    peakRenderCount: 0,
    emergencyTriggers: 0
  });

  const renderTimesRef = useRef<number[]>([]);
  const lastRenderTimeRef = useRef(0);
  const emergencyTriggersRef = useRef(0);

  // Track render performance
  useEffect(() => {
    const now = Date.now();
    const renderTime = now - lastRenderTimeRef.current;
    
    if (lastRenderTimeRef.current > 0) {
      renderTimesRef.current.push(renderTime);
      
      // Keep only last 50 render times
      if (renderTimesRef.current.length > 50) {
        renderTimesRef.current = renderTimesRef.current.slice(-50);
      }
      
      const averageRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;
      
      setMetrics(prev => ({
        ...prev,
        renderCount,
        lastRenderTime: renderTime,
        averageRenderTime: Math.round(averageRenderTime),
        peakRenderCount: Math.max(prev.peakRenderCount, renderCount)
      }));
    }
    
    lastRenderTimeRef.current = now;
  }, [renderCount]);

  // Track emergency mode
  useEffect(() => {
    if (isEmergencyMode) {
      emergencyTriggersRef.current++;
      setMetrics(prev => ({
        ...prev,
        emergencyTriggers: emergencyTriggersRef.current
      }));
    }
  }, [isEmergencyMode]);

  const handleReset = useCallback(() => {
    renderTimesRef.current = [];
    lastRenderTimeRef.current = 0;
    emergencyTriggersRef.current = 0;
    
    setMetrics({
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      peakRenderCount: 0,
      emergencyTriggers: 0
    });
    
    onReset?.();
  }, [onReset]);

  const getPerformanceStatus = () => {
    if (isEmergencyMode) return 'emergency';
    if (renderCount > 20) return 'warning';
    if (renderCount > 10) return 'caution';
    return 'good';
  };

  const status = getPerformanceStatus();
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    caution: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    warning: 'text-orange-600 bg-orange-50 border-orange-200',
    emergency: 'text-red-600 bg-red-50 border-red-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Performance Monitor</h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            status === 'good' ? 'bg-green-100 text-green-800' :
            status === 'caution' ? 'bg-yellow-100 text-yellow-800' :
            status === 'warning' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status.toUpperCase()}
          </span>
          <button
            onClick={handleReset}
            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
          >
            Reset
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="font-medium text-gray-600">Component</div>
          <div className="font-mono">{componentName}</div>
        </div>
        
        <div>
          <div className="font-medium text-gray-600">Render Count</div>
          <div className="font-mono">{renderCount}</div>
        </div>
        
        <div>
          <div className="font-medium text-gray-600">Avg Render Time</div>
          <div className="font-mono">{metrics.averageRenderTime}ms</div>
        </div>
        
        <div>
          <div className="font-medium text-gray-600">Peak Renders</div>
          <div className="font-mono">{metrics.peakRenderCount}</div>
        </div>
        
        <div>
          <div className="font-medium text-gray-600">Last Render</div>
          <div className="font-mono">{metrics.lastRenderTime}ms ago</div>
        </div>
        
        <div>
          <div className="font-medium text-gray-600">Emergency Triggers</div>
          <div className="font-mono">{metrics.emergencyTriggers}</div>
        </div>
        
        <div>
          <div className="font-medium text-gray-600">Status</div>
          <div className="font-mono">
            {isEmergencyMode ? 'EMERGENCY' : 'NORMAL'}
          </div>
        </div>
        
        <div>
          <div className="font-medium text-gray-600">Render Times</div>
          <div className="font-mono">{renderTimesRef.current.length} samples</div>
        </div>
      </div>
      
      {renderTimesRef.current.length > 0 && (
        <div className="mt-4">
          <div className="font-medium text-gray-600 mb-2">Render Time History</div>
          <div className="h-20 bg-gray-100 rounded p-2 overflow-x-auto">
            <div className="flex items-end h-full gap-1">
              {renderTimesRef.current.slice(-20).map((time, index) => (
                <div
                  key={index}
                  className="bg-blue-400 rounded-sm"
                  style={{
                    height: `${Math.min((time / 100) * 100, 100)}%`,
                    width: '4px'
                  }}
                  title={`${time}ms`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





