import { PoseResult } from '../lib/mediapipe';
import { analyzeSwing, AnalysisInput, UnifiedSwingData } from '../lib/unified-analysis';

// Worker message types
export interface WorkerMessage {
  type: 'ANALYZE_SWING';
  data: AnalysisInput;
}

export interface WorkerResponse {
  type: 'PROGRESS' | 'SWING_ANALYZED' | 'ERROR';
  data: any;
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;
  
  try {
    switch (type) {
      case 'ANALYZE_SWING':
        // Set up progress callback
        const onProgress = (step: string, progress: number) => {
          self.postMessage({
            type: 'PROGRESS',
            data: { step, progress }
          });
        };

        // Run unified analysis
        const result = await analyzeSwing(data, onProgress);
        
        // Send result back to main thread
        self.postMessage({
          type: 'SWING_ANALYZED',
          data: result
        });
        break;
        
      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    console.error('Worker analysis error:', error);
    self.postMessage({
      type: 'ERROR',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error occurred during analysis'
      }
    });
  }
};
