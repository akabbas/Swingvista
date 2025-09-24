'use client';

import React from 'react';

interface WeightTransferGraphProps {
  data: {
    backswing: number;
    impact: number;
    finish: number;
    score: number;
  };
  className?: string;
}

export default function WeightTransferGraph({ data, className = '' }: WeightTransferGraphProps) {
  // Safe destructuring with comprehensive defaults
  const { backswing = 0, impact = 0, finish = 0, score = 0 } = data || {};

  // Validate data exists
  if (!data) {
    return (
      <div className={`bg-white p-4 rounded-lg border ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-500">No weight transfer data available</p>
        </div>
      </div>
    );
  }

  // Safe calculations with validation
  const safeBackswing = typeof backswing === 'number' && !isNaN(backswing) ? backswing : 0;
  const safeImpact = typeof impact === 'number' && !isNaN(impact) ? impact : 0;
  const safeFinish = typeof finish === 'number' && !isNaN(finish) ? finish : 0;
  const safeScore = typeof score === 'number' && !isNaN(score) ? score : 0;

  // Additional validation for edge cases
  if (safeBackswing < 0 || safeBackswing > 100) {
    console.warn('WeightTransferGraph: Invalid backswing value:', safeBackswing);
  }
  if (safeImpact < 0 || safeImpact > 100) {
    console.warn('WeightTransferGraph: Invalid impact value:', safeImpact);
  }
  if (safeFinish < 0 || safeFinish > 100) {
    console.warn('WeightTransferGraph: Invalid finish value:', safeFinish);
  }

  // Professional benchmarks
  const idealBackswing = 85; // % on trail foot
  const idealImpact = 85; // % on lead foot
  const idealFinish = 95; // % on lead foot

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBarColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Calculate weight transfer progression
  const weightProgression = [
    { phase: 'Address', trailFoot: 50, leadFoot: 50 },
    { phase: 'Backswing', trailFoot: safeBackswing, leadFoot: 100 - safeBackswing },
    { phase: 'Impact', trailFoot: 100 - safeImpact, leadFoot: safeImpact },
    { phase: 'Finish', trailFoot: 100 - safeFinish, leadFoot: safeFinish }
  ];

  return (
    <div className={`bg-white p-4 rounded-lg border ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-800">Weight Transfer</h4>
        <div className={`text-lg font-bold ${getScoreColor(safeScore)}`}>
          {safeScore.toFixed(0)}/100
        </div>
      </div>

      {/* Weight Transfer Progression */}
      <div className="space-y-3 mb-4">
        {weightProgression.map((phase, index) => (
          <div key={phase.phase}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">{phase.phase}</span>
              <span className="text-xs text-gray-500">
                Trail: {phase.trailFoot.toFixed(0)}% | Lead: {phase.leadFoot.toFixed(0)}%
              </span>
            </div>
            <div className="flex h-4 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 transition-all duration-500"
                style={{ width: `${phase.trailFoot}%` }}
                title={`Trail foot: ${phase.trailFoot.toFixed(0)}%`}
              />
              <div
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${phase.leadFoot}%` }}
                title={`Lead foot: ${phase.leadFoot.toFixed(0)}%`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Individual Metrics */}
      <div className="space-y-3">
        {/* Backswing Weight */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Backswing Weight</span>
            <span className="text-sm font-medium">{safeBackswing.toFixed(0)}% trail</span>
          </div>
          <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(safeScore)} transition-all duration-500`}
              style={{ width: `${Math.min(safeBackswing, 100)}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-400"
              style={{ left: `${idealBackswing}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Ideal: {idealBackswing}% trail
          </div>
        </div>

        {/* Impact Weight */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Impact Weight</span>
            <span className="text-sm font-medium">{safeImpact.toFixed(0)}% lead</span>
          </div>
          <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(safeScore)} transition-all duration-500`}
              style={{ width: `${Math.min(safeImpact, 100)}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-400"
              style={{ left: `${idealImpact}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Ideal: {idealImpact}% lead
          </div>
        </div>

        {/* Finish Weight */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Finish Weight</span>
            <span className="text-sm font-medium">{safeFinish.toFixed(0)}% lead</span>
          </div>
          <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(safeScore)} transition-all duration-500`}
              style={{ width: `${Math.min(safeFinish, 100)}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-400"
              style={{ left: `${idealFinish}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Ideal: {idealFinish}% lead
          </div>
        </div>
      </div>

      {/* Weight Transfer Analysis */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-700">
          {safeImpact < 70 && (
            <div className="text-red-600">
              ⚠️ You're hanging back at impact. Practice step-through drills to improve weight transfer.
            </div>
          )}
          {safeImpact >= 70 && safeImpact < 80 && (
            <div className="text-orange-600">
              ⚠️ Weight transfer needs improvement. Focus on shifting weight to lead foot during downswing.
            </div>
          )}
          {safeImpact >= 80 && (
            <div className="text-green-600">
              ✅ Excellent weight transfer! You're properly shifting your weight through impact.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
