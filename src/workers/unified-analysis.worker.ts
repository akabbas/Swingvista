import { analyzeSwing, AnalysisInput } from '../lib/unified-analysis';

export type WorkerMessage = 
  | { 
      type: 'ANALYZE_SWING'; 
      data: AnalysisInput;
      transferable?: boolean;
    };

export type WorkerResponse = 
  | { 
      type: 'PROGRESS'; 
      data: { 
        step: string; 
        progress: number; 
        batchSize?: number; 
      };
      transferable?: boolean;
    }
  | { 
      type: 'SWING_ANALYZED'; 
      data: any; // This will be the analysis result
      transferable?: boolean;
    }
  | { 
      type: 'ERROR'; 
      data: { 
        error: string; 
      };
      transferable?: boolean;
    };

// Progress batching to reduce message passing overhead
let progressBatch: Array<{ step: string; progress: number; timestamp: number }> = [];
let progressTimeout: ReturnType<typeof setTimeout> | null = null;
const PROGRESS_BATCH_DELAY = 100; // ms

const flushProgressBatch = () => {
  if (progressBatch.length === 0) return;
  
  const latest = progressBatch[progressBatch.length - 1];
  (self as unknown as Worker).postMessage({ 
    type: 'PROGRESS', 
    data: { 
      step: latest.step, 
      progress: latest.progress,
      batchSize: progressBatch.length 
    } 
  } as WorkerResponse);
  
  progressBatch = [];
  progressTimeout = null;
};

const batchedProgress = (step: string, progress: number) => {
  progressBatch.push({ step, progress, timestamp: Date.now() });
  
  if (progressTimeout) {
    clearTimeout(progressTimeout);
  }
  
  progressTimeout = setTimeout(flushProgressBatch, PROGRESS_BATCH_DELAY);
};

// Binary data compression for pose data
const compressPoseData = (poses: any[]) => {
  const compressed = poses.map(pose => ({
    landmarks: pose.landmarks?.map((lm: any) => ({
      x: Math.round(lm.x * 1000) / 1000, // 3 decimal precision
      y: Math.round(lm.y * 1000) / 1000,
      z: Math.round(lm.z * 1000) / 1000,
      visibility: Math.round(lm.visibility * 100) / 100
    })),
    worldLandmarks: pose.worldLandmarks?.map((lm: any) => ({
      x: Math.round(lm.x * 1000) / 1000,
      y: Math.round(lm.y * 1000) / 1000,
      z: Math.round(lm.z * 1000) / 1000,
      visibility: Math.round(lm.visibility * 100) / 100
    })),
    timestamp: pose.timestamp
  }));
  
  return compressed;
};

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;
  try {
    switch (type) {
      case 'ANALYZE_SWING': {
        // Compress pose data to reduce memory usage
        const compressedData = {
          ...data,
          poses: compressPoseData(data.poses || [])
        };
        
        const result = await analyzeSwing(compressedData, batchedProgress);
        
        // Flush any remaining progress updates
        if (progressTimeout) {
          clearTimeout(progressTimeout);
          flushProgressBatch();
        }
        
        // Compress result data
        const compressedResult = {
          ...result,
          landmarks: compressPoseData(result.landmarks || [])
        };
        
        (self as unknown as Worker).postMessage({ 
          type: 'SWING_ANALYZED', 
          data: compressedResult 
        } as WorkerResponse);
        break;
      }
      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    console.error('Worker analysis error:', error);
    (self as unknown as Worker).postMessage({ 
      type: 'ERROR', 
      data: { 
        error: error instanceof Error ? error.message : 'Unknown error occurred during analysis' 
      } 
    } as WorkerResponse);
  }
};


