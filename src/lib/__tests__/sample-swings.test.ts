import { extractPosesFromVideo } from '../video-poses';
import { calculateSwingMetrics as _calculateSwingMetrics } from '../golf-metrics';
import { analyzeSwing } from '../unified-analysis';
import { BENCHMARKS } from '../golf-metrics';

describe('Sample Swing Analysis', () => {
  // Helper function to load video file
  async function loadVideoFile(filename: string): Promise<File> {
    const response = await fetch(`/fixtures/swings/${filename}`);
    const blob = await response.blob();
    return new File([blob], filename, { type: 'video/mp4' });
  }

  // Test each sample video
  const sampleVideos = [
    { 
      file: 'tiger-woods-swing.mp4',
      expectedMetrics: {
        tempo: {
          tempoRatio: { min: 2.8, max: 3.2 }, // Classic Tiger tempo
          backswingTime: { min: 0.7, max: 0.9 }
        },
        rotation: {
          shoulderTurn: { min: 85, max: 95 }, // Full shoulder turn
          hipTurn: { min: 45, max: 55 }
        }
      }
    },
    {
      file: 'ludvig_aberg_driver.mp4',
      expectedMetrics: {
        tempo: {
          tempoRatio: { min: 2.7, max: 3.3 },
          backswingTime: { min: 0.7, max: 1.0 }
        },
        rotation: {
          shoulderTurn: { min: 80, max: 100 }, // Modern full turn
          hipTurn: { min: 40, max: 60 }
        }
      }
    },
    {
      file: 'max_homa_iron.mp4',
      expectedMetrics: {
        tempo: {
          tempoRatio: { min: 2.5, max: 3.0 }, // Shorter iron tempo
          backswingTime: { min: 0.6, max: 0.8 }
        },
        rotation: {
          shoulderTurn: { min: 75, max: 90 }, // Iron swing turn
          hipTurn: { min: 35, max: 50 }
        }
      }
    }
  ];

  test.each(sampleVideos)('analyzes $file correctly', async ({ file, expectedMetrics }) => {
    // Load video file
    const videoFile = await loadVideoFile(file);
    expect(videoFile).toBeTruthy();
    expect(videoFile.size).toBeGreaterThan(0);

    // Extract poses
    const poses = await extractPosesFromVideo(videoFile, { 
      sampleFps: 30,
      maxFrames: 600,
      minConfidence: 0.7
    });

    // Verify pose extraction
    expect(poses).toBeTruthy();
    expect(poses.length).toBeGreaterThan(10);
    expect(poses[0].landmarks).toHaveLength(33); // MediaPipe provides 33 landmarks

    // Analyze swing
    const result = await analyzeSwing({
      poses,
      club: file.includes('driver') ? 'driver' : 'iron',
      swingId: 'test',
      source: 'upload'
    });

    // Verify metrics are within expected ranges
    const { metrics } = result;
    
    // Tempo checks
    expect(metrics.tempo.tempoRatio).toBeGreaterThanOrEqual(expectedMetrics.tempo.tempoRatio.min);
    expect(metrics.tempo.tempoRatio).toBeLessThanOrEqual(expectedMetrics.tempo.tempoRatio.max);
    expect(metrics.tempo.backswingTime).toBeGreaterThanOrEqual(expectedMetrics.tempo.backswingTime.min);
    expect(metrics.tempo.backswingTime).toBeLessThanOrEqual(expectedMetrics.tempo.backswingTime.max);

    // Rotation checks
    expect(metrics.rotation.shoulderTurn).toBeGreaterThanOrEqual(expectedMetrics.rotation.shoulderTurn.min);
    expect(metrics.rotation.shoulderTurn).toBeLessThanOrEqual(expectedMetrics.rotation.shoulderTurn.max);
    expect(metrics.rotation.hipTurn).toBeGreaterThanOrEqual(expectedMetrics.rotation.hipTurn.min);
    expect(metrics.rotation.hipTurn).toBeLessThanOrEqual(expectedMetrics.rotation.hipTurn.max);

    // Score checks
    expect(metrics.overallScore).toBeGreaterThan(70); // Pro swings should score well
    expect(['A', 'B']).toContain(metrics.letterGrade); // Pro swings should get A or B

    // Compare to PGA Tour benchmarks
    const { professional } = BENCHMARKS;
    
    // Tempo should be close to ideal
    const tempoDeviation = Math.abs(metrics.tempo.tempoRatio - professional.tempo.tempoRatio.ideal);
    expect(tempoDeviation).toBeLessThan(0.5);

    // Rotation should be close to ideal
    const shoulderDeviation = Math.abs(metrics.rotation.shoulderTurn - professional.rotation.shoulderTurn.ideal);
    expect(shoulderDeviation).toBeLessThan(15);

    // Weight transfer should be good
    expect(metrics.weightTransfer.impact).toBeGreaterThan(professional.weightTransfer.impact.min);

    // Swing plane should be consistent
    expect(metrics.swingPlane.planeDeviation).toBeLessThan(professional.swingPlane.planeDeviation.max);

    // Body alignment should be good
    expect(metrics.bodyAlignment.score).toBeGreaterThan(70);
  });
});
