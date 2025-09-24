import { useRef, useEffect, useCallback } from 'react';

interface UseRenderCounterOptions {
  emergencyThreshold?: number;
  onEmergency?: () => void;
  enableLogging?: boolean;
}

// Increase emergency delay and improve logic
const useRenderCounter = (componentName: string, options: UseRenderCounterOptions = {}) => {
  const { emergencyThreshold = 25, onEmergency, enableLogging = false } = options;
  const renderCount = useRef(0);
  const isEmergencyMode = useRef(false);
  const lastRenderTime = useRef(performance.now());

  // Reset function for manual reset
  const reset = useCallback(() => {
    renderCount.current = 0;
    isEmergencyMode.current = false;
    lastRenderTime.current = performance.now();
  }, []);

  useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (enableLogging) {
      console.log(`🔄 ${componentName} render #${renderCount.current}`, {
        timeSinceLastRender: timeSinceLastRender.toFixed(2) + 'ms'
      });
    }

    // TEMPORARILY DISABLED - Emergency break with timeout
    // if (renderCount.current > emergencyThreshold && !isEmergencyMode.current) {
    //   isEmergencyMode.current = true;
    //   console.error(`❌ EMERGENCY: ${componentName} render loop detected`);
      
    //   // Delay emergency handling to avoid false positives
    //   setTimeout(() => {
    //     if (renderCount.current > emergencyThreshold * 1.5) {
    //       onEmergency?.();
    //     } else {
    //       isEmergencyMode.current = false; // Reset if it stabilized
    //     }
    //   }, 2000); // 2-second delay
    // }

    return () => {
      if (isEmergencyMode.current) {
        console.warn(`⚠️ ${componentName} emergency mode active`);
      }
    };
  }, [componentName, emergencyThreshold, onEmergency, enableLogging]);

  return { 
    renderCount: renderCount.current, 
    isEmergencyMode: isEmergencyMode.current, 
    reset 
  };
};

export default useRenderCounter;
