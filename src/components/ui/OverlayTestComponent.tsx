'use client';

import React, { useRef, useEffect, useState } from 'react';
import StickFigureOverlay from './StickFigureOverlay';
import SwingPlaneVisualization from './SwingPlaneVisualization';
import PhaseMarkers from './PhaseMarkers';
import type { PoseResult } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export interface OverlayTestComponentProps {
  className?: string;
}

const OverlayTestComponent: React.FC<OverlayTestComponentProps> = ({ className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [poses, setPoses] = useState<PoseResult[]>([]);
  const [phases, setPhases] = useState<EnhancedSwingPhase[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Generate mock pose data for testing
  useEffect(() => {
    const generateMockPoses = () => {
      const mockPoses: PoseResult[] = [];
      const numFrames = 100;
      
      for (let i = 0; i < numFrames; i++) {
        const time = (i / numFrames) * 5000; // 5 second video
        const landmarks = [];
        
        // Generate 33 landmarks (MediaPipe pose format)
        for (let j = 0; j < 33; j++) {
          landmarks.push({
            x: 0.5 + Math.sin((i / numFrames) * Math.PI * 2 + j * 0.1) * 0.1,
            y: 0.5 + Math.cos((i / numFrames) * Math.PI * 2 + j * 0.1) * 0.1,
            z: Math.sin((i / numFrames) * Math.PI + j * 0.05) * 0.05,
            visibility: 0.8 + Math.random() * 0.2
          });
        }
        
        mockPoses.push({
          landmarks,
          worldLandmarks: landmarks,
          timestamp: time
        });
      }
      
      setPoses(mockPoses);
    };

    generateMockPoses();
  }, []);

  // Generate mock phases for testing
  useEffect(() => {
    const mockPhases: EnhancedSwingPhase[] = [
      {
        name: 'address',
        startFrame: 0,
        endFrame: 20,
        startTime: 0,
        endTime: 1000,
        duration: 1000,
        color: '#4CAF50',
        description: 'Setup and address position',
        confidence: 0.9,
        grade: 'A',
        metrics: {
          spineAngle: 35,
          kneeFlex: 20,
          posture: 85
        },
        recommendations: ['Maintain good posture', 'Keep spine angle consistent'],
        professionalBenchmark: {
          idealDuration: 2000,
          keyPositions: [],
          commonMistakes: []
        }
      },
      {
        name: 'backswing',
        startFrame: 20,
        endFrame: 60,
        startTime: 1000,
        endTime: 3000,
        duration: 2000,
        color: '#2196F3',
        description: 'Takeaway to top of backswing',
        confidence: 0.8,
        grade: 'B',
        metrics: {
          shoulderRotation: 85,
          hipRotation: 45,
          xFactor: 40
        },
        recommendations: ['Increase shoulder turn', 'Work on X-factor'],
        professionalBenchmark: {
          idealDuration: 3000,
          keyPositions: [],
          commonMistakes: []
        }
      },
      {
        name: 'top',
        startFrame: 60,
        endFrame: 70,
        startTime: 3000,
        endTime: 3500,
        duration: 500,
        color: '#FF9800',
        description: 'Top of swing position',
        confidence: 0.7,
        grade: 'B',
        metrics: {
          wristHinge: 90,
          balance: 80
        },
        recommendations: ['Improve balance at the top'],
        professionalBenchmark: {
          idealDuration: 500,
          keyPositions: [],
          commonMistakes: []
        }
      },
      {
        name: 'downswing',
        startFrame: 70,
        endFrame: 85,
        startTime: 3500,
        endTime: 4250,
        duration: 750,
        color: '#F44336',
        description: 'Downswing to impact',
        confidence: 0.8,
        grade: 'A',
        metrics: {
          tempoRatio: 3.0,
          sequencing: 85
        },
        recommendations: ['Maintain good tempo'],
        professionalBenchmark: {
          idealDuration: 1000,
          keyPositions: [],
          commonMistakes: []
        }
      },
      {
        name: 'impact',
        startFrame: 85,
        endFrame: 90,
        startTime: 4250,
        endTime: 4500,
        duration: 250,
        color: '#9C27B0',
        description: 'Ball contact moment',
        confidence: 0.9,
        grade: 'A',
        metrics: {
          weightTransfer: 85,
          clubFace: 0
        },
        recommendations: ['Great impact position'],
        professionalBenchmark: {
          idealDuration: 200,
          keyPositions: [],
          commonMistakes: []
        }
      },
      {
        name: 'follow-through',
        startFrame: 90,
        endFrame: 100,
        startTime: 4500,
        endTime: 5000,
        duration: 500,
        color: '#FFEB3B',
        description: 'Follow-through to finish',
        confidence: 0.8,
        grade: 'B',
        metrics: {
          finishBalance: 80,
          extension: 85
        },
        recommendations: ['Improve finish position'],
        professionalBenchmark: {
          idealDuration: 2000,
          keyPositions: [],
          commonMistakes: []
        }
      }
    ];
    
    setPhases(mockPhases);
  }, []);

  // Simulate video playback
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 50; // 50ms increments
        if (newTime >= 5000) return 0; // Loop back to start
        return newTime;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <h2 className="text-2xl font-bold mb-4 text-center">Overlay System Test</h2>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <strong>Poses:</strong> {poses.length}
          </div>
          <div>
            <strong>Phases:</strong> {phases.length}
          </div>
          <div>
            <strong>Current Time:</strong> {(currentTime / 1000).toFixed(1)}s
          </div>
          <div>
            <strong>Playing:</strong> {isPlaying ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        {/* Mock video element */}
        <div 
          ref={videoRef as unknown as React.RefObject<HTMLDivElement>}
          className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center text-white text-2xl"
        >
          Mock Video Feed
        </div>

        {/* Test overlays */}
        <StickFigureOverlay
          videoRef={videoRef as React.RefObject<HTMLVideoElement>}
          poses={poses}
          currentTime={currentTime}
          phases={phases}
          showSkeleton={true}
          showLandmarks={true}
          showSwingPlane={true}
          showPhaseMarkers={true}
          showMetrics={true}
        />

        <SwingPlaneVisualization
          videoRef={videoRef as React.RefObject<HTMLVideoElement>}
          poses={poses}
          currentTime={currentTime}
          phases={phases}
          showSwingPlane={true}
          showClubPath={true}
          showImpactZone={true}
          showWeightTransfer={true}
          showSpineAngle={true}
        />

        <PhaseMarkers
          videoRef={videoRef as React.RefObject<HTMLVideoElement>}
          phases={phases}
          currentTime={currentTime}
          showPhaseBars={true}
          showPhaseNames={true}
          showPhaseGrades={true}
          showPhaseRecommendations={true}
        />
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isPlaying ? 'Pause' : 'Play'} Test
        </button>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Test Features:</h3>
        <ul className="text-sm space-y-1">
          <li>• Mock pose data with 100 frames of 33 landmarks each</li>
          <li>• 6 swing phases with realistic timing and metrics</li>
          <li>• Animated playback simulation (50ms increments)</li>
          <li>• All overlay components rendered simultaneously</li>
          <li>• Responsive design that adapts to container size</li>
        </ul>
      </div>
    </div>
  );
};

export default OverlayTestComponent;

