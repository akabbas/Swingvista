import { analyzeSwing, AnalysisInput } from '../lib/unified-analysis';

export interface WorkerMessage { type: 'ANALYZE_SWING'; data: AnalysisInput; }
export interface WorkerResponse { type: 'PROGRESS' | 'SWING_ANALYZED' | 'ERROR'; data: unknown; }

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;
  try {
    switch (type) {
      case 'ANALYZE_SWING': {
        const onProgress = (step: string, progress: number) => {
          (self as unknown as Worker).postMessage({ type: 'PROGRESS', data: { step, progress } } as WorkerResponse);
        };
        const result = await analyzeSwing(data, onProgress);
        (self as unknown as Worker).postMessage({ type: 'SWING_ANALYZED', data: result } as WorkerResponse);
        break;
      }
      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    console.error('Worker analysis error:', error);
    (self as unknown as Worker).postMessage({ type: 'ERROR', data: { error: error instanceof Error ? error.message : 'Unknown error occurred during analysis' } } as WorkerResponse);
  }
};


