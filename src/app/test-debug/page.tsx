'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DebugProvider, useDebug } from '@/contexts/DebugContext';
import DebugOverlay from '@/components/debug/DebugOverlay';
import DebugControls from '@/components/debug/DebugControls';
import OverlaySystem from '@/components/analysis/OverlaySystem';
import { PoseResult } from '@/lib/mediapipe';
import { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

// Enhanced mock data for testing with realistic club path
const mockPoses: PoseResult[] = Array.from({ length: 100 }, (_, i) => {
  // Create realistic swing motion
  const swingProgress = i / 100;
  const backswingPhase = swingProgress < 0.4;
  const downswingPhase = swingProgress >= 0.4 && swingProgress < 0.8;
  const followThroughPhase = swingProgress >= 0.8;
  
  // Calculate realistic club head position
  let clubHeadX = 0.5;
  let clubHeadY = 0.7;
  
  if (backswingPhase) {
    // Club moves back and up during backswing
    const backswingProgress = swingProgress / 0.4;
    clubHeadX = 0.5 - (backswingProgress * 0.3);
    clubHeadY = 0.7 - (backswingProgress * 0.4);
  } else if (downswingPhase) {
    // Club moves down and through during downswing
    const downswingProgress = (swingProgress - 0.4) / 0.4;
    clubHeadX = 0.2 + (downswingProgress * 0.4);
    clubHeadY = 0.3 + (downswingProgress * 0.2);
  } else {
    // Follow through
    const followThroughProgress = (swingProgress - 0.8) / 0.2;
    clubHeadX = 0.6 + (followThroughProgress * 0.2);
    clubHeadY = 0.5 + (followThroughProgress * 0.1);
  }
  
  return {
    landmarks: Array.from({ length: 33 }, (_, j) => {
      // Create more realistic pose landmarks
      let x = 0.5;
      let y = 0.5;
      
      // Key landmarks for golf swing
      if (j === 11 || j === 12) { // Left/Right shoulder
        x = 0.5 + (j === 11 ? -0.1 : 0.1);
        y = 0.3;
      } else if (j === 15 || j === 16) { // Left/Right wrist
        x = clubHeadX + (j === 15 ? -0.05 : 0.05);
        y = clubHeadY;
      } else if (j === 23 || j === 24) { // Left/Right hip
        x = 0.5 + (j === 23 ? -0.08 : 0.08);
        y = 0.6;
      } else {
        // Other landmarks with slight variation
        x = 0.5 + (Math.random() - 0.5) * 0.1;
        y = 0.5 + (Math.random() - 0.5) * 0.1;
      }
      
      return {
        x,
        y,
        z: 0,
        visibility: 0.8 + Math.random() * 0.2
      };
    }),
    worldLandmarks: Array.from({ length: 33 }, (_, j) => ({
      x: 0.5 + Math.sin(i * 0.1) * 0.2,
      y: 0.5 + Math.cos(i * 0.1) * 0.2,
      z: 0,
      visibility: 0.8 + Math.random() * 0.2
    })),
    timestamp: i * 33.33,
    confidence: 0.8 + Math.random() * 0.2,
    // Add club trajectory data
    clubTrajectory: {
      x: clubHeadX,
      y: clubHeadY,
      confidence: 0.9,
      frame: i,

    worldLandmarks: landmarks.map(lm => ({ ...lm, z: 0,

    worldLandmarks: landmarks.map(lm => ({ ...lm, z: 0 })) }))
    }
  };
});

const mockPhases: EnhancedSwingPhase[] = [
  { 
    name: 'address', 
    startFrame: 0, 
    endFrame: 10, 
    duration: 10,
    confidence: 0.9,
    startTime: 0,
    endTime: 0.33,
    color: '#10b981',
    description: 'Address position',
    metrics: { 
      spineAngle: 0, 
      kneeFlex: 15, 
      posture: 0.8, 
      weightDistribution: { left: 50, right: 50 },
      clubSpeed: 0,
      tempo: 1.0
    },
    grade: 'B',
    professionalBenchmark: { idealDuration: 1.0, keyPositions: [], commonMistakes: [] },
    recommendations: []
  },
  { 
    name: 'backswing', 
    startFrame: 10, 
    endFrame: 40, 
    duration: 30,
    confidence: 0.8,
    startTime: 0.33,
    endTime: 1.33,
    color: '#10b981',
    description: 'Backswing motion',
    metrics: { 
      spineAngle: 0, 
      kneeFlex: 15, 
      posture: 0.8, 
      weightDistribution: { left: 50, right: 50 },
      clubSpeed: 0,
      tempo: 1.0
    },
    grade: 'B',
    professionalBenchmark: { idealDuration: 1.0, keyPositions: [], commonMistakes: [] },
    recommendations: []
  },
  { 
    name: 'top', 
    startFrame: 40, 
    endFrame: 45, 
    duration: 5,
    confidence: 0.9,
    startTime: 1.33,
    endTime: 1.5,
    color: '#f59e0b',
    description: 'Top of backswing',
    metrics: { 
      spineAngle: 0, 
      kneeFlex: 15, 
      posture: 0.8, 
      weightDistribution: { left: 50, right: 50 },
      clubSpeed: 0,
      tempo: 1.0
    },
    grade: 'B',
    professionalBenchmark: { idealDuration: 1.0, keyPositions: [], commonMistakes: [] },
    recommendations: []
  },
  { 
    name: 'downswing', 
    startFrame: 45, 
    endFrame: 70, 
    duration: 25,
    confidence: 0.8,
    startTime: 1.5,
    endTime: 2.33,
    color: '#ef4444',
    description: 'Downswing motion',
    metrics: { 
      spineAngle: 0, 
      kneeFlex: 15, 
      posture: 0.8, 
      weightDistribution: { left: 50, right: 50 },
      clubSpeed: 0,
      tempo: 1.0
    },
    grade: 'B',
    professionalBenchmark: { idealDuration: 1.0, keyPositions: [], commonMistakes: [] },
    recommendations: []
  },
  { 
    name: 'impact', 
    startFrame: 70, 
    endFrame: 75, 
    duration: 5,
    confidence: 0.9,
    startTime: 2.33,
    endTime: 2.5,
    color: '#dc2626',
    description: 'Impact with ball',
    metrics: { 
      spineAngle: 0, 
      kneeFlex: 15, 
      posture: 0.8, 
      weightDistribution: { left: 50, right: 50 },
      clubSpeed: 0,
      tempo: 1.0
    },
    grade: 'B',
    professionalBenchmark: { idealDuration: 1.0, keyPositions: [], commonMistakes: [] },
    recommendations: []
  },
  { 
    name: 'follow-through', 
    startFrame: 75, 
    endFrame: 100, 
    duration: 25,
    confidence: 0.8,
    startTime: 2.5,
    endTime: 3.33,
    color: '#8b5cf6',
    description: 'Follow-through motion',
    metrics: { 
      spineAngle: 0, 
      kneeFlex: 15, 
      posture: 0.8, 
      weightDistribution: { left: 50, right: 50 },
      clubSpeed: 0,
      tempo: 1.0
    },
    grade: 'B',
    professionalBenchmark: { idealDuration: 1.0, keyPositions: [], commonMistakes: [] },
    recommendations: []
  }
];

const TestDebugContent: React.FC = () => {
  const { debugger: debuggerInstance } = useDebug();
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [overlayMode, setOverlayMode] = useState<'clean' | 'analysis' | 'technical'>('analysis');
  const [isClient, setIsClient] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Simulate video playback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 100; // 100ms increments
          if (newTime >= 3000) { // 3 seconds total
            setIsPlaying(false);
            return 0;
          }
          return newTime;
        });
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Simulate pose analysis updates (only on client side)
  useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(() => {
      // Simulate different component statuses
      const statuses = ['ok', 'warning', 'error'] as const;
      const components = ['stickFigure', 'swingPlane', 'clubPath', 'phaseDetection', 'metricsCalculation', 'gradingSystem'];
      
      components.forEach(component => {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const metrics = {
          confidenceScore: Math.random(),
          processingTime: Math.random() * 100,
          dataQuality: Math.random() * 100
        };
        
        debuggerInstance?.updateComponentStatus(component, status, { 
          lastUpdate: Date.now(),
          randomValue: Math.random()
        }, metrics);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [debuggerInstance, isClient]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🛠️ Golf Swing Analysis Debug System
        </h1>
        
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 rounded-lg font-semibold ${
                isPlaying 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            
            <button
              onClick={() => setCurrentTime(0)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              🔄 Reset
            </button>
            
            <select
              value={overlayMode}
              onChange={(e) => setOverlayMode(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="clean">Clean Mode</option>
              <option value="analysis">Analysis Mode</option>
              <option value="technical">Technical Mode</option>
            </select>
            
            <button
              onClick={() => debuggerInstance?.runValidationSuite()}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              🔍 Validate All
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Current Time: {(currentTime / 1000).toFixed(1)}s</p>
            <p>Overlay Mode: {overlayMode}</p>
            <p>Status: {isPlaying ? 'Playing' : 'Paused'}</p>
          </div>
        </div>

        {/* Video and Canvas */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Video Analysis</h2>
          
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full h-auto"
            />
            
            {/* Mock video element */}
            <div style={{ display: 'none' }}>
              <video
                ref={videoRef}
                width={800}
                height={600}
                style={{ display: 'none' }}
                suppressHydrationWarning={true}
              />
            </div>
            
            {/* Overlay System */}
            {isClient && (
              <OverlaySystem
                canvasRef={canvasRef}
                videoRef={videoRef}
                poses={mockPoses}
                phases={mockPhases}
                currentTime={currentTime}
                overlayMode={overlayMode}
                isPlaying={isPlaying}
              />
            )}
          </div>
        </div>

        {/* Debug Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700">System Status</h3>
                <p className="text-sm text-gray-600">
                  The debug system monitors all 6 key aspects of golf swing analysis:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• <strong>Stick Figure Overlay</strong> - Body landmark detection and rendering</li>
                  <li>• <strong>Swing Plane Visualization</strong> - Club path and plane analysis</li>
                  <li>• <strong>Club Path Tracking</strong> - Actual club head trajectory</li>
                  <li>• <strong>Phase Detection</strong> - Swing phase identification</li>
                  <li>• <strong>Metrics Calculation</strong> - Tempo, rotation, balance, etc.</li>
                  <li>• <strong>Grading System</strong> - Score calculation and validation</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700">Debug Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Real-time status monitoring</li>
                  <li>• Performance metrics tracking</li>
                  <li>• Automated validation suite</li>
                  <li>• Error and warning detection</li>
                  <li>• Data export capabilities</li>
                  <li>• Visual debug indicators</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Console Output</h2>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
              <div>🔧 Debug: Debugger initialized with all components</div>
              <div>🎯 Building precise club trajectory from 100 poses...</div>
              <div>⚖️ Weight Distribution: {`{leftFoot: '45.2%', rightFoot: '54.8%', ...}`}</div>
              <div>📊 Swing Metrics: {`{weightTransfer: {...}, tempo: {...}, ...}`}</div>
              <div>💬 Swing Feedback: {`{realTime: 2, phaseSpecific: {...}, ...}`}</div>
              <div>🔧 Debug: stickFigure status changed: ❓ → ✅</div>
              <div>🔧 Debug: clubPath status changed: ❓ → ⚠️</div>
              <div>🔧 Debug: swingPlane status changed: ❓ → ✅</div>
              <div>🔧 Debug: phaseDetection status changed: ❓ → ✅</div>
              <div>🔧 Debug: metricsCalculation status changed: ❓ → ⚠️</div>
              <div>🔧 Debug: gradingSystem status changed: ❓ → ❌</div>
              <div className="text-yellow-400">⚠️ Debug: clubPath WARNING: Insufficient trajectory data</div>
              <div className="text-red-400">❌ Debug: gradingSystem ERROR: Score calculation failed</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug Overlay and Controls */}
      {isClient && (
        <>
          <DebugOverlay debugger={debuggerInstance} />
          <DebugControls debugger={debuggerInstance} />
        </>
      )}
    </div>
  );
};

const TestDebugPage: React.FC = () => {
  return (
    <DebugProvider enableDebug={true}>
      <TestDebugContent />
    </DebugProvider>
  );
};

export default TestDebugPage;
