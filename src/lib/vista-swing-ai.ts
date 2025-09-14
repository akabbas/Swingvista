import { PoseLandmark } from './mediapipe';

// VistaSwing AI - Professional Golf Coach and Computer Vision Expert
// Implements the C.R.E.A.T.E Framework for structured golf swing analysis

export interface SwingReportCard {
  setup: { grade: string; tip: string };
  grip: { grade: string; tip: string };
  alignment: { grade: string; tip: string };
  rotation: { grade: string; tip: string };
  impact: { grade: string; tip: string };
  followThrough: { grade: string; tip: string };
  overall: { score: string; tip: string };
}

export interface SwingAnalysisData {
  landmarks: PoseLandmark[][];
  timestamps: number[];
  club: string;
  swingId: string;
}

export interface SwingPhase {
  setup: PoseLandmark[];
  backswing: PoseLandmark[];
  downswing: PoseLandmark[];
  impact: PoseLandmark[];
  followThrough: PoseLandmark[];
}

export class VistaSwingAI {
  private static readonly IDEAL_TEMPO_RATIO = 3.0; // 3:1 backswing to downswing
  private static readonly TEMPO_TOLERANCE = 0.5;
  
  // Landmark indices for MediaPipe pose detection
  private static readonly LANDMARKS = {
    NOSE: 0,
    LEFT_EYE: 1,
    RIGHT_EYE: 2,
    LEFT_EAR: 3,
    RIGHT_EAR: 4,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28
  };

  /**
   * Main analysis function - analyzes swing and returns structured report card
   */
  public static analyzeSwing(data: SwingAnalysisData): SwingReportCard {
    const { landmarks, timestamps } = data;
    
    if (landmarks.length < 10) {
      throw new Error('Insufficient landmarks for analysis');
    }

    // Detect swing phases
    const phases = this.detectSwingPhases(landmarks, timestamps);
    
    // Analyze each component
    const setupAnalysis = this.analyzeSetup(phases.setup);
    const gripAnalysis = this.analyzeGrip(phases.setup);
    const alignmentAnalysis = this.analyzeAlignment(phases.setup);
    const rotationAnalysis = this.analyzeRotation(phases);
    const impactAnalysis = this.analyzeImpact(phases.impact, phases.setup);
    const followThroughAnalysis = this.analyzeFollowThrough(phases.followThrough, phases.setup);
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore([
      setupAnalysis.grade,
      gripAnalysis.grade,
      alignmentAnalysis.grade,
      rotationAnalysis.grade,
      impactAnalysis.grade,
      followThroughAnalysis.grade
    ]);

    return {
      setup: setupAnalysis,
      grip: gripAnalysis,
      alignment: alignmentAnalysis,
      rotation: rotationAnalysis,
      impact: impactAnalysis,
      followThrough: followThroughAnalysis,
      overall: {
        score: overallScore,
        tip: this.generateOverallTip(setupAnalysis, rotationAnalysis, impactAnalysis)
      }
    };
  }

  /**
   * Detect the 5 main phases of the golf swing
   */
  private static detectSwingPhases(landmarks: PoseLandmark[][], timestamps: number[]): SwingPhase {
    const totalFrames = landmarks.length;
    
    // Detect impact frame based on maximum acceleration of right wrist
    const impactFrame = this.detectImpactFrame(landmarks);
    
    // Define phase boundaries
    const setupEnd = Math.floor(totalFrames * 0.1); // First 10% is setup
    const backswingEnd = Math.floor(impactFrame * 0.8); // 80% of way to impact
    const downswingEnd = impactFrame;
    const followThroughStart = Math.floor(impactFrame * 1.2); // 20% past impact
    
    return {
      setup: landmarks[0],
      backswing: landmarks[backswingEnd] || landmarks[Math.floor(totalFrames * 0.3)],
      downswing: landmarks[downswingEnd] || landmarks[impactFrame],
      impact: landmarks[impactFrame],
      followThrough: landmarks[followThroughStart] || landmarks[Math.min(followThroughStart, totalFrames - 1)]
    };
  }

  /**
   * Detect impact frame based on acceleration analysis
   */
  private static detectImpactFrame(landmarks: PoseLandmark[][]): number {
    let maxAcceleration = 0;
    let impactFrame = Math.floor(landmarks.length * 0.7);
    
    for (let i = 1; i < landmarks.length - 1; i++) {
      const prev = landmarks[i - 1];
      const curr = landmarks[i];
      const next = landmarks[i + 1];
      
      // Calculate acceleration of right wrist (club head approximation)
      const rightWrist = this.LANDMARKS.RIGHT_WRIST;
      const velocity1 = this.calculateDistance(prev[rightWrist], curr[rightWrist]);
      const velocity2 = this.calculateDistance(curr[rightWrist], next[rightWrist]);
      const acceleration = Math.abs(velocity2 - velocity1);
      
      if (acceleration > maxAcceleration) {
        maxAcceleration = acceleration;
        impactFrame = i;
      }
    }
    
    return Math.max(1, Math.min(impactFrame, landmarks.length - 2));
  }

  /**
   * Analyze setup phase - posture, balance, ball position, stance width
   */
  private static analyzeSetup(setup: PoseLandmark[]): { grade: string; tip: string } {
    const posture = this.analyzePosture(setup);
    const balance = this.analyzeBalance(setup);
    const stanceWidth = this.analyzeStanceWidth(setup);
    
    let grade = 'C';
    let tip = '';
    
    if (posture >= 0.8 && balance >= 0.8 && stanceWidth >= 0.7) {
      grade = 'A';
      tip = 'Excellent setup with great posture and balance. Maintain this athletic position.';
    } else if (posture >= 0.6 && balance >= 0.6 && stanceWidth >= 0.5) {
      grade = 'B';
      tip = 'Good setup fundamentals. Focus on maintaining a more athletic posture throughout your swing.';
    } else if (posture >= 0.4 || balance >= 0.4) {
      grade = 'C';
      tip = 'Setup needs improvement. Work on standing taller with better balance and a more athletic posture.';
    } else {
      grade = 'D';
      tip = 'Setup requires significant work. Focus on proper posture, balance, and stance width fundamentals.';
    }
    
    return { grade, tip };
  }

  /**
   * Analyze grip - neutral grip, clubface control, pressure
   */
  private static analyzeGrip(setup: PoseLandmark[]): { grade: string; tip: string } {
    // For now, provide general grip feedback based on wrist position
    const leftWrist = setup[this.LANDMARKS.LEFT_WRIST];
    const rightWrist = setup[this.LANDMARKS.RIGHT_WRIST];
    
    const wristAlignment = Math.abs(leftWrist.y - rightWrist.y);
    
    let grade = 'B';
    let tip = '';
    
    if (wristAlignment < 0.05) {
      grade = 'A';
      tip = 'Neutral grip with good clubface control. Keep this solid foundation.';
    } else if (wristAlignment < 0.1) {
      grade = 'B';
      tip = 'Good grip fundamentals. Ensure both hands work together for consistent ball striking.';
    } else {
      grade = 'C';
      tip = 'Work on a more neutral grip position. Both hands should work as one unit.';
    }
    
    return { grade, tip };
  }

  /**
   * Analyze alignment - shoulders, hips, feet aligned with target line
   */
  private static analyzeAlignment(setup: PoseLandmark[]): { grade: string; tip: string } {
    const shoulderAlignment = this.analyzeShoulderAlignment(setup);
    const hipAlignment = this.analyzeHipAlignment(setup);
    
    let grade = 'C';
    let tip = '';
    
    if (shoulderAlignment >= 0.8 && hipAlignment >= 0.8) {
      grade = 'A';
      tip = 'Perfect alignment with target line. This will help you hit straighter shots.';
    } else if (shoulderAlignment >= 0.6 && hipAlignment >= 0.6) {
      grade = 'B';
      tip = 'Good alignment overall. Focus on squaring your shoulders and hips to the target.';
    } else if (shoulderAlignment >= 0.4 || hipAlignment >= 0.4) {
      grade = 'C';
      tip = 'Alignment needs work. Practice squaring your shoulders and hips to the target line.';
    } else {
      grade = 'D';
      tip = 'Poor alignment is causing wayward shots. Focus on proper setup alignment fundamentals.';
    }
    
    return { grade, tip };
  }

  /**
   * Analyze rotation - hip and shoulder turn, weight transfer, sequencing
   */
  private static analyzeRotation(phases: SwingPhase): { grade: string; tip: string } {
    const shoulderTurn = this.calculateShoulderTurn(phases.setup, phases.backswing);
    const hipTurn = this.calculateHipTurn(phases.setup, phases.backswing);
    const weightTransfer = this.analyzeWeightTransfer(phases);
    
    let grade = 'C';
    let tip = '';
    
    if (shoulderTurn >= 80 && hipTurn >= 40 && weightTransfer >= 0.7) {
      grade = 'A';
      tip = 'Excellent rotation and weight transfer. Great sequencing throughout your swing.';
    } else if (shoulderTurn >= 60 && hipTurn >= 30 && weightTransfer >= 0.5) {
      grade = 'B';
      tip = 'Good rotation fundamentals. Allow your hips to turn more freely for better power.';
    } else if (shoulderTurn >= 40 || hipTurn >= 20) {
      grade = 'C';
      tip = 'Limited rotation is costing you power. Focus on turning your shoulders and hips more.';
    } else {
      grade = 'D';
      tip = 'Poor rotation and weight transfer. Work on fundamental turning and weight shift.';
    }
    
    return { grade, tip };
  }

  /**
   * Analyze impact - ball-first contact, square clubface, shaft lean
   */
  private static analyzeImpact(impact: PoseLandmark[], setup: PoseLandmark[]): { grade: string; tip: string } {
    const shaftLean = this.analyzeShaftLean(impact, setup);
    const clubfaceAngle = this.analyzeClubfaceAngle(impact);
    
    let grade = 'C';
    let tip = '';
    
    if (shaftLean >= 0.7 && clubfaceAngle >= 0.8) {
      grade = 'A';
      tip = 'Perfect impact position with great shaft lean and square clubface. Compress the ball consistently.';
    } else if (shaftLean >= 0.5 && clubfaceAngle >= 0.6) {
      grade = 'B';
      tip = 'Good impact fundamentals. Focus on leading with your hands to compress the ball better.';
    } else if (shaftLean >= 0.3 || clubfaceAngle >= 0.4) {
      grade = 'C';
      tip = 'Impact needs improvement. Work on leading with your hands and squaring the clubface.';
    } else {
      grade = 'D';
      tip = 'Poor impact position. Focus on fundamental ball-first contact and proper hand position.';
    }
    
    return { grade, tip };
  }

  /**
   * Analyze follow-through - balanced finish, chest facing target, complete rotation
   */
  private static analyzeFollowThrough(followThrough: PoseLandmark[], setup: PoseLandmark[]): { grade: string; tip: string } {
    const balance = this.analyzeFinishBalance(followThrough);
    const chestPosition = this.analyzeChestPosition(followThrough);
    
    let grade = 'C';
    let tip = '';
    
    if (balance >= 0.8 && chestPosition >= 0.8) {
      grade = 'A';
      tip = 'Excellent finish with great balance and rotation. Your chest is perfectly facing the target.';
    } else if (balance >= 0.6 && chestPosition >= 0.6) {
      grade = 'B';
      tip = 'Good finish overall. Focus on completing your rotation and finishing tall.';
    } else if (balance >= 0.4 || chestPosition >= 0.4) {
      grade = 'C';
      tip = 'Finish needs work. Focus on balanced follow-through and complete rotation.';
    } else {
      grade = 'D';
      tip = 'Poor finish position. Work on fundamental balance and rotation through impact.';
    }
    
    return { grade, tip };
  }

  // Helper analysis methods
  private static analyzePosture(landmarks: PoseLandmark[]): number {
    const leftShoulder = landmarks[this.LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[this.LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[this.LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[this.LANDMARKS.RIGHT_HIP];
    
    // Calculate spine angle (simplified)
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };
    
    const spineAngle = Math.abs(Math.atan2(hipCenter.x - shoulderCenter.x, hipCenter.y - shoulderCenter.y));
    const idealAngle = Math.PI / 4; // 45 degrees
    
    return Math.max(0, 1 - Math.abs(spineAngle - idealAngle) / idealAngle);
  }

  private static analyzeBalance(landmarks: PoseLandmark[]): number {
    const leftAnkle = landmarks[this.LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[this.LANDMARKS.RIGHT_ANKLE];
    
    // Check if weight is evenly distributed
    const weightDistribution = Math.abs(leftAnkle.x - rightAnkle.x);
    return Math.max(0, 1 - weightDistribution * 2);
  }

  private static analyzeStanceWidth(landmarks: PoseLandmark[]): number {
    const leftAnkle = landmarks[this.LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[this.LANDMARKS.RIGHT_ANKLE];
    
    const stanceWidth = Math.abs(leftAnkle.x - rightAnkle.x);
    const idealWidth = 0.3; // Normalized width
    
    return Math.max(0, 1 - Math.abs(stanceWidth - idealWidth) / idealWidth);
  }

  private static analyzeShoulderAlignment(landmarks: PoseLandmark[]): number {
    const leftShoulder = landmarks[this.LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[this.LANDMARKS.RIGHT_SHOULDER];
    
    // Check if shoulders are parallel to target line
    const shoulderAngle = Math.abs(Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x));
    const idealAngle = 0; // Parallel to target
    
    return Math.max(0, 1 - shoulderAngle / (Math.PI / 4));
  }

  private static analyzeHipAlignment(landmarks: PoseLandmark[]): number {
    const leftHip = landmarks[this.LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[this.LANDMARKS.RIGHT_HIP];
    
    // Check if hips are parallel to target line
    const hipAngle = Math.abs(Math.atan2(rightHip.y - leftHip.y, rightHip.x - leftHip.x));
    const idealAngle = 0; // Parallel to target
    
    return Math.max(0, 1 - hipAngle / (Math.PI / 4));
  }

  private static calculateShoulderTurn(setup: PoseLandmark[], backswing: PoseLandmark[]): number {
    const setupLeftShoulder = setup[this.LANDMARKS.LEFT_SHOULDER];
    const setupRightShoulder = setup[this.LANDMARKS.RIGHT_SHOULDER];
    const backswingLeftShoulder = backswing[this.LANDMARKS.LEFT_SHOULDER];
    const backswingRightShoulder = backswing[this.LANDMARKS.RIGHT_SHOULDER];
    
    const setupAngle = Math.atan2(setupRightShoulder.y - setupLeftShoulder.y, setupRightShoulder.x - setupLeftShoulder.x);
    const backswingAngle = Math.atan2(backswingRightShoulder.y - backswingLeftShoulder.y, backswingRightShoulder.x - backswingLeftShoulder.x);
    
    return Math.abs(backswingAngle - setupAngle) * (180 / Math.PI);
  }

  private static calculateHipTurn(setup: PoseLandmark[], backswing: PoseLandmark[]): number {
    const setupLeftHip = setup[this.LANDMARKS.LEFT_HIP];
    const setupRightHip = setup[this.LANDMARKS.RIGHT_HIP];
    const backswingLeftHip = backswing[this.LANDMARKS.LEFT_HIP];
    const backswingRightHip = backswing[this.LANDMARKS.RIGHT_HIP];
    
    const setupAngle = Math.atan2(setupRightHip.y - setupLeftHip.y, setupRightHip.x - setupLeftHip.x);
    const backswingAngle = Math.atan2(backswingRightHip.y - backswingLeftHip.y, backswingRightHip.x - backswingLeftHip.x);
    
    return Math.abs(backswingAngle - setupAngle) * (180 / Math.PI);
  }

  private static analyzeWeightTransfer(phases: SwingPhase): number {
    // Simplified weight transfer analysis
    const setupLeftAnkle = phases.setup[this.LANDMARKS.LEFT_ANKLE];
    const setupRightAnkle = phases.setup[this.LANDMARKS.RIGHT_ANKLE];
    const impactLeftAnkle = phases.impact[this.LANDMARKS.LEFT_ANKLE];
    const impactRightAnkle = phases.impact[this.LANDMARKS.RIGHT_ANKLE];
    
    const setupWeight = Math.abs(setupLeftAnkle.x - setupRightAnkle.x);
    const impactWeight = Math.abs(impactLeftAnkle.x - impactRightAnkle.x);
    
    // Weight should shift from back foot to front foot
    return Math.max(0, 1 - Math.abs(impactWeight - setupWeight) / setupWeight);
  }

  private static analyzeShaftLean(impact: PoseLandmark[], setup: PoseLandmark[]): number {
    const impactLeftWrist = impact[this.LANDMARKS.LEFT_WRIST];
    const impactRightWrist = impact[this.LANDMARKS.RIGHT_WRIST];
    const setupLeftWrist = setup[this.LANDMARKS.LEFT_WRIST];
    const setupRightWrist = setup[this.LANDMARKS.RIGHT_WRIST];
    
    // Check if hands are ahead of the ball at impact
    const impactWristY = (impactLeftWrist.y + impactRightWrist.y) / 2;
    const setupWristY = (setupLeftWrist.y + setupRightWrist.y) / 2;
    
    const shaftLean = impactWristY - setupWristY;
    return Math.max(0, Math.min(1, shaftLean * 2)); // Normalize
  }

  private static analyzeClubfaceAngle(impact: PoseLandmark[]): number {
    const leftWrist = impact[this.LANDMARKS.LEFT_WRIST];
    const rightWrist = impact[this.LANDMARKS.RIGHT_WRIST];
    
    // Check if wrists are square at impact
    const wristAlignment = Math.abs(leftWrist.y - rightWrist.y);
    return Math.max(0, 1 - wristAlignment * 10);
  }

  private static analyzeFinishBalance(landmarks: PoseLandmark[]): number {
    const leftAnkle = landmarks[this.LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[this.LANDMARKS.RIGHT_ANKLE];
    
    // Check if weight is on front foot at finish
    const weightDistribution = Math.abs(leftAnkle.x - rightAnkle.x);
    return Math.max(0, 1 - weightDistribution * 2);
  }

  private static analyzeChestPosition(landmarks: PoseLandmark[]): number {
    const leftShoulder = landmarks[this.LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[this.LANDMARKS.RIGHT_SHOULDER];
    
    // Check if chest is facing target (shoulders parallel to target)
    const shoulderAngle = Math.abs(Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x));
    return Math.max(0, 1 - shoulderAngle / (Math.PI / 2));
  }

  private static calculateDistance(p1: PoseLandmark, p2: PoseLandmark): number {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }

  private static calculateOverallScore(grades: string[]): string {
    const gradeValues = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
    const totalScore = grades.reduce((sum, grade) => sum + (gradeValues[grade as keyof typeof gradeValues] || 0), 0);
    const averageScore = totalScore / grades.length;
    
    if (averageScore >= 3.5) return 'A';
    if (averageScore >= 2.5) return 'B';
    if (averageScore >= 1.5) return 'C';
    if (averageScore >= 0.5) return 'D';
    return 'F';
  }

  private static generateOverallTip(setup: any, rotation: any, impact: any): string {
    const issues = [];
    
    if (setup.grade === 'D' || setup.grade === 'F') {
      issues.push('setup fundamentals');
    }
    if (rotation.grade === 'D' || rotation.grade === 'F') {
      issues.push('rotation and weight transfer');
    }
    if (impact.grade === 'D' || impact.grade === 'F') {
      issues.push('impact position');
    }
    
    if (issues.length === 0) {
      return 'Excellent swing fundamentals! Keep practicing to maintain consistency.';
    } else if (issues.length === 1) {
      return `Solid swing overall. Key improvement: work on ${issues[0]}.`;
    } else {
      return `Good foundation. Focus on improving ${issues.join(' and ')} for better results.`;
    }
  }
}
