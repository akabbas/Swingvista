/**
 * Analysis configuration and result types
 */

export interface AnalysisConfig {
  isProSwing: boolean;
  minScore: number;
  confidenceThreshold: number;
}

export interface SwingReportCard {
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  feedback: string[];
  keyImprovements: string[];
  setup: string;
  grip: string;
  alignment: string;
  rotation: string;
  tempo: string;
  impact: string;
  followThrough: string;
}

export interface AnalysisInput {
  poses: any[];
  club: string;
  swingId: string;
  source: string;
  isProfessionalSwing?: boolean;
}

export interface AnalysisResult {
  reportCard: SwingReportCard;
  feedback: string[];
  overallScore: string;
  keyImprovements: string[];
  metrics: {
    tempo: {
      backswingTime: number;
      downswingTime: number;
      tempoRatio: number;
      score: number;
    };
    rotation: {
      shoulderTurn: number;
      hipTurn: number;
      xFactor: number;
      score: number;
    };
    weightTransfer: {
      backswing: number;
      impact: number;
      finish: number;
      score: number;
    };
    swingPlane: {
      shaftAngle: number;
      planeDeviation: number;
      score: number;
    };
    bodyAlignment: {
      spineAngle: number;
      headMovement: number;
      kneeFlex: number;
      score: number;
    };
    overallScore: number;
    letterGrade: string;
  };
  trajectory: {
    rightWrist: any[];
    leftWrist: any[];
    rightShoulder: any[];
    leftShoulder: any[];
    rightHip: any[];
    leftHip: any[];
    clubhead: any[];
  };
  phases: any[];
  landmarks: any[];
  timestamps?: number[];
}
