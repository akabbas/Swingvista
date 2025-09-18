'use client';

import React, { createContext, useContext, useRef, useEffect, ReactNode } from 'react';
import { SwingAnalysisDebugger } from '@/lib/swing-analysis-debugger';

interface DebugContextType {
  debugger: SwingAnalysisDebugger;
  isDebugMode: boolean;
  toggleDebugMode: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const useDebug = (): DebugContextType => {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};

interface DebugProviderProps {
  children: ReactNode;
  enableDebug?: boolean;
}

export const DebugProvider: React.FC<DebugProviderProps> = ({ 
  children, 
  enableDebug = false 
}) => {
  const debuggerRef = useRef<SwingAnalysisDebugger | null>(null);
  const [isDebugMode, setIsDebugMode] = React.useState(enableDebug);

  // Initialize debugger
  useEffect(() => {
    if (!debuggerRef.current) {
      debuggerRef.current = new SwingAnalysisDebugger();
      
      // Register all analysis components
      debuggerRef.current.registerComponent('stickFigure', {
        landmarksDetected: 0,
        confidenceScore: 0,
        renderingStatus: 'unknown'
      });

      debuggerRef.current.registerComponent('swingPlane', {
        planeCalculated: false,
        angle: 0,
        consistency: 0,
        deviation: 0
      });

      debuggerRef.current.registerComponent('clubPath', {
        pointsTracked: 0,
        smoothness: 0,
        accuracy: 0,
        frameAccuracy: 0
      });

      debuggerRef.current.registerComponent('phaseDetection', {
        phasesDetected: 0,
        phaseSequence: 'unknown',
        phaseTiming: 0,
        currentPhase: 'unknown'
      });

      debuggerRef.current.registerComponent('metricsCalculation', {
        tempoCalculated: false,
        balanceCalculated: false,
        metricsRange: 'unknown',
        calculationTime: 0
      });

      debuggerRef.current.registerComponent('gradingSystem', {
        scoresCalculated: false,
        scoreRange: 'unknown',
        gradingConsistency: 0,
        overallScore: 0
      });

      console.log('🔧 Debug: Debugger initialized with all components');
    }
  }, []);

  // Toggle debug mode
  const toggleDebugMode = () => {
    const newMode = !isDebugMode;
    setIsDebugMode(newMode);
    
    if (debuggerRef.current) {
      debuggerRef.current.setVisibility(newMode);
    }
    
    console.log(`🔧 Debug: Debug mode ${newMode ? 'enabled' : 'disabled'}`);
  };

  // Set initial visibility
  useEffect(() => {
    if (debuggerRef.current) {
      debuggerRef.current.setVisibility(isDebugMode);
    }
  }, [isDebugMode]);

  const contextValue: DebugContextType = {
    debugger: debuggerRef.current!,
    isDebugMode,
    toggleDebugMode
  };

  return (
    <DebugContext.Provider value={contextValue}>
      {children}
    </DebugContext.Provider>
  );
};

// Hook for easy access to debugger
export const useDebugger = (): SwingAnalysisDebugger => {
  const { debugger: debuggerInstance } = useDebug();
  return debuggerInstance;
};

// Hook for debug mode state
export const useDebugMode = (): boolean => {
  const { isDebugMode } = useDebug();
  return isDebugMode;
};
