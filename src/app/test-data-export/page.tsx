'use client';

import React, { useState, useCallback, useRef } from 'react';
import DataExportManager from '@/components/export/DataExportManager';
import HealthIntegrationManager from '@/components/export/HealthIntegrationManager';
import VideoExportManager from '@/components/export/VideoExportManager';
import type { SwingMetrics } from '@/lib/data-export-integration';
import type { PoseResult } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export default function TestDataExportPage() {
  const [activeTab, setActiveTab] = useState<'export' | 'health' | 'video'>('export');
  const [swingMetrics, setSwingMetrics] = useState<SwingMetrics[]>([]);
  const [poses, setPoses] = useState<PoseResult[]>([]);
  const [phases, setPhases] = useState<EnhancedSwingPhase[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [exportResults, setExportResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Generate mock data
  const generateMockData = useCallback(() => {
    setIsLoading(true);

    // Generate mock swing metrics
    const mockSwingMetrics: SwingMetrics[] = Array.from({ length: 5 }, (_, i) => ({
      sessionId: `session-${i + 1}`,
      studentId: 'student-1',
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      overallScore: 0.7 + Math.random() * 0.3,
      phases: [
        {
          phaseName: 'address',
          startTime: 0,
          endTime: 1,
          duration: 1,
          grade: 'A',
          confidence: 0.95,
          tempo: 0.8,
          balance: 0.9,
          posture: 0.85,
          power: 0.7,
          accuracy: 0.8
        },
        {
          phaseName: 'backswing',
          startTime: 1,
          endTime: 2.5,
          duration: 1.5,
          grade: 'B+',
          confidence: 0.9,
          tempo: 0.7,
          balance: 0.8,
          posture: 0.75,
          power: 0.6,
          accuracy: 0.7
        },
        {
          phaseName: 'downswing',
          startTime: 2.5,
          endTime: 4,
          duration: 1.5,
          grade: 'A',
          confidence: 0.88,
          tempo: 0.85,
          balance: 0.9,
          posture: 0.88,
          power: 0.9,
          accuracy: 0.85
        },
        {
          phaseName: 'follow-through',
          startTime: 4,
          endTime: 5,
          duration: 1,
          grade: 'B+',
          confidence: 0.87,
          tempo: 0.8,
          balance: 0.85,
          posture: 0.82,
          power: 0.8,
          accuracy: 0.8
        }
      ],
      faults: [
        {
          faultId: `fault-${i}-1`,
          faultName: 'Over-the-Top Swing',
          severity: 'high',
          category: 'technique',
          confidence: 0.8,
          detectedAt: 2.5,
          impactOnScore: 0.3,
          correctionSuggestions: ['Practice inside-out swing', 'Use alignment sticks']
        },
        {
          faultId: `fault-${i}-2`,
          faultName: 'Early Release',
          severity: 'medium',
          category: 'timing',
          confidence: 0.7,
          detectedAt: 3.5,
          impactOnScore: 0.2,
          correctionSuggestions: ['Maintain wrist angle longer', 'Use impact bag drill']
        }
      ],
      drills: [
        {
          drillId: `drill-${i}-1`,
          drillName: 'Grip Strengthening Drill',
          category: 'technique',
          difficulty: 'beginner',
          duration: 10,
          repetitions: 3,
          effectivenessScore: 0.8,
          completionRate: 0.9,
          improvementRate: 0.1
        },
        {
          drillId: `drill-${i}-2`,
          drillName: 'Tempo Training',
          category: 'timing',
          difficulty: 'intermediate',
          duration: 15,
          repetitions: 5,
          effectivenessScore: 0.75,
          completionRate: 0.8,
          improvementRate: 0.15
        }
      ],
      progress: {
        currentScore: 0.75 + Math.random() * 0.2,
        previousScore: 0.7 + Math.random() * 0.2,
        improvement: 0.05 + Math.random() * 0.1,
        trend: 'improving',
        milestones: [
          {
            milestoneId: `milestone-${i}-1`,
            name: 'Break 80',
            achievedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
            metric: 'score',
            value: 79,
            category: 'scoring'
          }
        ],
        goals: [
          {
            goalId: `goal-${i}-1`,
            title: 'Improve Consistency',
            targetValue: 0.9,
            currentValue: 0.75 + Math.random() * 0.1,
            progress: 0.8,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isAchieved: false
          }
        ]
      },
      health: {
        heartRate: 70 + Math.random() * 20,
        caloriesBurned: 200 + Math.random() * 100,
        steps: 4000 + Math.random() * 2000,
        distance: 2 + Math.random() * 2,
        duration: 30 + Math.random() * 30,
        intensity: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
        recoveryTime: 12 + Math.random() * 24
      }
    }));

    // Generate mock poses
    const mockPoses: PoseResult[] = Array.from({ length: 150 }, (_, i) => ({
      landmarks: Array.from({ length: 33 }, (_, j) => ({
        x: 0.5 + Math.sin(i * 0.1) * 0.1,
        y: 0.5 + Math.cos(i * 0.1) * 0.1,
        visibility: 0.9
      })),
      worldLandmarks: Array.from({ length: 33 }, (_, j) => ({
        x: 0.5 + Math.sin(i * 0.1) * 0.1,
        y: 0.5 + Math.cos(i * 0.1) * 0.1,
        z: 0.1,
        visibility: 0.9
      })),
      timestamp: i / 30,
      confidence: 0.9,

      worldLandmarks: landmarks.map(lm => ({ ...lm, z: 0,

      worldLandmarks: landmarks.map(lm => ({ ...lm, z: 0 })) }))
    }));

    // Generate mock phases
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
        recommendations: ['Great power generation'],

        description: "Phase description",

        professionalBenchmark: {

          idealDuration: 1.0,

          keyPositions: [],

          commonMistakes: []

        }
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
        recommendations: ['Hold finish position longer'],

        description: "Phase description",

        professionalBenchmark: {

          idealDuration: 1.0,

          keyPositions: [],

          commonMistakes: []

        }
      }
    ];

    // Generate mock annotations
    const mockAnnotations = [
      {
        id: 'annotation-1',
        type: 'arrow',
        position: { x: 100, y: 100 },
        size: 50,
        color: '#ffff00',
        timestamp: 1.5
      },
      {
        id: 'annotation-2',
        type: 'circle',
        position: { x: 200, y: 150 },
        size: 30,
        color: '#ff0000',
        timestamp: 3.0
      },
      {
        id: 'annotation-3',
        type: 'text',
        position: { x: 300, y: 200 },
        content: 'Great tempo!',
        timestamp: 2.0
      }
    ];

    // Generate mock voice notes
    const mockVoiceNotes = [
      {
        id: 'voice-1',
        timestamp: 1.0,
        duration: 5,
        transcription: 'Good setup position',
        category: 'positive'
      },
      {
        id: 'voice-2',
        timestamp: 2.5,
        duration: 3,
        transcription: 'Smooth transition',
        category: 'positive'
      },
      {
        id: 'voice-3',
        timestamp: 4.0,
        duration: 4,
        transcription: 'Hold the finish',
        category: 'instruction'
      }
    ];

    setSwingMetrics(mockSwingMetrics);
    setPoses(mockPoses);
    setPhases(mockPhases);
    setAnnotations(mockAnnotations);
    setVoiceNotes(mockVoiceNotes);
    setIsLoading(false);
  }, []);

  // Handle export completion
  const handleExportComplete = useCallback((format: string, data: any) => {
    const result = {
      id: `export-${Date.now()}`,
      format,
      timestamp: new Date(),
      data: data
    };
    setExportResults(prev => [result, ...prev]);
  }, []);

  // Handle export error
  const handleExportError = useCallback((error: string) => {
    console.error('Export error:', error);
  }, []);

  // Handle health data update
  const handleHealthDataUpdate = useCallback((data: any) => {
    setHealthData(data);
  }, []);

  // Handle integration status change
  const handleIntegrationStatusChange = useCallback((status: string) => {
    console.log('Integration status changed:', status);
  }, []);

  // Initialize mock data on component mount
  React.useEffect(() => {
    generateMockData();
  }, [generateMockData]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Data Export & Integration
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="flex space-x-4">
                {[
                  { id: 'export', label: 'Data Export', icon: '📊' },
                  { id: 'health', label: 'Health Integration', icon: '❤️' },
                  { id: 'video', label: 'Video Export', icon: '🎥' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'export' && (
              <DataExportManager
                swingMetrics={swingMetrics}
                poses={poses}
                phases={phases}
                annotations={annotations}
                voiceNotes={voiceNotes}
                onExportComplete={handleExportComplete}
                onExportError={handleExportError}
                className="h-96"
              />
            )}

            {activeTab === 'health' && (
              <HealthIntegrationManager
                onHealthDataUpdate={handleHealthDataUpdate}
                onIntegrationStatusChange={handleIntegrationStatusChange}
                className="h-96"
              />
            )}

            {activeTab === 'video' && (
              <VideoExportManager
                videoElement={videoRef.current!}
                poses={poses}
                phases={phases}
                annotations={annotations}
                voiceNotes={voiceNotes}
                onExportComplete={handleExportComplete}
                onExportError={handleExportError}
                className="h-96"
              />
            )}

            {/* Export Results */}
            {exportResults.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Recent Exports</h3>
                <div className="space-y-3">
                  {exportResults.slice(0, 5).map(result => (
                    <div key={result.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-medium text-white">
                            {result.format.toUpperCase()} Export
                          </h4>
                          <p className="text-xs text-gray-400">
                            {result.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-400">Completed</span>
                          <button
                            onClick={() => {
                              // Handle download or view
                              console.log('View export:', result);
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Data Summary */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Data Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Swing Sessions:</span>
                  <span className="text-white">{swingMetrics.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Pose Frames:</span>
                  <span className="text-white">{poses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Swing Phases:</span>
                  <span className="text-white">{phases.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Annotations:</span>
                  <span className="text-white">{annotations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Voice Notes:</span>
                  <span className="text-white">{voiceNotes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Export Results:</span>
                  <span className="text-white">{exportResults.length}</span>
                </div>
              </div>
            </div>

            {/* Export Features */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Export Features</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>CSV export for swing metrics</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>API for integration with other golf apps</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Apple Health/Garmin Connect integration</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Video export with overlay graphics</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Multiple export formats (CSV, JSON, XML, Excel)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Real-time health data sync</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Customizable video overlays</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Progress tracking and analytics</span>
                </div>
              </div>
            </div>

            {/* Health Data */}
            {healthData && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Health Data</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Heart Rate:</span>
                    <span className="text-white">{healthData.heartRate} bpm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Calories:</span>
                    <span className="text-white">{healthData.caloriesBurned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Steps:</span>
                    <span className="text-white">{healthData.steps.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Distance:</span>
                    <span className="text-white">{healthData.distance.toFixed(1)} mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Duration:</span>
                    <span className="text-white">{healthData.duration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Intensity:</span>
                    <span className="text-white capitalize">{healthData.intensity}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={generateMockData}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Generating...' : 'Generate Mock Data'}
                </button>
                <button
                  onClick={() => setActiveTab('export')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Export Data
                </button>
                <button
                  onClick={() => setActiveTab('health')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Health Integration
                </button>
                <button
                  onClick={() => setActiveTab('video')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Video Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Video Element for Video Export */}
      <video ref={videoRef} className="hidden" />
    </div>
  );
}
