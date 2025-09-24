'use client';

import React from 'react';
import MetricsErrorBoundary from './MetricsErrorBoundary';

interface TempoGraphProps {
  tempoRatio?: number;
  tempoData: number[];
  className?: string;
}

// Fallback calculation if tempoRatio is undefined
function calculateFallbackTempo(tempoData: number[]): number {
  if (!Array.isArray(tempoData) || tempoData.length === 0) return 3.0;
  
  // Simple average as fallback
  const sum = tempoData.reduce((acc, val) => acc + (val || 0), 0);
  return tempoData.length > 0 ? sum / tempoData.length : 3.0;
}

export default function TempoGraph({ tempoRatio, tempoData = [], className = '' }: TempoGraphProps) {
  // Validate inputs
  const safeTempoRatio = tempoRatio ?? calculateFallbackTempo(tempoData);
  const safeTempoData = Array.isArray(tempoData) ? tempoData : [];
  
  // Add loading state if no data
  if (safeTempoData.length === 0) {
    return (
      <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          Loading tempo data...
        </div>
      </div>
    );
  }

  // Professional benchmarks
  const idealRatio = 3.0;
  
  // Calculate metrics from tempo data
  const avgTempo = safeTempoData.reduce((acc, val) => acc + (val || 0), 0) / safeTempoData.length;
  const tempoVariance = safeTempoData.reduce((acc, val) => acc + Math.pow((val || 0) - avgTempo, 2), 0) / safeTempoData.length;
  const tempoStability = Math.max(0, 100 - Math.sqrt(tempoVariance) * 10);
  
  // Calculate bar height (normalized to 100)
  const ratioHeight = Math.min((safeTempoRatio / idealRatio) * 100, 120);

  // Calculate score based on tempo ratio and stability
  const tempoScore = Math.max(0, 100 - Math.abs(safeTempoRatio - idealRatio) * 20);
  const finalScore = Math.round((tempoScore + tempoStability) / 2);

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
    <MetricsErrorBoundary
      fallback={
        <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
          <div className="text-center">
            <h4 className="font-medium text-red-800 mb-2">Tempo Analysis Unavailable</h4>
            <p className="text-sm text-red-600">
              Unable to display tempo metrics. Please try refreshing the page.
            </p>
          </div>
        </div>
      }
    >
      <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-gray-800">Tempo Rhythm</h4>
          <div className={`text-lg font-bold ${getScoreColor(finalScore)}`}>
            {finalScore}/100
          </div>
        </div>

        {/* Tempo Ratio Display */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Tempo Ratio</span>
            <span className="text-sm font-medium">
              {safeTempoRatio.toFixed(1)}:1
            </span>
          </div>
          <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(finalScore)} transition-all duration-500`}
              style={{ width: `${Math.min(ratioHeight, 100)}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-400"
              style={{ left: `${(idealRatio / idealRatio) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Ideal: {idealRatio}:1
          </div>
        </div>

        {/* Tempo Data Summary */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-700">
            <div className="flex justify-between mb-1">
              <span>Average Tempo:</span>
              <span className="font-medium">{avgTempo.toFixed(1)}:1</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Stability:</span>
              <span className="font-medium">{tempoStability.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Data Points:</span>
              <span className="font-medium">{safeTempoData.length}</span>
            </div>
          </div>
        </div>

        {/* Tempo Analysis */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-700">
            {safeTempoRatio < 2.5 && (
              <div className="text-orange-600">
                ⚠️ Your backswing is too quick. Try counting "1-2-3" on backswing, "1" on downswing.
              </div>
            )}
            {safeTempoRatio > 3.5 && (
              <div className="text-blue-600">
                ℹ️ Your backswing is too slow. Focus on maintaining rhythm and tempo.
              </div>
            )}
            {safeTempoRatio >= 2.5 && safeTempoRatio <= 3.5 && (
              <div className="text-green-600">
                ✅ Great tempo! Your rhythm is well-balanced.
              </div>
            )}
          </div>
        </div>
      </div>
    </MetricsErrorBoundary>
  );
}
