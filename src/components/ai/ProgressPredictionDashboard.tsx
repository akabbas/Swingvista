'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { ProgressPrediction, PredictionFactor, RiskFactor, PredictedMilestone } from '@/lib/ai-predictive-analysis';

export interface ProgressPredictionDashboardProps {
  prediction: ProgressPrediction;
  onMilestoneSelect?: (milestone: PredictedMilestone) => void;
  onFactorSelect?: (factor: PredictionFactor) => void;
  onRiskSelect?: (risk: RiskFactor) => void;
  className?: string;
}

export default function ProgressPredictionDashboard({
  prediction,
  onMilestoneSelect,
  onFactorSelect,
  onRiskSelect,
  className = ''
}: ProgressPredictionDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'factors' | 'risks' | 'milestones'>('overview');
  const [selectedMilestone, setSelectedMilestone] = useState<PredictedMilestone | null>(null);
  const [selectedFactor, setSelectedFactor] = useState<PredictionFactor | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<RiskFactor | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Handle milestone selection
  const handleMilestoneSelect = useCallback((milestone: PredictedMilestone) => {
    setSelectedMilestone(milestone);
    onMilestoneSelect?.(milestone);
  }, [onMilestoneSelect]);

  // Handle factor selection
  const handleFactorSelect = useCallback((factor: PredictionFactor) => {
    setSelectedFactor(factor);
    onFactorSelect?.(factor);
  }, [onFactorSelect]);

  // Handle risk selection
  const handleRiskSelect = useCallback((risk: RiskFactor) => {
    setSelectedRisk(risk);
    onRiskSelect?.(risk);
  }, [onRiskSelect]);

  const getImpactColor = (impact: number) => {
    if (impact > 0.7) return 'text-green-500';
    if (impact > 0.4) return 'text-yellow-500';
    if (impact > 0.1) return 'text-orange-500';
    return 'text-red-500';
  };

  const getImpactIcon = (impact: number) => {
    if (impact > 0.7) return '📈';
    if (impact > 0.4) return '📊';
    if (impact > 0.1) return '📉';
    return '⚠️';
  };

  const getRiskColor = (risk: number) => {
    if (risk > 0.8) return 'text-red-500';
    if (risk > 0.6) return 'text-orange-500';
    if (risk > 0.4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRiskIcon = (risk: number) => {
    if (risk > 0.8) return '🔴';
    if (risk > 0.6) return '🟠';
    if (risk > 0.4) return '🟡';
    return '🟢';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-500';
    if (confidence > 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Progress Prediction</h3>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-white">
              {(prediction.predictedScore * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-400">Predicted Score</div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex space-x-2">
          {(['week', 'month', 'quarter', 'year'] as const).map(time => (
            <button
              key={time}
              onClick={() => setTimeframe(time)}
              className={`px-3 py-1 rounded text-sm ${
                timeframe === time
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {time.charAt(0).toUpperCase() + time.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mt-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'factors', label: `Factors (${prediction.factors.length})` },
            { id: 'risks', label: `Risks (${prediction.riskFactors.length})` },
            { id: 'milestones', label: `Milestones (${prediction.milestones.length})` }
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
            {/* Prediction Summary */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-semibold text-white mb-4">Prediction Summary</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {(prediction.predictedScore * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-400">Predicted Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {(prediction.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-400">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {prediction.milestones.length}
                  </div>
                  <div className="text-sm text-gray-400">Milestones</div>
                </div>
              </div>
            </div>

            {/* Key Recommendations */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-semibold text-white mb-4">Key Recommendations</h4>
              <div className="space-y-2">
                {prediction.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                    <span className="text-sm text-gray-300">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factors Summary */}
            {prediction.riskFactors.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-4">Risk Factors</h4>
                <div className="space-y-2">
                  {prediction.riskFactors.slice(0, 3).map((risk, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-lg">{getRiskIcon(risk.risk)}</span>
                      <span className="text-sm text-gray-300">{risk.factor}</span>
                      <span className={`text-xs ${getRiskColor(risk.risk)}`}>
                        {(risk.risk * 100).toFixed(0)}% risk
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'factors' && (
          <div className="space-y-4">
            {prediction.factors.map((factor, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border cursor-pointer ${
                  selectedFactor === factor
                    ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                    : 'border-gray-600 bg-gray-700'
                }`}
                onClick={() => handleFactorSelect(factor)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getImpactIcon(factor.impact)}</span>
                      <h5 className="text-md font-medium text-white">{factor.factor}</h5>
                      <span className="text-xs text-gray-400">Weight: {(factor.weight * 100).toFixed(0)}%</span>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-2">{factor.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>Impact: {(factor.impact * 100).toFixed(0)}%</span>
                      <span>Weight: {(factor.weight * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm ${getImpactColor(factor.impact)}`}>
                      {(factor.impact * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="space-y-4">
            {prediction.riskFactors.map((risk, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border cursor-pointer ${
                  selectedRisk === risk
                    ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                    : 'border-gray-600 bg-gray-700'
                }`}
                onClick={() => handleRiskSelect(risk)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getRiskIcon(risk.risk)}</span>
                      <h5 className="text-md font-medium text-white">{risk.factor}</h5>
                      <span className={`text-xs ${getRiskColor(risk.risk)}`}>
                        {(risk.risk * 100).toFixed(0)}% risk
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-2">{risk.description}</p>
                    
                    <div className="text-xs text-gray-400">
                      Mitigation: {risk.mitigation}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm ${getRiskColor(risk.risk)}`}>
                      {(risk.risk * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="space-y-4">
            {prediction.milestones.map((milestone, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border cursor-pointer ${
                  selectedMilestone === milestone
                    ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                    : 'border-gray-600 bg-gray-700'
                }`}
                onClick={() => handleMilestoneSelect(milestone)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="text-md font-medium text-white">{milestone.name}</h5>
                      <span className={`text-xs ${getConfidenceColor(milestone.confidence)}`}>
                        {(milestone.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-2">
                      Predicted: {formatDate(milestone.predictedDate)}
                    </p>
                    
                    <div className="text-xs text-gray-400">
                      Requirements: {milestone.requirements.join(', ')}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-white">
                      {formatDate(milestone.predictedDate)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modals */}
      {selectedFactor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">{selectedFactor.factor}</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-white mb-2">Description</h4>
                <p className="text-sm text-gray-300">{selectedFactor.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Impact</h4>
                  <span className={`text-sm ${getImpactColor(selectedFactor.impact)}`}>
                    {(selectedFactor.impact * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Weight</h4>
                  <span className="text-sm text-white">
                    {(selectedFactor.weight * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setSelectedFactor(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRisk && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">{selectedRisk.factor}</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-white mb-2">Description</h4>
                <p className="text-sm text-gray-300">{selectedRisk.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Risk Level</h4>
                  <span className={`text-sm ${getRiskColor(selectedRisk.risk)}`}>
                    {(selectedRisk.risk * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Mitigation</h4>
                  <span className="text-sm text-white">{selectedRisk.mitigation}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setSelectedRisk(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMilestone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">{selectedMilestone.name}</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-white mb-2">Predicted Date</h4>
                <p className="text-sm text-gray-300">{formatDate(selectedMilestone.predictedDate)}</p>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-white mb-2">Confidence</h4>
                <span className={`text-sm ${getConfidenceColor(selectedMilestone.confidence)}`}>
                  {(selectedMilestone.confidence * 100).toFixed(0)}%
                </span>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-white mb-2">Requirements</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedMilestone.requirements.map((requirement, index) => (
                    <li key={index} className="text-sm text-gray-300">{requirement}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setSelectedMilestone(null)}
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
