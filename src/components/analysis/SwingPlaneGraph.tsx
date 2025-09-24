'use client';

import React from 'react';

interface SwingPlaneGraphProps {
  data: {
    shaftAngle: number;
    planeDeviation: number;
    score: number;
  };
  className?: string;
}

export default function SwingPlaneGraph({ data, className = '' }: SwingPlaneGraphProps) {
  // Safe destructuring with comprehensive defaults
  const { shaftAngle = 0, planeDeviation = 0, score = 0 } = data || {};

  // Validate data exists
  if (!data) {
    return (
      <div className={`bg-white p-4 rounded-lg border ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-500">No swing plane data available</p>
        </div>
      </div>
    );
  }

  // Safe calculations with validation
  const safeShaftAngle = typeof shaftAngle === 'number' && !isNaN(shaftAngle) ? shaftAngle : 0;
  const safePlaneDeviation = typeof planeDeviation === 'number' && !isNaN(planeDeviation) ? planeDeviation : 0;
  const safeScore = typeof score === 'number' && !isNaN(score) ? score : 0;

  // Additional validation for edge cases
  if (safeShaftAngle < 0 || safeShaftAngle > 180) {
    console.warn('SwingPlaneGraph: Invalid shaft angle:', safeShaftAngle);
  }
  if (safePlaneDeviation < 0 || safePlaneDeviation > 45) {
    console.warn('SwingPlaneGraph: Invalid plane deviation:', safePlaneDeviation);
  }

  // Professional benchmarks
  const idealShaftAngle = 60; // degrees from ground
  const idealDeviation = 2; // degrees from ideal plane

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

  // Calculate swing plane visualization
  const planeAngle = safeShaftAngle;
  const deviation = safePlaneDeviation;

  return (
    <div className={`bg-white p-4 rounded-lg border ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-800">Swing Plane Consistency</h4>
        <div className={`text-lg font-bold ${getScoreColor(safeScore)}`}>
          {safeScore.toFixed(0)}/100
        </div>
      </div>

      {/* Swing Plane Visualization */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-3">Swing Plane Angle</div>
        <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
          {/* Ground line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400"></div>
          
          {/* Ideal plane line */}
          <div
            className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 opacity-60"
            style={{
              transformOrigin: 'left center',
              transform: `rotate(${idealShaftAngle - 90}deg)`
            }}
          ></div>
          
          {/* Actual plane line */}
          <div
            className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"
            style={{
              transformOrigin: 'left center',
              transform: `rotate(${planeAngle - 90}deg)`
            }}
          ></div>
          
          {/* Deviation indicator */}
          {deviation > 0 && (
            <div
              className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 opacity-80"
              style={{
                transformOrigin: 'left center',
                transform: `rotate(${planeAngle + deviation - 90}deg)`
              }}
            ></div>
          )}
          
          {/* Angle labels */}
          <div className="absolute top-2 left-2 text-xs text-gray-600">
            Ideal: {idealShaftAngle}°
          </div>
          <div className="absolute top-2 right-2 text-xs text-gray-600">
            Actual: {planeAngle.toFixed(1)}°
          </div>
        </div>
      </div>

      {/* Individual Metrics */}
      <div className="space-y-4">
        {/* Shaft Angle */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Shaft Angle</span>
            <span className="text-sm font-medium">{safeShaftAngle.toFixed(1)}°</span>
          </div>
          <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(safeScore)} transition-all duration-500`}
              style={{ width: `${Math.min((safeShaftAngle / idealShaftAngle) * 100, 100)}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-400"
              style={{ left: `${(idealShaftAngle / idealShaftAngle) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Ideal: {idealShaftAngle}°
          </div>
        </div>

        {/* Plane Deviation */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Plane Deviation</span>
            <span className="text-sm font-medium">{safePlaneDeviation.toFixed(1)}°</span>
          </div>
          <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(safeScore)} transition-all duration-500`}
              style={{ width: `${Math.min((safePlaneDeviation / idealDeviation) * 100, 100)}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-400"
              style={{ left: `${(idealDeviation / idealDeviation) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Ideal: {idealDeviation}° or less
          </div>
        </div>
      </div>

      {/* Swing Plane Analysis */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-700">
          {safePlaneDeviation > 6 && (
            <div className="text-red-600">
              ⚠️ Your swing plane is inconsistent. Focus on maintaining a consistent angle throughout the swing.
            </div>
          )}
          {safePlaneDeviation > 3 && safePlaneDeviation <= 6 && (
            <div className="text-orange-600">
              ⚠️ Swing plane needs improvement. Practice with alignment sticks to develop consistency.
            </div>
          )}
          {safePlaneDeviation <= 3 && (
            <div className="text-green-600">
              ✅ Great swing plane! You're maintaining excellent consistency throughout the swing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
