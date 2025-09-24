'use client';

import React from 'react';

interface RotationGraphProps {
  data: {
    shoulderTurn: number;
    hipTurn: number;
    xFactor: number;
    score: number;
  };
  className?: string;
}

export default function RotationGraph({ data, className = '' }: RotationGraphProps) {
  // Safe destructuring with comprehensive defaults
  const { shoulderTurn = 0, hipTurn = 0, xFactor = 0, score = 0 } = data || {};

  // Validate data exists
  if (!data) {
    return (
      <div className={`bg-white p-4 rounded-lg border ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-500">No rotation data available</p>
        </div>
      </div>
    );
  }

  // Safe calculations with validation
  const safeShoulderTurn = typeof shoulderTurn === 'number' && !isNaN(shoulderTurn) ? shoulderTurn : 0;
  const safeHipTurn = typeof hipTurn === 'number' && !isNaN(hipTurn) ? hipTurn : 0;
  const safeXFactor = typeof xFactor === 'number' && !isNaN(xFactor) ? xFactor : 0;
  const safeScore = typeof score === 'number' && !isNaN(score) ? score : 0;

  // Additional validation for edge cases
  if (safeShoulderTurn < 0 || safeShoulderTurn > 180) {
    console.warn('RotationGraph: Invalid shoulder turn:', safeShoulderTurn);
  }
  if (safeHipTurn < 0 || safeHipTurn > 90) {
    console.warn('RotationGraph: Invalid hip turn:', safeHipTurn);
  }
  if (safeXFactor < 0 || safeXFactor > 90) {
    console.warn('RotationGraph: Invalid X-Factor:', safeXFactor);
  }

  // Professional benchmarks
  const idealShoulderTurn = 90; // degrees
  const idealHipTurn = 50; // degrees
  const idealXFactor = 40; // degrees (shoulder-hip differential)

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

  return (
    <div className={`bg-white p-4 rounded-lg border ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-800">Rotation Sequence</h4>
        <div className={`text-lg font-bold ${getScoreColor(safeScore)}`}>
          {safeScore.toFixed(0)}/100
        </div>
      </div>

      {/* Rotation Visualization */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-3">Body Rotation</div>
        <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400 transform -translate-x-1/2"></div>
          
          {/* Shoulder turn indicator */}
          <div
            className="absolute top-4 left-1/2 w-16 h-0.5 bg-blue-500 transform -translate-x-1/2"
            style={{
              transformOrigin: 'left center',
              transform: `translateX(-50%) rotate(${safeShoulderTurn / 2}deg)`
            }}
          ></div>
          
          {/* Hip turn indicator */}
          <div
            className="absolute top-16 left-1/2 w-12 h-0.5 bg-green-500 transform -translate-x-1/2"
            style={{
              transformOrigin: 'left center',
              transform: `translateX(-50%) rotate(${safeHipTurn / 2}deg)`
            }}
          ></div>
          
          {/* X-Factor visualization */}
          <div
            className="absolute top-10 left-1/2 w-8 h-0.5 bg-red-500 transform -translate-x-1/2"
            style={{
              transformOrigin: 'left center',
              transform: `translateX(-50%) rotate(${(safeShoulderTurn - safeHipTurn) / 2}deg)`
            }}
          ></div>
          
          {/* Labels */}
          <div className="absolute top-2 left-2 text-xs text-blue-600">
            Shoulders: {safeShoulderTurn.toFixed(0)}°
          </div>
          <div className="absolute top-14 left-2 text-xs text-green-600">
            Hips: {safeHipTurn.toFixed(0)}°
          </div>
          <div className="absolute top-8 right-2 text-xs text-red-600">
            X-Factor: {safeXFactor.toFixed(0)}°
          </div>
        </div>
      </div>

      {/* Individual Metrics */}
      <div className="space-y-4">
        {/* Shoulder Turn */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Shoulder Turn</span>
            <span className="text-sm font-medium">{safeShoulderTurn.toFixed(0)}°</span>
          </div>
          <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(safeScore)} transition-all duration-500`}
              style={{ width: `${Math.min((safeShoulderTurn / idealShoulderTurn) * 100, 100)}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-400"
              style={{ left: `${(idealShoulderTurn / idealShoulderTurn) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Ideal: {idealShoulderTurn}°
          </div>
        </div>

        {/* Hip Turn */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Hip Turn</span>
            <span className="text-sm font-medium">{safeHipTurn.toFixed(0)}°</span>
          </div>
          <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(safeScore)} transition-all duration-500`}
              style={{ width: `${Math.min((safeHipTurn / idealHipTurn) * 100, 100)}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-400"
              style={{ left: `${(idealHipTurn / idealHipTurn) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Ideal: {idealHipTurn}°
          </div>
        </div>

        {/* X-Factor */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">X-Factor</span>
            <span className="text-sm font-medium">{safeXFactor.toFixed(0)}°</span>
          </div>
          <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(safeScore)} transition-all duration-500`}
              style={{ width: `${Math.min((safeXFactor / idealXFactor) * 100, 100)}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-400"
              style={{ left: `${(idealXFactor / idealXFactor) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Ideal: {idealXFactor}°
          </div>
        </div>
      </div>

      {/* Rotation Analysis */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-700">
          {safeXFactor < 30 && (
            <div className="text-red-600">
              ⚠️ Insufficient X-Factor. Focus on turning your shoulders more than your hips.
            </div>
          )}
          {safeXFactor > 50 && (
            <div className="text-orange-600">
              ⚠️ Too much X-Factor. Your shoulders are turning too much relative to your hips.
            </div>
          )}
          {safeXFactor >= 30 && safeXFactor <= 50 && (
            <div className="text-green-600">
              ✅ Excellent rotation sequence! You're creating proper separation between shoulders and hips.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
