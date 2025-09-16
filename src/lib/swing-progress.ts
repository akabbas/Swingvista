'use client';

export interface SwingProgress {
  date: string;
  overallScore: number;
  metricScores: Record<string, number>;
  feedback: string[];
  videoUrl?: string;
  grade?: {
    overall: { score: number; letter: string };
    categories: Record<string, { score: number; letter: string }>;
  };
}

export class ProgressTracker {
  private static STORAGE_KEY = 'swingvista-progress';
  
  static saveAnalysis(analysis: any, videoUrl?: string): void {
    const progress: SwingProgress = {
      date: new Date().toISOString(),
      overallScore: analysis.overallScore || 0,
      metricScores: analysis.swingMetrics ? {
        tempo: analysis.swingMetrics.tempo?.ratio || 0,
        rotation: analysis.swingMetrics.rotation?.shoulders || 0,
        balance: analysis.swingMetrics.balance?.score || 0,
        plane: analysis.swingMetrics.plane?.consistency || 0,
        power: analysis.swingMetrics.power?.score || 0,
        consistency: analysis.swingMetrics.consistency?.score || 0
      } : {},
      feedback: analysis.improvements || [],
      videoUrl,
      grade: analysis.grade ? {
        overall: analysis.grade.overall,
        categories: Object.fromEntries(
          Object.entries(analysis.grade.categories).map(([k, v]) => [k, { score: (v as any).score, letter: (v as any).letter }])
        )
      } : undefined
    };
    
    const history = this.getHistory();
    history.push(progress);
    
    // Keep only last 50 sessions to prevent storage bloat
    const trimmedHistory = history.slice(-50);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory));
  }
  
  static getHistory(): SwingProgress[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }
  
  static getProgressTrend(metric: string): number[] {
    const history = this.getHistory();
    return history.map(entry => entry.metricScores[metric] || 0);
  }
  
  static getOverallTrend(): number[] {
    const history = this.getHistory();
    return history.map(entry => entry.overallScore);
  }
  
  static getRecentSessions(days: number = 30): SwingProgress[] {
    const history = this.getHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return history.filter(entry => new Date(entry.date) >= cutoffDate);
  }
  
  static getAverageScore(metric?: string): number {
    const history = this.getHistory();
    if (history.length === 0) return 0;
    
    if (metric) {
      const scores = history.map(entry => entry.metricScores[metric] || 0);
      return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    } else {
      return history.reduce((sum, entry) => sum + entry.overallScore, 0) / history.length;
    }
  }
  
  static getImprovementRate(metric?: string): number {
    const trend = metric ? this.getProgressTrend(metric) : this.getOverallTrend();
    if (trend.length < 2) return 0;
    
    const firstHalf = trend.slice(0, Math.floor(trend.length / 2));
    const secondHalf = trend.slice(Math.floor(trend.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }
  
  static clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  static exportData(): string {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
  }
  
  static importData(data: string): boolean {
    try {
      const imported = JSON.parse(data);
      if (Array.isArray(imported)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(imported));
        return true;
      }
    } catch (error) {
      console.error('Failed to import progress data:', error);
    }
    return false;
  }
}
