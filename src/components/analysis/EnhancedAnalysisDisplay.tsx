/**
 * Enhanced Analysis Display Component
 * 
 * Displays comprehensive swing analysis with enhanced validation and dynamic advice
 */

import React from 'react';

interface EnhancedValidation {
  poseDataQuality: {
    isValid: boolean;
    confidence: number;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  };
  calculationAccuracy: {
    isValid: boolean;
    confidence: number;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  };
  physicalPossibility: {
    isValid: boolean;
    confidence: number;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  };
  videoConsistency: {
    isValid: boolean;
    confidence: number;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  };
  overall: {
    isValid: boolean;
    confidence: number;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  };
}

interface DynamicAdvice {
  overallAssessment: string;
  strengths: string[];
  improvements: string[];
  drills: string[];
  keyTip: string;
  professionalInsight: string;
  nextSteps: string[];
  confidence: number;
  personalizedFactors: string[];
  swingType: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

interface EnhancedAnalysisDisplayProps {
  enhancedValidation?: EnhancedValidation;
  dynamicAdvice?: DynamicAdvice;
  className?: string;
}

export default function EnhancedAnalysisDisplay({
  enhancedValidation,
  dynamicAdvice,
  className = ''
}: EnhancedAnalysisDisplayProps) {
  if (!enhancedValidation && !dynamicAdvice) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Validation Display */}
      {enhancedValidation && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-blue-800">Enhanced Metrics Validation</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              enhancedValidation.overall.isValid 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {enhancedValidation.overall.isValid ? 'Valid' : 'Issues Detected'}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pose Data Quality */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-800 mb-2">Pose Data Quality</h4>
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  enhancedValidation.poseDataQuality.isValid ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-600">
                  Confidence: {(enhancedValidation.poseDataQuality.confidence * 100).toFixed(1)}%
                </span>
              </div>
              {enhancedValidation.poseDataQuality.errors.length > 0 && (
                <div className="text-sm text-red-600 mb-2">
                  <strong>Errors:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {enhancedValidation.poseDataQuality.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {enhancedValidation.poseDataQuality.warnings.length > 0 && (
                <div className="text-sm text-yellow-600 mb-2">
                  <strong>Warnings:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {enhancedValidation.poseDataQuality.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              {enhancedValidation.poseDataQuality.recommendations.length > 0 && (
                <div className="text-sm text-blue-600">
                  <strong>Recommendations:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {enhancedValidation.poseDataQuality.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Calculation Accuracy */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-800 mb-2">Calculation Accuracy</h4>
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  enhancedValidation.calculationAccuracy.isValid ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-600">
                  Confidence: {(enhancedValidation.calculationAccuracy.confidence * 100).toFixed(1)}%
                </span>
              </div>
              {enhancedValidation.calculationAccuracy.errors.length > 0 && (
                <div className="text-sm text-red-600 mb-2">
                  <strong>Errors:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {enhancedValidation.calculationAccuracy.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {enhancedValidation.calculationAccuracy.warnings.length > 0 && (
                <div className="text-sm text-yellow-600 mb-2">
                  <strong>Warnings:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {enhancedValidation.calculationAccuracy.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Physical Possibility */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-800 mb-2">Physical Possibility</h4>
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  enhancedValidation.physicalPossibility.isValid ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-600">
                  Confidence: {(enhancedValidation.physicalPossibility.confidence * 100).toFixed(1)}%
                </span>
              </div>
              {enhancedValidation.physicalPossibility.errors.length > 0 && (
                <div className="text-sm text-red-600 mb-2">
                  <strong>Errors:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {enhancedValidation.physicalPossibility.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {enhancedValidation.physicalPossibility.warnings.length > 0 && (
                <div className="text-sm text-yellow-600 mb-2">
                  <strong>Warnings:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {enhancedValidation.physicalPossibility.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Video Consistency */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-800 mb-2">Video Consistency</h4>
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  enhancedValidation.videoConsistency.isValid ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-600">
                  Confidence: {(enhancedValidation.videoConsistency.confidence * 100).toFixed(1)}%
                </span>
              </div>
              {enhancedValidation.videoConsistency.errors.length > 0 && (
                <div className="text-sm text-red-600 mb-2">
                  <strong>Errors:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {enhancedValidation.videoConsistency.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {enhancedValidation.videoConsistency.warnings.length > 0 && (
                <div className="text-sm text-yellow-600 mb-2">
                  <strong>Warnings:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {enhancedValidation.videoConsistency.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Advice Display */}
      {dynamicAdvice && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-green-800">Dynamic Personalized Advice</h3>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {dynamicAdvice.difficultyLevel.charAt(0).toUpperCase() + dynamicAdvice.difficultyLevel.slice(1)}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {dynamicAdvice.swingType}
              </span>
            </div>
          </div>

          {/* Overall Assessment */}
          <div className="bg-white rounded-lg p-4 mb-4 border">
            <h4 className="font-semibold text-gray-800 mb-2">Overall Assessment</h4>
            <p className="text-gray-700">{dynamicAdvice.overallAssessment}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {dynamicAdvice.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-orange-700 mb-2">Areas for Improvement</h4>
              <ul className="space-y-1">
                {dynamicAdvice.improvements.map((improvement, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>

            {/* Drills */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-blue-700 mb-2">Recommended Drills</h4>
              <ul className="space-y-1">
                {dynamicAdvice.drills.map((drill, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-blue-500 mr-2">🏌️</span>
                    {drill}
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Tip */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-purple-700 mb-2">Key Tip</h4>
              <p className="text-sm text-gray-700 italic">"{dynamicAdvice.keyTip}"</p>
            </div>
          </div>

          {/* Professional Insight */}
          <div className="bg-white rounded-lg p-4 mt-4 border">
            <h4 className="font-semibold text-indigo-700 mb-2">Professional Insight</h4>
            <p className="text-gray-700">{dynamicAdvice.professionalInsight}</p>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-lg p-4 mt-4 border">
            <h4 className="font-semibold text-gray-800 mb-2">Next Steps</h4>
            <ul className="space-y-1">
              {dynamicAdvice.nextSteps.map((step, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="text-gray-500 mr-2">{index + 1}.</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Personalized Factors */}
          {dynamicAdvice.personalizedFactors.length > 0 && (
            <div className="bg-white rounded-lg p-4 mt-4 border">
              <h4 className="font-semibold text-gray-800 mb-2">Personalized Factors</h4>
              <div className="flex flex-wrap gap-2">
                {dynamicAdvice.personalizedFactors.map((factor, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Score */}
          <div className="bg-white rounded-lg p-4 mt-4 border">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800">Analysis Confidence</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${dynamicAdvice.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {(dynamicAdvice.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
