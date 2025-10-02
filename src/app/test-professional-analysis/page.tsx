'use client';

import React, { useRef, useState, useCallback } from 'react';
import ProfessionalGolfVisualization from '@/components/analysis/ProfessionalGolfVisualization';
import type { PoseResult } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';
import { performProfessionalGolfAnalysis, type ProfessionalGolfMetrics } from '@/lib/professional-golf-metrics';

export default function TestProfessionalAnalysisPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poses, setPoses] = useState<PoseResult[]>([]);
  const [phases, setPhases] = useState<EnhancedSwingPhase[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [professionalMetrics, setProfessionalMetrics] = useState<ProfessionalGolfMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showProfessionalMetrics, setShowProfessionalMetrics] = useState(true);
  const [showClubPathAnalysis, setShowClubPathAnalysis] = useState(true);
  const [showSwingPlaneAnalysis, setShowSwingPlaneAnalysis] = useState(true);
  const [showWeightTransferAnalysis, setShowWeightTransferAnalysis] = useState(true);
  const [showSpineAngleAnalysis, setShowSpineAngleAnalysis] = useState(true);
  const [showHeadStabilityAnalysis, setShowHeadStabilityAnalysis] = useState(true);

  // Mock data for demonstration
  const generateMockPoses = useCallback(() => {
    const mockPoses: PoseResult[] = [];
    const totalFrames = 300; // 10 seconds at 30fps
    
    for (let i = 0; i < totalFrames; i++) {
      const time = i / 30;
      const progress = i / totalFrames;
      
      // Generate realistic pose landmarks with golf-specific movements
      const landmarks = Array.from({ length: 33 }, (_, index) => {
        let x = 0.5;
        let y = 0.5;
        
        // Simulate golf swing movements
        if (index === GOLF_LANDMARKS.head) {
          x = 0.5 + Math.sin(progress * Math.PI) * 0.02; // Slight head movement
          y = 0.3 + Math.cos(progress * Math.PI) * 0.01;
        } else if (index === GOLF_LANDMARKS.leftShoulder || index === GOLF_LANDMARKS.rightShoulder) {
          x = 0.5 + Math.sin(progress * Math.PI * 2) * 0.1;
          y = 0.4 + Math.cos(progress * Math.PI * 2) * 0.05;
        } else if (index === GOLF_LANDMARKS.leftWrist || index === GOLF_LANDMARKS.rightWrist) {
          x = 0.5 + Math.sin(progress * Math.PI * 2) * 0.15;
          y = 0.6 + Math.cos(progress * Math.PI * 2) * 0.1;
        } else if (index === GOLF_LANDMARKS.leftHip || index === GOLF_LANDMARKS.rightHip) {
          x = 0.5 + Math.sin(progress * Math.PI) * 0.05;
          y = 0.7 + Math.cos(progress * Math.PI) * 0.02;
        }
        
        return {
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y)),
          visibility: 0.9
        };
      });
      
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
        keyPoints: [0],
        metrics: { tempo: 0.8, balance: 0.9, posture: 0.85 },
        recommendations: ['Maintain steady posture'],

        description: "Phase description",

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
        metrics: { tempo: 0.7, balance: 0.8, posture: 0.75 },
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
        metrics: { tempo: 0.9, balance: 0.85, posture: 0.8 },
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
        metrics: { tempo: 0.85, balance: 0.9, posture: 0.88 },
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
        metrics: { tempo: 0.95, balance: 0.95, posture: 0.92 },
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
        metrics: { tempo: 0.8, balance: 0.85, posture: 0.82 },
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

  // Perform professional analysis when poses change
  React.useEffect(() => {
    if (poses.length === 0 || phases.length === 0) return;

    try {
      const analysis = performProfessionalGolfAnalysis(poses, phases);
      setProfessionalMetrics(analysis);
    } catch (error) {
      console.error('Error performing professional golf analysis:', error);
    }
  }, [poses, phases]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Professional Golf Analysis
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-3">
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
              
              {/* Professional Analysis Overlay */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                style={{ imageRendering: 'pixelated' }}
              />
              
              <ProfessionalGolfVisualization
                videoRef={videoRef as React.RefObject<HTMLVideoElement>}
                canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
                poses={poses}
                phases={phases}
                currentTime={currentTime}
                showProfessionalMetrics={showProfessionalMetrics}
                showClubPathAnalysis={showClubPathAnalysis}
                showSwingPlaneAnalysis={showSwingPlaneAnalysis}
                showWeightTransferAnalysis={showWeightTransferAnalysis}
                showSpineAngleAnalysis={showSpineAngleAnalysis}
                showHeadStabilityAnalysis={showHeadStabilityAnalysis}
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
                  {isAnalyzing ? 'Analyzing...' : 'Start Professional Analysis'}
                </button>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Analysis Features</h3>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showProfessionalMetrics}
                      onChange={(e) => setShowProfessionalMetrics(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Professional Metrics</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showClubPathAnalysis}
                      onChange={(e) => setShowClubPathAnalysis(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Club Path Analysis</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showSwingPlaneAnalysis}
                      onChange={(e) => setShowSwingPlaneAnalysis(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Swing Plane Analysis</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showWeightTransferAnalysis}
                      onChange={(e) => setShowWeightTransferAnalysis(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Weight Transfer Analysis</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showSpineAngleAnalysis}
                      onChange={(e) => setShowSpineAngleAnalysis(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Spine Angle Analysis</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showHeadStabilityAnalysis}
                      onChange={(e) => setShowHeadStabilityAnalysis(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Head Stability Analysis</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Professional Metrics Results */}
            {professionalMetrics && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Professional Analysis Results</h2>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      {professionalMetrics.professionalGrade}
                    </div>
                    <div className="text-lg">
                      Overall Score: {(professionalMetrics.overallProfessionalScore * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Club Path Efficiency:</span>
                      <span className={`text-sm font-medium ${
                        professionalMetrics.clubPath.pathEfficiency > 0.7 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(professionalMetrics.clubPath.pathEfficiency * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Swing Plane Efficiency:</span>
                      <span className={`text-sm font-medium ${
                        professionalMetrics.swingPlane.efficiencyScore > 0.7 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(professionalMetrics.swingPlane.efficiencyScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Weight Transfer Efficiency:</span>
                      <span className={`text-sm font-medium ${
                        professionalMetrics.weightTransfer.transferEfficiency > 0.7 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(professionalMetrics.weightTransfer.transferEfficiency * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Spine Angle Consistency:</span>
                      <span className={`text-sm font-medium ${
                        professionalMetrics.spineAngle.consistencyScore > 0.7 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(professionalMetrics.spineAngle.consistencyScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Head Stability:</span>
                      <span className={`text-sm font-medium ${
                        professionalMetrics.headStability.stabilityScore > 0.7 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(professionalMetrics.headStability.stabilityScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Key Recommendations */}
                  {professionalMetrics.keyRecommendations.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Key Recommendations</h3>
                      <div className="space-y-1">
                        {professionalMetrics.keyRecommendations.map((rec, index) => (
                          <div key={index} className="text-xs text-gray-300">
                            • {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Professional Features List */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Professional Features</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Club path analysis (inside-out, outside-in)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Swing plane efficiency scoring</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Weight transfer analysis (pressure shift)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Spine angle consistency tracking</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Head movement stability tracking</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Professional-grade scoring system</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Comprehensive recommendations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Golf-specific landmark indices for mock data generation
const GOLF_LANDMARKS = {
  head: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
};
