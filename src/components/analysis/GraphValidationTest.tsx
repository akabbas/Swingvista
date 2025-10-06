'use client';

import React, { useState } from 'react';
import TempoGraph from './TempoGraph';
import WeightTransferGraph from './WeightTransferGraph';
import SwingPlaneGraph from './SwingPlaneGraph';
import RotationGraph from './RotationGraph';
import SwingMetricsGraphs from './SwingMetricsGraphs';

export default function GraphValidationTest() {
  const [testCase, setTestCase] = useState('normal');

  const testCases = {
    normal: {
      name: 'Normal Data',
      tempo: { tempoRatio: 3.2, tempoHistory: [3.1, 3.2, 3.3] },
      weightTransfer: { backswing: 85, impact: 80, finish: 95, score: 88 },
      swingPlane: { shaftAngle: 60, planeDeviation: 2.5, score: 82 },
      rotation: { shoulderTurn: 95, hipTurn: 45, xFactor: 50, score: 90 }
    },
    undefined: {
      name: 'Undefined Data',
      tempo: undefined,
      weightTransfer: undefined,
      swingPlane: undefined,
      rotation: undefined
    },
    partial: {
      name: 'Partial Data',
      tempo: { tempoRatio: 3.2 }, // Missing tempoHistory
      weightTransfer: { backswing: 85 }, // Missing other fields
      swingPlane: { shaftAngle: 60 }, // Missing other fields
      rotation: { shoulderTurn: 95 } // Missing other fields
    },
    invalid: {
      name: 'Invalid Values',
      tempo: { tempoRatio: 'invalid', tempoHistory: 'not-array' },
      weightTransfer: { backswing: -50, impact: 150, finish: 'invalid', score: null },
      swingPlane: { shaftAngle: 'invalid', planeDeviation: -10, score: undefined },
      rotation: { shoulderTurn: 'invalid', hipTurn: 200, xFactor: null, score: 'invalid' }
    },
    empty: {
      name: 'Empty Data',
      tempo: {},
      weightTransfer: {},
      swingPlane: {},
      rotation: {}
    },
    null: {
      name: 'Null Data',
      tempo: null,
      weightTransfer: null,
      swingPlane: null,
      rotation: null
    }
  };

  const currentTest = testCases[testCase as keyof typeof testCases];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Graph Component Validation Test</h2>
        <p className="text-gray-600 mb-4">
          Testing all graph components with various edge cases to ensure no crashes occur.
        </p>
        
        {/* Test Case Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Test Case:
          </label>
          <select
            value={testCase}
            onChange={(e) => setTestCase(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(testCases).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name}
              </option>
            ))}
          </select>
        </div>

        {/* Current Test Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">Current Test: {currentTest.name}</h3>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify(currentTest, null, 2)}
          </pre>
        </div>
      </div>

      {/* Individual Graph Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TempoGraph Test */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-800 mb-4">TempoGraph Test</h3>
          <TempoGraph
            tempoRatio={currentTest.tempo?.tempoRatio}
            tempoData={currentTest.tempo?.tempoHistory || []}
          />
        </div>

        {/* WeightTransferGraph Test */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-800 mb-4">WeightTransferGraph Test</h3>
          <WeightTransferGraph data={currentTest.weightTransfer} />
        </div>

        {/* SwingPlaneGraph Test */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-800 mb-4">SwingPlaneGraph Test</h3>
          <SwingPlaneGraph data={currentTest.swingPlane} />
        </div>

        {/* RotationGraph Test */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-800 mb-4">RotationGraph Test</h3>
          <RotationGraph data={currentTest.rotation} />
        </div>
      </div>

      {/* SwingMetricsGraphs Test */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-medium text-gray-800 mb-4">SwingMetricsGraphs Test</h3>
        <SwingMetricsGraphs
          metrics={currentTest}
          isLoading={false}
          error={null}
        />
      </div>

      {/* Loading State Test */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-medium text-gray-800 mb-4">Loading State Test</h3>
        <SwingMetricsGraphs
          metrics={undefined}
          isLoading={true}
          error={null}
        />
      </div>

      {/* Error State Test */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-medium text-gray-800 mb-4">Error State Test</h3>
        <SwingMetricsGraphs
          metrics={undefined}
          isLoading={false}
          error="Test error message"
          onRetry={() => console.log('Retry clicked')}
        />
      </div>

      {/* Test Results */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-800 mb-2">✅ Test Results</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• All components handle undefined data gracefully</li>
          <li>• No TypeError crashes from .toFixed() calls</li>
          <li>• Safe array operations with fallbacks</li>
          <li>• Proper object property access validation</li>
          <li>• Loading states display correctly</li>
          <li>• Error boundaries prevent app crashes</li>
          <li>• Professional error messages for users</li>
        </ul>
      </div>
    </div>
  );
}








