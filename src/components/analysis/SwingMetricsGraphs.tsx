'use client';

import React, { useState } from 'react';
import { SwingMetrics } from '@/lib/golf-metrics';
import TempoGraph from './TempoGraph';
import WeightTransferGraph from './WeightTransferGraph';
import SwingPlaneGraph from './SwingPlaneGraph';
import RotationGraph from './RotationGraph';
import MetricsErrorBoundary from './MetricsErrorBoundary';
import {
  TempoGraphSkeleton,
  WeightTransferSkeleton,
  SwingPlaneSkeleton,
  RotationSkeleton,
  AnalysisLoadingState,
  AnalysisErrorState,
  AnalysisEmptyState,
  LoadingOverlay
} from './GraphSkeletons';

interface SwingMetricsGraphsProps {
  metrics?: SwingMetrics;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export default function SwingMetricsGraphs({ 
  metrics, 
  isLoading = false, 
  error = null, 
  onRetry, 
  className = '' 
}: SwingMetricsGraphsProps) {
  const [activeGraph, setActiveGraph] = useState<string>('tempo');

  const graphTabs = [
    { id: 'tempo', label: 'Tempo Rhythm', icon: '⏱️' },
    { id: 'weight', label: 'Weight Transfer', icon: '⚖️' },
    { id: 'plane', label: 'Swing Plane', icon: '📐' },
    { id: 'rotation', label: 'Rotation', icon: '🔄' }
  ];

  // Handle loading state
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Swing Analysis Graphs</h3>
          <p className="text-sm text-gray-600">
            Analyzing your swing data...
          </p>
        </div>

        {/* Loading Content */}
        <div className="p-4">
          <AnalysisLoadingState />
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Swing Analysis Graphs</h3>
          <p className="text-sm text-gray-600">
            Unable to load analysis data
          </p>
        </div>

        {/* Error Content */}
        <div className="p-4">
          <AnalysisErrorState error={error} onRetry={onRetry} />
        </div>
      </div>
    );
  }

  // Handle empty state
  if (!metrics) {
    return (
      <div className={`bg-white rounded-lg shadow-lg ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Swing Analysis Graphs</h3>
          <p className="text-sm text-gray-600">
            No analysis data available
          </p>
        </div>

        {/* Empty Content */}
        <div className="p-4">
          <AnalysisEmptyState />
        </div>
      </div>
    );
  }

  const renderActiveGraph = () => {
    switch (activeGraph) {
      case 'tempo':
        // Ensure we have valid tempo data with multiple fallback options
        const tempoRatio = metrics.tempo?.tempoRatio ?? 
                          metrics.tempo?.ratio ?? 
                          (metrics.tempo?.backswingTime && metrics.tempo?.downswingTime ? 
                            metrics.tempo.backswingTime / metrics.tempo.downswingTime : 
                          3.0);
        
        const tempoData = metrics.tempo?.tempoHistory || 
                         metrics.tempo?.history || 
                         metrics.tempo?.data || 
                         [];
        
        // Debug logging for troubleshooting
        if (process.env.NODE_ENV === 'development') {
          console.log('TempoGraph Data Debug:', {
            originalTempo: metrics.tempo,
            calculatedRatio: tempoRatio,
            tempoData: tempoData,
            isArray: Array.isArray(tempoData)
          });
        }
        
        return (
          <MetricsErrorBoundary>
            <TempoGraph 
              tempoRatio={tempoRatio}
              tempoData={Array.isArray(tempoData) ? tempoData : []}
            />
          </MetricsErrorBoundary>
        );
      case 'weight':
        return (
          <MetricsErrorBoundary>
            <WeightTransferGraph data={metrics.weightTransfer || {}} />
          </MetricsErrorBoundary>
        );
      case 'plane':
        return (
          <MetricsErrorBoundary>
            <SwingPlaneGraph data={metrics.swingPlane || {}} />
          </MetricsErrorBoundary>
        );
      case 'rotation':
        return (
          <MetricsErrorBoundary>
            <RotationGraph data={metrics.rotation || {}} />
          </MetricsErrorBoundary>
        );
      default:
        return (
          <MetricsErrorBoundary>
            <TempoGraph 
              tempoRatio={metrics.tempo?.tempoRatio ?? 3.0}
              tempoData={metrics.tempo?.tempoHistory || []}
            />
          </MetricsErrorBoundary>
        );
    }
  };


  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Swing Analysis Graphs</h3>
        <p className="text-sm text-gray-600">
          Detailed visualizations of your swing metrics with professional benchmarks
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {graphTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveGraph(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeGraph === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Graph Content */}
      <div className="p-4">
        <LoadingOverlay isLoading={isLoading} message="Loading graph data...">
          {renderActiveGraph()}
        </LoadingOverlay>
      </div>

      {/* Summary Stats */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.tempo?.score?.toFixed(0) || '0'}
            </div>
            <div className="text-xs text-gray-600">Tempo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {metrics.weightTransfer?.score?.toFixed(0) || '0'}
            </div>
            <div className="text-xs text-gray-600">Weight</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {metrics.swingPlane?.score?.toFixed(0) || '0'}
            </div>
            <div className="text-xs text-gray-600">Plane</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {metrics.rotation?.score?.toFixed(0) || '0'}
            </div>
            <div className="text-xs text-gray-600">Rotation</div>
          </div>
        </div>
      </div>
    </div>
  );
}
