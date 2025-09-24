// src/hooks/useVideoProcessing.ts
import { useCallback, useRef } from 'react';

export const useVideoProcessing = () => {
  const processingRef = useRef(false);
  const frameIdRef = useRef<number>();

  const processFrame = useCallback((callback: () => void, fps = 30) => {
    if (processingRef.current) return;
    
    processingRef.current = true;
    frameIdRef.current = requestAnimationFrame(() => {
      callback();
      processingRef.current = false;
    });
  }, []);

  const stopProcessing = useCallback(() => {
    if (frameIdRef.current) {
      cancelAnimationFrame(frameIdRef.current);
    }
    processingRef.current = false;
  }, []);

  return { processFrame, stopProcessing };
};
