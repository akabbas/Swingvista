'use client';

import React, { useState, useEffect } from 'react';
import SwingMetricsGraphs from './SwingMetricsGraphs';
import { SwingMetrics } from '@/lib/golf-metrics';

interface SwingAnalysisExampleProps {
  videoFile?: File;
  className?: string;
}

export default function SwingAnalysisExample({ videoFile, className = '' }: SwingAnalysisExampleProps) {
  const [analysis, setAnalysis] = useState<SwingMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate analysis process
  const analyzeSwing = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate analysis results
      const mockAnalysis: SwingMetrics = {
        tempo: {
          tempoRatio: 3.2,
          backswingTime: 0.8,
          downswingTime: 0.25,
          score: 85,
          tempoHistory: [3.1, 3.2, 3.3, 3.1, 3.2]
        },
        weightTransfer: {
          backswing: 85,
          impact: 80,
          finish: 95,
          score: 88
        },
        swingPlane: {
          shaftAngle: 45,
          planeDeviation: 2.5,
          score: 82
        },
        rotation: {
          shoulderTurn: 95,
          hipTurn: 45,
          xFactor: 50,
          score: 90
        }
      };
      
      setAnalysis(mockAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (videoFile) {
      analyzeSwing(videoFile);
    }
  };

  // Trigger analysis when video file changes
  useEffect(() => {
    if (videoFile) {
      analyzeSwing(videoFile);
    }
  }, [videoFile]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Video Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Upload Golf Swing Video</h2>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setAnalysis(null); // Reset previous analysis
              analyzeSwing(file);
            }
          }}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Analysis Results */}
      <SwingMetricsGraphs
        metrics={analysis}
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
      />

      {/* Additional Analysis Components */}
      {analysis && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Video Player */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Swing Video</h3>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Video player would go here</p>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Overall Score:</span>
                <span className="font-semibold text-lg">
                  {Math.round(
                    (analysis.tempo?.score || 0 + 
                     analysis.weightTransfer?.score || 0 + 
                     analysis.swingPlane?.score || 0 + 
                     analysis.rotation?.score || 0) / 4
                  )}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tempo:</span>
                <span className="font-medium">{analysis.tempo?.tempoRatio?.toFixed(1)}:1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weight Transfer:</span>
                <span className="font-medium">{analysis.weightTransfer?.impact}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Swing Plane:</span>
                <span className="font-medium">{analysis.swingPlane?.shaftAngle}°</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}








