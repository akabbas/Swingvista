import { WeightDistribution, CameraAngle, SwingMetrics } from './weight-distribution-analysis';

export interface SwingFeedback {
  category: 'weight-distribution' | 'balance' | 'tempo' | 'posture' | 'overall';
  priority: 'high' | 'medium' | 'low';
  message: string;
  technicalDetails: string;
  improvementTip: string;
  visualIndicator: {
    type: 'arrow' | 'circle' | 'line' | 'text';
    position: { x: number; y: number };
    color: string;
    size: number;
  };
  score: number; // 0-100
}

export interface DynamicFeedback {
  realTime: SwingFeedback[];
  phaseSpecific: {
    address: SwingFeedback[];
    backswing: SwingFeedback[];
    top: SwingFeedback[];
    downswing: SwingFeedback[];
    impact: SwingFeedback[];
    followThrough: SwingFeedback[];
  };
  overall: SwingFeedback[];
  recommendations: string[];
}

export class SwingFeedbackSystem {
  private weightAnalyzer: any; // WeightDistributionAnalyzer instance

  constructor(weightAnalyzer: any) {
    this.weightAnalyzer = weightAnalyzer;
  }

  // Generate comprehensive feedback for current swing state
  generateFeedback(
    currentWeightDist: WeightDistribution,
    swingMetrics: SwingMetrics,
    cameraAngle: CameraAngle,
    currentPhase: string
  ): DynamicFeedback {
    const realTime = this.generateRealTimeFeedback(currentWeightDist, cameraAngle);
    const phaseSpecific = this.generatePhaseSpecificFeedback(currentWeightDist, swingMetrics, currentPhase);
    const overall = this.generateOverallFeedback(swingMetrics);
    const recommendations = this.generateRecommendations(swingMetrics, currentWeightDist);

    return {
      realTime,
      phaseSpecific,
      overall,
      recommendations
    };
  }

  // Generate real-time feedback based on current weight distribution
  private generateRealTimeFeedback(weightDist: WeightDistribution, cameraAngle: CameraAngle): SwingFeedback[] {
    const feedback: SwingFeedback[] = [];

    // Weight distribution feedback
    if (weightDist.confidence > 0.7) {
      const weightDiff = Math.abs(weightDist.leftFoot - weightDist.rightFoot);
      
      if (weightDiff > 30) {
        const dominantFoot = weightDist.leftFoot > weightDist.rightFoot ? 'left' : 'right';
        feedback.push({
          category: 'weight-distribution',
          priority: 'high',
          message: `Too much weight on ${dominantFoot} foot`,
          technicalDetails: `${weightDist.leftFoot.toFixed(1)}% left, ${weightDist.rightFoot.toFixed(1)}% right`,
          improvementTip: 'Try to maintain more balanced weight distribution',
          visualIndicator: {
            type: 'circle',
            position: { x: 0.5, y: 0.7 },
            color: '#ff4444',
            size: 20
          },
          score: Math.max(0, 100 - weightDiff)
        });
      } else if (weightDiff < 10) {
        feedback.push({
          category: 'weight-distribution',
          priority: 'low',
          message: 'Good weight balance',
          technicalDetails: `Balanced: ${weightDist.leftFoot.toFixed(1)}% left, ${weightDist.rightFoot.toFixed(1)}% right`,
          improvementTip: 'Maintain this balance throughout your swing',
          visualIndicator: {
            type: 'circle',
            position: { x: 0.5, y: 0.7 },
            color: '#44ff44',
            size: 15
          },
          score: 90
        });
      }
    }

    // Balance feedback
    if (weightDist.balance.stability < 60) {
      feedback.push({
        category: 'balance',
        priority: 'high',
        message: 'Unstable balance detected',
        technicalDetails: `Stability: ${weightDist.balance.stability.toFixed(1)}%`,
        improvementTip: 'Focus on maintaining a stable base',
        visualIndicator: {
          type: 'line',
          position: { x: 0.5, y: 0.6 },
          color: '#ff8800',
          size: 30
        },
        score: weightDist.balance.stability
      });
    }

    // Forward/back balance
    if (Math.abs(weightDist.balance.forward) > 20) {
      const direction = weightDist.balance.forward > 0 ? 'forward' : 'backward';
      feedback.push({
        category: 'balance',
        priority: 'medium',
        message: `Leaning too ${direction}`,
        technicalDetails: `Forward balance: ${weightDist.balance.forward.toFixed(1)}%`,
        improvementTip: 'Keep your weight more centered over your feet',
        visualIndicator: {
          type: 'arrow',
          position: { x: 0.5, y: 0.5 },
          color: '#ffaa00',
          size: 25
        },
        score: Math.max(0, 100 - Math.abs(weightDist.balance.forward))
      });
    }

    return feedback;
  }

  // Generate phase-specific feedback
  private generatePhaseSpecificFeedback(
    weightDist: WeightDistribution,
    swingMetrics: SwingMetrics,
    currentPhase: string
  ): { [key: string]: SwingFeedback[] } {
    const feedback: { [key: string]: SwingFeedback[] } = {
      address: [],
      backswing: [],
      top: [],
      downswing: [],
      impact: [],
      followThrough: []
    };

    // Address phase feedback
    feedback.address = this.getAddressPhaseFeedback(swingMetrics.weightTransfer.address);

    // Backswing phase feedback
    feedback.backswing = this.getBackswingPhaseFeedback(swingMetrics.weightTransfer.backswing);

    // Top phase feedback
    feedback.top = this.getTopPhaseFeedback(swingMetrics.weightTransfer.top);

    // Downswing phase feedback
    feedback.downswing = this.getDownswingPhaseFeedback(swingMetrics.weightTransfer.downswing);

    // Impact phase feedback
    feedback.impact = this.getImpactPhaseFeedback(swingMetrics.weightTransfer.impact);

    // Follow-through phase feedback
    feedback.followThrough = this.getFollowThroughPhaseFeedback(swingMetrics.weightTransfer.finish);

    return feedback;
  }

  // Address phase specific feedback
  private getAddressPhaseFeedback(addressWeight: WeightDistribution): SwingFeedback[] {
    const feedback: SwingFeedback[] = [];

    // Check for proper address weight distribution (should be 50-50 or slightly favoring lead foot)
    const weightDiff = addressWeight.leftFoot - addressWeight.rightFoot;
    
    if (weightDiff < -10) {
      feedback.push({
        category: 'weight-distribution',
        priority: 'high',
        message: 'Too much weight on back foot at address',
        technicalDetails: `Address weight: ${addressWeight.leftFoot.toFixed(1)}% left, ${addressWeight.rightFoot.toFixed(1)}% right`,
        improvementTip: 'Start with more weight on your lead foot (left foot for right-handed golfers)',
        visualIndicator: {
          type: 'circle',
          position: { x: 0.3, y: 0.7 },
          color: '#ff4444',
          size: 18
        },
        score: Math.max(0, 50 + weightDiff)
      });
    } else if (weightDiff > 20) {
      feedback.push({
        category: 'weight-distribution',
        priority: 'medium',
        message: 'Too much weight on lead foot at address',
        technicalDetails: `Address weight: ${addressWeight.leftFoot.toFixed(1)}% left, ${addressWeight.rightFoot.toFixed(1)}% right`,
        improvementTip: 'Start with more balanced weight distribution',
        visualIndicator: {
          type: 'circle',
          position: { x: 0.7, y: 0.7 },
          color: '#ffaa00',
          size: 18
        },
        score: Math.max(0, 100 - (weightDiff - 10))
      });
    }

    return feedback;
  }

  // Backswing phase specific feedback
  private getBackswingPhaseFeedback(backswingWeight: WeightDistribution): SwingFeedback[] {
    const feedback: SwingFeedback[] = [];

    // During backswing, weight should shift to the back foot
    const weightDiff = backswingWeight.rightFoot - backswingWeight.leftFoot;
    
    if (weightDiff < 10) {
      feedback.push({
        category: 'weight-distribution',
        priority: 'medium',
        message: 'Insufficient weight shift to back foot',
        technicalDetails: `Backswing weight: ${backswingWeight.leftFoot.toFixed(1)}% left, ${backswingWeight.rightFoot.toFixed(1)}% right`,
        improvementTip: 'Shift more weight to your back foot during the backswing',
        visualIndicator: {
          type: 'arrow',
          position: { x: 0.3, y: 0.6 },
          color: '#ff8800',
          size: 20
        },
        score: Math.max(0, 50 + weightDiff)
      });
    }

    return feedback;
  }

  // Top phase specific feedback
  private getTopPhaseFeedback(topWeight: WeightDistribution): SwingFeedback[] {
    const feedback: SwingFeedback[] = [];

    // At the top, most weight should be on the back foot
    const weightDiff = topWeight.rightFoot - topWeight.leftFoot;
    
    if (weightDiff < 20) {
      feedback.push({
        category: 'weight-distribution',
        priority: 'high',
        message: 'Insufficient weight transfer at top of swing',
        technicalDetails: `Top weight: ${topWeight.leftFoot.toFixed(1)}% left, ${topWeight.rightFoot.toFixed(1)}% right`,
        improvementTip: 'Transfer more weight to your back foot at the top of your swing',
        visualIndicator: {
          type: 'circle',
          position: { x: 0.3, y: 0.5 },
          color: '#ff4444',
          size: 20
        },
        score: Math.max(0, 30 + weightDiff)
      });
    }

    return feedback;
  }

  // Downswing phase specific feedback
  private getDownswingPhaseFeedback(downswingWeight: WeightDistribution): SwingFeedback[] {
    const feedback: SwingFeedback[] = [];

    // During downswing, weight should shift back to lead foot
    const weightDiff = downswingWeight.leftFoot - downswingWeight.rightFoot;
    
    if (weightDiff < 0) {
      feedback.push({
        category: 'weight-distribution',
        priority: 'high',
        message: 'Weight not shifting to lead foot in downswing',
        technicalDetails: `Downswing weight: ${downswingWeight.leftFoot.toFixed(1)}% left, ${downswingWeight.rightFoot.toFixed(1)}% right`,
        improvementTip: 'Start shifting weight to your lead foot as you begin the downswing',
        visualIndicator: {
          type: 'arrow',
          position: { x: 0.7, y: 0.6 },
          color: '#ff4444',
          size: 25
        },
        score: Math.max(0, 50 + weightDiff)
      });
    }

    return feedback;
  }

  // Impact phase specific feedback
  private getImpactPhaseFeedback(impactWeight: WeightDistribution): SwingFeedback[] {
    const feedback: SwingFeedback[] = [];

    // At impact, most weight should be on the lead foot
    const weightDiff = impactWeight.leftFoot - impactWeight.rightFoot;
    
    if (weightDiff < 30) {
      feedback.push({
        category: 'weight-distribution',
        priority: 'high',
        message: 'Insufficient weight transfer at impact',
        technicalDetails: `Impact weight: ${impactWeight.leftFoot.toFixed(1)}% left, ${impactWeight.rightFoot.toFixed(1)}% right`,
        improvementTip: 'Transfer more weight to your lead foot at impact for maximum power',
        visualIndicator: {
          type: 'circle',
          position: { x: 0.7, y: 0.7 },
          color: '#ff4444',
          size: 22
        },
        score: Math.max(0, 20 + weightDiff)
      });
    } else if (weightDiff > 60) {
      feedback.push({
        category: 'weight-distribution',
        priority: 'medium',
        message: 'Too much weight on lead foot at impact',
        technicalDetails: `Impact weight: ${impactWeight.leftFoot.toFixed(1)}% left, ${impactWeight.rightFoot.toFixed(1)}% right`,
        improvementTip: 'Maintain some balance at impact to avoid falling forward',
        visualIndicator: {
          type: 'circle',
          position: { x: 0.7, y: 0.7 },
          color: '#ffaa00',
          size: 20
        },
        score: Math.max(0, 100 - (weightDiff - 50))
      });
    }

    return feedback;
  }

  // Follow-through phase specific feedback
  private getFollowThroughPhaseFeedback(finishWeight: WeightDistribution): SwingFeedback[] {
    const feedback: SwingFeedback[] = [];

    // At finish, weight should be mostly on the lead foot
    const weightDiff = finishWeight.leftFoot - finishWeight.rightFoot;
    
    if (weightDiff < 20) {
      feedback.push({
        category: 'weight-distribution',
        priority: 'medium',
        message: 'Incomplete weight transfer at finish',
        technicalDetails: `Finish weight: ${finishWeight.leftFoot.toFixed(1)}% left, ${finishWeight.rightFoot.toFixed(1)}% right`,
        improvementTip: 'Complete your weight transfer to finish balanced on your lead foot',
        visualIndicator: {
          type: 'arrow',
          position: { x: 0.7, y: 0.5 },
          color: '#ff8800',
          size: 20
        },
        score: Math.max(0, 40 + weightDiff)
      });
    }

    return feedback;
  }

  // Generate overall swing feedback
  private generateOverallFeedback(swingMetrics: SwingMetrics): SwingFeedback[] {
    const feedback: SwingFeedback[] = [];

    // Tempo feedback
    if (swingMetrics.tempo.ratio < 2.0) {
      feedback.push({
        category: 'tempo',
        priority: 'high',
        message: 'Swing tempo too fast',
        technicalDetails: `Backswing/Downswing ratio: ${swingMetrics.tempo.ratio.toFixed(2)} (ideal: 3:1)`,
        improvementTip: 'Slow down your backswing to improve tempo and control',
        visualIndicator: {
          type: 'text',
          position: { x: 0.1, y: 0.1 },
          color: '#ff4444',
          size: 16
        },
        score: Math.max(0, 100 - (2.0 - swingMetrics.tempo.ratio) * 50)
      });
    } else if (swingMetrics.tempo.ratio > 4.0) {
      feedback.push({
        category: 'tempo',
        priority: 'medium',
        message: 'Swing tempo too slow',
        technicalDetails: `Backswing/Downswing ratio: ${swingMetrics.tempo.ratio.toFixed(2)} (ideal: 3:1)`,
        improvementTip: 'Speed up your backswing slightly for better rhythm',
        visualIndicator: {
          type: 'text',
          position: { x: 0.1, y: 0.1 },
          color: '#ffaa00',
          size: 16
        },
        score: Math.max(0, 100 - (swingMetrics.tempo.ratio - 4.0) * 25)
      });
    }

    // Balance feedback
    if (swingMetrics.balance.averageStability < 70) {
      feedback.push({
        category: 'balance',
        priority: 'high',
        message: 'Overall balance needs improvement',
        technicalDetails: `Average stability: ${swingMetrics.balance.averageStability.toFixed(1)}%`,
        improvementTip: 'Focus on maintaining better balance throughout your swing',
        visualIndicator: {
          type: 'line',
          position: { x: 0.5, y: 0.3 },
          color: '#ff4444',
          size: 40
        },
        score: swingMetrics.balance.averageStability
      });
    }

    return feedback;
  }

  // Generate improvement recommendations
  private generateRecommendations(swingMetrics: SwingMetrics, currentWeightDist: WeightDistribution): string[] {
    const recommendations: string[] = [];

    // Weight distribution recommendations
    const weightDiff = Math.abs(currentWeightDist.leftFoot - currentWeightDist.rightFoot);
    if (weightDiff > 30) {
      recommendations.push('Practice drills to improve weight distribution balance');
    }

    // Tempo recommendations
    if (swingMetrics.tempo.ratio < 2.0) {
      recommendations.push('Use a metronome to practice proper swing tempo');
    }

    // Balance recommendations
    if (swingMetrics.balance.averageStability < 70) {
      recommendations.push('Include balance exercises in your practice routine');
    }

    // General recommendations
    recommendations.push('Record your swing regularly to track improvements');
    recommendations.push('Work with a golf instructor for personalized guidance');

    return recommendations;
  }
}

