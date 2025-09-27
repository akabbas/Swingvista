'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { AIAnalysisResult, SwingFault, PersonalizedDrill, ProgressPrediction, InjuryPreventionAlert } from '@/lib/ai-predictive-analysis';

export interface AIAnalysisVisualizerProps {
  analysisResult: AIAnalysisResult;
  onDrillSelect?: (drill: PersonalizedDrill) => void;
  onFaultSelect?: (fault: SwingFault) => void;
  onAlertSelect?: (alert: InjuryPreventionAlert) => void;
  className?: string;
}

export default function AIAnalysisVisualizer({
  analysisResult,
  onDrillSelect,
  onFaultSelect,
  onAlertSelect,
  className = ''
}: AIAnalysisVisualizerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'faults' | 'drills' | 'progress' | 'injury'>('overview');
  const [selectedFault, setSelectedFault] = useState<SwingFault | null>(null);
  const [selectedDrill, setSelectedDrill] = useState<PersonalizedDrill | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<InjuryPreventionAlert | null>(null);

  // Handle fault selection
  const handleFaultSelect = useCallback((fault: SwingFault) => {
    setSelectedFault(fault);
    onFaultSelect?.(fault);
  }, [onFaultSelect]);

  // Handle drill selection
  const handleDrillSelect = useCallback((drill: PersonalizedDrill) => {
    setSelectedDrill(drill);
    onDrillSelect?.(drill);
  }, [onDrillSelect]);

  // Handle alert selection
  const handleAlertSelect = useCallback((alert: InjuryPreventionAlert) => {
    setSelectedAlert(alert);
    onAlertSelect?.(alert);
  }, [onAlertSelect]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technique': return 'bg-blue-100 text-blue-800';
      case 'timing': return 'bg-green-100 text-green-800';
      case 'posture': return 'bg-purple-100 text-purple-800';
      case 'grip': return 'bg-yellow-100 text-yellow-800';
      case 'stance': return 'bg-pink-100 text-pink-800';
      case 'follow-through': return 'bg-indigo-100 text-indigo-800';
      case 'power': return 'bg-red-100 text-red-800';
      case 'accuracy': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'professional': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-red-500';
      case 'caution': return 'text-yellow-500';
      case 'recommendation': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'caution': return '⚠️';
      case 'recommendation': return '💡';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">AI Analysis Results</h3>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-white">
              {(analysisResult.overallScore * 100).toFixed(0)}
            </div>
            <div className="text-sm text-gray-400">Overall Score</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'faults', label: `Faults (${analysisResult.swingFaults.length})` },
            { id: 'drills', label: `Drills (${analysisResult.personalizedDrills.length})` },
            { id: 'progress', label: 'Progress' },
            { id: 'injury', label: `Alerts (${analysisResult.injuryAlerts.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-semibold text-white mb-4">Overall Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {(analysisResult.overallScore * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-400">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {analysisResult.swingFaults.length}
                  </div>
                  <div className="text-sm text-gray-400">Faults Detected</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {analysisResult.personalizedDrills.length}
                  </div>
                  <div className="text-sm text-gray-400">Recommended Drills</div>
                </div>
              </div>
            </div>

            {/* Strengths and Improvement Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-3">Strengths</h4>
                <div className="space-y-2">
                  {analysisResult.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-gray-300">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-3">Improvement Areas</h4>
                <div className="space-y-2">
                  {analysisResult.improvementAreas.map((area, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-sm text-gray-300">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-semibold text-white mb-3">Key Recommendations</h4>
              <div className="space-y-2">
                {analysisResult.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                    <span className="text-sm text-gray-300">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-semibold text-white mb-3">Next Steps</h4>
              <div className="space-y-2">
                {analysisResult.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                    <span className="text-sm text-gray-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'faults' && (
          <div className="space-y-4">
            {analysisResult.swingFaults.map(fault => (
              <div
                key={fault.id}
                className={`p-4 rounded-lg border cursor-pointer ${
                  selectedFault?.id === fault.id
                    ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                    : 'border-gray-600 bg-gray-700'
                }`}
                onClick={() => handleFaultSelect(fault)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="text-md font-medium text-white">{fault.name}</h5>
                      <span className={`px-2 py-1 rounded text-xs ${getSeverityBgColor(fault.severity)}`}>
                        {fault.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(fault.category)}`}>
                        {fault.category}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-2">{fault.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>Confidence: {(fault.confidence * 100).toFixed(0)}%</span>
                      <span>Impact: {(fault.impactOnScore * 100).toFixed(0)}%</span>
                      <span>Phases: {fault.affectedPhases.join(', ')}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-white">
                      {fault.correctionSuggestions.length} corrections
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'drills' && (
          <div className="space-y-4">
            {analysisResult.personalizedDrills.map(drill => (
              <div
                key={drill.id}
                className={`p-4 rounded-lg border cursor-pointer ${
                  selectedDrill?.id === drill.id
                    ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                    : 'border-gray-600 bg-gray-700'
                }`}
                onClick={() => handleDrillSelect(drill)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="text-md font-medium text-white">{drill.name}</h5>
                      <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(drill.difficulty)}`}>
                        {drill.difficulty}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(drill.category)}`}>
                        {drill.category}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-2">{drill.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>Duration: {drill.duration} min</span>
                      <span>Repetitions: {drill.repetitions}</span>
                      <span>Equipment: {drill.equipment.join(', ')}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-white">
                      {(drill.effectivenessScore * 100).toFixed(0)}% effective
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-semibold text-white mb-4">Progress Prediction</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {(analysisResult.progressPrediction.predictedScore * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-400">Predicted Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {(analysisResult.progressPrediction.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-400">Confidence</div>
                </div>
              </div>
              
              <div className="mb-4">
                <h5 className="text-sm font-medium text-white mb-2">Prediction Factors</h5>
                <div className="space-y-2">
                  {analysisResult.progressPrediction.factors.map((factor, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{factor.description}</span>
                      <span className="text-sm text-white">
                        {(factor.impact * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <h5 className="text-sm font-medium text-white mb-2">Recommendations</h5>
                <div className="space-y-1">
                  {analysisResult.progressPrediction.recommendations.map((rec, index) => (
                    <div key={index} className="text-sm text-gray-300">• {rec}</div>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-white mb-2">Predicted Milestones</h5>
                <div className="space-y-2">
                  {analysisResult.progressPrediction.milestones.map((milestone, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{milestone.name}</span>
                      <span className="text-sm text-white">
                        {(milestone.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'injury' && (
          <div className="space-y-4">
            {analysisResult.injuryAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border cursor-pointer ${
                  selectedAlert?.id === alert.id
                    ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                    : 'border-gray-600 bg-gray-700'
                }`}
                onClick={() => handleAlertSelect(alert)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getAlertTypeIcon(alert.type)}</span>
                      <h5 className="text-md font-medium text-white">{alert.title}</h5>
                      <span className={`px-2 py-1 rounded text-xs ${getSeverityBgColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className={`text-xs ${getAlertTypeColor(alert.type)}`}>
                        {alert.type.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-2">{alert.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>Body Parts: {alert.affectedBodyParts.join(', ')}</span>
                      <span>Timeframe: {alert.timeframe}</span>
                      <span>Confidence: {(alert.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-white">
                      {alert.preventionMeasures.length} measures
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modals */}
      {selectedFault && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">{selectedFault.name}</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-white mb-2">Description</h4>
                <p className="text-sm text-gray-300">{selectedFault.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Severity</h4>
                  <span className={`px-2 py-1 rounded text-xs ${getSeverityBgColor(selectedFault.severity)}`}>
                    {selectedFault.severity.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Confidence</h4>
                  <span className="text-sm text-white">{(selectedFault.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-white mb-2">Correction Suggestions</h4>
                <div className="space-y-2">
                  {selectedFault.correctionSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-gray-700 rounded-lg">
                      <h5 className="text-sm font-medium text-white">{suggestion.title}</h5>
                      <p className="text-xs text-gray-300">{suggestion.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-gray-400">Priority: {suggestion.priority}</span>
                        <span className="text-xs text-gray-400">Difficulty: {suggestion.difficulty}</span>
                        <span className="text-xs text-gray-400">Time: {suggestion.estimatedTime} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setSelectedFault(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDrill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">{selectedDrill.name}</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-white mb-2">Description</h4>
                <p className="text-sm text-gray-300">{selectedDrill.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Duration</h4>
                  <span className="text-sm text-white">{selectedDrill.duration} minutes</span>
                </div>
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Repetitions</h4>
                  <span className="text-sm text-white">{selectedDrill.repetitions}</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-white mb-2">Instructions</h4>
                <ol className="list-decimal list-inside space-y-1">
                  {selectedDrill.instructions.map((instruction, index) => (
                    <li key={index} className="text-sm text-gray-300">{instruction}</li>
                  ))}
                </ol>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-white mb-2">Benefits</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedDrill.benefits.map((benefit, index) => (
                    <li key={index} className="text-sm text-gray-300">{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setSelectedDrill(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">{selectedAlert.title}</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-white mb-2">Description</h4>
                <p className="text-sm text-gray-300">{selectedAlert.description}</p>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-white mb-2">Prevention Measures</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedAlert.preventionMeasures.map((measure, index) => (
                    <li key={index} className="text-sm text-gray-300">{measure}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-white mb-2">Recommended Actions</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedAlert.recommendedActions.map((action, index) => (
                    <li key={index} className="text-sm text-gray-300">{action}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
