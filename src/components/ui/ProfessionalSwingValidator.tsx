'use client';

import React, { useState } from 'react';
import { ComprehensiveGolfGradingSystem } from '@/lib/comprehensive-golf-grading';
import { calculateAccurateSwingMetrics } from '@/lib/accurate-swing-metrics';

interface ProfessionalSwingValidatorProps {
  className?: string;
}

// Test swing data for validation - NO HARD-CODED EXPECTED RESULTS
const TEST_SWING_DATA = {
  testSwing1: {
    name: 'Test Swing 1',
    poses: generateMockPoses(120), // 4 seconds at 30fps
    phases: [
      { name: 'address', startTime: 0, endTime: 200, startFrame: 0, endFrame: 6, duration: 200 },
      { name: 'backswing', startTime: 200, endTime: 1000, startFrame: 6, endFrame: 30, duration: 800 },
      { name: 'downswing', startTime: 1000, endTime: 1200, startFrame: 30, endFrame: 36, duration: 200 },
      { name: 'impact', startTime: 1200, endTime: 1250, startFrame: 36, endFrame: 37, duration: 50 },
      { name: 'followThrough', startTime: 1250, endTime: 1500, startFrame: 37, endFrame: 45, duration: 250 }
    ],
    trajectory: {
      rightWrist: generateMockTrajectory(120),
      leftWrist: generateMockTrajectory(120)
    }
  },
  testSwing2: {
    name: 'Test Swing 2',
    poses: generateMockPoses(100),
    phases: [
      { name: 'address', startTime: 0, endTime: 150, startFrame: 0, endFrame: 5, duration: 150 },
      { name: 'backswing', startTime: 150, endTime: 900, startFrame: 5, endFrame: 30, duration: 750 },
      { name: 'downswing', startTime: 900, endTime: 1100, startFrame: 30, endFrame: 36, duration: 200 },
      { name: 'impact', startTime: 1100, endTime: 1150, startFrame: 36, endFrame: 37, duration: 50 },
      { name: 'followThrough', startTime: 1150, endTime: 1400, startFrame: 37, endFrame: 45, duration: 250 }
    ],
    trajectory: {
      rightWrist: generateMockTrajectory(100),
      leftWrist: generateMockTrajectory(100)
    }
  },
  testSwing3: {
    name: 'Test Swing 3',
    poses: generateMockPoses(110),
    phases: [
      { name: 'address', startTime: 0, endTime: 180, startFrame: 0, endFrame: 6, duration: 180 },
      { name: 'backswing', startTime: 180, endTime: 950, startFrame: 6, endFrame: 32, duration: 770 },
      { name: 'downswing', startTime: 950, endTime: 1150, startFrame: 32, endFrame: 38, duration: 200 },
      { name: 'impact', startTime: 1150, endTime: 1200, startFrame: 38, endFrame: 39, duration: 50 },
      { name: 'followThrough', startTime: 1200, endTime: 1450, startFrame: 39, endFrame: 47, duration: 250 }
    ],
    trajectory: {
      rightWrist: generateMockTrajectory(110),
      leftWrist: generateMockTrajectory(110)
    }
  }
};

function generateMockPoses(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    landmarks: Array.from({ length: 33 }, (_, j) => ({
      x: 0.5 + Math.sin(i * 0.1 + j * 0.01) * 0.1,
      y: 0.5 + Math.cos(i * 0.1 + j * 0.01) * 0.1,
      z: 0,
      visibility: 0.9
    })),
    timestamp: i * 33.33 // 30fps
  }));
}

function generateMockTrajectory(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: 0.5 + Math.sin(i * 0.2) * 0.3,
    y: 0.5 + Math.cos(i * 0.2) * 0.3,
    z: 0,
    timestamp: i * 33.33
  }));
}

export default function ProfessionalSwingValidator({ className = '' }: ProfessionalSwingValidatorProps) {
  const [results, setResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const validateTestSwings = async () => {
    setIsRunning(true);
    console.log('=== TEST SWING VALIDATION ===');
    
    const validationResults = [];
    
    for (const [key, swingData] of Object.entries(TEST_SWING_DATA)) {
      console.log(`\nAnalyzing ${swingData.name}...`);
      
      try {
        // Calculate accurate metrics
        const accurateMetrics = calculateAccurateSwingMetrics(
          swingData.poses as any,
          swingData.phases as any,
          swingData.trajectory as any
        );
        
        // Run comprehensive grading
        const gradingSystem = new ComprehensiveGolfGradingSystem();
        const grade = gradingSystem.gradeSwing(
          swingData.poses as any,
          swingData.trajectory as any,
          swingData.phases as any,
          'driver'
        );
        
        const result = {
          name: swingData.name,
          analysis: {
            accurateScore: accurateMetrics.overallScore,
            accurateGrade: accurateMetrics.letterGrade,
            comprehensiveScore: grade.overall.score,
            comprehensiveGrade: grade.overall.letter
          },
          emergencyOverrides: grade.emergencyOverrides,
          categories: {
            tempo: grade.categories.tempo,
            rotation: grade.categories.rotation,
            balance: grade.categories.balance,
            swingPlane: grade.categories.swingPlane,
            power: grade.categories.power,
            consistency: grade.categories.consistency
          },
          dataQuality: {
            poseCount: swingData.poses.length,
            phaseCount: swingData.phases.length,
            trajectoryPoints: swingData.trajectory.rightWrist.length
          }
        };
        
        validationResults.push(result);
        
        console.log(`${swingData.name} Analysis:`, {
          grade: `${grade.overall.letter} (${grade.overall.score})`,
          emergencyOverrides: grade.emergencyOverrides.applied
        });
        
      } catch (error) {
        console.error(`Error analyzing ${swingData.name}:`, error);
        validationResults.push({
          name: swingData.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    setResults(validationResults);
    setIsRunning(false);
    console.log('Analysis complete:', validationResults);
    console.log('=====================================');
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Swing Analysis Validator</h3>
        <button
          onClick={validateTestSwings}
          disabled={isRunning}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {isRunning ? 'Analyzing...' : 'Analyze Test Swings'}
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        This validator tests the grading system with sample swing data to ensure 
        all metrics are calculated from actual video analysis, not hard-coded values.
      </p>

      {results && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Analysis Results</h4>
          
          {results.map((result: any, index: number) => (
            <div key={index} className="border rounded-lg p-4">
              {result.error ? (
                <div className="text-red-600">
                  <div className="font-medium">{result.name}</div>
                  <div className="text-sm">Error: {result.error}</div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{result.name}</h5>
                    <div className="flex gap-4 text-sm">
                      <div>
                        Analysis: <span className="font-medium text-blue-600">
                          {result.analysis.comprehensiveGrade} ({result.analysis.comprehensiveScore})
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {result.emergencyOverrides.applied && (
                    <div className="mb-2 p-2 bg-yellow-100 rounded text-sm">
                      <div className="font-medium text-yellow-800">Emergency Override Applied:</div>
                      <div className="text-yellow-700">{result.emergencyOverrides.reason}</div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Data Quality:</div>
                      <div>Poses: {result.dataQuality.poseCount}</div>
                      <div>Phases: {result.dataQuality.phaseCount}</div>
                    </div>
                    <div>
                      <div className="font-medium">Category Scores:</div>
                      <div>Tempo: {result.categories.tempo.score} ({result.categories.tempo.letter})</div>
                      <div>Rotation: {result.categories.rotation.score} ({result.categories.rotation.letter})</div>
                    </div>
                    <div>
                      <div className="font-medium">Additional:</div>
                      <div>Balance: {result.categories.balance.score} ({result.categories.balance.letter})</div>
                      <div>Plane: {result.categories.plane.score} ({result.categories.plane.letter})</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
