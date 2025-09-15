import { describe, it, expect, beforeEach } from 'vitest';
import { SwingPhaseDetector } from '../lib/swing-phases';
import { PoseLandmark, TrajectoryPoint, SwingTrajectory } from '../lib/mediapipe';

// Mock data for testing
const createMockLandmarks = (count: number): PoseLandmark[][] => {
  const landmarks: PoseLandmark[][] = [];
  
  for (let i = 0; i < count; i++) {
    const frame: PoseLandmark[] = [];
    
    // Create mock landmarks for key body parts
    for (let j = 0; j < 33; j++) {
      frame.push({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        visibility: 0.9
      });
    }
    
    landmarks.push(frame);
  }
  
  return landmarks;
};

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

    rightWrist.push({
      x: 0.3 + 0.4 * Math.sin((i / count) * Math.PI),
      y: 0.7 - 0.6 * (i / count),
      z: 0.1 * Math.sin((i / count) * Math.PI * 2),
      timestamp,
      frame
    });

    leftWrist.push({
      x: 0.2 + 0.4 * Math.sin((i / count) * Math.PI),
      y: 0.7 - 0.6 * (i / count),
      z: 0.1 * Math.sin((i / count) * Math.PI * 2),
      timestamp,
      frame
    });

    rightShoulder.push({
      x: 0.4,
      y: 0.3,
      z: 0.0,
      timestamp,
      frame
    });

    leftShoulder.push({
      x: 0.6,
      y: 0.3,
      z: 0.0,
      timestamp,
      frame
    });

    rightHip.push({
      x: 0.45,
      y: 0.6,
      z: 0.0,
      timestamp,
      frame
    });

    leftHip.push({
      x: 0.55,
      y: 0.6,
      z: 0.0,
      timestamp,
      frame
    });

    clubhead.push({
      x: 0.3 + 0.4 * Math.sin((i / count) * Math.PI) + 0.1,
      y: 0.7 - 0.6 * (i / count) - 0.05,
      z: 0.1 * Math.sin((i / count) * Math.PI * 2),
      timestamp,
      frame
    });
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

describe('SwingPhaseDetector', () => {
  let detector: SwingPhaseDetector;
  let landmarks: PoseLandmark[][];
  let trajectory: SwingTrajectory;
  let timestamps: number[];

  beforeEach(() => {
    detector = new SwingPhaseDetector();
    landmarks = createMockLandmarks(60);
    trajectory = createMockTrajectory(60);
    timestamps = landmarks.map((_, i) => i * 33.33);
  });

  describe('detectPhases', () => {
    it('should detect all 5 swing phases', () => {
      const result = detector.detectPhases(landmarks, trajectory, timestamps);
      
      expect(result.phases).toHaveLength(5);
      expect(result.phases.map(p => p.name)).toEqual([
        'Setup',
        'Backswing',
        'Transition',
        'Impact',
        'Follow-through'
      ]);
    });

    it('should have valid phase boundaries', () => {
      const result = detector.detectPhases(landmarks, trajectory, timestamps);
      
      result.phases.forEach((phase, index) => {
        expect(phase.startFrame).toBeGreaterThanOrEqual(0);
        expect(phase.endFrame).toBeLessThan(landmarks.length);
        expect(phase.startFrame).toBeLessThanOrEqual(phase.endFrame);
        
        if (index > 0) {
          expect(phase.startFrame).toBeGreaterThanOrEqual(result.phases[index - 1].endFrame);
        }
      });
    });

    it('should calculate tempo ratio correctly', () => {
      const result = detector.detectPhases(landmarks, trajectory, timestamps);
      
      expect(result.tempoRatio).toBeGreaterThan(0);
      expect(result.tempoRatio).toBeLessThan(10); // Reasonable range
    });

    it('should calculate swing plane angle', () => {
      const result = detector.detectPhases(landmarks, trajectory, timestamps);
      
      expect(typeof result.swingPlane).toBe('number');
      expect(result.swingPlane).toBeGreaterThanOrEqual(-180);
      expect(result.swingPlane).toBeLessThanOrEqual(180);
    });

    it('should calculate weight transfer', () => {
      const result = detector.detectPhases(landmarks, trajectory, timestamps);
      
      expect(result.weightTransfer).toBeGreaterThanOrEqual(0);
      expect(result.weightTransfer).toBeLessThanOrEqual(1);
    });

    it('should calculate rotation metrics', () => {
      const result = detector.detectPhases(landmarks, trajectory, timestamps);
      
      expect(result.rotation.shoulder).toBeGreaterThanOrEqual(0);
      expect(result.rotation.hip).toBeGreaterThanOrEqual(0);
      expect(result.rotation.shoulder).toBeLessThanOrEqual(180);
      expect(result.rotation.hip).toBeLessThanOrEqual(180);
    });
  });

  describe('getPhaseAtFrame', () => {
    it('should return correct phase for given frame', () => {
      const result = detector.detectPhases(landmarks, trajectory, timestamps);
      const phases = result.phases;
      
      // Test first frame (should be Setup)
      const setupPhase = detector.getPhaseAtFrame(phases, 0);
      expect(setupPhase?.name).toBe('Setup');
      
      // Test middle frame (should be Backswing or Transition)
      const middleFrame = Math.floor(landmarks.length / 2);
      const middlePhase = detector.getPhaseAtFrame(phases, middleFrame);
      expect(middlePhase).toBeTruthy();
      expect(['Backswing', 'Transition']).toContain(middlePhase?.name);
      
      // Test last frame (should be Follow-through)
      const lastFrame = landmarks.length - 1;
      const lastPhase = detector.getPhaseAtFrame(phases, lastFrame);
      expect(lastPhase?.name).toBe('Follow-through');
    });

    it('should return null for frame outside range', () => {
      const result = detector.detectPhases(landmarks, trajectory, timestamps);
      const phases = result.phases;
      
      const invalidPhase = detector.getPhaseAtFrame(phases, -1);
      expect(invalidPhase).toBeNull();
      
      const invalidPhase2 = detector.getPhaseAtFrame(phases, landmarks.length);
      expect(invalidPhase2).toBeNull();
    });
  });

  describe('getPhaseProgress', () => {
    it('should return 0 for start of phase', () => {
      const result = detector.detectPhases(landmarks, trajectory, timestamps);
      const phases = result.phases;
      
      phases.forEach(phase => {
        const progress = detector.getPhaseProgress(phase, phase.startFrame);
        expect(progress).toBe(0);
      });
    });

    it('should return 1 for end of phase', () => {
      const result = detector.detectPhases(landmarks, trajectory, timestamps);
      const phases = result.phases;
      
      phases.forEach(phase => {
        const progress = detector.getPhaseProgress(phase, phase.endFrame);
        expect(progress).toBe(1);
      });
    });

    it('should return correct progress for middle of phase', () => {
      const result = detector.detectPhases(landmarks, trajectory, timestamps);
      const phases = result.phases;
      
      phases.forEach(phase => {
        const middleFrame = Math.floor((phase.startFrame + phase.endFrame) / 2);
        const progress = detector.getPhaseProgress(phase, middleFrame);
        expect(progress).toBeGreaterThan(0);
        expect(progress).toBeLessThan(1);
        expect(progress).toBeCloseTo(0.5, 0); // More lenient tolerance
      });
    });
  });

  describe('smoothPhaseBoundaries', () => {
    it('should smooth phase boundaries without overlapping', () => {
      const result = detector.detectPhases(landmarks, trajectory, timestamps);
      const smoothed = detector.smoothPhaseBoundaries(result.phases);
      
      smoothed.forEach((phase, index) => {
        expect(phase.startFrame).toBeGreaterThanOrEqual(0);
        expect(phase.endFrame).toBeLessThan(landmarks.length);
        expect(phase.startFrame).toBeLessThanOrEqual(phase.endFrame);
        
        if (index > 0) {
          expect(phase.startFrame).toBeGreaterThan(smoothed[index - 1].endFrame);
        }
      });
    });
  });
});
