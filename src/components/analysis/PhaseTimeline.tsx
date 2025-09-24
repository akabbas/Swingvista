'use client';

import React from 'react';
import { SwingPhaseAnalysis } from '@/lib/professional-phase-detection';

interface PhaseTimelineProps {
  phaseAnalysis: SwingPhaseAnalysis;
  currentTime: number;
  className?: string;
}

export default function PhaseTimeline({ 
  phaseAnalysis, 
  currentTime, 
  className = '' 
}: PhaseTimelineProps) {
  const phases = [
    { 
      name: 'Address', 
      data: phaseAnalysis.address, 
      color: '#00ff00',
      description: 'Setup position'
    },
    { 
      name: 'Approach', 
      data: phaseAnalysis.approach, 
      color: '#ffff00',
      description: 'Initial movement'
    },
    { 
      name: 'Backswing', 
      data: phaseAnalysis.backswing, 
      color: '#ff8800',
      description: 'Club going back'
    },
    { 
      name: 'Top', 
      data: phaseAnalysis.top, 
      color: '#ff0000',
      description: 'Top of swing'
    },
    { 
      name: 'Downswing', 
      data: phaseAnalysis.downswing, 
      color: '#8800ff',
      description: 'Club coming down'
    },
    { 
      name: 'Impact', 
      data: phaseAnalysis.impact, 
      color: '#ff0088',
      description: 'Ball contact'
    },
    { 
      name: 'Follow-Through', 
      data: phaseAnalysis.followThrough, 
      color: '#00ffff',
      description: 'Finish'
    }
  ];

  const calculateTempoRatio = () => {
    const backswingTime = phaseAnalysis.backswing.duration;
    const downswingTime = phaseAnalysis.downswing.duration;
    return downswingTime > 0 ? backswingTime / downswingTime : 0;
  };

  const getCurrentPhase = () => {
    return phases.find(phase => {
      const phaseStart = phase.data.start / 30; // Convert frame to time
      const phaseEnd = phase.data.end / 30;
      return currentTime >= phaseStart && currentTime <= phaseEnd;
    });
  };

  const currentPhase = getCurrentPhase();

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Swing Phase Breakdown</h3>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Total Duration: {phaseAnalysis.totalDuration.toFixed(2)}s</span>
          <span>Confidence: {(phaseAnalysis.overallConfidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Phase Timeline */}
      <div className="p-4">
        <div className="relative">
          {/* Timeline Bar */}
          <div className="h-8 bg-gray-200 rounded-full overflow-hidden relative">
            {phases.map((phase, index) => {
              const phaseStart = phase.data.start / 30;
              const phaseEnd = phase.data.end / 30;
              const phaseDuration = phase.data.duration;
              const totalDuration = phaseAnalysis.totalDuration;
              
              const leftPercent = (phaseStart / totalDuration) * 100;
              const widthPercent = (phaseDuration / totalDuration) * 100;
              
              return (
                <div
                  key={phase.name}
                  className="absolute h-full flex items-center justify-center"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: phase.color,
                    opacity: 0.8
                  }}
                >
                  <span className="text-xs font-medium text-white">
                    {phase.name}
                  </span>
                </div>
              );
            })}
            
            {/* Current Time Indicator */}
            <div
              className="absolute top-0 h-full w-1 bg-black z-10"
              style={{
                left: `${(currentTime / phaseAnalysis.totalDuration) * 100}%`
              }}
            />
          </div>

          {/* Phase Details */}
          <div className="mt-4 space-y-2">
            {phases.map((phase, index) => {
              const phaseStart = phase.data.start / 30;
              const phaseEnd = phase.data.end / 30;
              const isActive = currentTime >= phaseStart && currentTime <= phaseEnd;
              
              return (
                <div
                  key={phase.name}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: phase.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-800">{phase.name}</div>
                        <div className="text-sm text-gray-600">{phase.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-800">
                        {phase.data.duration.toFixed(2)}s
                      </div>
                      <div className="text-xs text-gray-500">
                        {(phase.data.confidence * 100).toFixed(0)}% conf
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Phase Metrics */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {calculateTempoRatio().toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">Tempo Ratio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {phaseAnalysis.backswing.duration.toFixed(2)}s
            </div>
            <div className="text-xs text-gray-600">Backswing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {phaseAnalysis.downswing.duration.toFixed(2)}s
            </div>
            <div className="text-xs text-gray-600">Downswing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {currentPhase?.name || 'N/A'}
            </div>
            <div className="text-xs text-gray-600">Current Phase</div>
          </div>
        </div>
      </div>

      {/* Professional Benchmarks */}
      <div className="p-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Professional Benchmarks</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="font-medium text-green-800">Tempo Ratio</div>
            <div className="text-green-600">
              Ideal: 3.0:1 | Yours: {calculateTempoRatio().toFixed(2)}:1
            </div>
            <div className="text-xs text-green-600 mt-1">
              {calculateTempoRatio() >= 2.8 && calculateTempoRatio() <= 3.2 
                ? '✅ Excellent tempo' 
                : '⚠️ Work on tempo consistency'
              }
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="font-medium text-blue-800">Backswing Time</div>
            <div className="text-blue-600">
              Ideal: 0.8s | Yours: {phaseAnalysis.backswing.duration.toFixed(2)}s
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {phaseAnalysis.backswing.duration >= 0.7 && phaseAnalysis.backswing.duration <= 0.9 
                ? '✅ Good timing' 
                : '⚠️ Adjust backswing speed'
              }
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="font-medium text-purple-800">Downswing Time</div>
            <div className="text-purple-600">
              Ideal: 0.25s | Yours: {phaseAnalysis.downswing.duration.toFixed(2)}s
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {phaseAnalysis.downswing.duration >= 0.23 && phaseAnalysis.downswing.duration <= 0.27 
                ? '✅ Perfect timing' 
                : '⚠️ Work on downswing speed'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




