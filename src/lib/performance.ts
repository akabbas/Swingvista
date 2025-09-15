'use client';

import React, { useState, useEffect } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  timestamp: number;
}

interface PerformanceConfig {
  sampleSize: number;
  updateInterval: number;
  memoryThreshold: number;
  fpsThreshold: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private config: PerformanceConfig;
  private isMonitoring = false;
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = [];

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      sampleSize: 30,
      updateInterval: 1000,
      memoryThreshold: 100, // MB
      fpsThreshold: 10,
      ...config
    };
  }

  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, this.config.updateInterval);
  }

  stop(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private collectMetrics(): void {
    const metrics: PerformanceMetrics = {
      fps: this.calculateFPS(),
      frameTime: this.calculateFrameTime(),
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now()
    };

    this.metrics.push(metrics);
    
    // Keep only the last sampleSize metrics
    if (this.metrics.length > this.config.sampleSize) {
      this.metrics = this.metrics.slice(-this.config.sampleSize);
    }

    // Notify callbacks
    this.callbacks.forEach(callback => callback(metrics));

    // Check for performance issues
    this.checkPerformanceIssues(metrics);
  }

  private calculateFPS(): number {
    // This is a simplified FPS calculation
    // In a real implementation, you'd track frame times
    return 60; // Placeholder
  }

  private calculateFrameTime(): number {
    // This is a simplified frame time calculation
    // In a real implementation, you'd measure actual frame times
    return 16.67; // Placeholder for 60fps
  }

  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  private checkPerformanceIssues(metrics: PerformanceMetrics): void {
    if (metrics.fps < this.config.fpsThreshold) {
      console.warn(`Low FPS detected: ${metrics.fps}fps`);
    }

    if (metrics.memoryUsage > this.config.memoryThreshold) {
      console.warn(`High memory usage: ${metrics.memoryUsage}MB`);
    }
  }

  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return {
        fps: 0,
        frameTime: 0,
        memoryUsage: 0,
        timestamp: Date.now()
      };
    }

    const sum = this.metrics.reduce((acc, metric) => ({
      fps: acc.fps + metric.fps,
      frameTime: acc.frameTime + metric.frameTime,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      timestamp: Date.now()
    }), { fps: 0, frameTime: 0, memoryUsage: 0, timestamp: 0 });

    return {
      fps: Math.round(sum.fps / this.metrics.length),
      frameTime: Math.round(sum.frameTime / this.metrics.length),
      memoryUsage: Math.round(sum.memoryUsage / this.metrics.length),
      timestamp: Date.now()
    };
  }

  isHealthy(): boolean {
    const avg = this.getAverageMetrics();
    return avg.fps >= this.config.fpsThreshold && 
           avg.memoryUsage <= this.config.memoryThreshold;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const requestIdleCallback = (callback: () => void, timeout = 5000): number => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout });
  } else {
    return setTimeout(callback, 1) as unknown as number;
  }
};

export const cancelIdleCallback = (id: number): void => {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

// Lazy loading utility
export const lazyLoad = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> => {
  return React.lazy(importFunc);
};

// Memory management utilities
export const cleanupResources = (): void => {
  // Clear any cached data
  if (typeof window !== 'undefined') {
    // Clear localStorage if it's getting too large
    try {
      const keys = Object.keys(localStorage);
      if (keys.length > 100) {
        // Keep only the most recent 50 items
        const sortedKeys = keys.sort((a, b) => {
          const aTime = localStorage.getItem(a + '_timestamp') || '0';
          const bTime = localStorage.getItem(b + '_timestamp') || '0';
          return parseInt(bTime) - parseInt(aTime);
        });
        
        sortedKeys.slice(50).forEach(key => {
          localStorage.removeItem(key);
          localStorage.removeItem(key + '_timestamp');
        });
      }
    } catch (error) {
      console.warn('Failed to cleanup localStorage:', error);
    }
  }
};

// Performance optimization hooks
export const usePerformanceOptimization = () => {
  const [isOptimized, setIsOptimized] = useState(false);

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((metrics) => {
      if (metrics.fps < 15 || metrics.memoryUsage > 150) {
        setIsOptimized(false);
        // Trigger cleanup
        cleanupResources();
      } else {
        setIsOptimized(true);
      }
    });

    performanceMonitor.start();

    return () => {
      unsubscribe();
      performanceMonitor.stop();
    };
  }, []);

  return { isOptimized };
};

export default PerformanceMonitor;
