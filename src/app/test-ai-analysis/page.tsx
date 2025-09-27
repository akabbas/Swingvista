'use client';

import React, { useState, useCallback, useEffect } from 'react';
import AIAnalysisVisualizer from '@/components/ai/AIAnalysisVisualizer';
import ProgressPredictionDashboard from '@/components/ai/ProgressPredictionDashboard';
import InjuryPreventionAlerts from '@/components/ai/InjuryPreventionAlerts';
import { AIAnalysisOrchestrator, type AIAnalysisResult } from '@/lib/ai-predictive-analysis';
import type { PoseResult } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export default function TestAIAnalysisPage() {
  const [aiOrchestrator] = useState(() => new AIAnalysisOrchestrator());
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState('student-1');
  const [activeTab, setActiveTab] = useState<'overview' | 'faults' | 'drills' | 'progress' | 'injury'>('overview');

  // Mock data for demonstration
  const mockStudents = [
    { id: 'student-1', name: 'John Smith', level: 'Intermediate', currentScore: 0.75 },
    { id: 'student-2', name: 'Sarah Johnson', level: 'Beginner', currentScore: 0.45 },
    { id: 'student-3', name: 'Mike Davis', level: 'Advanced', currentScore: 0.85 }
  ];

  const mockPoses: PoseResult[] = Array.from({ length: 150 }, (_, i) => ({
    landmarks: Array.from({ length: 33 }, (_, j) => ({
      x: 0.5 + Math.sin(i * 0.1) * 0.1,
      y: 0.5 + Math.cos(i * 0.1) * 0.1,
      visibility: 0.9
    })),
    timestamp: i / 30,
    confidence: 0.9
  }));

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

  const mockStudentProfile = {
    experience: 'intermediate',
    fitnessLevel: 'medium',
    practiceFrequency: 0.7,
    lessonAttendance: 0.8,
    faultCorrectionRate: 0.6,
    consistency: 0.5,
    techniqueImprovement: 0.4,
    commitment: 0.6,
    coachingQuality: 0.7,
    goalAchievementRate: 0.5,
    currentScore: 0.75
  };

  const mockPreferences = {
    availableTime: 30,
    focusAreas: ['technique', 'consistency'],
    difficulty: 'intermediate'
  };

  const mockPracticeHistory = [
    { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), score: 0.72, duration: 45 },
    { date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), score: 0.68, duration: 30 },
    { date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), score: 0.65, duration: 60 }
  ];

  // Perform AI analysis
  const performAIAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate analysis progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await aiOrchestrator.performAIAnalysis(
        selectedStudent,
        mockPoses,
        mockPhases,
        mockStudentProfile,
        mockPreferences,
        mockPracticeHistory
      );

      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setAnalysisResult(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [aiOrchestrator, selectedStudent]);

  // Handle drill selection
  const handleDrillSelect = useCallback((drill: any) => {
    console.log('Drill selected:', drill);
  }, []);

  // Handle fault selection
  const handleFaultSelect = useCallback((fault: any) => {
    console.log('Fault selected:', fault);
  }, []);

  // Handle alert selection
  const handleAlertSelect = useCallback((alert: any) => {
    console.log('Alert selected:', alert);
  }, []);

  // Handle milestone selection
  const handleMilestoneSelect = useCallback((milestone: any) => {
    console.log('Milestone selected:', milestone);
  }, []);

  // Handle factor selection
  const handleFactorSelect = useCallback((factor: any) => {
    console.log('Factor selected:', factor);
  }, []);

  // Handle risk selection
  const handleRiskSelect = useCallback((risk: any) => {
    console.log('Risk selected:', risk);
  }, []);

  // Handle alert dismiss
  const handleAlertDismiss = useCallback((alertId: string) => {
    console.log('Alert dismissed:', alertId);
  }, []);

  // Handle alert acknowledge
  const handleAlertAcknowledge = useCallback((alertId: string) => {
    console.log('Alert acknowledged:', alertId);
  }, []);

  // Auto-analyze on student change
  useEffect(() => {
    if (selectedStudent) {
      performAIAnalysis();
    }
  }, [selectedStudent, performAIAnalysis]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          AI Predictive Analysis
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Student Selection */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <h3 className="text-lg font-semibold">Select Student</h3>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  {mockStudents.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.level})
                    </option>
                  ))}
                </select>
                <button
                  onClick={performAIAnalysis}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
                </button>
              </div>

              {/* Analysis Progress */}
              {isAnalyzing && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>AI Analysis Progress</span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="space-y-6">
                {/* AI Analysis Visualizer */}
                <AIAnalysisVisualizer
                  analysisResult={analysisResult}
                  onDrillSelect={handleDrillSelect}
                  onFaultSelect={handleFaultSelect}
                  onAlertSelect={handleAlertSelect}
                  className="h-96"
                />

                {/* Progress Prediction Dashboard */}
                <ProgressPredictionDashboard
                  prediction={analysisResult.progressPrediction}
                  onMilestoneSelect={handleMilestoneSelect}
                  onFactorSelect={handleFactorSelect}
                  onRiskSelect={handleRiskSelect}
                  className="h-96"
                />

                {/* Injury Prevention Alerts */}
                <InjuryPreventionAlerts
                  alerts={analysisResult.injuryAlerts}
                  onAlertSelect={handleAlertSelect}
                  onAlertDismiss={handleAlertDismiss}
                  onAlertAcknowledge={handleAlertAcknowledge}
                  className="h-96"
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Features */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">AI Features</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Swing fault detection and correction suggestions</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Personalized drill recommendations</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Progress prediction and goal setting</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Injury prevention alerts</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Machine learning analysis</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span>Predictive analytics</span>
                </div>
              </div>
            </div>

            {/* Analysis Summary */}
            {analysisResult && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Overall Score:</span>
                    <span className="text-sm text-white">
                      {(analysisResult.overallScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Faults Detected:</span>
                    <span className="text-sm text-white">{analysisResult.swingFaults.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Recommended Drills:</span>
                    <span className="text-sm text-white">{analysisResult.personalizedDrills.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Injury Alerts:</span>
                    <span className="text-sm text-white">{analysisResult.injuryAlerts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Predicted Score:</span>
                    <span className="text-sm text-white">
                      {(analysisResult.progressPrediction.predictedScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Confidence:</span>
                    <span className="text-sm text-white">
                      {(analysisResult.progressPrediction.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Student Profile */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Student Profile</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Experience:</span>
                  <span className="text-white">{mockStudentProfile.experience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Fitness Level:</span>
                  <span className="text-white">{mockStudentProfile.fitnessLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Practice Frequency:</span>
                  <span className="text-white">
                    {(mockStudentProfile.practiceFrequency * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Lesson Attendance:</span>
                  <span className="text-white">
                    {(mockStudentProfile.lessonAttendance * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Current Score:</span>
                  <span className="text-white">
                    {(mockStudentProfile.currentScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  View Overview
                </button>
                <button
                  onClick={() => setActiveTab('faults')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Analyze Faults
                </button>
                <button
                  onClick={() => setActiveTab('drills')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  View Drills
                </button>
                <button
                  onClick={() => setActiveTab('progress')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Check Progress
                </button>
                <button
                  onClick={() => setActiveTab('injury')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Injury Alerts
                </button>
              </div>
            </div>

            {/* AI Insights */}
            {analysisResult && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-300">
                    <strong>Strengths:</strong> {analysisResult.strengths.join(', ')}
                  </div>
                  <div className="text-gray-300">
                    <strong>Improvement Areas:</strong> {analysisResult.improvementAreas.join(', ')}
                  </div>
                  <div className="text-gray-300">
                    <strong>Key Recommendations:</strong>
                  </div>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {analysisResult.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="text-xs text-gray-400">{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
