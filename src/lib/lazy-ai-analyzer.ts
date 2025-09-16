'use client';

import type { PoseResult, SwingTrajectory } from './mediapipe';
import type { SwingPhase } from './swing-phases';

export interface AISwingAnalysis {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  technicalNotes: string[];
  recordingQuality: {
    angle: string;
    score: number;
    recommendations: string[];
  };
  swingMetrics: {
    tempo: { ratio: number; backswingTime: number; downswingTime: number; assessment: string };
    rotation: { shoulders: number; hips: number; xFactor: number; assessment: string };
    balance: { score: number; assessment: string };
    plane: { angle: number; consistency: number; assessment: string };
  };
  openAI?: {
    overallAssessment: string;
    keyTip: string;
    recordingTips: string[];
  };
  grade?: any;
}

export class LazyAISwingAnalyzer {
  private analyzer: any = null;
  private loadPromise: Promise<any> | null = null;

  private async loadAnalyzer() {
    if (this.analyzer) return this.analyzer;
    
    if (!this.loadPromise) {
      this.loadPromise = import('./ai-swing-analyzer').then(module => {
        this.analyzer = new module.AISwingAnalyzer();
        return this.analyzer;
      });
    }
    
    return this.loadPromise;
  }

  async analyze(
    poses: PoseResult[], 
    trajectory: SwingTrajectory, 
    phases: SwingPhase[], 
    club: string
  ): Promise<AISwingAnalysis> {
    const analyzer = await this.loadAnalyzer();
    return analyzer.analyze(poses, trajectory, phases, club);
  }
}

// Export a singleton instance
export const lazyAIAnalyzer = new LazyAISwingAnalyzer();
