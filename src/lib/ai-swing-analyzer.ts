'use client';

import { PoseResult, SwingTrajectory } from './mediapipe';
import { SwingPhase } from './swing-phases';
import { GolfGradingSystem, GolfGrade } from './golf-grading-system';

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
  grade?: GolfGrade;
}

export class AISwingAnalyzer {
  private analyzeSwing(poses: PoseResult[], trajectory: SwingTrajectory, phases: SwingPhase[]): AISwingAnalysis {
    const recordingAngle = this.detectRecordingAngle(poses);
    const qualityScore = this.assessRecordingQuality(poses);
    
    // Analyze tempo
    const tempo = this.analyzeTempo(phases);
    
    // Analyze rotation
    const rotation = this.analyzeRotation(poses, phases);
    
    // Analyze balance
    const balance = this.analyzeBalance(poses, trajectory);
    
    // Analyze swing plane
    const plane = this.analyzeSwingPlane(trajectory, phases);
    
    // Generate AI feedback
    const strengths = this.generateStrengths(tempo, rotation, balance, plane);
    const improvements = this.generateImprovements(tempo, rotation, balance, plane);
    const technicalNotes = this.generateTechnicalNotes(tempo, rotation, balance, plane, recordingAngle);
    
    const overallScore = this.calculateOverallScore(tempo, rotation, balance, plane, qualityScore);
    
    return {
      overallScore,
      strengths,
      improvements,
      technicalNotes,
      recordingQuality: {
        angle: recordingAngle,
        score: qualityScore,
        recommendations: this.getRecordingRecommendations(recordingAngle, qualityScore)
      },
      swingMetrics: {
        tempo,
        rotation,
        balance,
        plane
      }
    };
  }

  private detectRecordingAngle(poses: PoseResult[]): string {
    if (poses.length === 0) return 'unknown';
    
    const sampleFrames = poses.slice(0, Math.min(5, poses.length));
    let totalShoulderAngle = 0;
    let validFrames = 0;
    
    for (const pose of sampleFrames) {
      const leftShoulder = pose.landmarks[11];
      const rightShoulder = pose.landmarks[12];
      
      if (leftShoulder && rightShoulder && 
          leftShoulder.visibility && leftShoulder.visibility > 0.7 &&
          rightShoulder.visibility && rightShoulder.visibility > 0.7) {
        
        const angle = Math.atan2(
          rightShoulder.y - leftShoulder.y,
          rightShoulder.x - leftShoulder.x
        );
        totalShoulderAngle += angle;
        validFrames++;
      }
    }
    
    if (validFrames === 0) return 'unknown';
    
    const avgAngle = totalShoulderAngle / validFrames;
    const degrees = Math.abs(avgAngle * 180 / Math.PI);
    
    if (degrees < 20) return 'face-on';
    if (degrees > 70) return 'down-the-line';
    return 'angled';
  }

  private assessRecordingQuality(poses: PoseResult[]): number {
    let totalScore = 0;
    let validFrames = 0;
    
    for (const pose of poses) {
      const criticalLandmarks = [11, 12, 15, 16, 23, 24];
      let frameScore = 0;
      let validLandmarks = 0;
      
      for (const index of criticalLandmarks) {
        const landmark = pose.landmarks[index];
        if (landmark && landmark.visibility && landmark.visibility > 0.5) {
          frameScore += landmark.visibility;
          validLandmarks++;
        }
      }
      
      if (validLandmarks >= 4) {
        totalScore += frameScore / validLandmarks;
        validFrames++;
      }
    }
    
    return validFrames > 0 ? totalScore / validFrames : 0;
  }

  private analyzeTempo(phases: SwingPhase[]): { ratio: number; backswingTime: number; downswingTime: number; assessment: string } {
    const backswingPhase = phases.find(p => p.name === 'backswing');
    const downswingPhase = phases.find(p => p.name === 'downswing');
    
    const backswingTime = backswingPhase?.duration || 0;
    const downswingTime = downswingPhase?.duration || 0;
    const ratio = downswingTime > 0 ? backswingTime / downswingTime : 0;
    
    let assessment = '';
    if (ratio < 2.0) {
      assessment = 'Your downswing is too quick. Work on a smoother transition for better control.';
    } else if (ratio > 4.0) {
      assessment = 'Your downswing is too slow. Focus on generating more speed through impact.';
    } else if (ratio >= 2.5 && ratio <= 3.5) {
      assessment = 'Excellent tempo! Your 3:1 ratio is ideal for consistent ball striking.';
    } else {
      assessment = 'Good tempo with room for minor adjustments.';
    }
    
    return { ratio, backswingTime, downswingTime, assessment };
  }

  private analyzeRotation(poses: PoseResult[], phases: SwingPhase[]): { shoulders: number; hips: number; xFactor: number; assessment: string } {
    const setupFrame = poses[0];
    const topFrame = phases.find(p => p.name === 'backswing')?.endFrame || Math.floor(poses.length * 0.6);
    const topPose = poses[topFrame] || poses[poses.length - 1];
    
    if (!setupFrame || !topPose) {
      return { shoulders: 0, hips: 0, xFactor: 0, assessment: 'Insufficient data for rotation analysis' };
    }
    
    const shoulderRotation = this.calculateRotation(setupFrame, topPose, 11, 12);
    const hipRotation = this.calculateRotation(setupFrame, topPose, 23, 24);
    const xFactor = shoulderRotation - hipRotation;
    
    let assessment = '';
    if (shoulderRotation < 80) {
      assessment = 'Limited shoulder turn. Focus on turning your back more toward the target.';
    } else if (shoulderRotation > 110) {
      assessment = 'Over-rotation in shoulders. Maintain better control at the top.';
    } else if (xFactor < 15) {
      assessment = 'Good shoulder turn but need more hip stability. Keep hips quieter during backswing.';
    } else if (xFactor > 40) {
      assessment = 'Too much separation. Work on more synchronized body movement.';
    } else {
      assessment = 'Excellent rotation with good separation between shoulders and hips.';
    }
    
    return { shoulders: shoulderRotation, hips: hipRotation, xFactor, assessment };
  }

  private analyzeBalance(poses: PoseResult[], _trajectory: SwingTrajectory): { score: number; assessment: string } {
    let totalDeviation = 0;
    let validFrames = 0;
    
    for (let i = 0; i < poses.length; i++) {
      const pose = poses[i];
      const leftAnkle = pose.landmarks[27];
      const rightAnkle = pose.landmarks[28];
      
      if (leftAnkle && rightAnkle && 
          leftAnkle.visibility && leftAnkle.visibility > 0.5 &&
          rightAnkle.visibility && rightAnkle.visibility > 0.5) {
        
        const centerX = (leftAnkle.x + rightAnkle.x) / 2;
        const deviation = Math.abs(centerX - 0.5); // 0.5 is center of frame
        totalDeviation += deviation;
        validFrames++;
      }
    }
    
    const avgDeviation = validFrames > 0 ? totalDeviation / validFrames : 0;
    const balanceScore = Math.max(0, 1 - avgDeviation * 2); // Convert to 0-1 scale
    
    let assessment = '';
    if (balanceScore > 0.8) {
      assessment = 'Excellent balance throughout the swing.';
    } else if (balanceScore > 0.6) {
      assessment = 'Good balance with minor adjustments needed.';
    } else {
      assessment = 'Focus on maintaining better balance and staying centered.';
    }
    
    return { score: balanceScore, assessment };
  }

  private analyzeSwingPlane(trajectory: SwingTrajectory, _phases: SwingPhase[]): { angle: number; consistency: number; assessment: string } {
    const rightWrist = trajectory.rightWrist;
    if (rightWrist.length < 10) {
      return { angle: 0, consistency: 0, assessment: 'Insufficient data for plane analysis' };
    }
    
    // Calculate swing plane angle
    const startPoint = rightWrist[0];
    const endPoint = rightWrist[rightWrist.length - 1];
    const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) * 180 / Math.PI;
    
    // Calculate consistency (lower deviation = more consistent)
    let totalDeviation = 0;
    for (let i = 1; i < rightWrist.length - 1; i++) {
      const prev = rightWrist[i - 1];
      const curr = rightWrist[i];
      const next = rightWrist[i + 1];
      
      const expectedY = prev.y + (next.y - prev.y) / 2;
      const deviation = Math.abs(curr.y - expectedY);
      totalDeviation += deviation;
    }
    
    const consistency = Math.max(0, 1 - (totalDeviation / rightWrist.length));
    
    let assessment = '';
    if (consistency > 0.8) {
      assessment = 'Very consistent swing plane. Great work!';
    } else if (consistency > 0.6) {
      assessment = 'Good swing plane with room for improvement.';
    } else {
      assessment = 'Focus on maintaining a more consistent swing plane.';
    }
    
    return { angle: Math.abs(angle), consistency, assessment };
  }

  private calculateRotation(setup: PoseResult, top: PoseResult, leftIndex: number, rightIndex: number): number {
    const setupLeft = setup.landmarks[leftIndex];
    const setupRight = setup.landmarks[rightIndex];
    const topLeft = top.landmarks[leftIndex];
    const topRight = top.landmarks[rightIndex];
    
    if (!setupLeft || !setupRight || !topLeft || !topRight) return 0;
    
    const setupAngle = Math.atan2(setupRight.y - setupLeft.y, setupRight.x - setupLeft.x);
    const topAngle = Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x);
    
    return Math.abs(topAngle - setupAngle) * 180 / Math.PI;
  }

  private generateStrengths(tempo: any, rotation: any, balance: any, plane: any): string[] {
    const strengths: string[] = [];
    
    if (tempo.ratio >= 2.5 && tempo.ratio <= 3.5) {
      strengths.push('Excellent swing tempo');
    }
    if (rotation.shoulders >= 80 && rotation.shoulders <= 110) {
      strengths.push('Good shoulder rotation');
    }
    if (rotation.xFactor >= 15 && rotation.xFactor <= 40) {
      strengths.push('Proper shoulder-hip separation');
    }
    if (balance.score > 0.7) {
      strengths.push('Solid balance throughout swing');
    }
    if (plane.consistency > 0.7) {
      strengths.push('Consistent swing plane');
    }
    
    return strengths.length > 0 ? strengths : ['Keep working on the fundamentals'];
  }

  private generateImprovements(tempo: any, rotation: any, balance: any, plane: any): string[] {
    const improvements: string[] = [];
    
    if (tempo.ratio < 2.0) {
      improvements.push('Slow down your downswing for better control');
    } else if (tempo.ratio > 4.0) {
      improvements.push('Increase downswing speed for more power');
    }
    
    if (rotation.shoulders < 80) {
      improvements.push('Turn your shoulders more in the backswing');
    } else if (rotation.shoulders > 110) {
      improvements.push('Reduce shoulder turn for better control');
    }
    
    if (rotation.xFactor < 15) {
      improvements.push('Keep your hips more stable during backswing');
    } else if (rotation.xFactor > 40) {
      improvements.push('Work on more synchronized body movement');
    }
    
    if (balance.score < 0.6) {
      improvements.push('Focus on maintaining better balance');
    }
    
    if (plane.consistency < 0.6) {
      improvements.push('Work on a more consistent swing plane');
    }
    
    return improvements.length > 0 ? improvements : ['Continue practicing the basics'];
  }

  private generateTechnicalNotes(tempo: any, rotation: any, balance: any, plane: any, angle: string): string[] {
    const notes: string[] = [];
    
    notes.push(`Tempo ratio: ${tempo.ratio.toFixed(2)}:1 (ideal: 3:1)`);
    notes.push(`Shoulder rotation: ${rotation.shoulders.toFixed(1)}° (target: 90-100°)`);
    notes.push(`Hip rotation: ${rotation.hips.toFixed(1)}° (target: 40-50°)`);
    notes.push(`X-factor: ${rotation.xFactor.toFixed(1)}° (target: 20-30°)`);
    notes.push(`Balance score: ${(balance.score * 100).toFixed(0)}%`);
    notes.push(`Swing plane consistency: ${(plane.consistency * 100).toFixed(0)}%`);
    notes.push(`Recording angle: ${angle}`);
    
    return notes;
  }

  private calculateOverallScore(tempo: any, rotation: any, balance: any, plane: any, _quality: number): number {
    let score = 0;
    let factors = 0;
    
    // Tempo score (0-25 points)
    if (tempo.ratio >= 2.5 && tempo.ratio <= 3.5) {
      score += 25;
    } else if (tempo.ratio >= 2.0 && tempo.ratio <= 4.0) {
      score += 20;
    } else {
      score += 10;
    }
    factors++;
    
    // Rotation score (0-25 points)
    const rotationScore = (rotation.shoulders >= 80 && rotation.shoulders <= 110 ? 10 : 5) +
                         (rotation.xFactor >= 15 && rotation.xFactor <= 40 ? 10 : 5) +
                         (rotation.hips >= 30 && rotation.hips <= 60 ? 5 : 2);
    score += rotationScore;
    factors++;
    
    // Balance score (0-25 points)
    score += balance.score * 25;
    factors++;
    
    // Plane score (0-25 points)
    score += plane.consistency * 25;
    factors++;
    
    return factors > 0 ? Math.round(score / factors) : 0;
  }

  private getRecordingRecommendations(angle: string, quality: number): string[] {
    const recommendations: string[] = [];
    
    if (quality < 0.6) {
      recommendations.push('Record in better lighting');
      recommendations.push('Ensure full body is visible');
    }
    
    if (angle === 'unknown') {
      recommendations.push('Try recording from face-on or down-the-line angle');
    } else if (angle === 'angled') {
      recommendations.push('Consider recording from a more direct angle');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Recording quality is good');
    }
    
    return recommendations;
  }

  public async analyze(poses: PoseResult[], trajectory: SwingTrajectory, phases: SwingPhase[], club: string = 'driver'): Promise<AISwingAnalysis> {
    const basicAnalysis = this.analyzeSwing(poses, trajectory, phases);
    
    // Generate golf grade
    const gradingSystem = new GolfGradingSystem();
    const grade = gradingSystem.gradeSwing(poses, trajectory, phases, club);
    basicAnalysis.grade = grade;
    
    // Try to enhance with OpenAI analysis
    try {
      const openAIResponse = await fetch('/api/analyze-swing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          swingData: {
            frameCount: poses.length,
            duration: (() => {
              if (poses.length === 0) return 0;
              const first = poses[0];
              const last = poses[poses.length - 1];
              if (!first || !last || !first.timestamp || !last.timestamp) return 0;
              return (last.timestamp - first.timestamp) / 1000;
            })()
          },
          recordingQuality: {
            angle: basicAnalysis.recordingQuality.angle,
            score: basicAnalysis.recordingQuality.score
          },
          swingMetrics: basicAnalysis.swingMetrics,
          grade: {
            overall: grade.overall,
            categories: grade.categories
          }
        })
      });

      if (openAIResponse.ok) {
        const openAIData = await openAIResponse.json();
        if (openAIData.success && openAIData.analysis) {
          basicAnalysis.openAI = {
            overallAssessment: openAIData.analysis.overallAssessment || '',
            keyTip: openAIData.analysis.keyTip || '',
            recordingTips: openAIData.analysis.recordingTips || []
          };
        }
      }
    } catch (error) {
      console.warn('OpenAI analysis failed, using basic analysis:', error);
    }

    return basicAnalysis;
  }
}
