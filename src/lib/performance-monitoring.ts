export interface PerformanceMetrics {
  timestamp: number;
  memoryUsage: number;
  processingTime: number; // ms
  videoDuration: number; // seconds
  poseCount: number;
  analysisScore?: number;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly MAX_METRICS = 100;

  static trackAnalysis(metrics: Omit<PerformanceMetrics, 'timestamp'>) {
    this.metrics.push({ ...metrics, timestamp: Date.now() });
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
    try {
      console.log('[Performance] Analysis completed:', {
        duration: metrics.videoDuration,
        processingTime: metrics.processingTime,
        efficiency: metrics.videoDuration / (metrics.processingTime / 1000)
      });
    } catch {}
  }

  static getEfficiencyReport() {
    const recent = this.metrics.slice(-10);
    if (recent.length === 0) return null;
    const avgEff = recent.reduce((sum, m) => sum + (m.videoDuration / (m.processingTime / 1000)), 0) / recent.length;
    const avgMem = recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length;
    return {
      avgEfficiency: Math.round(avgEff * 100) / 100,
      avgMemory: Math.round(avgMem / 1024 / 1024) + 'MB',
      sampleSize: recent.length
    };
  }
}


