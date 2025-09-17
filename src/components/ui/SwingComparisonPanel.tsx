"use client";

import React from 'react';
import { SwingComparison } from '@/lib/swing-history';

interface SwingComparisonPanelProps {
  comparison: SwingComparison;
  onClose?: () => void;
  className?: string;
}

const SwingComparisonPanel: React.FC<SwingComparisonPanelProps> = ({
  comparison,
  onClose,
  className = ""
}) => {
  const getChangeColor = (change: number) => {
    if (change > 5) return 'text-green-600';
    if (change < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 5) return '📈';
    if (change < -5) return '📉';
    return '➡️';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (duration: number) => {
    return (duration / 1000).toFixed(1) + 's';
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Swing Comparison</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Overall Comparison */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Overall Performance</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {comparison.current.grade.overall.letter}
            </div>
            <div className="text-lg text-gray-600 mb-1">
              {comparison.current.grade.overall.score}/100
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(comparison.current.date)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {comparison.previous.grade.overall.letter}
            </div>
            <div className="text-lg text-gray-600 mb-1">
              {comparison.previous.grade.overall.score}/100
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(comparison.previous.date)}
            </div>
          </div>
        </div>
        
        <div className="text-center mt-4">
          <div className={`text-lg font-medium ${getChangeColor(comparison.overallChange)}`}>
            {getChangeIcon(comparison.overallChange)} {comparison.overallChange > 0 ? '+' : ''}{comparison.overallChange.toFixed(1)} points
          </div>
        </div>
      </div>

      {/* Category Comparison */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900">Category Breakdown</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(comparison.categoryChanges).map(([category, change]) => (
            <div key={category} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className={`font-medium ${getChangeColor(change)}`}>
                  {getChangeIcon(change)} {change > 0 ? '+' : ''}{change.toFixed(1)}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Current: {comparison.current.grade.categories[category as keyof typeof comparison.current.grade.categories]?.score || 0}/100
              </div>
              <div className="text-sm text-gray-600">
                Previous: {comparison.previous.grade.categories[category as keyof typeof comparison.previous.grade.categories]?.score || 0}/100
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Improvements and Regressions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Improvements */}
        {comparison.improvements.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="font-medium text-green-900 mb-2 flex items-center">
              <span className="text-lg mr-2">📈</span>
              Improvements
            </h5>
            <ul className="space-y-1">
              {comparison.improvements.map((improvement, index) => (
                <li key={index} className="text-sm text-green-800 flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Regressions */}
        {comparison.regressions.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h5 className="font-medium text-red-900 mb-2 flex items-center">
              <span className="text-lg mr-2">📉</span>
              Areas to Focus On
            </h5>
            <ul className="space-y-1">
              {comparison.regressions.map((regression, index) => (
                <li key={index} className="text-sm text-red-800 flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  {regression}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Video Details */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Video Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Current Swing</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <div>File: {comparison.current.fileName}</div>
              <div>Duration: {formatDuration(comparison.current.duration)}</div>
              <div>Poses: {comparison.current.poses.length}</div>
              <div>Phases: {comparison.current.phases.length}</div>
            </div>
          </div>
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Previous Swing</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <div>File: {comparison.previous.fileName}</div>
              <div>Duration: {formatDuration(comparison.previous.duration)}</div>
              <div>Poses: {comparison.previous.poses.length}</div>
              <div>Phases: {comparison.previous.phases.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
        <p className="text-sm text-gray-600">
          {comparison.overallChange > 0 
            ? `Your swing has improved by ${comparison.overallChange.toFixed(1)} points overall. ${comparison.improvements.length > 0 ? `Key improvements: ${comparison.improvements.slice(0, 2).join(', ')}.` : ''}`
            : comparison.overallChange < 0
            ? `Your swing has decreased by ${Math.abs(comparison.overallChange).toFixed(1)} points overall. ${comparison.regressions.length > 0 ? `Focus on: ${comparison.regressions.slice(0, 2).join(', ')}.` : ''}`
            : 'Your swing performance has remained consistent.'
          }
        </p>
      </div>
    </div>
  );
};

export default SwingComparisonPanel;
