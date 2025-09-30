import { calculateSwingMetrics } from '../golf-metrics';
import { PoseResult } from '../mediapipe';
import { SwingPhase } from '../swing-phases';
import { SwingTrajectory } from '../mediapipe';

// Sample pose data for testing
const samplePoses: PoseResult[] = [
  {
    landmarks: Array(33).fill(null).map((_, i) => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 1,
      name: `landmark_${i}`
    })),
    timestamp: 0
  }
];

// Sample phases for testing
const samplePhases: SwingPhase[] = [
  {
    name: 'address',
    startFrame: 0,
    endFrame: 10,
    duration: 0.5,
    confidence: 0.9,

    worldLandmarks: landmarks.map(lm => ({ ...lm, z: 0,

    worldLandmarks: landmarks.map(lm => ({ ...lm, z: 0 })) }))
  },
  {
    name: 'backswing',
    startFrame: 11,
    endFrame: 30,
    duration: 0.8,
    confidence: 0.9
  },
  {
    name: 'downswing',
    startFrame: 31,
    endFrame: 40,
    duration: 0.25,
    confidence: 0.9
  },
  {
    name: 'impact',
    startFrame: 41,
    endFrame: 45,
    duration: 0.1,
    confidence: 0.9
  },
  {
    name: 'followThrough',
    startFrame: 46,
    endFrame: 60,
    duration: 0.5,
    confidence: 0.9
  }
];

// Sample trajectory for testing
const sampleTrajectory: SwingTrajectory = {
  rightWrist: Array(60).fill(null).map((_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    frame: i,
    timestamp: i * 16.67 // 60fps
  })),
  leftWrist: Array(60).fill(null).map((_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    frame: i,
    timestamp: i * 16.67
  })),
  rightShoulder: Array(60).fill(null).map((_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    frame: i,
    timestamp: i * 16.67
  })),
  leftShoulder: Array(60).fill(null).map((_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    frame: i,
    timestamp: i * 16.67
  })),
  rightHip: Array(60).fill(null).map((_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    frame: i,
    timestamp: i * 16.67
  })),
  leftHip: Array(60).fill(null).map((_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    frame: i,
    timestamp: i * 16.67
  })),
  clubhead: Array(60).fill(null).map((_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    frame: i,
    timestamp: i * 16.67
  }))
};

describe('Golf Metrics', () => {
  it('calculates swing metrics correctly', () => {
    const metrics = calculateSwingMetrics(samplePoses, samplePhases, sampleTrajectory);

    // Check that all required metrics are present
    expect(metrics).toHaveProperty('tempo');
    expect(metrics).toHaveProperty('rotation');
    expect(metrics).toHaveProperty('weightTransfer');
    expect(metrics).toHaveProperty('swingPlane');
    expect(metrics).toHaveProperty('bodyAlignment');
    expect(metrics).toHaveProperty('overallScore');
    expect(metrics).toHaveProperty('letterGrade');

    // Check tempo metrics
    expect(metrics.tempo.backswingTime).toBe(0.8);
    expect(metrics.tempo.downswingTime).toBe(0.25);
    expect(metrics.tempo.tempoRatio).toBe(3.2);
    expect(metrics.tempo.score).toBeGreaterThan(0);
    expect(metrics.tempo.score).toBeLessThanOrEqual(100);

    // Check overall score and grade
    expect(metrics.overallScore).toBeGreaterThan(0);
    expect(metrics.overallScore).toBeLessThanOrEqual(100);
    expect(['A', 'B', 'C', 'D', 'F']).toContain(metrics.letterGrade);
  });
});
