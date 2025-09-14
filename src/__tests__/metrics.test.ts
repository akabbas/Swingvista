import { describe, it, expect } from 'vitest';
import { analyzeSwing, SwingAnalysisData } from '../workers/analysis.worker';
import { defaultMetricsConfig } from '../lib/metrics.config';

// Mock pose landmarks for testing
const createMockLandmarks = (x: number, y: number, z: number = 0): any => ({
  x,
  y,
  z,
  visibility: 1.0
});

const createMockSwingData = (landmarks: any[][]): SwingAnalysisData => ({
  landmarks,
  timestamps: landmarks.map((_, i) => i * 33), // 30fps
  club: 'driver',
  swingId: 'test-swing'
});

describe('Swing Analysis', () => {
  it('should analyze a basic swing with valid landmarks', () => {
    // Create a simple swing with 10 frames
    const landmarks = Array.from({ length: 10 }, (_, frame) => {
      const angle = (frame / 10) * Math.PI; // 0 to π
      return Array.from({ length: 33 }, (_, i) => 
        createMockLandmarks(
          Math.cos(angle) * 0.5 + 0.5, // x: 0 to 1
          Math.sin(angle) * 0.5 + 0.5, // y: 0 to 1
          0
        )
      );
    });

    const swingData = createMockSwingData(landmarks);
    const result = analyzeSwing(swingData);

    expect(result).toBeDefined();
    expect(result.swingId).toBe('test-swing');
    expect(result.club).toBe('driver');
    expect(result.metrics).toBeDefined();
    expect(result.feedback).toBeDefined();
    expect(result.timestamps).toBeDefined();
  });

  it('should throw error for insufficient landmarks', () => {
    const swingData = createMockSwingData([]);
    
    expect(() => analyzeSwing(swingData)).toThrow('Insufficient landmarks for analysis');
  });

  it('should calculate swing plane angle', () => {
    // Create landmarks with a steep swing plane
    const landmarks = Array.from({ length: 10 }, () => {
      const leftShoulder = createMockLandmarks(0.3, 0.2);
      const rightShoulder = createMockLandmarks(0.7, 0.2);
      const leftHip = createMockLandmarks(0.2, 0.8);
      const rightHip = createMockLandmarks(0.8, 0.8);
      
      const frame = Array.from({ length: 33 }, () => createMockLandmarks(0.5, 0.5));
      frame[11] = leftShoulder;
      frame[12] = rightShoulder;
      frame[23] = leftHip;
      frame[24] = rightHip;
      
      return frame;
    });

    const swingData = createMockSwingData(landmarks);
    const result = analyzeSwing(swingData);

    expect(result.metrics.swingPlaneAngle).toBeDefined();
    expect(typeof result.metrics.swingPlaneAngle).toBe('number');
  });

  it('should calculate tempo ratio', () => {
    const landmarks = Array.from({ length: 20 }, () => 
      Array.from({ length: 33 }, () => createMockLandmarks(0.5, 0.5))
    );

    const swingData = createMockSwingData(landmarks);
    const result = analyzeSwing(swingData);

    expect(result.metrics.tempoRatio).toBeDefined();
    expect(typeof result.metrics.tempoRatio).toBe('number');
    expect(result.metrics.tempoRatio).toBeGreaterThanOrEqual(0);
  });

  it('should detect impact frame', () => {
    const landmarks = Array.from({ length: 15 }, () => 
      Array.from({ length: 33 }, () => createMockLandmarks(0.5, 0.5))
    );

    const swingData = createMockSwingData(landmarks);
    const result = analyzeSwing(swingData);

    expect(result.metrics.impactFrame).toBeDefined();
    expect(typeof result.metrics.impactFrame).toBe('number');
    expect(result.metrics.impactFrame).toBeGreaterThanOrEqual(0);
    expect(result.metrics.impactFrame).toBeLessThan(landmarks.length);
  });

  it('should generate appropriate feedback', () => {
    const landmarks = Array.from({ length: 10 }, () => 
      Array.from({ length: 33 }, () => createMockLandmarks(0.5, 0.5))
    );

    const swingData = createMockSwingData(landmarks);
    const result = analyzeSwing(swingData);

    expect(result.feedback).toBeDefined();
    expect(Array.isArray(result.feedback)).toBe(true);
    expect(result.feedback.length).toBeGreaterThan(0);
    expect(result.feedback.every(f => typeof f === 'string')).toBe(true);
  });

  it('should calculate timing metrics', () => {
    const landmarks = Array.from({ length: 12 }, () => 
      Array.from({ length: 33 }, () => createMockLandmarks(0.5, 0.5))
    );

    const swingData = createMockSwingData(landmarks);
    const result = analyzeSwing(swingData);

    expect(result.metrics.backswingTime).toBeDefined();
    expect(result.metrics.downswingTime).toBeDefined();
    expect(typeof result.metrics.backswingTime).toBe('number');
    expect(typeof result.metrics.downswingTime).toBe('number');
    expect(result.metrics.backswingTime).toBeGreaterThan(0);
    expect(result.metrics.downswingTime).toBeGreaterThan(0);
  });

  it('should handle different club types', () => {
    const landmarks = Array.from({ length: 10 }, () => 
      Array.from({ length: 33 }, () => createMockLandmarks(0.5, 0.5))
    );

    const swingData = createMockSwingData(landmarks);
    swingData.club = 'putter';
    
    const result = analyzeSwing(swingData);

    expect(result.club).toBe('putter');
  });

  it('should use custom metrics config', () => {
    const customConfig = {
      ...defaultMetricsConfig,
      swingPlane: {
        steepThreshold: 20,
        flatThreshold: -10
      }
    };

    const landmarks = Array.from({ length: 10 }, () => 
      Array.from({ length: 33 }, () => createMockLandmarks(0.5, 0.5))
    );

    const swingData = createMockSwingData(landmarks);
    const result = analyzeSwing(swingData, customConfig);

    expect(result).toBeDefined();
    // The feedback should be generated based on the custom config
    expect(result.feedback).toBeDefined();
  });
});
