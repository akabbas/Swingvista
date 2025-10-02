import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  usedJSHeapSize: string;
  totalJSHeapSize: string;
  renderCount: number;
  timestamp: number;
}

/**
 * Performance monitoring hook for tracking memory usage and render performance
 * 
 * Features:
 * - Memory usage tracking (if available)
 * - Render count monitoring
 * - Automatic logging at intervals
 * - Performance data collection
 */
export const usePerformanceMonitor = (options: {
  intervalMs?: number;
  enableLogging?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
} = {}) => {
  const {
    intervalMs = 10000, // Log every 10 seconds
    enableLogging = true,
    onMetricsUpdate
  } = options;

  const renderCountRef = useRef(0);
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  // Track renders
  useEffect(() => {
    renderCountRef.current += 1;
  });

  // Performance monitoring
  useEffect(() => {
    const monitorInterval = setInterval(() => {
      const memory = (performance as any).memory;
      const now = Date.now();
      
      const metrics: PerformanceMetrics = {
        usedJSHeapSize: memory ? (memory.usedJSHeapSize / 1048576).toFixed(2) + 'MB' : 'N/A',
        totalJSHeapSize: memory ? (memory.totalJSHeapSize / 1048576).toFixed(2) + 'MB' : 'N/A',
        renderCount: renderCountRef.current,
        timestamp: now
      };

      // Store metrics
      metricsRef.current.push(metrics);
      if (metricsRef.current.length > 50) {
        metricsRef.current = metricsRef.current.slice(-50); // Keep last 50 entries
      }

      if (enableLogging) {
        console.log('📊 Performance:', {
          usedJSHeapSize: metrics.usedJSHeapSize,
          totalJSHeapSize: metrics.totalJSHeapSize,
          renderCount: metrics.renderCount,
          timestamp: new Date(now).toLocaleTimeString()
        });
      }

      // Call custom callback if provided
      onMetricsUpdate?.(metrics);
    }, intervalMs);

    return () => clearInterval(monitorInterval);
  }, [intervalMs, enableLogging, onMetricsUpdate]);

  return {
    currentMetrics: metricsRef.current[metricsRef.current.length - 1],
    allMetrics: metricsRef.current,
    renderCount: renderCountRef.current,
    reset: () => {
      renderCountRef.current = 0;
      metricsRef.current = [];
    }
  };
};

export default usePerformanceMonitor;







