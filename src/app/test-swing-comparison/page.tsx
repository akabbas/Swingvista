'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import SwingComparisonVisualization from '@/components/analysis/SwingComparisonVisualization';
import ProgressTrackingVisualization from '@/components/analysis/ProgressTrackingVisualization';
import SwingLibraryManager from '@/components/analysis/SwingLibraryManager';
import type { PoseResult } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';
import type { 
  SwingSession, 
  ProGolferSwing, 
  SwingComparisonResult, 
  ProgressTracking, 
  SwingLibrary,
  SwingCategory 
} from '@/lib/swing-comparison';
import { 
  compareSwingWithPro, 
  trackSwingProgress, 
  manageSwingLibrary, 
  findBestSwingOfSession,
  highlightBestSwingCharacteristics 
} from '@/lib/swing-comparison';

export default function TestSwingComparisonPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'comparison' | 'progress' | 'library'>('comparison');
  
  // Swing data
  const [userSessions, setUserSessions] = useState<SwingSession[]>([]);
  const [proSwings, setProSwings] = useState<ProGolferSwing[]>([]);
  const [currentComparison, setCurrentComparison] = useState<SwingComparisonResult | null>(null);
  const [progressTracking, setProgressTracking] = useState<ProgressTracking | null>(null);
  const [swingLibrary, setSwingLibrary] = useState<SwingLibrary | null>(null);
  const [bestSwing, setBestSwing] = useState<SwingSession | null>(null);

  // Mock data generation
  const generateMockUserSessions = useCallback(() => {
    const sessions: SwingSession[] = [];
    const sessionCount = 10;
    
    for (let i = 0; i < sessionCount; i++) {
      const session: SwingSession = {
        id: `session-${i}`,
        timestamp: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // One day apart
        poses: generateMockPoses(),
        phases: generateMockPhases(),
        metrics: generateMockMetrics(),
        tags: ['practice', 'driver', 'improvement'],
        category: 'practice' as SwingCategory,
        notes: `Practice session ${i + 1} - Working on swing tempo`,
        bestSwing: i === 2, // Make session 3 the best
        sessionName: `Practice Session ${i + 1}`,
        location: 'Local Golf Course',
        weather: 'Sunny',
        equipment: 'Driver'
      };
      sessions.push(session);
    }
    
    setUserSessions(sessions);
  }, []);

  const generateMockProSwings = useCallback(() => {
    const proSwings: ProGolferSwing[] = [
      {
        id: 'pro-tiger-woods',
        golferName: 'Tiger Woods',
        golferInfo: {
          name: 'Tiger Woods',
          ranking: 1,
          specialty: 'Power and Precision',
          achievements: ['15 Major Championships', '82 PGA Tour Wins']
        },
        swingData: {
          poses: generateMockPoses(),
          phases: generateMockPhases(),
          metrics: generateMockMetrics()
        },
        swingType: 'driver',
        difficulty: 'professional',
        description: 'Classic Tiger Woods driver swing with perfect tempo and power',
        keyPoints: ['Smooth tempo', 'Perfect weight transfer', 'Consistent spine angle'],
        videoUrl: '/pro-swings/tiger-woods-driver.mp4',
        thumbnailUrl: '/pro-swings/tiger-woods-thumb.jpg'
      },
      {
        id: 'pro-rory-mcilroy',
        golferName: 'Rory McIlroy',
        golferInfo: {
          name: 'Rory McIlroy',
          ranking: 2,
          specialty: 'Swing Speed and Power',
          achievements: ['4 Major Championships', '25 PGA Tour Wins']
        },
        swingData: {
          poses: generateMockPoses(),
          phases: generateMockPhases(),
          metrics: generateMockMetrics()
        },
        swingType: 'driver',
        difficulty: 'professional',
        description: 'Rory McIlroy\'s powerful driver swing with explosive tempo',
        keyPoints: ['Explosive tempo', 'Maximum power', 'Perfect follow-through'],
        videoUrl: '/pro-swings/rory-mcilroy-driver.mp4',
        thumbnailUrl: '/pro-swings/rory-mcilroy-thumb.jpg'
      }
    ];
    
    setProSwings(proSwings);
  }, []);

  const generateMockPoses = (): PoseResult[] => {
    const poses: PoseResult[] = [];
    const frameCount = 150; // 5 seconds at 30fps
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / 30;
      const progress = i / frameCount;
      
      const landmarks = Array.from({ length: 33 }, (_, index) => ({
        x: 0.5 + Math.sin(progress * Math.PI * 2) * 0.1,
        y: 0.5 + Math.cos(progress * Math.PI * 2) * 0.1,
        visibility: 0.9
      }));
      
      poses.push({
        landmarks,
        timestamp: time,
        confidence: 0.9
      });
    }
    
    return poses;
  };

  const generateMockPhases = (): EnhancedSwingPhase[] => {
    return [
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
        recommendations: ['Maintain steady posture']
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
        recommendations: ['Smooth tempo transition']
      },
      {
        name: 'downswing',
        startTime: 2.5,
        endTime: 4,
        startFrame: 75,
        endFrame: 120,
        duration: 1.5,
        confidence: 0.88,
        grade: 'A',
        color: '#ff0000',
        keyPoints: [105],
        metrics: { tempo: 0.85, balance: 0.9, posture: 0.88 },
        recommendations: ['Great power generation']
      },
      {
        name: 'follow-through',
        startTime: 4,
        endTime: 5,
        startFrame: 120,
        endFrame: 150,
        duration: 1,
        confidence: 0.87,
        grade: 'B+',
        color: '#00ffff',
        keyPoints: [135],
        metrics: { tempo: 0.8, balance: 0.85, posture: 0.82 },
        recommendations: ['Hold finish position longer']
      }
    ];
  };

  const generateMockMetrics = () => {
    return {
      clubPath: {
        pathType: 'straight' as const,
        pathDeviation: 0.05,
        pathConsistency: 0.85,
        insideOutRatio: 0.3,
        outsideInRatio: 0.2,
        pathEfficiency: 0.82,
        recommendations: ['Excellent club path']
      },
      swingPlane: {
        planeAngle: 45,
        planeConsistency: 0.88,
        planeStability: 0.85,
        efficiencyScore: 0.86,
        idealPlaneDeviation: 2.5,
        planeRecommendations: ['Great swing plane']
      },
      weightTransfer: {
        pressureShift: 0.6,
        weightTransferSmoothness: 0.82,
        weightTransferTiming: 0.85,
        pressureDistribution: { leftFoot: 0.4, rightFoot: 0.6, centerOfPressure: 0.5 },
        transferEfficiency: 0.83,
        recommendations: ['Good weight transfer']
      },
      spineAngle: {
        averageSpineAngle: 12,
        spineAngleVariance: 2.5,
        consistencyScore: 0.87,
        spineStability: 0.85,
        maxDeviation: 5,
        spineRecommendations: ['Consistent spine angle']
      },
      headStability: {
        headPositionVariance: 0.002,
        headMovementRange: 0.05,
        stabilityScore: 0.89,
        headStillness: 0.87,
        movementPattern: 'stable' as const,
        stabilityRecommendations: ['Excellent head stability']
      },
      overallProfessionalScore: 0.85,
      professionalGrade: 'A-',
      keyRecommendations: ['Great overall swing!']
    };
  };

  // Initialize data
  useEffect(() => {
    generateMockUserSessions();
    generateMockProSwings();
  }, [generateMockUserSessions, generateMockProSwings]);

  // Update progress tracking and library when sessions change
  useEffect(() => {
    if (userSessions.length > 0) {
      const progress = trackSwingProgress(userSessions);
      setProgressTracking(progress);
      
      const library = manageSwingLibrary(userSessions);
      setSwingLibrary(library);
      
      const best = findBestSwingOfSession(userSessions);
      setBestSwing(best);
    }
  }, [userSessions]);

  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleSwingSelect = useCallback((swing: SwingSession) => {
    // Find a pro swing to compare with
    const proSwing = proSwings[0]; // Use first pro swing for demo
    if (proSwing) {
      const comparison = compareSwingWithPro(swing, proSwing);
      setCurrentComparison(comparison);
    }
  }, [proSwings]);

  const handleSwingDelete = useCallback((swingId: string) => {
    setUserSessions(prev => prev.filter(s => s.id !== swingId));
  }, []);

  const handleSwingTag = useCallback((swingId: string, tags: string[]) => {
    setUserSessions(prev => prev.map(s => 
      s.id === swingId ? { ...s, tags } : s
    ));
  }, []);

  const handleSwingCategorize = useCallback((swingId: string, category: SwingCategory) => {
    setUserSessions(prev => prev.map(s => 
      s.id === swingId ? { ...s, category } : s
    ));
  }, []);

  const handleFilterChange = useCallback((filters: SwingLibrary['filters']) => {
    if (swingLibrary) {
      const updatedLibrary = manageSwingLibrary(userSessions, filters);
      setSwingLibrary(updatedLibrary);
    }
  }, [swingLibrary, userSessions]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Swing Comparison & Analysis
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('comparison')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'comparison' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Swing Comparison
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'progress' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Progress Tracking
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'library' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Swing Library
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'comparison' && (
              <div className="space-y-6">
                {/* Video Player */}
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
                  
                  {/* Comparison Overlay */}
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  
                  {currentComparison && (
                    <SwingComparisonVisualization
                      videoRef={videoRef}
                      canvasRef={canvasRef}
                      comparisonResult={currentComparison}
                      currentTime={currentTime}
                      showSideBySide={true}
                      showMetrics={true}
                      showRecommendations={true}
                      className="absolute inset-0"
                    />
                  )}
                </div>

                {/* Comparison Controls */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Comparison Controls</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Swing:</label>
                      <select className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600">
                        {userSessions.map(session => (
                          <option key={session.id} value={session.id}>
                            {session.sessionName} - {session.metrics.professionalGrade}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Pro Golfer:</label>
                      <select className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600">
                        {proSwings.map(proSwing => (
                          <option key={proSwing.id} value={proSwing.id}>
                            {proSwing.golferInfo.name} - {proSwing.golferInfo.specialty}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'progress' && progressTracking && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Progress Tracking</h3>
                  <ProgressTrackingVisualization
                    progressTracking={progressTracking}
                    selectedMetric="overallScore"
                    timeRange="month"
                    showTrends={true}
                    showMilestones={true}
                    className="h-96"
                  />
                </div>
              </div>
            )}

            {activeTab === 'library' && swingLibrary && (
              <div className="bg-gray-800 rounded-lg">
                <SwingLibraryManager
                  swingLibrary={swingLibrary}
                  onSwingSelect={handleSwingSelect}
                  onSwingDelete={handleSwingDelete}
                  onSwingTag={handleSwingTag}
                  onSwingCategorize={handleSwingCategorize}
                  onFilterChange={handleFilterChange}
                  className="h-96"
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Best Swing Highlight */}
            {bestSwing && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Best Swing of Session</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Session:</span>
                    <span className="text-sm text-white">{bestSwing.sessionName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Score:</span>
                    <span className="text-sm text-white">{(bestSwing.metrics.overallProfessionalScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Grade:</span>
                    <span className="text-sm text-white">{bestSwing.metrics.professionalGrade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Date:</span>
                    <span className="text-sm text-white">{bestSwing.timestamp.toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleSwingSelect(bestSwing)}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Compare with Pro
                </button>
              </div>
            )}

            {/* Pro Golfers */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Pro Golfers</h3>
              <div className="space-y-3">
                {proSwings.map(proSwing => (
                  <div key={proSwing.id} className="border border-gray-600 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{proSwing.golferInfo.name}</h4>
                      <span className="text-sm text-gray-400">#{proSwing.golferInfo.ranking}</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{proSwing.golferInfo.specialty}</p>
                    <p className="text-xs text-gray-400">{proSwing.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Comparison Features</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Side-by-side comparison with pro golfers</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Progress tracking over multiple sessions</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Swing library with tagging and categorization</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Best swing of the session highlighting</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Similarity scoring and recommendations</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Progress trends and milestones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
