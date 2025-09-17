"use client";

import React, { useState, useCallback } from 'react';
import { calculateAccurateSwingMetrics, validateSwingMetrics } from '@/lib/accurate-swing-metrics';
import { PoseResult } from '@/lib/mediapipe';
import { SwingPhase } from '@/lib/swing-phases';

interface MetricsValidationTestProps {
  className?: string;
}

const MetricsValidationTest: React.FC<MetricsValidationTestProps> = ({ className = "" }) => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const generateMockPoseData = useCallback((): PoseResult[] => {
    const poses: PoseResult[] = [];
    const frameCount = 60; // 2 seconds at 30fps
    
    for (let i = 0; i < frameCount; i++) {
      const progress = i / frameCount;
      
      // Simulate a golf swing with realistic pose data
      const pose: PoseResult = {
        landmarks: [
          // Nose (0)
          {
            x: 0.5 + Math.sin(progress * Math.PI) * 0.1,
            y: 0.3 + Math.cos(progress * Math.PI) * 0.05,
            z: 0,
            visibility: 0.9
          },
          // Left eye (1) - Right eye (2)
          { x: 0.48, y: 0.28, z: 0, visibility: 0.9 },
          { x: 0.52, y: 0.28, z: 0, visibility: 0.9 },
          // Left ear (3) - Right ear (4)
          { x: 0.45, y: 0.3, z: 0, visibility: 0.8 },
          { x: 0.55, y: 0.3, z: 0, visibility: 0.8 },
          // Mouth landmarks (5-10)
          { x: 0.5, y: 0.35, z: 0, visibility: 0.9 },
          { x: 0.48, y: 0.36, z: 0, visibility: 0.9 },
          { x: 0.52, y: 0.36, z: 0, visibility: 0.9 },
          { x: 0.49, y: 0.37, z: 0, visibility: 0.9 },
          { x: 0.51, y: 0.37, z: 0, visibility: 0.9 },
          { x: 0.5, y: 0.38, z: 0, visibility: 0.9 },
          // Left shoulder (11) - Right shoulder (12)
          {
            x: 0.4 + Math.sin(progress * Math.PI * 2) * 0.2,
            y: 0.5 + Math.cos(progress * Math.PI * 2) * 0.1,
            z: 0,
            visibility: 0.9
          },
          {
            x: 0.6 + Math.sin(progress * Math.PI * 2) * 0.2,
            y: 0.5 + Math.cos(progress * Math.PI * 2) * 0.1,
            z: 0,
            visibility: 0.9
          },
          // Left elbow (13) - Right elbow (14)
          {
            x: 0.35 + Math.sin(progress * Math.PI * 2) * 0.3,
            y: 0.6 + Math.cos(progress * Math.PI * 2) * 0.15,
            z: 0,
            visibility: 0.8
          },
          {
            x: 0.65 + Math.sin(progress * Math.PI * 2) * 0.3,
            y: 0.6 + Math.cos(progress * Math.PI * 2) * 0.15,
            z: 0,
            visibility: 0.8
          },
          // Left wrist (15) - Right wrist (16)
          {
            x: 0.3 + Math.sin(progress * Math.PI * 2) * 0.4,
            y: 0.7 + Math.cos(progress * Math.PI * 2) * 0.2,
            z: 0,
            visibility: 0.8
          },
          {
            x: 0.7 + Math.sin(progress * Math.PI * 2) * 0.4,
            y: 0.7 + Math.cos(progress * Math.PI * 2) * 0.2,
            z: 0,
            visibility: 0.8
          },
          // Left pinky (17) - Right pinky (18)
          { x: 0.28, y: 0.72, z: 0, visibility: 0.7 },
          { x: 0.72, y: 0.72, z: 0, visibility: 0.7 },
          // Left index (19) - Right index (20)
          { x: 0.32, y: 0.68, z: 0, visibility: 0.7 },
          { x: 0.68, y: 0.68, z: 0, visibility: 0.7 },
          // Left thumb (21) - Right thumb (22)
          { x: 0.31, y: 0.69, z: 0, visibility: 0.7 },
          { x: 0.69, y: 0.69, z: 0, visibility: 0.7 },
          // Left hip (23) - Right hip (24)
          {
            x: 0.45 + Math.sin(progress * Math.PI) * 0.1,
            y: 0.8 + Math.cos(progress * Math.PI) * 0.05,
            z: 0,
            visibility: 0.9
          },
          {
            x: 0.55 + Math.sin(progress * Math.PI) * 0.1,
            y: 0.8 + Math.cos(progress * Math.PI) * 0.05,
            z: 0,
            visibility: 0.9
          },
          // Left knee (25) - Right knee (26)
          {
            x: 0.44 + Math.sin(progress * Math.PI) * 0.08,
            y: 0.9 + Math.cos(progress * Math.PI) * 0.03,
            z: 0,
            visibility: 0.8
          },
          {
            x: 0.56 + Math.sin(progress * Math.PI) * 0.08,
            y: 0.9 + Math.cos(progress * Math.PI) * 0.03,
            z: 0,
            visibility: 0.8
          },
          // Left ankle (27) - Right ankle (28)
          {
            x: 0.43 + Math.sin(progress * Math.PI) * 0.06,
            y: 0.95 + Math.cos(progress * Math.PI) * 0.02,
            z: 0,
            visibility: 0.8
          },
          {
            x: 0.57 + Math.sin(progress * Math.PI) * 0.06,
            y: 0.95 + Math.cos(progress * Math.PI) * 0.02,
            z: 0,
            visibility: 0.8
          },
          // Left heel (29) - Right heel (30)
          { x: 0.42, y: 0.97, z: 0, visibility: 0.7 },
          { x: 0.58, y: 0.97, z: 0, visibility: 0.7 },
          // Left foot index (31) - Right foot index (32)
          { x: 0.44, y: 0.96, z: 0, visibility: 0.7 },
          { x: 0.56, y: 0.96, z: 0, visibility: 0.7 }
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
    for (let i = 0; i < 60; i++) {
      const progress = i / 60;
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

  const runValidationTest = useCallback(async () => {
    setIsRunning(true);
    
    try {
      const poses = generateMockPoseData();
      const phases = generateMockPhases();
      const trajectory = generateMockTrajectory();
      
      console.log('Running metrics validation test...');
      console.log('Poses:', poses.length);
      console.log('Phases:', phases.length);
      console.log('Trajectory points:', trajectory.rightWrist.length);
      
      // Calculate accurate metrics
      const metrics = calculateAccurateSwingMetrics(poses, phases, trajectory);
      
      // Validate metrics
      const validation = validateSwingMetrics(metrics);
      
      const results = {
        metrics,
        validation,
        testData: {
          poseCount: poses.length,
          phaseCount: phases.length,
          trajectoryPoints: trajectory.rightWrist.length
        }
      };
      
      setTestResults(results);
      console.log('Validation test complete:', results);
      
    } catch (error) {
      console.error('Validation test failed:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: null,
        validation: null
      });
    } finally {
      setIsRunning(false);
    }
  }, [generateMockPoseData, generateMockPhases, generateMockTrajectory]);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <span className="text-2xl mr-2">🧪</span>
        Metrics Validation Test
      </h3>
      
      <div className="space-y-4">
        <button
          onClick={runValidationTest}
          disabled={isRunning}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {isRunning ? 'Running Test...' : 'Run Validation Test'}
        </button>
        
        {testResults && (
          <div className="space-y-4">
            {testResults.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Test Failed</h4>
                <p className="text-red-700 text-sm">{testResults.error}</p>
              </div>
            ) : (
              <>
                {/* Validation Results */}
                <div className={`rounded-lg p-4 ${
                  testResults.validation.isValid 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    testResults.validation.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Validation: {testResults.validation.isValid ? 'PASSED' : 'FAILED'}
                  </h4>
                  
                  {testResults.validation.errors.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
                      <ul className="text-sm text-red-600 list-disc list-inside">
                        {testResults.validation.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {testResults.validation.warnings.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-yellow-700 mb-1">Warnings:</p>
                      <ul className="text-sm text-yellow-600 list-disc list-inside">
                        {testResults.validation.warnings.map((warning: string, index: number) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Metrics Results */}
                {testResults.metrics && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Calculated Metrics:</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tempo */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-900 mb-2">Tempo</h5>
                        <div className="text-sm space-y-1">
                          <div>Backswing: {testResults.metrics.tempo.backswingTime}s</div>
                          <div>Downswing: {testResults.metrics.tempo.downswingTime}s</div>
                          <div>Ratio: {testResults.metrics.tempo.tempoRatio}:1</div>
                          <div>Score: {testResults.metrics.tempo.score}/100</div>
                        </div>
                      </div>
                      
                      {/* Rotation */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-900 mb-2">Rotation</h5>
                        <div className="text-sm space-y-1">
                          <div>Shoulder: {testResults.metrics.rotation.shoulderTurn}°</div>
                          <div>Hip: {testResults.metrics.rotation.hipTurn}°</div>
                          <div>X-Factor: {testResults.metrics.rotation.xFactor}°</div>
                          <div>Score: {testResults.metrics.rotation.score}/100</div>
                        </div>
                      </div>
                      
                      {/* Weight Transfer */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-900 mb-2">Weight Transfer</h5>
                        <div className="text-sm space-y-1">
                          <div>Backswing: {testResults.metrics.weightTransfer.backswing}%</div>
                          <div>Impact: {testResults.metrics.weightTransfer.impact}%</div>
                          <div>Finish: {testResults.metrics.weightTransfer.finish}%</div>
                          <div>Score: {testResults.metrics.weightTransfer.score}/100</div>
                        </div>
                      </div>
                      
                      {/* Swing Plane */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-900 mb-2">Swing Plane</h5>
                        <div className="text-sm space-y-1">
                          <div>Shaft Angle: {testResults.metrics.swingPlane.shaftAngle}°</div>
                          <div>Deviation: {testResults.metrics.swingPlane.planeDeviation}°</div>
                          <div>Score: {testResults.metrics.swingPlane.score}/100</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Overall Score */}
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-900">
                        Overall Score: {testResults.metrics.overallScore}/100
                      </div>
                      <div className="text-lg text-blue-700">
                        Grade: {testResults.metrics.letterGrade}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Test Data Info */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="font-medium text-gray-900 mb-2">Test Data</h5>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Poses: {testResults.testData.poseCount}</div>
                    <div>Phases: {testResults.testData.phaseCount}</div>
                    <div>Trajectory Points: {testResults.testData.trajectoryPoints}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsValidationTest;
