import { describe, it, expect } from 'vitest';
import { defaultMetricsConfig } from '../lib/metrics.config';

// Mock pose landmarks for testing
const createMockLandmarks = (x: number, y: number, z: number = 0): any => ({
  x,
  y,
  z,
  visibility: 1.0
});

describe('Metrics Configuration', () => {
  it('should have valid default metrics config', () => {
    expect(defaultMetricsConfig).toBeDefined();
    expect(defaultMetricsConfig.swingPlane).toBeDefined();
    expect(defaultMetricsConfig.tempo).toBeDefined();
    expect(defaultMetricsConfig.rotation).toBeDefined();
    expect(defaultMetricsConfig.impact).toBeDefined();
  });

  it('should have valid swing plane thresholds', () => {
    expect(typeof defaultMetricsConfig.swingPlane.steepThreshold).toBe('number');
    expect(typeof defaultMetricsConfig.swingPlane.flatThreshold).toBe('number');
    expect(defaultMetricsConfig.swingPlane.steepThreshold).toBeGreaterThan(defaultMetricsConfig.swingPlane.flatThreshold);
  });

  it('should have valid tempo thresholds', () => {
    expect(typeof defaultMetricsConfig.tempo.fastThreshold).toBe('number');
    expect(typeof defaultMetricsConfig.tempo.slowThreshold).toBe('number');
    expect(defaultMetricsConfig.tempo.slowThreshold).toBeGreaterThan(defaultMetricsConfig.tempo.fastThreshold);
  });

  it('should have valid rotation thresholds', () => {
    expect(typeof defaultMetricsConfig.rotation.shoulderMinRotation).toBe('number');
    expect(typeof defaultMetricsConfig.rotation.hipMinRotation).toBe('number');
    expect(defaultMetricsConfig.rotation.shoulderMinRotation).toBeGreaterThan(0);
    expect(defaultMetricsConfig.rotation.hipMinRotation).toBeGreaterThan(0);
  });

  it('should have valid impact thresholds', () => {
    expect(typeof defaultMetricsConfig.impact.accelerationThreshold).toBe('number');
    expect(typeof defaultMetricsConfig.impact.minDistanceToBall).toBe('number');
    expect(defaultMetricsConfig.impact.accelerationThreshold).toBeGreaterThan(0);
    expect(defaultMetricsConfig.impact.minDistanceToBall).toBeGreaterThan(0);
  });
});
