'use client';

import { DrillRecommendationEngine, DrillRecommendation } from '@/lib/drill-recommendations';
import { useState } from 'react';

interface DrillRecommendationsProps {
  metrics: any;
  className?: string;
}

export default function DrillRecommendations({ metrics, className }: DrillRecommendationsProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('tempo');
  const [selectedDrill, setSelectedDrill] = useState<DrillRecommendation | null>(null);

  const getDrillsForMetrics = () => {
    const drills: Record<string, DrillRecommendation[]> = {};
    
    // Map metrics to drill categories
    const metricMap = {
      tempo: metrics?.tempo?.ratio || 0,
      rotation: metrics?.rotation?.shoulders || 0,
      balance: (metrics?.balance?.score || 0) * 100,
      plane: (metrics?.plane?.consistency || 0) * 100,
      power: (metrics?.power?.score || 0) * 100,
      consistency: (metrics?.consistency?.score || 0) * 100
    };

    Object.entries(metricMap).forEach(([metric, score]) => {
      if (score > 0) {
        drills[metric] = DrillRecommendationEngine.getDrillsForMetric(metric, score);
      }
    });

    return drills;
  };

  const drills = getDrillsForMetrics();
  const availableMetrics = Object.keys(drills).filter(metric => drills[metric].length > 0);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🔴';
      default: return '⚪';
    }
  };

  if (availableMetrics.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className || ''}`}>
        <h3 className="text-xl font-semibold mb-4">Recommended Drills</h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🏌️‍♂️</div>
          <p>Complete a swing analysis to get personalized drill recommendations!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className || ''}`}>
      <h3 className="text-xl font-semibold mb-4">Recommended Drills</h3>
      
      {/* Metric Selection */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {availableMetrics.map(metric => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedMetric === metric
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Drills List */}
      <div className="space-y-4">
        {drills[selectedMetric]?.map((drill, index) => (
          <div 
            key={index} 
            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedDrill(drill)}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-800">{drill.name}</h4>
              <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(drill.difficulty)}`}>
                {getDifficultyIcon(drill.difficulty)} {drill.difficulty}
              </div>
            </div>
            
            <p className="text-gray-600 mb-3">{drill.description}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>⏱️ {drill.duration}</span>
              <span>🎯 {drill.equipment.length} items needed</span>
            </div>
          </div>
        ))}
      </div>

      {/* Drill Detail Modal */}
      {selectedDrill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold">{selectedDrill.name}</h3>
                <button
                  onClick={() => setSelectedDrill(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(selectedDrill.difficulty)}`}>
                  {getDifficultyIcon(selectedDrill.difficulty)} {selectedDrill.difficulty}
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">{selectedDrill.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-medium mb-2">Duration</h4>
                  <p className="text-gray-600">⏱️ {selectedDrill.duration}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Equipment Needed</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedDrill.equipment.map((item, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Steps</h4>
                <ol className="space-y-2">
                  {selectedDrill.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              
              {selectedDrill.visualDemo && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Visual Demo</h4>
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <p className="text-gray-600">🎥 Video demonstration coming soon</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


