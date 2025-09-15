import { TrajectoryPoint, SwingTrajectory } from './mediapipe';
import { SwingPhase } from './swing-phases';

export interface TrajectoryMetrics {
  totalDistance: number;
  maxVelocity: number;
  avgVelocity: number;
  maxAcceleration: number;
  avgAcceleration: number;
  peakFrame: number;
  smoothness: number; // 0-1, higher is smoother
}

export interface SwingPathAnalysis {
  clubheadPath: TrajectoryPoint[];
  swingPlane: number;
  pathConsistency: number; // 0-1, higher is more consistent
  insideOut: boolean;
  outsideIn: boolean;
  onPlane: boolean;
}

export interface VelocityProfile {
  frames: number[];
  velocities: number[];
  accelerations: number[];
  peakVelocityFrame: number;
  peakAccelerationFrame: number;
}

export interface TrajectoryVisualization {
  points: TrajectoryPoint[];
  smoothedPoints: TrajectoryPoint[];
  velocityProfile: VelocityProfile;
  phases: SwingPhase[];
  metrics: TrajectoryMetrics;
}

export class TrajectoryAnalyzer {
  private smoothingWindow = 5;
  private minVelocityThreshold = 0.001;

  constructor(smoothingWindow: number = 5) {
    this.smoothingWindow = smoothingWindow;
  }

  /**
   * Analyze trajectory metrics for a specific body part
   */
  analyzeTrajectory(trajectory: TrajectoryPoint[]): TrajectoryMetrics {
    if (trajectory.length === 0) {
      return {
        totalDistance: 0,
        maxVelocity: 0,
        avgVelocity: 0,
        maxAcceleration: 0,
        avgAcceleration: 0,
        peakFrame: 0,
        smoothness: 0 // Empty trajectory has no smoothness
      };
    }
    
    if (trajectory.length < 2) {
      return {
        totalDistance: 0,
        maxVelocity: 0,
        avgVelocity: 0,
        maxAcceleration: 0,
        avgAcceleration: 0,
        peakFrame: 0,
        smoothness: 1 // Single point is perfectly smooth
      };
    }

    const velocities = this.calculateVelocities(trajectory);
    const accelerations = this.calculateAccelerations(trajectory);
    const totalDistance = this.calculateTotalDistance(trajectory);
    const maxVelocity = Math.max(...velocities);
    const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    const maxAcceleration = Math.max(...accelerations);
    const avgAcceleration = accelerations.reduce((sum, a) => sum + a, 0) / accelerations.length;
    const peakFrame = velocities.indexOf(maxVelocity);
    const smoothness = this.calculateSmoothness(trajectory);

    return {
      totalDistance,
      maxVelocity,
      avgVelocity,
      maxAcceleration,
      avgAcceleration,
      peakFrame,
      smoothness
    };
  }

  /**
   * Analyze swing path characteristics
   */
  analyzeSwingPath(trajectory: SwingTrajectory, phases: SwingPhase[]): SwingPathAnalysis {
    const clubheadPath = trajectory.clubhead;
    const swingPlane = this.calculateSwingPlane(clubheadPath);
    const pathConsistency = this.calculatePathConsistency(clubheadPath);
    const pathDirection = this.analyzePathDirection(clubheadPath, phases);

    return {
      clubheadPath,
      swingPlane,
      pathConsistency,
      insideOut: pathDirection.insideOut,
      outsideIn: pathDirection.outsideIn,
      onPlane: pathDirection.onPlane
    };
  }

  /**
   * Create velocity profile for visualization
   */
  createVelocityProfile(trajectory: TrajectoryPoint[]): VelocityProfile {
    const velocities = this.calculateVelocities(trajectory);
    const accelerations = this.calculateAccelerations(trajectory);
    const frames = trajectory.map((_, index) => index);
    
    // Handle empty arrays
    const peakVelocityFrame = velocities.length > 0 ? velocities.indexOf(Math.max(...velocities)) : 0;
    const peakAccelerationFrame = accelerations.length > 0 ? accelerations.indexOf(Math.max(...accelerations)) : 0;

    return {
      frames,
      velocities,
      accelerations,
      peakVelocityFrame,
      peakAccelerationFrame
    };
  }

  /**
   * Smooth trajectory using moving average
   */
  smoothTrajectory(trajectory: TrajectoryPoint[]): TrajectoryPoint[] {
    if (trajectory.length < this.smoothingWindow) return trajectory;

    const smoothed: TrajectoryPoint[] = [];

    for (let i = 0; i < trajectory.length; i++) {
      const start = Math.max(0, i - Math.floor(this.smoothingWindow / 2));
      const end = Math.min(trajectory.length, i + Math.ceil(this.smoothingWindow / 2));
      const window = trajectory.slice(start, end);

      const avgX = window.reduce((sum, p) => sum + p.x, 0) / window.length;
      const avgY = window.reduce((sum, p) => sum + p.y, 0) / window.length;
      const avgZ = window.reduce((sum, p) => sum + p.z, 0) / window.length;
      const avgTimestamp = window.reduce((sum, p) => sum + p.timestamp, 0) / window.length;

      smoothed.push({
        x: avgX,
        y: avgY,
        z: avgZ,
        timestamp: avgTimestamp,
        frame: i
      });
    }

    return smoothed;
  }

  /**
   * Calculate velocities between consecutive points
   */
  private calculateVelocities(trajectory: TrajectoryPoint[]): number[] {
    const velocities: number[] = [];

    for (let i = 1; i < trajectory.length; i++) {
      const velocity = this.calculateVelocity(trajectory[i - 1], trajectory[i]);
      velocities.push(velocity);
    }

    return velocities;
  }

  /**
   * Calculate accelerations from velocities
   */
  private calculateAccelerations(trajectory: TrajectoryPoint[]): number[] {
    const velocities = this.calculateVelocities(trajectory);
    const accelerations: number[] = [];

    for (let i = 1; i < velocities.length; i++) {
      const acceleration = this.calculateAcceleration(
        trajectory[i - 1],
        trajectory[i],
        trajectory[i + 1] || trajectory[i]
      );
      accelerations.push(acceleration);
    }

    return accelerations;
  }

  /**
   * Calculate velocity between two points
   */
  private calculateVelocity(point1: TrajectoryPoint, point2: TrajectoryPoint): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    const dt = point2.timestamp - point1.timestamp;

    if (dt === 0) return 0;

    return Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;
  }

  /**
   * Calculate acceleration between three points
   */
  private calculateAcceleration(
    point1: TrajectoryPoint,
    point2: TrajectoryPoint,
    point3: TrajectoryPoint
  ): number {
    const v1 = this.calculateVelocity(point1, point2);
    const v2 = this.calculateVelocity(point2, point3);
    const dt = (point3.timestamp - point1.timestamp) / 2;

    if (dt === 0) return 0;

    return Math.abs(v2 - v1) / dt;
  }

  /**
   * Calculate total distance traveled
   */
  private calculateTotalDistance(trajectory: TrajectoryPoint[]): number {
    let totalDistance = 0;

    for (let i = 1; i < trajectory.length; i++) {
      const distance = this.calculateDistance(trajectory[i - 1], trajectory[i]);
      totalDistance += distance;
    }

    return totalDistance;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: TrajectoryPoint, point2: TrajectoryPoint): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate trajectory smoothness (0-1, higher is smoother)
   */
  private calculateSmoothness(trajectory: TrajectoryPoint[]): number {
    if (trajectory.length <= 1) return 1; // Single point or empty is perfectly smooth
    if (trajectory.length < 3) return 1; // Two points are perfectly smooth

    const accelerations = this.calculateAccelerations(trajectory);
    if (accelerations.length === 0) return 1;
    
    const avgAcceleration = accelerations.reduce((sum, a) => sum + a, 0) / accelerations.length;
    const maxAcceleration = Math.max(...accelerations);

    if (maxAcceleration === 0) return 1;

    // Smoothness is inverse of normalized acceleration variance
    const variance = accelerations.reduce((sum, a) => sum + Math.pow(a - avgAcceleration, 2), 0) / accelerations.length;
    const normalizedVariance = variance / (maxAcceleration * maxAcceleration);

    return Math.max(0, Math.min(1, 1 - normalizedVariance));
  }

  /**
   * Calculate swing plane angle
   */
  private calculateSwingPlane(trajectory: TrajectoryPoint[]): number {
    if (trajectory.length < 2) return 0;

    const start = trajectory[0];
    const end = trajectory[trajectory.length - 1];

    const dx = end.x - start.x;
    const dy = end.y - start.y;

    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  /**
   * Calculate path consistency (0-1, higher is more consistent)
   */
  private calculatePathConsistency(trajectory: TrajectoryPoint[]): number {
    if (trajectory.length < 3) return 1;

    const velocities = this.calculateVelocities(trajectory);
    const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length;
    const normalizedVariance = variance / (avgVelocity * avgVelocity);

    return Math.max(0, 1 - normalizedVariance);
  }

  /**
   * Analyze swing path direction
   */
  private analyzePathDirection(
    trajectory: TrajectoryPoint[],
    phases: SwingPhase[]
  ): { insideOut: boolean; outsideIn: boolean; onPlane: boolean } {
    if (trajectory.length < 3) {
      return { insideOut: false, outsideIn: false, onPlane: true };
    }

    const backswingPhase = phases.find(p => p.name === 'Backswing');
    const downswingPhase = phases.find(p => p.name === 'Transition');

    if (!backswingPhase || !downswingPhase) {
      return { insideOut: false, outsideIn: false, onPlane: true };
    }

    // Analyze backswing direction
    const backswingStart = Math.max(0, backswingPhase.startFrame);
    const backswingEnd = Math.min(trajectory.length - 1, backswingPhase.endFrame);
    const backswingDirection = this.calculateDirection(
      trajectory[backswingStart],
      trajectory[backswingEnd]
    );

    // Analyze downswing direction
    const downswingStart = Math.max(0, downswingPhase.startFrame);
    const downswingEnd = Math.min(trajectory.length - 1, downswingPhase.endFrame);
    const downswingDirection = this.calculateDirection(
      trajectory[downswingStart],
      trajectory[downswingEnd]
    );

    // Determine path characteristics
    const insideOut = downswingDirection > backswingDirection;
    const outsideIn = downswingDirection < backswingDirection;
    const onPlane = Math.abs(downswingDirection - backswingDirection) < 10; // Within 10 degrees

    return { insideOut, outsideIn, onPlane };
  }

  /**
   * Calculate direction angle between two points
   */
  private calculateDirection(point1: TrajectoryPoint, point2: TrajectoryPoint): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;

    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  /**
   * Find key moments in the swing
   */
  findKeyMoments(trajectory: TrajectoryPoint[]): {
    takeaway: number;
    top: number;
    impact: number;
    finish: number;
  } {
    if (trajectory.length === 0) {
      return { takeaway: 0, top: 0, impact: 0, finish: 0 };
    }

    const velocities = this.calculateVelocities(trajectory);
    const accelerations = this.calculateAccelerations(trajectory);

    // Find takeaway (first significant movement)
    let takeaway = 0;
    for (let i = 0; i < velocities.length; i++) {
      if (velocities[i] > this.minVelocityThreshold) {
        takeaway = i;
        break;
      }
    }

    // Find top (minimum Y position) in first 70% of swing
    let top = 0;
    let minY = trajectory[0].y;
    const searchEnd = Math.floor(trajectory.length * 0.7);
    
    for (let i = 1; i <= searchEnd; i++) {
      if (trajectory[i].y < minY) {
        minY = trajectory[i].y;
        top = i;
      }
    }

    // Find impact (maximum acceleration) in second half
    let impact = Math.floor(trajectory.length * 0.7);
    let maxAcceleration = 0;
    const impactStart = Math.floor(trajectory.length * 0.5);
    
    for (let i = impactStart; i < accelerations.length; i++) {
      if (accelerations[i] > maxAcceleration) {
        maxAcceleration = accelerations[i];
        impact = i;
      }
    }

    // Ensure proper sequence: takeaway <= top <= impact <= finish
    top = Math.max(takeaway, top);
    impact = Math.max(top, impact);
    
    // Find finish (end of trajectory)
    const finish = trajectory.length - 1;

    return { takeaway, top, impact, finish };
  }

  /**
   * Create visualization data for trajectory plotting
   */
  createVisualizationData(
    trajectory: TrajectoryPoint[],
    phases: SwingPhase[]
  ): TrajectoryVisualization {
    const smoothedPoints = this.smoothTrajectory(trajectory);
    const velocityProfile = this.createVelocityProfile(trajectory);
    const metrics = this.analyzeTrajectory(trajectory);

    return {
      points: trajectory,
      smoothedPoints,
      velocityProfile,
      phases,
      metrics
    };
  }
}
