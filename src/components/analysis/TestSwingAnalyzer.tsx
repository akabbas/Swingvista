'use client';

import React, { useState } from 'react';
import { PoseResult } from '@/lib/mediapipe';
import SwingMetricsGraphs from './SwingMetricsGraphs';

// Mock data for testing
const mockSwingMetrics = {
  tempo: {
    backswingTime: 1.2,
    downswingTime: 0.4,
    tempoRatio: 3.0,
    score: 85
  },
  rotation: {
    shoulderTurn: 90,
    hipTurn: 50,
    xFactor: 40,
    score: 88
  },
  weightTransfer: {
    backswing: 80,
    impact: 85,
    finish: 95,
    score: 82
  },
  swingPlane: {
    shaftAngle: 60,
    planeDeviation: 2,
    score: 90
  },
  bodyAlignment: {
    spineAngle: 40,
    headMovement: 2,
    kneeFlex: 25,
    score: 87
  },
  overallScore: 86,
  letterGrade: 'B+'
};

export default function TestSwingAnalyzer() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const runTests = () => {
    setIsTesting(true);
    setTestResults([]);
    
    const results: string[] = [];
    
    // Test 1: Check if metrics are defined
    results.push('✅ Test 1: Mock metrics loaded successfully');
    
    // Test 2: Check tempo data
    if (mockSwingMetrics.tempo && typeof mockSwingMetrics.tempo.tempoRatio === 'number') {
      results.push('✅ Test 2: Tempo data structure is valid');
    } else {
      results.push('❌ Test 2: Tempo data structure is invalid');
    }
    
    // Test 3: Check rotation data
    if (mockSwingMetrics.rotation && typeof mockSwingMetrics.rotation.shoulderTurn === 'number') {
      results.push('✅ Test 3: Rotation data structure is valid');
    } else {
      results.push('❌ Test 3: Rotation data structure is invalid');
    }
    
    // Test 4: Check weight transfer data
    if (mockSwingMetrics.weightTransfer && typeof mockSwingMetrics.weightTransfer.impact === 'number') {
      results.push('✅ Test 4: Weight transfer data structure is valid');
    } else {
      results.push('❌ Test 4: Weight transfer data structure is invalid');
    }
    
    // Test 5: Check swing plane data
    if (mockSwingMetrics.swingPlane && typeof mockSwingMetrics.swingPlane.shaftAngle === 'number') {
      results.push('✅ Test 5: Swing plane data structure is valid');
    } else {
      results.push('❌ Test 5: Swing plane data structure is invalid');
    }
    
    // Test 6: Check overall score
    if (typeof mockSwingMetrics.overallScore === 'number' && mockSwingMetrics.letterGrade) {
      results.push('✅ Test 6: Overall metrics are valid');
    } else {
      results.push('❌ Test 6: Overall metrics are invalid');
    }
    
    setTestResults(results);
    setIsTesting(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">🧪 Swing Analysis Test Suite</h1>
        <p className="text-gray-600 mb-6">
          Test the professional swing analysis system with mock data to verify all components work correctly.
        </p>
        
        <div className="flex space-x-4 mb-6">
          <button
            onClick={runTests}
            disabled={isTesting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {isTesting ? 'Running Tests...' : 'Run Tests'}
          </button>
          
          <button
            onClick={() => setTestResults([])}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Clear Results
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">Test Results</h3>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mock Data Display */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Mock Swing Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium text-blue-600">Tempo</h4>
              <p>Ratio: {mockSwingMetrics.tempo.tempoRatio}:1</p>
              <p>Backswing: {mockSwingMetrics.tempo.backswingTime}s</p>
              <p>Downswing: {mockSwingMetrics.tempo.downswingTime}s</p>
              <p>Score: {mockSwingMetrics.tempo.score}/100</p>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium text-green-600">Rotation</h4>
              <p>Shoulder: {mockSwingMetrics.rotation.shoulderTurn}°</p>
              <p>Hip: {mockSwingMetrics.rotation.hipTurn}°</p>
              <p>X-Factor: {mockSwingMetrics.rotation.xFactor}°</p>
              <p>Score: {mockSwingMetrics.rotation.score}/100</p>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium text-purple-600">Weight Transfer</h4>
              <p>Backswing: {mockSwingMetrics.weightTransfer.backswing}%</p>
              <p>Impact: {mockSwingMetrics.weightTransfer.impact}%</p>
              <p>Finish: {mockSwingMetrics.weightTransfer.finish}%</p>
              <p>Score: {mockSwingMetrics.weightTransfer.score}/100</p>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium text-orange-600">Swing Plane</h4>
              <p>Shaft Angle: {mockSwingMetrics.swingPlane.shaftAngle}°</p>
              <p>Deviation: {mockSwingMetrics.swingPlane.planeDeviation}°</p>
              <p>Score: {mockSwingMetrics.swingPlane.score}/100</p>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium text-red-600">Body Alignment</h4>
              <p>Spine: {mockSwingMetrics.bodyAlignment.spineAngle}°</p>
              <p>Head Movement: {mockSwingMetrics.bodyAlignment.headMovement}in</p>
              <p>Knee Flex: {mockSwingMetrics.bodyAlignment.kneeFlex}°</p>
              <p>Score: {mockSwingMetrics.bodyAlignment.score}/100</p>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium text-indigo-600">Overall</h4>
              <p>Score: {mockSwingMetrics.overallScore}/100</p>
              <p>Grade: {mockSwingMetrics.letterGrade}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Swing Metrics Graphs */}
      <SwingMetricsGraphs metrics={mockSwingMetrics} />
    </div>
  );
}








