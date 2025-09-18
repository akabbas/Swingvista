export interface WeightDistribution {
  leftFoot: number;      // 0-100% weight on left foot
  rightFoot: number;     // 0-100% weight on right foot
  centerOfGravity: {
    x: number;           // 0-1 horizontal position
    y: number;           // 0-1 vertical position
    z: number;           // 0-1 depth position
  };
  balance: {
    forward: number;     // -100 to +100 (negative = leaning back)
    lateral: number;     // -100 to +100 (negative = leaning left)
    stability: number;   // 0-100 (100 = perfectly stable)
  };
  phase: 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through';
  confidence: number;    // 0-1 confidence in analysis
}

export interface CameraAngle {
  type: 'down-the-line' | 'face-on' | 'side-view' | 'diagonal' | 'unknown';
  rotation: number;      // degrees of rotation from standard view
  tilt: number;          // degrees of tilt up/down
  distance: 'close' | 'medium' | 'far';
  confidence: number;    // 0-1 confidence in angle detection
}

export interface SwingMetrics {
  weightTransfer: {
    address: WeightDistribution;
    top: WeightDistribution;
    impact: WeightDistribution;
    finish: WeightDistribution;
  };
  tempo: {
    backswingTime: number;    // seconds
    downswingTime: number;    // seconds
    totalTime: number;        // seconds
    ratio: number;            // backswing/downswing ratio
  };
  balance: {
    averageStability: number;
    maxLateralShift: number;
    maxForwardShift: number;
  };
  posture: {
    spineAngle: number;       // degrees from vertical
    kneeFlex: number;         // degrees of knee bend
    shoulderTilt: number;     // degrees of shoulder tilt
  };
}

export class WeightDistributionAnalyzer {
  private cameraAngle: CameraAngle = {
    type: 'unknown',
    rotation: 0,
    tilt: 0,
    distance: 'medium',
    confidence: 0
  };

  constructor() {
    this.detectCameraAngle = this.detectCameraAngle.bind(this);
    this.analyzeWeightDistribution = this.analyzeWeightDistribution.bind(this);
    this.compensateForCameraAngle = this.compensateForCameraAngle.bind(this);
  }

  // Detect camera angle from pose landmarks
  detectCameraAngle(landmarks: any[]): CameraAngle {
    if (!landmarks || landmarks.length < 33) {
      return { type: 'unknown', rotation: 0, tilt: 0, distance: 'medium', confidence: 0 };
    }

    const nose = landmarks[0];
    const leftEye = landmarks[1];
    const rightEye = landmarks[2];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      return { type: 'unknown', rotation: 0, tilt: 0, distance: 'medium', confidence: 0 };
    }

    // Calculate body width and height for distance estimation
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    const hipWidth = Math.abs(rightHip.x - leftHip.x);
    const bodyHeight = Math.abs(nose.y - Math.min(leftHip.y, rightHip.y));
    
    // Determine distance
    let distance: 'close' | 'medium' | 'far' = 'medium';
    if (shoulderWidth > 0.3) distance = 'close';
    else if (shoulderWidth < 0.15) distance = 'far';

    // Calculate rotation angle
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };

    const bodyAngle = Math.atan2(
      hipCenter.y - shoulderCenter.y,
      hipCenter.x - shoulderCenter.x
    ) * 180 / Math.PI;

    // Determine camera type based on body orientation
    let type: 'down-the-line' | 'face-on' | 'side-view' | 'diagonal' | 'unknown' = 'unknown';
    let confidence = 0.5;

    if (Math.abs(bodyAngle) < 15) {
      type = 'face-on';
      confidence = 0.9;
    } else if (Math.abs(bodyAngle - 90) < 15 || Math.abs(bodyAngle + 90) < 15) {
      type = 'side-view';
      confidence = 0.9;
    } else if (Math.abs(bodyAngle - 45) < 30 || Math.abs(bodyAngle + 45) < 30) {
      type = 'down-the-line';
      confidence = 0.8;
    } else {
      type = 'diagonal';
      confidence = 0.6;
    }

    // Calculate tilt
    const tilt = Math.atan2(
      Math.min(leftHip.y, rightHip.y) - Math.min(leftShoulder.y, rightShoulder.y),
      Math.abs(leftHip.x - rightHip.x)
    ) * 180 / Math.PI;

    this.cameraAngle = {
      type,
      rotation: bodyAngle,
      tilt,
      distance,
      confidence
    };

    return this.cameraAngle;
  }

  // Analyze weight distribution with camera angle compensation
  analyzeWeightDistribution(landmarks: any[], frameIndex: number, totalFrames: number): WeightDistribution {
    if (!landmarks || landmarks.length < 33) {
      return this.getDefaultWeightDistribution();
    }

    // Detect camera angle first
    this.detectCameraAngle(landmarks);

    // Get key landmarks
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const nose = landmarks[0];

    if (!leftAnkle || !rightAnkle || !leftHip || !rightHip) {
      return this.getDefaultWeightDistribution();
    }

    // Calculate weight distribution using multiple methods
    const methods = this.calculateWeightDistributionMethods(landmarks);
    
    // Weight the methods based on confidence and camera angle
    const weights = this.calculateMethodWeights(methods, this.cameraAngle);
    
    // Combine methods with weighted average
    let leftFootWeight = 50;
    let rightFootWeight = 50;
    
    let totalWeight = 0;
    for (let i = 0; i < methods.length; i++) {
      const methodWeight = weights[i];
      leftFootWeight += methods[i].leftFoot * methodWeight;
      rightFootWeight += methods[i].rightFoot * methodWeight;
      totalWeight += methodWeight;
    }
    
    if (totalWeight > 0) {
      leftFootWeight /= totalWeight;
      rightFootWeight /= totalWeight;
    }

    // Apply camera angle compensation
    const compensated = this.compensateForCameraAngle({
      leftFoot: leftFootWeight,
      rightFoot: rightFootWeight
    });

    // Normalize to ensure sum equals exactly 100%
    const total = compensated.leftFoot + compensated.rightFoot;
    
    if (total === 0) {
      // Fallback if both feet have zero weight
      leftFootWeight = 50;
      rightFootWeight = 50;
    } else {
      // Calculate percentages and ensure they sum to exactly 100%
      leftFootWeight = Math.max(0, Math.min(100, (compensated.leftFoot / total) * 100));
      rightFootWeight = 100 - leftFootWeight; // Ensure exact 100% total
    }

    // Calculate center of gravity
    const centerOfGravity = this.calculateCenterOfGravity(landmarks);

    // Calculate balance metrics
    const balance = this.calculateBalance(landmarks, leftFootWeight, rightFootWeight);

    // Determine swing phase
    const phase = this.determineSwingPhase(frameIndex, totalFrames);

    // Calculate confidence
    const confidence = this.calculateConfidence(landmarks, this.cameraAngle);

    return {
      leftFoot: leftFootWeight,
      rightFoot: rightFootWeight,
      centerOfGravity,
      balance,
      phase,
      confidence
    };
  }

  // Calculate weight distribution using multiple methods
  private calculateWeightDistributionMethods(landmarks: any[]): { leftFoot: number; rightFoot: number; confidence: number }[] {
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const nose = landmarks[0];

    const methods = [];

    // Method 1: Advanced ankle height analysis with body tilt compensation
    const ankleHeightDiff = rightAnkle.y - leftAnkle.y;
    const bodyTilt = this.calculateBodyTilt(landmarks);
    const compensatedAnkleDiff = ankleHeightDiff - (bodyTilt * 0.1); // Compensate for body tilt
    
    const ankleMethod = {
      leftFoot: 50 + compensatedAnkleDiff * 800, // More sensitive scaling
      rightFoot: 50 - compensatedAnkleDiff * 800,
      confidence: Math.min(leftAnkle.visibility || 1, rightAnkle.visibility || 1) * 0.95
    };
    methods.push(ankleMethod);

    // Method 2: Hip position relative to ankle center with rotation compensation
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };
    const ankleCenter = {
      x: (leftAnkle.x + rightAnkle.x) / 2,
      y: (leftAnkle.y + rightAnkle.y) / 2
    };
    const hipToAnkleOffset = hipCenter.x - ankleCenter.x;
    const hipRotation = this.calculateHipRotation(landmarks);
    const compensatedHipOffset = hipToAnkleOffset - (hipRotation * 0.05);
    
    const hipMethod = {
      leftFoot: 50 - compensatedHipOffset * 1500, // More sensitive scaling
      rightFoot: 50 + compensatedHipOffset * 1500,
      confidence: Math.min(leftHip.visibility || 1, rightHip.visibility || 1) * 0.9
    };
    methods.push(hipMethod);

    // Method 3: Advanced knee flex analysis with angle compensation
    if (leftKnee && rightKnee) {
      const leftKneeFlex = this.calculateKneeFlex(leftHip, leftKnee, leftAnkle);
      const rightKneeFlex = this.calculateKneeFlex(rightHip, rightKnee, rightAnkle);
      const kneeFlexDiff = rightKneeFlex - leftKneeFlex;
      const kneeAngleCompensation = this.calculateKneeAngleCompensation(landmarks);
      const compensatedKneeDiff = kneeFlexDiff - kneeAngleCompensation;
      
      const kneeMethod = {
        leftFoot: 50 - compensatedKneeDiff * 2.5, // More sensitive scaling
        rightFoot: 50 + compensatedKneeDiff * 2.5,
        confidence: Math.min(leftKnee.visibility || 1, rightKnee.visibility || 1) * 0.8
      };
      methods.push(kneeMethod);
    }

    // Method 4: Shoulder position analysis with spine angle compensation
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    const shoulderToAnkleOffset = shoulderCenter.x - ankleCenter.x;
    const spineAngle = this.calculateSpineAngle(landmarks);
    const compensatedShoulderOffset = shoulderToAnkleOffset - (spineAngle * 0.03);
    
    const shoulderMethod = {
      leftFoot: 50 - compensatedShoulderOffset * 1200,
      rightFoot: 50 + compensatedShoulderOffset * 1200,
      confidence: Math.min(leftShoulder.visibility || 1, rightShoulder.visibility || 1) * 0.85
    };
    methods.push(shoulderMethod);

    // Method 5: Ankle width analysis with stance width compensation
    const ankleWidth = Math.abs(rightAnkle.x - leftAnkle.x);
    const expectedWidth = 0.15; // Expected stance width
    const widthRatio = ankleWidth / expectedWidth;
    const stanceCompensation = this.calculateStanceCompensation(landmarks);
    const compensatedWidthRatio = widthRatio + stanceCompensation;
    
    const widthMethod = {
      leftFoot: 50 + (compensatedWidthRatio - 1) * 30, // More sensitive scaling
      rightFoot: 50 - (compensatedWidthRatio - 1) * 30,
      confidence: Math.min(leftAnkle.visibility || 1, rightAnkle.visibility || 1) * 0.7
    };
    methods.push(widthMethod);

    // Method 6: Center of mass analysis
    const centerOfMass = this.calculateCenterOfMass(landmarks);
    const centerOfMassOffset = centerOfMass.x - ankleCenter.x;
    
    const centerOfMassMethod = {
      leftFoot: 50 - centerOfMassOffset * 2000,
      rightFoot: 50 + centerOfMassOffset * 2000,
      confidence: 0.8
    };
    methods.push(centerOfMassMethod);

    // Method 7: Foot pressure simulation based on joint angles
    const footPressure = this.calculateFootPressure(landmarks);
    
    const footPressureMethod = {
      leftFoot: footPressure.left,
      rightFoot: footPressure.right,
      confidence: 0.75
    };
    methods.push(footPressureMethod);

    return methods;
  }

  // Calculate body tilt for compensation
  private calculateBodyTilt(landmarks: any[]): number {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
    
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };
    
    const tilt = (shoulderCenter.x - hipCenter.x) * 2; // Scale factor
    return Math.max(-1, Math.min(1, tilt));
  }

  // Calculate hip rotation for compensation
  private calculateHipRotation(landmarks: any[]): number {
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    
    if (!leftHip || !rightHip || !leftKnee || !rightKnee) return 0;
    
    const leftHipKneeAngle = Math.atan2(leftKnee.y - leftHip.y, leftKnee.x - leftHip.x);
    const rightHipKneeAngle = Math.atan2(rightKnee.y - rightHip.y, rightKnee.x - rightHip.x);
    
    const rotation = (leftHipKneeAngle - rightHipKneeAngle) * 0.5;
    return Math.max(-1, Math.min(1, rotation));
  }

  // Calculate knee angle compensation
  private calculateKneeAngleCompensation(landmarks: any[]): number {
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    
    if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle) return 0;
    
    const leftKneeAngle = Math.atan2(leftAnkle.y - leftKnee.y, leftAnkle.x - leftKnee.x);
    const rightKneeAngle = Math.atan2(rightAnkle.y - rightKnee.y, rightAnkle.x - rightKnee.x);
    
    const angleDiff = Math.abs(leftKneeAngle - rightKneeAngle);
    return angleDiff * 0.1; // Small compensation factor
  }

  // Calculate spine angle for compensation
  private calculateSpineAngle(landmarks: any[]): number {
    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
    
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };
    
    const spineAngle = Math.atan2(shoulderCenter.y - hipCenter.y, shoulderCenter.x - hipCenter.x);
    return Math.max(-1, Math.min(1, spineAngle * 0.3));
  }

  // Calculate stance compensation
  private calculateStanceCompensation(landmarks: any[]): number {
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    if (!leftAnkle || !rightAnkle || !leftHip || !rightHip) return 0;
    
    const ankleWidth = Math.abs(rightAnkle.x - leftAnkle.x);
    const hipWidth = Math.abs(rightHip.x - leftHip.x);
    
    const widthRatio = ankleWidth / hipWidth;
    return (widthRatio - 1) * 0.1; // Small compensation
  }

  // Calculate center of mass
  private calculateCenterOfMass(landmarks: any[]): { x: number; y: number } {
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const nose = landmarks[0];
    
    // Weight different body parts
    const ankleWeight = 0.3;
    const kneeWeight = 0.2;
    const hipWeight = 0.3;
    const shoulderWeight = 0.15;
    const headWeight = 0.05;
    
    let totalX = 0;
    let totalY = 0;
    let totalWeight = 0;
    
    if (leftAnkle && rightAnkle) {
      const ankleCenter = {
        x: (leftAnkle.x + rightAnkle.x) / 2,
        y: (leftAnkle.y + rightAnkle.y) / 2
      };
      totalX += ankleCenter.x * ankleWeight;
      totalY += ankleCenter.y * ankleWeight;
      totalWeight += ankleWeight;
    }
    
    if (leftKnee && rightKnee) {
      const kneeCenter = {
        x: (leftKnee.x + rightKnee.x) / 2,
        y: (leftKnee.y + rightKnee.y) / 2
      };
      totalX += kneeCenter.x * kneeWeight;
      totalY += kneeCenter.y * kneeWeight;
      totalWeight += kneeWeight;
    }
    
    if (leftHip && rightHip) {
      const hipCenter = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      totalX += hipCenter.x * hipWeight;
      totalY += hipCenter.y * hipWeight;
      totalWeight += hipWeight;
    }
    
    if (leftShoulder && rightShoulder) {
      const shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      totalX += shoulderCenter.x * shoulderWeight;
      totalY += shoulderCenter.y * shoulderWeight;
      totalWeight += shoulderWeight;
    }
    
    if (nose) {
      totalX += nose.x * headWeight;
      totalY += nose.y * headWeight;
      totalWeight += headWeight;
    }
    
    return {
      x: totalWeight > 0 ? totalX / totalWeight : 0.5,
      y: totalWeight > 0 ? totalY / totalWeight : 0.5
    };
  }

  // Calculate foot pressure simulation
  private calculateFootPressure(landmarks: any[]): { left: number; right: number } {
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    if (!leftAnkle || !rightAnkle || !leftKnee || !rightKnee || !leftHip || !rightHip) {
      return { left: 50, right: 50 };
    }
    
    // Calculate joint angles and use them to estimate pressure
    const leftKneeAngle = this.calculateKneeFlex(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = this.calculateKneeFlex(rightHip, rightKnee, rightAnkle);
    
    // More flexed knee = more weight on that foot
    const leftPressure = 50 + (leftKneeAngle - 90) * 0.5;
    const rightPressure = 50 + (rightKneeAngle - 90) * 0.5;
    
    return {
      left: Math.max(0, Math.min(100, leftPressure)),
      right: Math.max(0, Math.min(100, rightPressure))
    };
  }

  // Calculate method weights based on confidence and camera angle
  private calculateMethodWeights(methods: { leftFoot: number; rightFoot: number; confidence: number }[], cameraAngle: CameraAngle): number[] {
    const weights = methods.map(method => method.confidence);
    
    // Adjust weights based on camera angle
    switch (cameraAngle.type) {
      case 'face-on':
        // Ankle height and hip position are most reliable
        weights[0] *= 1.5; // Ankle height
        weights[1] *= 1.3; // Hip position
        weights[2] *= 0.8; // Knee flex
        weights[3] *= 1.1; // Shoulder position
        weights[4] *= 1.2; // Ankle width
        break;
      case 'side-view':
        // Knee flex and shoulder position are most reliable
        weights[0] *= 1.1; // Ankle height
        weights[1] *= 0.9; // Hip position
        weights[2] *= 1.4; // Knee flex
        weights[3] *= 1.3; // Shoulder position
        weights[4] *= 0.7; // Ankle width
        break;
      case 'down-the-line':
        // All methods are reasonably reliable
        weights.forEach((weight, index) => weights[index] = weight * 1.1);
        break;
      case 'diagonal':
        // Reduce all weights slightly
        weights.forEach((weight, index) => weights[index] = weight * 0.9);
        break;
      default:
        // Unknown angle - use confidence only
        break;
    }

    // Normalize weights
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight > 0) {
      return weights.map(weight => weight / totalWeight);
    }
    
    return weights.map(() => 1 / weights.length);
  }

  // Compensate for camera angle distortions
  private compensateForCameraAngle(weights: { leftFoot: number; rightFoot: number }): { leftFoot: number; rightFoot: number } {
    const { type, rotation, tilt, confidence } = this.cameraAngle;

    if (confidence < 0.5) {
      return weights; // Don't compensate if angle detection is uncertain
    }

    let compensationFactor = 1.0;

    switch (type) {
      case 'face-on':
        // Face-on view: lateral weight shifts are most accurate
        compensationFactor = 1.0;
        break;
      case 'side-view':
        // Side view: forward/back weight shifts are most accurate
        // Lateral shifts may be distorted
        compensationFactor = 0.8;
        break;
      case 'down-the-line':
        // Down-the-line: good for both lateral and forward/back
        compensationFactor = 0.9;
        break;
      case 'diagonal':
        // Diagonal: moderate compensation needed
        compensationFactor = 0.7;
        break;
      default:
        compensationFactor = 0.6;
    }

    // Apply tilt compensation
    const tiltFactor = 1 - (Math.abs(tilt) / 45); // Reduce accuracy with more tilt
    const finalFactor = compensationFactor * tiltFactor;

    return {
      leftFoot: weights.leftFoot * finalFactor + 50 * (1 - finalFactor),
      rightFoot: weights.rightFoot * finalFactor + 50 * (1 - finalFactor)
    };
  }

  // Calculate center of gravity
  private calculateCenterOfGravity(landmarks: any[]): { x: number; y: number; z: number } {
    const keyPoints = [
      landmarks[0],  // nose
      landmarks[11], // left shoulder
      landmarks[12], // right shoulder
      landmarks[23], // left hip
      landmarks[24], // right hip
      landmarks[25], // left knee
      landmarks[26], // right knee
      landmarks[27], // left ankle
      landmarks[28]  // right ankle
    ].filter(point => point && point.visibility > 0.5);

    if (keyPoints.length === 0) {
      return { x: 0.5, y: 0.5, z: 0.5 };
    }

    const center = keyPoints.reduce(
      (acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y,
        z: acc.z + (point.z || 0)
      }),
      { x: 0, y: 0, z: 0 }
    );

    return {
      x: center.x / keyPoints.length,
      y: center.y / keyPoints.length,
      z: center.z / keyPoints.length
    };
  }

  // Calculate balance metrics
  private calculateBalance(landmarks: any[], leftFootWeight: number, rightFootWeight: number): {
    forward: number;
    lateral: number;
    stability: number;
  } {
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    if (!leftAnkle || !rightAnkle || !leftHip || !rightHip) {
      return { forward: 0, lateral: 0, stability: 50 };
    }

    // Calculate lateral balance (left-right)
    const lateral = ((rightFootWeight - leftFootWeight) / 100) * 100;

    // Calculate forward balance (front-back)
    const ankleCenter = {
      x: (leftAnkle.x + rightAnkle.x) / 2,
      y: (leftAnkle.y + rightAnkle.y) / 2
    };
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };

    const forwardOffset = (hipCenter.x - ankleCenter.x) * 100;
    const forward = Math.max(-100, Math.min(100, forwardOffset));

    // Calculate stability (how centered the weight is)
    const weightBalance = Math.abs(leftFootWeight - rightFootWeight);
    const stability = Math.max(0, 100 - weightBalance);

    return { forward, lateral, stability };
  }

  // Calculate knee flex angle
  private calculateKneeFlex(hip: any, knee: any, ankle: any): number {
    const hipToKnee = {
      x: knee.x - hip.x,
      y: knee.y - hip.y
    };
    const kneeToAnkle = {
      x: ankle.x - knee.x,
      y: ankle.y - knee.y
    };

    const angle1 = Math.atan2(hipToKnee.y, hipToKnee.x);
    const angle2 = Math.atan2(kneeToAnkle.y, kneeToAnkle.x);
    
    let angle = Math.abs(angle2 - angle1) * 180 / Math.PI;
    if (angle > 180) angle = 360 - angle;
    
    return angle;
  }

  // Determine swing phase
  private determineSwingPhase(frameIndex: number, totalFrames: number): 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through' {
    const progress = frameIndex / totalFrames;
    
    if (progress < 0.1) return 'address';
    if (progress < 0.4) return 'backswing';
    if (progress < 0.5) return 'top';
    if (progress < 0.8) return 'downswing';
    if (progress < 0.9) return 'impact';
    return 'follow-through';
  }

  // Calculate confidence in analysis
  private calculateConfidence(landmarks: any[], cameraAngle: CameraAngle): number {
    let confidence = 0.5;

    // Check landmark visibility
    const keyLandmarks = [27, 28, 23, 24, 25, 26]; // ankles, hips, knees
    const visibleLandmarks = keyLandmarks.filter(i => 
      landmarks[i] && landmarks[i].visibility > 0.5
    ).length;
    
    confidence += (visibleLandmarks / keyLandmarks.length) * 0.3;

    // Check camera angle confidence
    confidence += cameraAngle.confidence * 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  // Get default weight distribution
  private getDefaultWeightDistribution(): WeightDistribution {
    return {
      leftFoot: 50,
      rightFoot: 50,
      centerOfGravity: { x: 0.5, y: 0.5, z: 0.5 },
      balance: { forward: 0, lateral: 0, stability: 50 },
      phase: 'address',
      confidence: 0
    };
  }

  // Analyze complete swing metrics
  analyzeSwingMetrics(poses: any[]): SwingMetrics {
    const keyFrames = this.identifyKeyFrames(poses);
    const weightTransfer = {
      address: this.analyzeWeightDistribution(poses[keyFrames.address]?.landmarks || [], keyFrames.address, poses.length),
      top: this.analyzeWeightDistribution(poses[keyFrames.top]?.landmarks || [], keyFrames.top, poses.length),
      impact: this.analyzeWeightDistribution(poses[keyFrames.impact]?.landmarks || [], keyFrames.impact, poses.length),
      finish: this.analyzeWeightDistribution(poses[keyFrames.finish]?.landmarks || [], keyFrames.finish, poses.length)
    };

    const tempo = this.calculateTempo(poses, keyFrames);
    const balance = this.calculateOverallBalance(poses);
    const posture = this.calculatePosture(poses);

    return {
      weightTransfer,
      tempo,
      balance,
      posture
    };
  }

  // Identify key frames in swing
  private identifyKeyFrames(poses: any[]): { address: number; top: number; impact: number; finish: number } {
    const totalFrames = poses.length;
    return {
      address: 0,
      top: Math.floor(totalFrames * 0.4),
      impact: Math.floor(totalFrames * 0.8),
      finish: totalFrames - 1
    };
  }

  // Calculate swing tempo
  private calculateTempo(poses: any[], keyFrames: any): { backswingTime: number; downswingTime: number; totalTime: number; ratio: number } {
    const totalTime = poses[poses.length - 1]?.timestamp - poses[0]?.timestamp || 0;
    const backswingTime = poses[keyFrames.top]?.timestamp - poses[keyFrames.address]?.timestamp || 0;
    const downswingTime = poses[keyFrames.impact]?.timestamp - poses[keyFrames.top]?.timestamp || 0;
    
    return {
      backswingTime: backswingTime / 1000, // Convert to seconds
      downswingTime: downswingTime / 1000,
      totalTime: totalTime / 1000,
      ratio: backswingTime / downswingTime || 1
    };
  }

  // Calculate overall balance metrics
  private calculateOverallBalance(poses: any[]): { averageStability: number; maxLateralShift: number; maxForwardShift: number } {
    let totalStability = 0;
    let maxLateral = 0;
    let maxForward = 0;

    poses.forEach((pose, index) => {
      const weightDist = this.analyzeWeightDistribution(pose.landmarks, index, poses.length);
      totalStability += weightDist.balance.stability;
      maxLateral = Math.max(maxLateral, Math.abs(weightDist.balance.lateral));
      maxForward = Math.max(maxForward, Math.abs(weightDist.balance.forward));
    });

    return {
      averageStability: totalStability / poses.length,
      maxLateralShift: maxLateral,
      maxForwardShift: maxForward
    };
  }

  // Calculate posture metrics
  private calculatePosture(poses: any[]): { spineAngle: number; kneeFlex: number; shoulderTilt: number } {
    // Simplified posture calculation - would need more sophisticated analysis
    return {
      spineAngle: 0,
      kneeFlex: 0,
      shoulderTilt: 0
    };
  }
}
