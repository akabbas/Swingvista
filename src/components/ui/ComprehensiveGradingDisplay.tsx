"use client";

import React from 'react';
import { ComprehensiveGolfGrade, GradeLetter } from '@/lib/comprehensive-golf-grading';

interface ComprehensiveGradingDisplayProps {
  grade: ComprehensiveGolfGrade;
  className?: string;
}

const ComprehensiveGradingDisplay: React.FC<ComprehensiveGradingDisplayProps> = ({
  grade,
  className = ""
}) => {
  // Add null checking and fallbacks
  if (!grade || !grade.overall) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Grading Data Unavailable</h3>
          <p className="text-red-700">The grading system could not process this swing. Please try analyzing again.</p>
        </div>
      </div>
    );
  }

  const getGradeColor = (letter: GradeLetter) => {
    if (letter === 'A+' || letter === 'A' || letter === 'A-') return 'text-green-600 bg-green-50';
    if (letter === 'B+' || letter === 'B' || letter === 'B-') return 'text-blue-600 bg-blue-50';
    if (letter === 'C+' || letter === 'C' || letter === 'C-') return 'text-yellow-600 bg-yellow-50';
    if (letter === 'D+' || letter === 'D') return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Grade Display */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 border border-gray-200">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Swing Grade</h2>
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={`text-6xl font-bold px-6 py-4 rounded-2xl ${getGradeColor(grade.overall.letter || 'F')}`}>
              {grade.overall.letter || 'N/A'}
            </div>
            <div className="text-4xl font-bold text-gray-600">
              {grade.overall.score || 0}/100
            </div>
          </div>
          <p className="text-lg text-gray-600 mb-4">{grade.overall.description || 'No description available'}</p>
          
          {/* Emergency Override Notice */}
          {grade.emergencyOverrides?.applied && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Override Applied:</span> {grade.emergencyOverrides.reason || 'Unknown reason'}
              </p>
              <p className="text-xs text-yellow-700">
                Original Score: {grade.emergencyOverrides.originalScore || 0} → Adjusted: {grade.emergencyOverrides.adjustedScore || 0}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {grade.categories && Object.entries(grade.categories).map(([categoryName, category]) => (
          <div key={categoryName} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {categoryName.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(category?.letter || 'F')}`}>
                {category?.letter || 'N/A'}
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Score Display */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(category?.score || 0)}`}>
                  {category?.score || 0}/100
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(category?.score || 0)}`}
                  style={{ width: `${category?.score || 0}%` }}
                />
              </div>
              
              {/* Weight */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Weight</span>
                <span className="text-sm font-medium text-gray-900">
                  {((category?.weight || 0) * 100).toFixed(0)}%
                </span>
              </div>
              
              {/* Description */}
              <p className="text-sm text-gray-600">{category?.description || 'No description available'}</p>
              
              {/* Details */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Primary:</span> {category?.details?.primary || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Secondary:</span> {category?.details?.secondary || 'N/A'}
                </div>
                <div className="text-xs text-blue-600">
                  <span className="font-medium">Tip:</span> {category?.details?.improvement || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Metrics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {grade.comparison?.vsProfessional || 0}%
            </div>
            <div className="text-sm text-gray-600">vs Professional</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, grade.comparison?.vsProfessional || 0)}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {grade.comparison?.vsAmateur || 0}%
            </div>
            <div className="text-sm text-gray-600">vs Amateur</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, grade.comparison?.vsAmateur || 0)}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {grade.comparison?.percentile || 0}th
            </div>
            <div className="text-sm text-gray-600">Percentile</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, grade.comparison?.percentile || 0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data Quality Assessment */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Quality</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {grade.dataQuality?.poseCount || 0}
            </div>
            <div className="text-sm text-gray-600">Poses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {grade.dataQuality?.phaseCount || 0}
            </div>
            <div className="text-sm text-gray-600">Phases</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {grade.dataQuality?.qualityScore || 0}
            </div>
            <div className="text-sm text-gray-600">Quality Score</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${
              grade.dataQuality?.reliability === 'High' ? 'text-green-600' :
              grade.dataQuality?.reliability === 'Medium' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {grade.dataQuality?.reliability || 'Unknown'}
            </div>
            <div className="text-sm text-gray-600">Reliability</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Recommendations</h3>
        
        {/* Immediate Recommendations */}
        {grade.recommendations?.immediate?.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2 flex items-center">
              <span className="text-lg mr-2">⚡</span>
              Immediate (Quick Fixes)
            </h4>
            <ul className="space-y-1">
              {grade.recommendations.immediate.map((rec, index) => (
                <li key={index} className="text-sm text-red-800 flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Short-term Recommendations */}
        {grade.recommendations?.shortTerm?.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
              <span className="text-lg mr-2">📅</span>
              Short-term (1-2 weeks)
            </h4>
            <ul className="space-y-1">
              {grade.recommendations.shortTerm.map((rec, index) => (
                <li key={index} className="text-sm text-yellow-800 flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Long-term Recommendations */}
        {grade.recommendations?.longTerm?.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <span className="text-lg mr-2">🎯</span>
              Long-term (1+ months)
            </h4>
            <ul className="space-y-1">
              {grade.recommendations.longTerm.map((rec, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveGradingDisplay;
