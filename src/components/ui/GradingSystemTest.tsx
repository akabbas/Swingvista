"use client";

import React, { useState, useCallback } from 'react';
import { ComprehensiveGolfGradingSystem } from '@/lib/comprehensive-golf-grading';
import { PoseResult } from '@/lib/mediapipe';
import { SwingPhase } from '@/lib/swing-phases';
import ComprehensiveGradingDisplay from './ComprehensiveGradingDisplay';

interface GradingSystemTestProps {
  className?: string;
}

const GradingSystemTest: React.FC<GradingSystemTestProps> = ({ className = "" }) => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const generateMockPoseData = useCallback((): PoseResult[] => {
    const poses: PoseResult[] = [];
    const frameCount = 120; // 4 seconds at 30fps
    
    for (let i = 0; i < frameCount; i++) {
      const progress = i / frameCount;
      
      // Simulate a professional-quality golf swing
      const pose: PoseResult = {
        landmarks: [
          // Nose (0)
          {
            x: 0.5 + Math.sin(progress * Math.PI) * 0.05,
            y: 0.3 + Math.cos(progress * Math.PI) * 0.02,
            z: 0,
            visibility: 0.95
          },
          // Left eye (1) - Right eye (2)
          { x: 0.48, y: 0.28, z: 0, visibility: 0.95 },
          { x: 0.52, y: 0.28, z: 0, visibility: 0.95 },
          // Left ear (3) - Right ear (4)
          { x: 0.45, y: 0.3, z: 0, visibility: 0.9 },
          { x: 0.55, y: 0.3, z: 0, visibility: 0.9 },
          // Mouth landmarks (5-10)
          { x: 0.5, y: 0.35, z: 0, visibility: 0.95 },
          { x: 0.48, y: 0.36, z: 0, visibility: 0.95 },
          { x: 0.52, y: 0.36, z: 0, visibility: 0.95 },
          { x: 0.49, y: 0.37, z: 0, visibility: 0.95 },
          { x: 0.51, y: 0.37, z: 0, visibility: 0.95 },
          { x: 0.5, y: 0.38, z: 0, visibility: 0.95 },
          // Left shoulder (11) - Right shoulder (12)
          {
            x: 0.4 + Math.sin(progress * Math.PI * 2) * 0.25,
            y: 0.5 + Math.cos(progress * Math.PI * 2) * 0.12,
            z: 0,
            visibility: 0.95
          },
          {
            x: 0.6 + Math.sin(progress * Math.PI * 2) * 0.25,
            y: 0.5 + Math.cos(progress * Math.PI * 2) * 0.12,
            z: 0,
            visibility: 0.95
          },
          // Left elbow (13) - Right elbow (14)
          {
            x: 0.35 + Math.sin(progress * Math.PI * 2) * 0.35,
            y: 0.6 + Math.cos(progress * Math.PI * 2) * 0.18,
            z: 0,
            visibility: 0.9
          },
          {
            x: 0.65 + Math.sin(progress * Math.PI * 2) * 0.35,
            y: 0.6 + Math.cos(progress * Math.PI * 2) * 0.18,
            z: 0,
            visibility: 0.9
          },
          // Left wrist (15) - Right wrist (16)
          {
            x: 0.3 + Math.sin(progress * Math.PI * 2) * 0.45,
            y: 0.7 + Math.cos(progress * Math.PI * 2) * 0.25,
            z: 0,
            visibility: 0.9
          },
          {
            x: 0.7 + Math.sin(progress * Math.PI * 2) * 0.45,
            y: 0.7 + Math.cos(progress * Math.PI * 2) * 0.25,
            z: 0,
            visibility: 0.9
          },
          // Left pinky (17) - Right pinky (18)
          { x: 0.28, y: 0.72, z: 0, visibility: 0.8 },
          { x: 0.72, y: 0.72, z: 0, visibility: 0.8 },
          // Left index (19) - Right index (20)
          { x: 0.32, y: 0.68, z: 0, visibility: 0.8 },
          { x: 0.68, y: 0.68, z: 0, visibility: 0.8 },
          // Left thumb (21) - Right thumb (22)
          { x: 0.31, y: 0.69, z: 0, visibility: 0.8 },
          { x: 0.69, y: 0.69, z: 0, visibility: 0.8 },
          // Left hip (23) - Right hip (24)
          {
            x: 0.45 + Math.sin(progress * Math.PI) * 0.08,
            y: 0.8 + Math.cos(progress * Math.PI) * 0.03,
            z: 0,
            visibility: 0.95
          },
          {
            x: 0.55 + Math.sin(progress * Math.PI) * 0.08,
            y: 0.8 + Math.cos(progress * Math.PI) * 0.03,
            z: 0,
            visibility: 0.95
          },
          // Left knee (25) - Right knee (26)
          {
            x: 0.44 + Math.sin(progress * Math.PI) * 0.06,
            y: 0.9 + Math.cos(progress * Math.PI) * 0.02,
            z: 0,
            visibility: 0.9
          },
          {
            x: 0.56 + Math.sin(progress * Math.PI) * 0.06,
            y: 0.9 + Math.cos(progress * Math.PI) * 0.02,
            z: 0,
            visibility: 0.9
          },
          // Left ankle (27) - Right ankle (28)
          {
            x: 0.43 + Math.sin(progress * Math.PI) * 0.04,
            y: 0.95 + Math.cos(progress * Math.PI) * 0.01,
            z: 0,
            visibility: 0.9
          },
          {
            x: 0.57 + Math.sin(progress * Math.PI) * 0.04,
            y: 0.95 + Math.cos(progress * Math.PI) * 0.01,
            z: 0,
            visibility: 0.9
          },
          // Left heel (29) - Right heel (30)
          { x: 0.42, y: 0.97, z: 0, visibility: 0.8 },
          { x: 0.58, y: 0.97, z: 0, visibility: 0.8 },
          // Left foot index (31) - Right foot index (32)
          { x: 0.44, y: 0.96, z: 0, visibility: 0.8 },
          { x: 0.56, y: 0.96, z: 0, visibility: 0.8 }
        ],
        worldLandmarks: [],
        timestamp: i * 33 // 30fps
      };
      
      poses.push(pose);
    }
    
    return poses;
  }, []);

  const generateMockPhases = useCallback((): SwingPhase[] => {
    return [
      { 
        name: 'address' as const, 
        startTime: 0, 
        endTime: 200, 
        startFrame: 0, 
        endFrame: 6, 
        duration: 200,
        keyLandmarks: [],
        color: '#3B82F6',
        description: 'Setup position',
        confidence: 0.9,
        keyMetrics: {}
      },
      { 
        name: 'backswing' as const, 
        startTime: 200, 
        endTime: 1400, 
        startFrame: 6, 
        endFrame: 42, 
        duration: 1200,
        keyLandmarks: [],
        color: '#10B981',
        description: 'Backswing motion',
        confidence: 0.9,
        keyMetrics: {}
      },
      { 
        name: 'downswing' as const, 
        startTime: 1400, 
        endTime: 1800, 
        startFrame: 42, 
        endFrame: 54, 
        duration: 400,
        keyLandmarks: [],
        color: '#F59E0B',
        description: 'Downswing motion',
        confidence: 0.9,
        keyMetrics: {}
      },
      { 
        name: 'impact' as const, 
        startTime: 1800, 
        endTime: 1900, 
        startFrame: 54, 
        endFrame: 57, 
        duration: 100,
        keyLandmarks: [],
        color: '#EF4444',
        description: 'Impact position',
        confidence: 0.9,
        keyMetrics: {}
      },
      { 
        name: 'follow-through' as const, 
        startTime: 1900, 
        endTime: 2000, 
        startFrame: 57, 
        endFrame: 60, 
        duration: 100,
        keyLandmarks: [],
        color: '#8B5CF6',
        description: 'Follow through',
        confidence: 0.9,
        keyMetrics: {}
      }
    ];
  }, []);

  const generateMockTrajectory = useCallback((): any => {
    const points = [];
    for (let i = 0; i < 120; i++) {
      const progress = i / 120;
      points.push({
        x: 0.5 + Math.sin(progress * Math.PI * 2) * 0.4,
        y: 0.7 + Math.cos(progress * Math.PI * 2) * 0.2,
        z: 0,
        timestamp: i * 33
      });
    }
    
    return {
      clubhead: points,
      rightWrist: points,
      leftWrist: points
    };
  }, []);

  const runGradingTest = useCallback(async () => {
    setIsRunning(true);
    
    try {
      const poses = generateMockPoseData();
      const phases = generateMockPhases();
      const trajectory = generateMockTrajectory();
      
      console.log('Running comprehensive grading test...');
      console.log('Poses:', poses.length);
      console.log('Phases:', phases.length);
      console.log('Trajectory points:', trajectory.rightWrist.length);
      
      // Test the comprehensive grading system
      const gradingSystem = new ComprehensiveGolfGradingSystem();
      const grade = gradingSystem.gradeSwing(poses, trajectory, phases, 'driver');
      
      setTestResults(grade);
      console.log('Grading test complete:', grade);
      
    } catch (error) {
      console.error('Grading test failed:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        grade: null
      });
    } finally {
      setIsRunning(false);
    }
  }, [generateMockPoseData, generateMockPhases, generateMockTrajectory]);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">🏌️</span>
          Comprehensive Golf Grading System Test
        </h3>
        
        <div className="space-y-4">
          <button
            onClick={runGradingTest}
            disabled={isRunning}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-green-300 transition-colors"
          >
            {isRunning ? 'Running Test...' : 'Test Comprehensive Grading System'}
          </button>
          
          {testResults && (
            <div className="space-y-4">
              {testResults.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Test Failed</h4>
                  <p className="text-red-700 text-sm">{testResults.error}</p>
                </div>
              ) : (
                <ComprehensiveGradingDisplay grade={testResults} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradingSystemTest;
