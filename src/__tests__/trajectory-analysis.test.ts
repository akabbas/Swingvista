import { describe, it, expect, beforeEach } from 'vitest';
import { TrajectoryAnalyzer } from '../lib/trajectory-analysis';
import { TrajectoryPoint, SwingTrajectory } from '../lib/mediapipe';
import { SwingPhase } from '../lib/swing-phases';

// Mock data for testing
const createMockTrajectory = (count: number): SwingTrajectory => {
  const rightWrist: TrajectoryPoint[] = [];
  const leftWrist: TrajectoryPoint[] = [];
  const rightShoulder: TrajectoryPoint[] = [];
  const leftShoulder: TrajectoryPoint[] = [];
  const rightHip: TrajectoryPoint[] = [];
  const leftHip: TrajectoryPoint[] = [];
  const clubhead: TrajectoryPoint[] = [];

  for (let i = 0; i < count; i++) {
    const timestamp = i * 33.33;
    const frame = i;

    // Create a realistic swing trajectory
    const t = i / (count - 1);
    const x = 0.3 + 0.4 * Math.sin(t * Math.PI);
    const y = 0.7 - 0.6 * t + 0.1 * Math.sin(t * Math.PI * 3);
    const z = 0.1 * Math.sin(t * Math.PI * 2);

    rightWrist.push({ x, y, z, timestamp, frame });
    leftWrist.push({ x: x - 0.1, y: y + 0.05, z, timestamp, frame });
    rightShoulder.push({ x: 0.4, y: 0.3, z: 0.0, timestamp, frame });
    leftShoulder.push({ x: 0.6, y: 0.3, z: 0.0, timestamp, frame });
    rightHip.push({ x: 0.45, y: 0.6, z: 0.0, timestamp, frame });
    leftHip.push({ x: 0.55, y: 0.6, z: 0.0, timestamp, frame });
    clubhead.push({ x: x + 0.1, y: y - 0.05, z, timestamp, frame });
  }

  return {
    rightWrist,
    leftWrist,
    rightShoulder,
    leftShoulder,
    rightHip,
    leftHip,
    clubhead
  };
};

const createMockPhases = (): SwingPhase[] => [
  {
    name: 'Setup',
    startFrame: 0,
    endFrame: 5,
    startTime: 0,
    endTime: 166.65,
    duration: 166.65,
    keyLandmarks: [],
    color: '#3B82F6',
    description: 'Initial position'
  },
  {
    name: 'Backswing',
    startFrame: 5,
    endFrame: 35,
    startTime: 166.65,
    endTime: 1166.55,
    duration: 999.9,
    keyLandmarks: [],
    color: '#10B981',
    description: 'Takeaway to top'
  },
  {
    name: 'Transition',
    startFrame: 35,
    endFrame: 45,
    startTime: 1166.55,
    endTime: 1499.85,
    duration: 333.3,
    keyLandmarks: [],
    color: '#F59E0B',
    description: 'Downswing to impact'
  },
  {
    name: 'Impact',
    startFrame: 45,
    endFrame: 47,
    startTime: 1499.85,
    endTime: 1566.51,
    duration: 66.66,
    keyLandmarks: [],
    color: '#EF4444',
    description: 'Ball contact'
  },
  {
    name: 'Follow-through',
    startFrame: 47,
    endFrame: 59,
    startTime: 1566.51,
    endTime: 1966.47,
    duration: 399.96,
    keyLandmarks: [],
    color: '#8B5CF6',
    description: 'Finish position'
  }
];

describe('TrajectoryAnalyzer', () => {
  let analyzer: TrajectoryAnalyzer;
  let trajectory: SwingTrajectory;
  let phases: SwingPhase[];

  beforeEach(() => {
    analyzer = new TrajectoryAnalyzer();
    trajectory = createMockTrajectory(60);
    phases = createMockPhases();
  });

  describe('analyzeTrajectory', () => {
    it('should analyze trajectory metrics correctly', () => {
      const metrics = analyzer.analyzeTrajectory(trajectory.rightWrist);

      expect(metrics.totalDistance).toBeGreaterThan(0);
      expect(metrics.maxVelocity).toBeGreaterThan(0);
      expect(metrics.avgVelocity).toBeGreaterThan(0);
      expect(metrics.maxAcceleration).toBeGreaterThan(0);
      expect(metrics.avgAcceleration).toBeGreaterThan(0);
      expect(metrics.peakFrame).toBeGreaterThanOrEqual(0);
      expect(metrics.peakFrame).toBeLessThan(trajectory.rightWrist.length);
      expect(metrics.smoothness).toBeGreaterThanOrEqual(0);
      expect(metrics.smoothness).toBeLessThanOrEqual(1);
    });

    it('should handle empty trajectory', () => {
      const emptyTrajectory: TrajectoryPoint[] = [];
      const metrics = analyzer.analyzeTrajectory(emptyTrajectory);

      expect(metrics.totalDistance).toBe(0);
      expect(metrics.maxVelocity).toBe(0);
      expect(metrics.avgVelocity).toBe(0);
      expect(metrics.maxAcceleration).toBe(0);
      expect(metrics.avgAcceleration).toBe(0);
      expect(metrics.peakFrame).toBe(0);
      expect(metrics.smoothness).toBe(0);
    });

    it('should handle single point trajectory', () => {
      const singlePoint = [trajectory.rightWrist[0]];
      const metrics = analyzer.analyzeTrajectory(singlePoint);

      expect(metrics.totalDistance).toBe(0);
      expect(metrics.maxVelocity).toBe(0);
      expect(metrics.avgVelocity).toBe(0);
      expect(metrics.maxAcceleration).toBe(0);
      expect(metrics.avgAcceleration).toBe(0);
      expect(metrics.peakFrame).toBe(0);
      expect(metrics.smoothness).toBe(1); // Single point is perfectly smooth
    });
  });

  describe('analyzeSwingPath', () => {
    it('should analyze swing path characteristics', () => {
      const pathAnalysis = analyzer.analyzeSwingPath(trajectory, phases);

      expect(pathAnalysis.clubheadPath).toHaveLength(trajectory.clubhead.length);
      expect(typeof pathAnalysis.swingPlane).toBe('number');
      expect(pathAnalysis.swingPlane).toBeGreaterThanOrEqual(-180);
      expect(pathAnalysis.swingPlane).toBeLessThanOrEqual(180);
      expect(pathAnalysis.pathConsistency).toBeGreaterThanOrEqual(0);
      expect(pathAnalysis.pathConsistency).toBeLessThanOrEqual(1);
      expect(typeof pathAnalysis.insideOut).toBe('boolean');
      expect(typeof pathAnalysis.outsideIn).toBe('boolean');
      expect(typeof pathAnalysis.onPlane).toBe('boolean');
    });
  });

  describe('createVelocityProfile', () => {
    it('should create velocity profile with correct structure', () => {
      const profile = analyzer.createVelocityProfile(trajectory.rightWrist);

      expect(profile.frames).toHaveLength(trajectory.rightWrist.length);
      expect(profile.velocities).toHaveLength(trajectory.rightWrist.length - 1);
      expect(profile.accelerations).toHaveLength(trajectory.rightWrist.length - 2);
      expect(profile.peakVelocityFrame).toBeGreaterThanOrEqual(0);
      expect(profile.peakVelocityFrame).toBeLessThan(trajectory.rightWrist.length);
      expect(profile.peakAccelerationFrame).toBeGreaterThanOrEqual(0);
      expect(profile.peakAccelerationFrame).toBeLessThan(trajectory.rightWrist.length);
    });

    it('should handle empty trajectory for velocity profile', () => {
      const emptyTrajectory: TrajectoryPoint[] = [];
      const profile = analyzer.createVelocityProfile(emptyTrajectory);

      expect(profile.frames).toHaveLength(0);
      expect(profile.velocities).toHaveLength(0);
      expect(profile.accelerations).toHaveLength(0);
      expect(profile.peakVelocityFrame).toBe(0);
      expect(profile.peakAccelerationFrame).toBe(0);
    });
  });

  describe('smoothTrajectory', () => {
    it('should smooth trajectory without changing length', () => {
      const smoothed = analyzer.smoothTrajectory(trajectory.rightWrist);

      expect(smoothed).toHaveLength(trajectory.rightWrist.length);
      expect(smoothed[0].frame).toBe(0);
      expect(smoothed[smoothed.length - 1].frame).toBe(trajectory.rightWrist.length - 1);
    });

    it('should handle trajectory shorter than smoothing window', () => {
      const shortTrajectory = trajectory.rightWrist.slice(0, 3);
      const smoothed = analyzer.smoothTrajectory(shortTrajectory);

      expect(smoothed).toHaveLength(shortTrajectory.length);
    });
  });

  describe('findKeyMoments', () => {
    it('should find key moments in swing', () => {
      const keyMoments = analyzer.findKeyMoments(trajectory.rightWrist);

      expect(keyMoments.takeaway).toBeGreaterThanOrEqual(0);
      expect(keyMoments.top).toBeGreaterThanOrEqual(0);
      expect(keyMoments.impact).toBeGreaterThanOrEqual(0);
      expect(keyMoments.finish).toBeGreaterThanOrEqual(0);
      
      expect(keyMoments.takeaway).toBeLessThanOrEqual(keyMoments.top);
      expect(keyMoments.top).toBeLessThanOrEqual(keyMoments.impact);
      expect(keyMoments.impact).toBeLessThanOrEqual(keyMoments.finish);
      expect(keyMoments.finish).toBe(trajectory.rightWrist.length - 1);
    });
  });

  describe('createVisualizationData', () => {
    it('should create visualization data with all required fields', () => {
      const visualization = analyzer.createVisualizationData(trajectory.rightWrist, phases);

      expect(visualization.points).toHaveLength(trajectory.rightWrist.length);
      expect(visualization.smoothedPoints).toHaveLength(trajectory.rightWrist.length);
      expect(visualization.velocityProfile).toBeDefined();
      expect(visualization.phases).toHaveLength(phases.length);
      expect(visualization.metrics).toBeDefined();
    });
  });
});
