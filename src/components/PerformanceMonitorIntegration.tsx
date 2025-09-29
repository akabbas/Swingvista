'use client';

import { useEffect } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

/**
 * Performance monitoring integration component
 * Add this to your main layout or app component for automatic monitoring
 */
export const PerformanceMonitorIntegration = () => {
  const { currentMetrics, renderCount } = usePerformanceMonitor({
    intervalMs: 10000, // Log every 10 seconds
    enableLogging: true,
    onMetricsUpdate: (metrics) => {
      // Custom performance monitoring logic
      if (parseFloat(metrics.usedJSHeapSize) > 100) { // Alert if memory > 100MB
        console.warn('⚠️ High memory usage detected:', metrics.usedJSHeapSize);
      }
      
      if (metrics.renderCount > 1000) { // Alert if too many renders
        console.warn('⚠️ High render count detected:', metrics.renderCount);
      }
    }
  });

  // Additional performance monitoring
  useEffect(() => {
    // Performance monitoring
    const monitorInterval = setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        console.log('📊 Performance:', {
          usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + 'MB',
          totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + 'MB',
          renderCount: renderCount
        });
      }
    }, 10000); // Log every 10 seconds

    return () => clearInterval(monitorInterval);
  }, [renderCount]);

  // This component doesn't render anything, it just monitors
  return null;
};

export default PerformanceMonitorIntegration;





