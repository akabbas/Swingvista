import { useCallback, useRef, useMemo } from 'react';

/**
 * Optimized state management hook for complex video processing
 * Prevents render loops and provides stable state updates
 */
export const useOptimizedState = <T>(
  initialState: T,
  options: {
    enableChangeDetection?: boolean;
    maxUpdatesPerSecond?: number;
    enableBatching?: boolean;
  } = {}
) => {
  const {
    enableChangeDetection = true,
    maxUpdatesPerSecond = 60,
    enableBatching = true
  } = options;

  const stateRef = useRef(initialState);
  const lastUpdateTimeRef = useRef(0);
  const updateQueueRef = useRef<T[]>([]);
  const isUpdatingRef = useRef(false);

  // Stable update function with rate limiting
  const updateState = useCallback((newState: T | ((prev: T) => T)) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    const minUpdateInterval = 1000 / maxUpdatesPerSecond;

    // Rate limiting
    if (timeSinceLastUpdate < minUpdateInterval) {
      if (enableBatching) {
        updateQueueRef.current.push(newState as T);
        return;
      }
      return; // Skip update if too frequent
    }

    // Change detection
    if (enableChangeDetection) {
      const actualNewState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(stateRef.current)
        : newState;
      
      if (actualNewState === stateRef.current) {
        return; // No change, skip update
      }
    }

    // Update state
    stateRef.current = typeof newState === 'function' 
      ? (newState as (prev: T) => T)(stateRef.current)
      : newState;
    
    lastUpdateTimeRef.current = now;
  }, [enableChangeDetection, maxUpdatesPerSecond, enableBatching]);

  // Process batched updates
  const processBatchedUpdates = useCallback(() => {
    if (isUpdatingRef.current || updateQueueRef.current.length === 0) {
      return;
    }

    isUpdatingRef.current = true;
    
    // Process all queued updates
    while (updateQueueRef.current.length > 0) {
      const update = updateQueueRef.current.shift();
      if (update) {
        updateState(update);
      }
    }
    
    isUpdatingRef.current = false;
  }, [updateState]);

  // Memoized state getter
  const getState = useCallback(() => stateRef.current, []);

  // Memoized state for rendering
  const state = useMemo(() => stateRef.current, [stateRef.current]);

  return {
    state,
    updateState,
    getState,
    processBatchedUpdates,
    reset: () => {
      stateRef.current = initialState;
      updateQueueRef.current = [];
      lastUpdateTimeRef.current = 0;
      isUpdatingRef.current = false;
    }
  };
};

export default useOptimizedState;





