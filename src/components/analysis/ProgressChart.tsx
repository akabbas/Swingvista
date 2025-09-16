'use client';

import { ProgressTracker } from '@/lib/swing-progress';
import { useEffect, useState } from 'react';

interface ProgressChartProps {
  metric: string;
  className?: string;
}

export default function ProgressChart({ metric, className }: ProgressChartProps) {
  const [progress, setProgress] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProgress = () => {
      const trend = ProgressTracker.getProgressTrend(metric);
      setProgress(trend);
      setIsLoading(false);
    };

    loadProgress();
    
    // Listen for storage changes (if user opens multiple tabs)
    const handleStorageChange = () => loadProgress();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [metric]);

  if (isLoading) {
    return (
      <div className={`text-center p-8 text-gray-500 ${className || ''}`}>
        <div className="animate-pulse">Loading progress...</div>
      </div>
    );
  }

  if (progress.length < 2) {
    return (
      <div className={`text-center p-8 text-gray-500 ${className || ''}`}>
        <div className="mb-2">📈</div>
        <p>Record more swings to see your progress with {metric}</p>
        <p className="text-sm mt-1">We need at least 2 sessions to show trends</p>
      </div>
    );
  }

  const maxScore = Math.max(...progress, 100);
  const minScore = Math.min(...progress, 0);
  const range = maxScore - minScore || 1;

  const getBarColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTrendIcon = () => {
    const recent = progress.slice(-3);
    if (recent.length < 2) return '📊';
    
    const isImproving = recent[recent.length - 1] > recent[0];
    return isImproving ? '📈' : '📉';
  };

  const getTrendText = () => {
    const recent = progress.slice(-3);
    if (recent.length < 2) return 'No trend yet';
    
    const isImproving = recent[recent.length - 1] > recent[0];
    const change = Math.abs(recent[recent.length - 1] - recent[0]);
    
    if (change < 2) return 'Stable';
    return isImproving ? `Improving (+${change.toFixed(1)})` : `Needs work (-${change.toFixed(1)})`;
  };

  return (
    <div className={`bg-white p-4 rounded-lg border ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-800 capitalize">{metric} Progress</h4>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getTrendIcon()}</span>
          <span className="text-sm text-gray-600">{getTrendText()}</span>
        </div>
      </div>
      
      <div className="h-32 flex items-end space-x-1 mb-4">
        {progress.map((score, index) => {
          const height = ((score - minScore) / range) * 100;
          const isLatest = index === progress.length - 1;
          
          return (
            <div
              key={index}
              className={`flex-1 rounded-t transition-all duration-300 hover:opacity-80 ${
                getBarColor(score)
              } ${isLatest ? 'ring-2 ring-blue-300' : ''}`}
              style={{ height: `${Math.max(height, 5)}%` }}
              title={`Session ${index + 1}: ${score.toFixed(0)}/100`}
            />
          );
        })}
      </div>
      
      <div className="flex justify-between text-sm text-gray-600">
        <span>{progress.length} sessions</span>
        <span>Latest: {progress[progress.length - 1]?.toFixed(0) || 0}/100</span>
      </div>
      
      {progress.length >= 5 && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
          <div className="flex justify-between">
            <span>Average: {ProgressTracker.getAverageScore(metric).toFixed(1)}</span>
            <span>Improvement: {ProgressTracker.getImprovementRate(metric).toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
