'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { MobilePoseVisualizer as MobilePoseVisualizerClass, type MobileVisualizationConfig } from '@/lib/mobile-optimization';
import type { PoseResult } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export interface MobilePoseVisualizerProps {
  poses: PoseResult[];
  phases: EnhancedSwingPhase[];
  currentTime: number;
  onLandmarkSelect?: (landmarkIndex: number, landmark: any) => void;
  onPhaseSelect?: (phase: EnhancedSwingPhase) => void;
  className?: string;
}

export default function MobilePoseVisualizer({
  poses,
  phases,
  currentTime,
  onLandmarkSelect,
  onPhaseSelect,
  className = ''
}: MobilePoseVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualizer, setVisualizer] = useState<MobilePoseVisualizerClass | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [selectedLandmark, setSelectedLandmark] = useState<number | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<EnhancedSwingPhase | null>(null);
  const [visualizationConfig, setVisualizationConfig] = useState<MobileVisualizationConfig>({
    landmarkSize: 6,
    connectionWidth: 3,
    textSize: 14,
    overlayOpacity: 0.8,
    enableGestures: true,
    enableHapticFeedback: true,
    colorScheme: 'auto'
  });

  // Initialize visualizer
  useEffect(() => {
    if (canvasRef.current) {
      const viz = new MobilePoseVisualizerClass(canvasRef.current, visualizationConfig);
      setVisualizer(viz);
    }
  }, [visualizationConfig]);

  // Render pose
  useEffect(() => {
    if (visualizer && poses.length > 0) {
      const currentPose = poses[Math.floor(currentTime * 30)]; // Assuming 30fps
      if (currentPose) {
        visualizer.renderPose(currentPose, phases, currentTime);
      }
    }
  }, [visualizer, poses, phases, currentTime]);

  // Handle landmark selection
  const handleLandmarkSelect = useCallback((landmarkIndex: number) => {
    if (poses.length > 0) {
      const currentPose = poses[Math.floor(currentTime * 30)];
      if (currentPose?.landmarks?.[landmarkIndex]) {
        setSelectedLandmark(landmarkIndex);
        onLandmarkSelect?.(landmarkIndex, currentPose.landmarks[landmarkIndex]);
      }
    }
  }, [poses, currentTime, onLandmarkSelect]);

  // Handle phase selection
  const handlePhaseSelect = useCallback((phase: EnhancedSwingPhase) => {
    setSelectedPhase(phase);
    onPhaseSelect?.(phase);
  }, [onPhaseSelect]);

  // Handle touch events
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (!canvasRef.current) return;
    
    const touch = event.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Check if touch is on a landmark
    if (poses.length > 0) {
      const currentPose = poses[Math.floor(currentTime * 30)];
      if (currentPose?.landmarks) {
        const canvasWidth = canvasRef.current.width;
        const canvasHeight = canvasRef.current.height;
        
        for (let i = 0; i < currentPose.landmarks.length; i++) {
          const landmark = currentPose.landmarks[i];
          if (landmark && (landmark.visibility ?? 0) > 0.5) {
            const landmarkX = landmark.x * canvasWidth;
            const landmarkY = landmark.y * canvasHeight;
            const distance = Math.sqrt((x - landmarkX) ** 2 + (y - landmarkY) ** 2);
            
            if (distance < visualizationConfig.landmarkSize * 2) {
              handleLandmarkSelect(i);
              break;
            }
          }
        }
      }
    }
  }, [poses, currentTime, visualizationConfig.landmarkSize, handleLandmarkSelect]);

  // Handle canvas resize
  const handleResize = useCallback(() => {
    if (canvasRef.current && visualizer) {
      // Reinitialize visualizer with new dimensions
      const newVisualizer = new MobilePoseVisualizerClass(canvasRef.current, visualizationConfig);
      setVisualizer(newVisualizer);
    }
  }, [visualizer, visualizationConfig]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Get current phase
  const currentPhase = phases.find(phase => 
    currentTime >= phase.startTime && currentTime <= phase.endTime
  );

  return (
    <div className={`relative ${className}`}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onTouchStart={handleTouchStart}
        style={{ touchAction: 'none' }}
      />
      
      {/* Mobile Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        {/* Phase Indicator */}
        {currentPhase && (
          <div className="bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
            <div className="text-sm font-medium">{currentPhase.name.toUpperCase()}</div>
            <div className="text-xs opacity-75">
              {((currentTime - currentPhase.startTime) / (currentPhase.endTime - currentPhase.startTime) * 100).toFixed(0)}%
            </div>
          </div>
        )}
        
        {/* Visibility Toggle */}
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="w-10 h-10 bg-black bg-opacity-70 text-white rounded-full flex items-center justify-center"
        >
          {isVisible ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Phase Navigation */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex space-x-2 overflow-x-auto">
          {phases.map((phase, index) => (
            <button
              key={index}
              onClick={() => handlePhaseSelect(phase)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedPhase?.name === phase.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 bg-opacity-70 text-white hover:bg-opacity-90'
              }`}
            >
              {phase.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Landmark Info */}
      {selectedLandmark !== null && poses.length > 0 && (
        <div className="absolute top-16 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg max-w-xs">
          <div className="text-sm font-medium">Landmark {selectedLandmark}</div>
          {(() => {
            const currentPose = poses[Math.floor(currentTime * 30)];
            const landmark = currentPose?.landmarks?.[selectedLandmark];
            if (landmark) {
              return (
                <div className="text-xs space-y-1 mt-2">
                  <div>X: {landmark.x.toFixed(3)}</div>
                  <div>Y: {landmark.y.toFixed(3)}</div>
                  <div>Visibility: {(landmark.visibility ?? 0).toFixed(3)}</div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
      
      {/* Phase Info */}
      {selectedPhase && (
        <div className="absolute top-16 right-4 bg-black bg-opacity-70 text-white p-3 rounded-lg max-w-xs">
          <div className="text-sm font-medium">{selectedPhase.name}</div>
          <div className="text-xs space-y-1 mt-2">
            <div>Duration: {selectedPhase.duration.toFixed(1)}s</div>
            <div>Grade: {selectedPhase.grade}</div>
            <div>Confidence: {(selectedPhase.confidence * 100).toFixed(0)}%</div>
            {selectedPhase.metrics && (
              <div className="mt-2">
                <div>Tempo: {(selectedPhase.metrics.tempo * 100).toFixed(0)}%</div>
                <div>Balance: {(selectedPhase.metrics.balance * 100).toFixed(0)}%</div>
                <div>Posture: {(selectedPhase.metrics.posture * 100).toFixed(0)}%</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Touch Instructions */}
      <div className="absolute bottom-20 left-4 right-4 text-center text-white text-xs opacity-70">
        <div className="flex justify-center space-x-4">
          <span>👆 Tap landmarks for info</span>
          <span>👆 Tap phases to select</span>
        </div>
      </div>
      
      {/* Settings Panel */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => {
            // Toggle settings panel
            const panel = document.getElementById('mobile-settings-panel');
            if (panel) {
              panel.classList.toggle('hidden');
            }
          }}
          className="w-10 h-10 bg-black bg-opacity-70 text-white rounded-full flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      
      {/* Settings Panel */}
      <div id="mobile-settings-panel" className="absolute top-16 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg hidden">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Landmark Size</label>
            <input
              type="range"
              min="3"
              max="12"
              value={visualizationConfig.landmarkSize}
              onChange={(e) => setVisualizationConfig(prev => ({
                ...prev,
                landmarkSize: parseInt(e.target.value)
              }))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Connection Width</label>
            <input
              type="range"
              min="1"
              max="6"
              value={visualizationConfig.connectionWidth}
              onChange={(e) => setVisualizationConfig(prev => ({
                ...prev,
                connectionWidth: parseInt(e.target.value)
              }))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Text Size</label>
            <input
              type="range"
              min="10"
              max="20"
              value={visualizationConfig.textSize}
              onChange={(e) => setVisualizationConfig(prev => ({
                ...prev,
                textSize: parseInt(e.target.value)
              }))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Opacity</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={visualizationConfig.overlayOpacity}
              onChange={(e) => setVisualizationConfig(prev => ({
                ...prev,
                overlayOpacity: parseFloat(e.target.value)
              }))}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
