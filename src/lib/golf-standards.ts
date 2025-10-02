/**
 * Professional Golf Biomechanics Standards
 * 
 * Comprehensive set of biomechanical standards and rules derived from
 * professional golf research and PGA Tour data. These standards define
 * optimal ranges, sequences, and relationships for golf swing mechanics.
 */

// 🎯 BIOMECHANICAL STANDARDS INTERFACES
export interface JointStandard {
  joint: string;
  phase: string;
  range: {
    min: number;
    max: number;
    optimal: number;
  };
  tolerance: {
    beginner: number;
    intermediate: number;
    advanced: number;
    professional: number;
  };
  importance: number; // 0-1
  description: string;
}

export interface KinematicStandard {
  phase: string;
  sequence: {
    order: string[];
    timing: {
      min: number;
      max: number;
      optimal: number;
    }[];
  };
  tolerance: {
    beginner: number;
    intermediate: number;
    advanced: number;
    professional: number;
  };
  importance: number; // 0-1
  description: string;
}

export interface WeightTransferStandard {
  phase: string;
  distribution: {
    leftFoot: {
      min: number;
      max: number;
      optimal: number;
    };
    rightFoot: {
      min: number;
      max: number;
      optimal: number;
    };
  };
  tolerance: {
    beginner: number;
    intermediate: number;
    advanced: number;
    professional: number;
  };
  importance: number; // 0-1
  description: string;
}

export interface ClubPathStandard {
  phase: string;
  angles: {
    shaft: {
      min: number;
      max: number;
      optimal: number;
    };
    face: {
      min: number;
      max: number;
      optimal: number;
    };
    path: {
      min: number;
      max: number;
      optimal: number;
    };
  };
  tolerance: {
    beginner: number;
    intermediate: number;
    advanced: number;
    professional: number;
  };
  importance: number; // 0-1
  description: string;
}

// 🎯 PROFESSIONAL STANDARDS
export const JOINT_STANDARDS: JointStandard[] = [
  // Address Position
  {
    joint: 'spine_angle',
    phase: 'address',
    range: { min: 35, max: 45, optimal: 40 },
    tolerance: {
      beginner: 8,
      intermediate: 6,
      advanced: 4,
      professional: 2
    },
    importance: 0.9,
    description: 'Forward spine tilt at address, measured from vertical'
  },
  {
    joint: 'knee_flex',
    phase: 'address',
    range: { min: 20, max: 30, optimal: 25 },
    tolerance: {
      beginner: 7,
      intermediate: 5,
      advanced: 3,
      professional: 2
    },
    importance: 0.8,
    description: 'Knee flexion at address for athletic stance'
  },

  // Backswing
  {
    joint: 'shoulder_turn',
    phase: 'top',
    range: { min: 80, max: 100, optimal: 90 },
    tolerance: {
      beginner: 15,
      intermediate: 10,
      advanced: 7,
      professional: 5
    },
    importance: 0.95,
    description: 'Shoulder rotation at top of backswing'
  },
  {
    joint: 'hip_turn',
    phase: 'top',
    range: { min: 35, max: 45, optimal: 40 },
    tolerance: {
      beginner: 10,
      intermediate: 8,
      advanced: 5,
      professional: 3
    },
    importance: 0.9,
    description: 'Hip rotation at top of backswing'
  },
  {
    joint: 'wrist_cock',
    phase: 'top',
    range: { min: 80, max: 100, optimal: 90 },
    tolerance: {
      beginner: 12,
      intermediate: 9,
      advanced: 6,
      professional: 4
    },
    importance: 0.85,
    description: 'Wrist hinge angle at top of backswing'
  },

  // Impact
  {
    joint: 'hip_rotation',
    phase: 'impact',
    range: { min: 35, max: 45, optimal: 40 },
    tolerance: {
      beginner: 10,
      intermediate: 7,
      advanced: 5,
      professional: 3
    },
    importance: 0.95,
    description: 'Hip rotation at impact for power transfer'
  },
  {
    joint: 'shoulder_tilt',
    phase: 'impact',
    range: { min: 30, max: 40, optimal: 35 },
    tolerance: {
      beginner: 8,
      intermediate: 6,
      advanced: 4,
      professional: 2
    },
    importance: 0.9,
    description: 'Secondary axis tilt at impact'
  }
];

export const KINEMATIC_STANDARDS: KinematicStandard[] = [
  {
    phase: 'downswing',
    sequence: {
      order: ['hips', 'torso', 'arms', 'club'],
      timing: [
        { min: 0.18, max: 0.22, optimal: 0.2 },  // hips
        { min: 0.38, max: 0.42, optimal: 0.4 },  // torso
        { min: 0.58, max: 0.62, optimal: 0.6 },  // arms
        { min: 0.78, max: 0.82, optimal: 0.8 }   // club
      ]
    },
    tolerance: {
      beginner: 0.1,
      intermediate: 0.07,
      advanced: 0.05,
      professional: 0.03
    },
    importance: 0.95,
    description: 'Kinematic sequence timing in downswing'
  }
];

export const WEIGHT_TRANSFER_STANDARDS: WeightTransferStandard[] = [
  // Address
  {
    phase: 'address',
    distribution: {
      leftFoot: { min: 45, max: 55, optimal: 50 },
      rightFoot: { min: 45, max: 55, optimal: 50 }
    },
    tolerance: {
      beginner: 8,
      intermediate: 6,
      advanced: 4,
      professional: 2
    },
    importance: 0.8,
    description: 'Weight distribution at address'
  },
  // Top of Backswing
  {
    phase: 'top',
    distribution: {
      leftFoot: { min: 30, max: 40, optimal: 35 },
      rightFoot: { min: 60, max: 70, optimal: 65 }
    },
    tolerance: {
      beginner: 10,
      intermediate: 7,
      advanced: 5,
      professional: 3
    },
    importance: 0.85,
    description: 'Weight transfer to trail foot at top'
  },
  // Impact
  {
    phase: 'impact',
    distribution: {
      leftFoot: { min: 75, max: 85, optimal: 80 },
      rightFoot: { min: 15, max: 25, optimal: 20 }
    },
    tolerance: {
      beginner: 12,
      intermediate: 8,
      advanced: 5,
      professional: 3
    },
    importance: 0.95,
    description: 'Weight transfer to lead foot at impact'
  }
];

export const CLUB_PATH_STANDARDS: ClubPathStandard[] = [
  // Backswing
  {
    phase: 'backswing',
    angles: {
      shaft: { min: 80, max: 100, optimal: 90 },
      face: { min: -5, max: 5, optimal: 0 },
      path: { min: -5, max: 5, optimal: 0 }
    },
    tolerance: {
      beginner: 10,
      intermediate: 7,
      advanced: 5,
      professional: 3
    },
    importance: 0.85,
    description: 'Club path angles during backswing'
  },
  // Impact
  {
    phase: 'impact',
    angles: {
      shaft: { min: -2, max: 2, optimal: 0 },
      face: { min: -2, max: 2, optimal: 0 },
      path: { min: -2, max: 2, optimal: 0 }
    },
    tolerance: {
      beginner: 5,
      intermediate: 3,
      advanced: 2,
      professional: 1
    },
    importance: 0.95,
    description: 'Club path angles at impact'
  }
];

// 🎯 VALIDATION FUNCTIONS
export function validateJointAngle(
  joint: string,
  phase: string,
  angle: number,
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional'
): { isValid: boolean; confidence: number; deviation: number } {
  const standard = JOINT_STANDARDS.find(s => s.joint === joint && s.phase === phase);
  if (!standard) return { isValid: false, confidence: 0, deviation: 0 };

  const { min, max, optimal } = standard.range;
  const tolerance = standard.tolerance[level];

  const deviation = Math.abs(angle - optimal);
  const maxDeviation = Math.max(optimal - min, max - optimal) + tolerance;
  const confidence = Math.max(0, 1 - (deviation / maxDeviation));

  return {
    isValid: angle >= min - tolerance && angle <= max + tolerance,
    confidence,
    deviation
  };
}

export function validateKinematicSequence(
  sequence: { timing: { [key: string]: number } },
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional'
): { isValid: boolean; confidence: number; deviations: number[] } {
  const standard = KINEMATIC_STANDARDS[0]; // Only one sequence standard
  const tolerance = standard.tolerance[level];

  const deviations = standard.sequence.timing.map((timing, index) => {
    const actual = sequence.timing[standard.sequence.order[index]];
    return Math.abs(actual - timing.optimal);
  });

  const maxDeviation = Math.max(...deviations);
  const confidence = Math.max(0, 1 - (maxDeviation / tolerance));

  return {
    isValid: deviations.every(d => d <= tolerance),
    confidence,
    deviations
  };
}

export function validateWeightTransfer(
  phase: string,
  leftFoot: number,
  rightFoot: number,
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional'
): { isValid: boolean; confidence: number; deviations: number[] } {
  const standard = WEIGHT_TRANSFER_STANDARDS.find(s => s.phase === phase);
  if (!standard) return { isValid: false, confidence: 0, deviations: [] };

  const tolerance = standard.tolerance[level];
  const leftDeviation = Math.abs(leftFoot - standard.distribution.leftFoot.optimal);
  const rightDeviation = Math.abs(rightFoot - standard.distribution.rightFoot.optimal);

  const maxDeviation = Math.max(leftDeviation, rightDeviation);
  const confidence = Math.max(0, 1 - (maxDeviation / (tolerance * 2)));

  return {
    isValid: leftDeviation <= tolerance && rightDeviation <= tolerance,
    confidence,
    deviations: [leftDeviation, rightDeviation]
  };
}

export function validateClubPath(
  phase: string,
  angles: { shaft: number; face: number; path: number },
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional'
): { isValid: boolean; confidence: number; deviations: number[] } {
  const standard = CLUB_PATH_STANDARDS.find(s => s.phase === phase);
  if (!standard) return { isValid: false, confidence: 0, deviations: [] };

  const tolerance = standard.tolerance[level];
  const deviations = [
    Math.abs(angles.shaft - standard.angles.shaft.optimal),
    Math.abs(angles.face - standard.angles.face.optimal),
    Math.abs(angles.path - standard.angles.path.optimal)
  ];

  const maxDeviation = Math.max(...deviations);
  const confidence = Math.max(0, 1 - (maxDeviation / (tolerance * 2)));

  return {
    isValid: deviations.every(d => d <= tolerance),
    confidence,
    deviations
  };
}

// 🎯 UTILITY FUNCTIONS
export function getStandardDescription(
  type: 'joint' | 'kinematic' | 'weight' | 'club',
  phase: string,
  joint?: string
): string {
  switch (type) {
    case 'joint':
      return JOINT_STANDARDS.find(s => s.joint === joint && s.phase === phase)?.description || '';
    case 'kinematic':
      return KINEMATIC_STANDARDS.find(s => s.phase === phase)?.description || '';
    case 'weight':
      return WEIGHT_TRANSFER_STANDARDS.find(s => s.phase === phase)?.description || '';
    case 'club':
      return CLUB_PATH_STANDARDS.find(s => s.phase === phase)?.description || '';
    default:
      return '';
  }
}

export function getStandardImportance(
  type: 'joint' | 'kinematic' | 'weight' | 'club',
  phase: string,
  joint?: string
): number {
  switch (type) {
    case 'joint':
      return JOINT_STANDARDS.find(s => s.joint === joint && s.phase === phase)?.importance || 0;
    case 'kinematic':
      return KINEMATIC_STANDARDS.find(s => s.phase === phase)?.importance || 0;
    case 'weight':
      return WEIGHT_TRANSFER_STANDARDS.find(s => s.phase === phase)?.importance || 0;
    case 'club':
      return CLUB_PATH_STANDARDS.find(s => s.phase === phase)?.importance || 0;
    default:
      return 0;
  }
}

export function getToleranceRange(
  type: 'joint' | 'kinematic' | 'weight' | 'club',
  phase: string,
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional',
  joint?: string
): number {
  switch (type) {
    case 'joint':
      return JOINT_STANDARDS.find(s => s.joint === joint && s.phase === phase)?.tolerance[level] || 0;
    case 'kinematic':
      return KINEMATIC_STANDARDS.find(s => s.phase === phase)?.tolerance[level] || 0;
    case 'weight':
      return WEIGHT_TRANSFER_STANDARDS.find(s => s.phase === phase)?.tolerance[level] || 0;
    case 'club':
      return CLUB_PATH_STANDARDS.find(s => s.phase === phase)?.tolerance[level] || 0;
    default:
      return 0;
  }
}
