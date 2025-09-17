'use client';

import React, { useState } from 'react';
import { PoseResult } from '@/lib/mediapipe';
import { SwingPhase } from '@/lib/swing-phases';
import { ComprehensiveGolfGradingSystem } from '@/lib/comprehensive-golf-grading';
import { calculateAccurateSwingMetrics } from '@/lib/accurate-swing-metrics';

interface GradingDebugPanelProps {
  poses: PoseResult[];
  phases: SwingPhase[];
  trajectory: { rightWrist: any[]; leftWrist: any[] };
  className?: string;
}

export default function GradingDebugPanel({ 
  poses, 
  phases, 
  trajectory, 
  className = '' 
}: GradingDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);

  const runDebugAnalysis = () => {
    console.log('=== GRADING DEBUG ANALYSIS ===');
    
    // Create a complete trajectory object
    const completeTrajectory = {
      rightWrist: trajectory.rightWrist || [],
      leftWrist: trajectory.leftWrist || [],
      rightShoulder: trajectory.rightWrist?.map((point, index) => ({
        x: point.x,
        y: point.y,
        z: point.z,
        timestamp: point.timestamp,
        frame: index
      })) || [],
      leftShoulder: trajectory.leftWrist?.map((point, index) => ({
        x: point.x,
        y: point.y,
        z: point.z,
        timestamp: point.timestamp,
        frame: index
      })) || [],
      rightHip: trajectory.rightWrist?.map((point, index) => ({
        x: point.x,
        y: point.y,
        z: point.z,
        timestamp: point.timestamp,
        frame: index
      })) || [],
      leftHip: trajectory.leftWrist?.map((point, index) => ({
        x: point.x,
        y: point.y,
        z: point.z,
        timestamp: point.timestamp,
        frame: index
      })) || [],
      clubhead: trajectory.rightWrist?.map((point, index) => ({
        x: point.x,
        y: point.y,
        z: point.z,
        timestamp: point.timestamp,
        frame: index
      })) || []
    };
    
    // Calculate accurate metrics
    const accurateMetrics = calculateAccurateSwingMetrics(poses, phases, completeTrajectory);
    console.log('Accurate metrics:', accurateMetrics);
    
    // Run comprehensive grading
    const gradingSystem = new ComprehensiveGolfGradingSystem();
    const grade = gradingSystem.gradeSwing(poses, completeTrajectory, phases, 'driver');
    console.log('Comprehensive grade:', grade);
    
    // Analyze each category
    const categoryAnalysis = {
      tempo: {
        backswingTime: accurateMetrics.tempo.backswingTime,
        downswingTime: accurateMetrics.tempo.downswingTime,
        tempoRatio: accurateMetrics.tempo.tempoRatio,
        score: accurateMetrics.tempo.score,
        grade: grade.categories.tempo
      },
      rotation: {
        shoulderTurn: accurateMetrics.rotation.shoulderTurn,
        hipTurn: accurateMetrics.rotation.hipTurn,
        xFactor: accurateMetrics.rotation.xFactor,
        score: accurateMetrics.rotation.score,
        grade: grade.categories.rotation
      },
      weightTransfer: {
        backswing: accurateMetrics.weightTransfer.backswing,
        impact: accurateMetrics.weightTransfer.impact,
        finish: accurateMetrics.weightTransfer.finish,
        score: accurateMetrics.weightTransfer.score,
        grade: grade.categories.balance
      },
      swingPlane: {
        shaftAngle: accurateMetrics.swingPlane.shaftAngle,
        planeDeviation: accurateMetrics.swingPlane.planeDeviation,
        score: accurateMetrics.swingPlane.score,
        grade: grade.categories.swingPlane
      },
      bodyAlignment: {
        spineAngle: accurateMetrics.bodyAlignment.spineAngle,
        headMovement: accurateMetrics.bodyAlignment.headMovement,
        kneeFlex: accurateMetrics.bodyAlignment.kneeFlex,
        score: accurateMetrics.bodyAlignment.score,
        grade: grade.categories.consistency
      }
    };
    
    const debugData = {
      overall: {
        accurateScore: accurateMetrics.overallScore,
        accurateGrade: accurateMetrics.letterGrade,
        comprehensiveScore: grade.overall.score,
        comprehensiveGrade: grade.overall.letter,
        emergencyOverrides: grade.emergencyOverrides
      },
      categories: categoryAnalysis,
      dataQuality: {
        poseCount: poses.length,
        phaseCount: phases.length,
        trajectoryPoints: trajectory.rightWrist.length
      }
    };
    
    setDebugResults(debugData);
    console.log('Debug results:', debugData);
    console.log('===============================');
  };

  return (
    <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Grading Debug Panel</h3>
        <div className="flex gap-2">
          <button
            onClick={runDebugAnalysis}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Run Analysis
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {debugResults && (
        <div className={`space-y-4 ${isExpanded ? 'block' : 'hidden'}`}>
          {/* Fallback Data Warning */}
          {debugResults.overall.comprehensiveScore === 77 && (
            <div className="bg-red-900 border border-red-600 text-red-100 px-4 py-3 rounded-md">
              <h4 className="font-bold text-lg">⚠️ FALLBACK DATA DETECTED</h4>
              <p className="text-sm">This analysis used placeholder data due to processing errors. The results are not accurate!</p>
            </div>
          )}
          
          {/* Overall Scores */}
          <div className="bg-white rounded p-3">
            <h4 className="font-semibold mb-2">Overall Scores</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Accurate Metrics:</div>
                <div>Score: {debugResults.overall.accurateScore}</div>
                <div>Grade: {debugResults.overall.accurateGrade}</div>
              </div>
              <div>
                <div className="font-medium">Comprehensive Grading:</div>
                <div>Score: {debugResults.overall.comprehensiveScore}</div>
                <div>Grade: {debugResults.overall.comprehensiveGrade}</div>
              </div>
            </div>
            {debugResults.overall.emergencyOverrides.applied && (
              <div className="mt-2 p-2 bg-yellow-100 rounded text-sm">
                <div className="font-medium text-yellow-800">Emergency Override Applied:</div>
                <div className="text-yellow-700">{debugResults.overall.emergencyOverrides.reason}</div>
                <div className="text-yellow-700">
                  Original: {debugResults.overall.emergencyOverrides.originalScore} → 
                  Adjusted: {debugResults.overall.emergencyOverrides.adjustedScore}
                </div>
              </div>
            )}
          </div>

          {/* Data Quality */}
          <div className="bg-white rounded p-3">
            <h4 className="font-semibold mb-2">Data Quality</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>Poses: {debugResults.dataQuality.poseCount}</div>
              <div>Phases: {debugResults.dataQuality.phaseCount}</div>
              <div>Trajectory Points: {debugResults.dataQuality.trajectoryPoints}</div>
            </div>
          </div>

          {/* Category Analysis */}
          <div className="bg-white rounded p-3">
            <h4 className="font-semibold mb-2">Category Analysis</h4>
            <div className="space-y-3 text-sm">
              {Object.entries(debugResults.categories).map(([category, data]: [string, any]) => (
                <div key={category} className="border-l-4 border-blue-500 pl-3">
                  <div className="font-medium capitalize">{category}</div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <div>Raw Score: {data.score}</div>
                      <div>Grade: {data.grade.letter} ({data.grade.score})</div>
                    </div>
                    <div className="text-xs text-gray-600">
                      {Object.entries(data)
                        .filter(([key]) => !['score', 'grade'].includes(key))
                        .map(([key, value]) => (
                          <div key={key}>
                            {key}: {typeof value === 'number' ? value.toFixed(1) : String(value)}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
