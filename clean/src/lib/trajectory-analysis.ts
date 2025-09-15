import { TrajectoryPoint, SwingTrajectory } from './mediapipe';
import { SwingPhase } from './swing-phases';

export interface TrajectoryMetrics {
  totalDistance: number;
  maxVelocity: number;
  avgVelocity: number;
  maxAcceleration: number;
  avgAcceleration: number;
  peakFrame: number;
  smoothness: number;
}

export interface SwingPathAnalysis {
  clubheadPath: TrajectoryPoint[];
  swingPlane: number;
  pathConsistency: number;
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

  constructor(smoothingWindow: number = 5) { this.smoothingWindow = smoothingWindow; }

  analyzeTrajectory(trajectory: TrajectoryPoint[]): TrajectoryMetrics {
    if (trajectory.length === 0) {
      return { totalDistance: 0, maxVelocity: 0, avgVelocity: 0, maxAcceleration: 0, avgAcceleration: 0, peakFrame: 0, smoothness: 0 };
    }
    if (trajectory.length < 2) {
      return { totalDistance: 0, maxVelocity: 0, avgVelocity: 0, maxAcceleration: 0, avgAcceleration: 0, peakFrame: 0, smoothness: 1 };
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
    return { totalDistance, maxVelocity, avgVelocity, maxAcceleration, avgAcceleration, peakFrame, smoothness };
  }

  analyzeSwingPath(trajectory: SwingTrajectory, phases: SwingPhase[]): SwingPathAnalysis {
    const clubheadPath = trajectory.clubhead;
    const swingPlane = this.calculateSwingPlane(clubheadPath);
    const pathConsistency = this.calculatePathConsistency(clubheadPath);
    const pathDirection = this.analyzePathDirection(clubheadPath, phases);
    return { clubheadPath, swingPlane, pathConsistency, insideOut: pathDirection.insideOut, outsideIn: pathDirection.outsideIn, onPlane: pathDirection.onPlane };
  }

  createVelocityProfile(trajectory: TrajectoryPoint[]): VelocityProfile {
    const velocities = this.calculateVelocities(trajectory);
    const accelerations = this.calculateAccelerations(trajectory);
    const frames = trajectory.map((_, index) => index);
    const peakVelocityFrame = velocities.length > 0 ? velocities.indexOf(Math.max(...velocities)) : 0;
    const peakAccelerationFrame = accelerations.length > 0 ? accelerations.indexOf(Math.max(...accelerations)) : 0;
    return { frames, velocities, accelerations, peakVelocityFrame, peakAccelerationFrame };
  }

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
      smoothed.push({ x: avgX, y: avgY, z: avgZ, timestamp: avgTimestamp, frame: i });
    }
    return smoothed;
  }

  private calculateVelocities(trajectory: TrajectoryPoint[]): number[] {
    const velocities: number[] = [];
    for (let i = 1; i < trajectory.length; i++) { velocities.push(this.calculateVelocity(trajectory[i - 1], trajectory[i])); }
    return velocities;
  }

  private calculateAccelerations(trajectory: TrajectoryPoint[]): number[] {
    const velocities = this.calculateVelocities(trajectory);
    const accelerations: number[] = [];
    for (let i = 1; i < velocities.length; i++) { accelerations.push(this.calculateAcceleration(trajectory[i - 1], trajectory[i], trajectory[i + 1] || trajectory[i])); }
    return accelerations;
  }

  private calculateVelocity(point1: TrajectoryPoint, point2: TrajectoryPoint): number {
    const dx = point2.x - point1.x; const dy = point2.y - point1.y; const dz = point2.z - point1.z; const dt = point2.timestamp - point1.timestamp; if (dt === 0) return 0; return Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;
  }

  private calculateAcceleration(point1: TrajectoryPoint, point2: TrajectoryPoint, point3: TrajectoryPoint): number {
    const v1 = this.calculateVelocity(point1, point2); const v2 = this.calculateVelocity(point2, point3); const dt = (point3.timestamp - point1.timestamp) / 2; if (dt === 0) return 0; return Math.abs(v2 - v1) / dt;
  }

  private calculateTotalDistance(trajectory: TrajectoryPoint[]): number {
    let totalDistance = 0; for (let i = 1; i < trajectory.length; i++) { totalDistance += this.calculateDistance(trajectory[i - 1], trajectory[i]); } return totalDistance;
  }

  private calculateDistance(point1: TrajectoryPoint, point2: TrajectoryPoint): number { const dx = point2.x - point1.x; const dy = point2.y - point1.y; const dz = point2.z - point1.z; return Math.sqrt(dx * dx + dy * dy + dz * dz); }

  private calculateSmoothness(trajectory: TrajectoryPoint[]): number {
    if (trajectory.length <= 1) return 1; if (trajectory.length < 3) return 1;
    const accelerations = this.calculateAccelerations(trajectory); if (accelerations.length === 0) return 1;
    const avgAcceleration = accelerations.reduce((sum, a) => sum + a, 0) / accelerations.length;
    const maxAcceleration = Math.max(...accelerations); if (maxAcceleration === 0) return 1;
    const variance = accelerations.reduce((sum, a) => sum + Math.pow(a - avgAcceleration, 2), 0) / accelerations.length;
    const normalizedVariance = variance / (maxAcceleration * maxAcceleration);
    return Math.max(0, Math.min(1, 1 - normalizedVariance));
  }

  private calculateSwingPlane(trajectory: TrajectoryPoint[]): number {
    if (trajectory.length < 2) return 0;
    const start = trajectory[0]; const end = trajectory[trajectory.length - 1];
    const dx = end.x - start.x; const dy = end.y - start.y; return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  private calculatePathConsistency(trajectory: TrajectoryPoint[]): number {
    if (trajectory.length < 3) return 1;
    const velocities = this.calculateVelocities(trajectory);
    const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length;
    const normalizedVariance = variance / (avgVelocity * avgVelocity);
    return Math.max(0, 1 - normalizedVariance);
  }

  private analyzePathDirection(trajectory: TrajectoryPoint[], phases: SwingPhase[]): { insideOut: boolean; outsideIn: boolean; onPlane: boolean } {
    if (trajectory.length < 3) { return { insideOut: false, outsideIn: false, onPlane: true }; }
    const backswingPhase = phases.find(p => p.name === 'Backswing');
    const downswingPhase = phases.find(p => p.name === 'Transition');
    if (!backswingPhase || !downswingPhase) { return { insideOut: false, outsideIn: false, onPlane: true }; }
    const backswingStart = Math.max(0, backswingPhase.startFrame);
    const backswingEnd = Math.min(trajectory.length - 1, backswingPhase.endFrame);
    const backswingDirection = this.calculateDirection(trajectory[backswingStart], trajectory[backswingEnd]);
    const downswingStart = Math.max(0, downswingPhase.startFrame);
    const downswingEnd = Math.min(trajectory.length - 1, downswingPhase.endFrame);
    const downswingDirection = this.calculateDirection(trajectory[downswingStart], trajectory[downswingEnd]);
    const insideOut = downswingDirection > backswingDirection;
    const outsideIn = downswingDirection < backswingDirection;
    const onPlane = Math.abs(downswingDirection - backswingDirection) < 10;
    return { insideOut, outsideIn, onPlane };
  }

  private calculateDirection(point1: TrajectoryPoint, point2: TrajectoryPoint): number { const dx = point2.x - point1.x; const dy = point2.y - point1.y; return Math.atan2(dy, dx) * (180 / Math.PI); }

  findKeyMoments(trajectory: TrajectoryPoint[]): { takeaway: number; top: number; impact: number; finish: number; } {
    if (trajectory.length === 0) { return { takeaway: 0, top: 0, impact: 0, finish: 0 }; }
    const velocities = this.calculateVelocities(trajectory);
    const accelerations = this.calculateAccelerations(trajectory);
    let takeaway = 0; for (let i = 0; i < velocities.length; i++) { if (velocities[i] > this.minVelocityThreshold) { takeaway = i; break; } }
    let top = 0; let minY = trajectory[0].y; const searchEnd = Math.floor(trajectory.length * 0.7);
    for (let i = 1; i <= searchEnd; i++) { if (trajectory[i].y < minY) { minY = trajectory[i].y; top = i; } }
    let impact = Math.floor(trajectory.length * 0.7); let maxAcceleration = 0; const impactStart = Math.floor(trajectory.length * 0.5);
    for (let i = impactStart; i < accelerations.length; i++) { if (accelerations[i] > maxAcceleration) { maxAcceleration = accelerations[i]; impact = i; } }
    top = Math.max(takeaway, top); impact = Math.max(top, impact);
    const finish = trajectory.length - 1; return { takeaway, top, impact, finish };
  }
}


