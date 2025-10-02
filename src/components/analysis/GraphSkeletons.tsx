'use client';

import React from 'react';

// Base skeleton component
const SkeletonBase = ({ className = '', children, ...props }) => (
  <div className={`animate-pulse ${className}`} {...props}>
    {children}
  </div>
);

// Skeleton for tempo graph
export function TempoGraphSkeleton({ className = '' }) {
  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 bg-gray-200 rounded w-24"></div>
        <div className="h-6 bg-gray-200 rounded w-12"></div>
      </div>

      {/* Tempo Ratio Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-8"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded-full"></div>
        <div className="h-3 bg-gray-200 rounded w-16 mt-1"></div>
      </div>

      {/* Data Summary */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-8"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-6"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-18"></div>
            <div className="h-4 bg-gray-200 rounded w-4"></div>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );
}

// Skeleton for weight transfer graph
export function WeightTransferSkeleton({ className = '' }) {
  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 bg-gray-200 rounded w-28"></div>
        <div className="h-6 bg-gray-200 rounded w-12"></div>
      </div>

      {/* Weight Transfer Progression */}
      <div className="space-y-3 mb-4">
        {['Address', 'Backswing', 'Impact', 'Finish'].map((phase, index) => (
          <div key={phase} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded flex-1"></div>
              <div className="h-6 bg-gray-200 rounded flex-1"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Individual Metrics */}
      <div className="space-y-3">
        {['Backswing Weight', 'Impact Weight', 'Finish Weight'].map((metric, index) => (
          <div key={metric}>
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-10"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for swing plane graph
export function SwingPlaneSkeleton({ className = '' }) {
  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 bg-gray-200 rounded w-24"></div>
        <div className="h-6 bg-gray-200 rounded w-12"></div>
      </div>

      {/* Swing Plane Visualization */}
      <div className="mb-4">
        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-gray-400 text-sm">Swing Plane Visualization</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        {['Shaft Angle', 'Plane Deviation', 'Attack Angle'].map((metric, index) => (
          <div key={metric}>
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-10"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for rotation graph
export function RotationSkeleton({ className = '' }) {
  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 bg-gray-200 rounded w-20"></div>
        <div className="h-6 bg-gray-200 rounded w-12"></div>
      </div>

      {/* Rotation Metrics */}
      <div className="space-y-3">
        {['Shoulder Turn', 'Hip Turn', 'X-Factor'].map((metric, index) => (
          <div key={metric}>
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-10"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full"></div>
          </div>
        ))}
      </div>

      {/* Rotation Analysis */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
}

// Loading spinner component
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}></div>
    </div>
  );
}

// Loading overlay component
export function LoadingOverlay({ isLoading, children, message = 'Loading...' }) {
  if (!isLoading) return children;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-2" />
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
}

// Analysis loading state
export function AnalysisLoadingState({ className = '' }) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <LoadingSpinner size="xl" className="mb-4" />
      <h3 className="text-lg font-medium text-gray-800 mb-2">Analyzing Your Swing</h3>
      <p className="text-gray-600 mb-4">
        Processing video data and calculating swing metrics...
      </p>
      <div className="max-w-md mx-auto">
        <div className="bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
      </div>
    </div>
  );
}

// Error state component
export function AnalysisErrorState({ error, onRetry, className = '' }) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-red-500 mb-4">
        <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">Analysis Failed</h3>
      <p className="text-gray-600 mb-4">
        {error || 'Unable to process your swing video. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// Empty state component
export function AnalysisEmptyState({ className = '' }) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-gray-400 mb-4">
        <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">No Analysis Data</h3>
      <p className="text-gray-600">
        Upload a golf swing video to see detailed analysis and metrics.
      </p>
    </div>
  );
}







