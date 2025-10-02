'use client';

import React, { useRef, useState, useCallback } from 'react';
import ComprehensiveGolfAnalyzer from '@/components/analysis/ComprehensiveGolfAnalyzer';
import type { PoseResult } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export default function TestAdvancedAnalysisPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [poses, setPoses] = useState<PoseResult[]>([]);
  const [phases, setPhases] = useState<EnhancedSwingPhase[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(true);
  const [showComparison, setShowComparison] = useState(false);

  // Mock data for demonstration
  const generateMockPoses = useCallback(() => {
    const mockPoses: PoseResult[] = [];
    const totalFrames = 300; // 10 seconds at 30fps
    
    for (let i = 0; i < totalFrames; i++) {
      const time = i / 30;
      const progress = i / totalFrames;
      
      // Generate realistic pose landmarks
      const landmarks = Array.from({ length: 33 }, (_, index) => ({
        x: 0.5 + Math.sin(progress * Math.PI * 2) * 0.1,
        y: 0.5 + Math.cos(progress * Math.PI * 2) * 0.1,
        visibility: 0.9
      }));
      
      mockPoses.push({
        landmarks,
        worldLandmarks: landmarks.map(lm => ({ ...lm, z: 0 })),
        timestamp: time,
        confidence: 0.9
      });
    }
    
    setPoses(mockPoses);
  }, []);

  const generateMockPhases = useCallback(() => {
    const mockPhases: EnhancedSwingPhase[] = [
      {
        name: 'address',
        startTime: 0,
        endTime: 1,
        startFrame: 0,
        endFrame: 30,
        duration: 1,
        confidence: 0.95,
        grade: 'A',
        color: '#00ff00',
        description: 'Setup position with proper stance and grip',
        keyPoints: [0],
        metrics: {
          tempo: 0.8,
          balance: 0.9,
          posture: 0.85
        },
        recommendations: ['Maintain steady posture'],
        professionalBenchmark: {
          idealDuration: 1.0,
          keyPositions: [],
          commonMistakes: []
        }
      },
      {
        name: 'backswing',
        startTime: 1,
        endTime: 2.5,
        startFrame: 30,
        endFrame: 75,
        duration: 1.5,
        confidence: 0.9,
        grade: 'B+',
        color: '#ffff00',
        keyPoints: [45],
        metrics: {
          tempo: 0.7,
          balance: 0.8,
          posture: 0.75
        },
        recommendations: ['Smooth tempo transition'],

        description: "Phase description",

        professionalBenchmark: {

          idealDuration: 1.0,

          keyPositions: [],

          commonMistakes: []

        }
      },
      {
        name: 'transition',
        startTime: 2.5,
        endTime: 3,
        startFrame: 75,
        endFrame: 90,
        duration: 0.5,
        confidence: 0.85,
        grade: 'A-',
        color: '#ff8800',
        keyPoints: [82],
        metrics: {
          tempo: 0.9,
          balance: 0.85,
          posture: 0.8
        },
        recommendations: ['Excellent transition timing'],

        description: "Phase description",

        professionalBenchmark: {

          idealDuration: 1.0,

          keyPositions: [],

          commonMistakes: []

        }
      },
      {
        name: 'downswing',
        startTime: 3,
        endTime: 4,
        startFrame: 90,
        endFrame: 120,
        duration: 1,
        confidence: 0.88,
        grade: 'A',
        color: '#ff0000',
        keyPoints: [105],
        metrics: {
          tempo: 0.85,
          balance: 0.9,
          posture: 0.88
        },
        recommendations: ['Great power generation'],

        description: "Phase description",

        professionalBenchmark: {

          idealDuration: 1.0,

          keyPositions: [],

          commonMistakes: []

        }
      },
      {
        name: 'impact',
        startTime: 4,
        endTime: 4.2,
        startFrame: 120,
        endFrame: 126,
        duration: 0.2,
        confidence: 0.92,
        grade: 'A+',
        color: '#ff00ff',
        keyPoints: [123],
        metrics: {
          tempo: 0.95,
          balance: 0.95,
          posture: 0.92
        },
        recommendations: ['Perfect impact position'],

        description: "Phase description",

        professionalBenchmark: {

          idealDuration: 1.0,

          keyPositions: [],

          commonMistakes: []

        }
      },
      {
        name: 'follow-through',
        startTime: 4.2,
        endTime: 6,
        startFrame: 126,
        endFrame: 180,
        duration: 1.8,
        confidence: 0.87,
        grade: 'B+',
        color: '#00ffff',
        keyPoints: [150, 165],
        metrics: {
          tempo: 0.8,
          balance: 0.85,
          posture: 0.82
        },
        recommendations: ['Hold finish position longer'],

        description: "Phase description",

        professionalBenchmark: {

          idealDuration: 1.0,

          keyPositions: [],

          commonMistakes: []

        }
      }
    ];
    
    setPhases(mockPhases);
  }, []);

  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const startAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    generateMockPoses();
    generateMockPhases();
    
    // Simulate analysis delay
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  }, [generateMockPoses, generateMockPhases]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Advanced Golf Analysis Demo
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-auto"
                onTimeUpdate={handleVideoTimeUpdate}
                controls
                muted
              >
                <source src="/sample-golf-swing.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Analysis Overlay */}
              <ComprehensiveGolfAnalyzer
                videoRef={videoRef as React.RefObject<HTMLVideoElement>}
                poses={poses}
                phases={phases}
                currentTime={currentTime}
                showAdvancedAnalysis={showAdvancedAnalysis}
                showComparison={showComparison}
                className="absolute inset-0"
              />
            </div>
          </div>
          
          {/* Controls Panel */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Analysis Controls</h2>
              
              <div className="space-y-4">
                <button
                  onClick={startAnalysis}
                  disabled={isAnalyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                </button>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showAdvancedAnalysis}
                      onChange={(e) => setShowAdvancedAnalysis(e.target.checked)}
                      className="rounded"
                    />
                    <span>Show Advanced Analysis</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showComparison}
                      onChange={(e) => setShowComparison(e.target.checked)}
                      className="rounded"
                    />
                    <span>Show Comparison View</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Analysis Results */}
            {poses.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Swing Phases</h3>
                    <div className="space-y-2">
                      {phases.map((phase, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: phase.color }}
                            />
                            <span className="capitalize">{phase.name}</span>
                          </div>
                          <div className="text-sm text-gray-400">
                            {phase.grade} ({phase.duration.toFixed(1)}s)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Key Metrics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Poses:</span>
                        <span>{poses.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Analysis Confidence:</span>
                        <span>92%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overall Grade:</span>
                        <span className="text-green-400">A-</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Features List */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Enhanced Features</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Club path estimation using wrist and shoulder landmarks</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Swing tempo breakdown by phases</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Body rotation metrics with hip and shoulder angles</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Follow-through quality assessment</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Real-time angle measurements</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Phase indicators and timeline</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Before/after comparison views</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
