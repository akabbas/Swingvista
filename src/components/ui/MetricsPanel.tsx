"use client";

import React from 'react';

interface SwingMetrics {
  tempo: {
    backswingTime: number;
    downswingTime: number;
    tempoRatio: number;
    score: number;
  };
  rotation: {
    shoulderTurn: number;
    hipTurn: number;
    xFactor: number;
    score: number;
  };
  weightTransfer: {
    backswing: number;
    impact: number;
    finish: number;
    score: number;
  };
  swingPlane: {
    shaftAngle: number;
    planeDeviation: number;
    score: number;
  };
  bodyAlignment: {
    spineAngle: number;
    headMovement: number;
    kneeFlex: number;
    score: number;
  };
  overallScore: number;
  letterGrade: string;
}

interface AIFeedback {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  technicalNotes: string[];
  swingSummary?: string;
}

interface MetricsPanelProps {
  metrics: SwingMetrics;
  aiFeedback?: AIFeedback;
  className?: string;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({
  metrics,
  aiFeedback,
  className = ""
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Needs Work';
    return 'Poor';
  };

  const MetricCard: React.FC<{
    title: string;
    score: number;
    children: React.ReactNode;
    icon: string;
  }> = ({ title, score, children, icon }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(score)}`}>
          {score}/100
        </div>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 border border-gray-200">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Overall Swing Score</h2>
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={`text-6xl font-bold ${getScoreColor(metrics.overallScore).split(' ')[0]}`}>
              {metrics.overallScore}
            </div>
            <div className="text-4xl font-bold text-gray-600">/100</div>
            <div className={`text-2xl font-bold px-4 py-2 rounded-full ${getScoreColor(metrics.overallScore)}`}>
              {metrics.letterGrade}
            </div>
          </div>
          <p className="text-lg text-gray-600">
            {getScoreLabel(metrics.overallScore)} - {aiFeedback?.swingSummary || 'Keep practicing to improve your swing!'}
          </p>
        </div>
      </div>

      {/* AI Feedback Summary */}
      {aiFeedback?.swingSummary && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">🤖</span>
            AI Analysis Summary
          </h3>
          <p className="text-blue-800 leading-relaxed">{aiFeedback.swingSummary}</p>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tempo Metrics */}
        <MetricCard title="Tempo" score={metrics.tempo.score} icon="⏱️">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Backswing Time:</span>
              <span className="font-medium">{metrics.tempo.backswingTime.toFixed(2)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Downswing Time:</span>
              <span className="font-medium">{metrics.tempo.downswingTime.toFixed(2)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tempo Ratio:</span>
              <span className="font-medium">{metrics.tempo.tempoRatio.toFixed(1)}:1</span>
            </div>
            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {metrics.tempo.tempoRatio > 3.0 
                  ? '✅ Good tempo ratio - maintain this rhythm' 
                  : '⚠️ Work on slowing down your backswing for better tempo'
                }
              </p>
            </div>
          </div>
        </MetricCard>

        {/* Rotation Metrics */}
        <MetricCard title="Rotation" score={metrics.rotation.score} icon="🔄">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Shoulder Turn:</span>
              <span className="font-medium">{metrics.rotation.shoulderTurn.toFixed(0)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hip Turn:</span>
              <span className="font-medium">{metrics.rotation.hipTurn.toFixed(0)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">X-Factor:</span>
              <span className="font-medium">{metrics.rotation.xFactor.toFixed(0)}°</span>
            </div>
            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {metrics.rotation.xFactor > 35 
                  ? '✅ Good separation between shoulders and hips' 
                  : '⚠️ Increase shoulder turn while keeping hips stable'
                }
              </p>
            </div>
          </div>
        </MetricCard>

        {/* Weight Transfer Metrics */}
        <MetricCard title="Weight Transfer" score={metrics.weightTransfer.score} icon="⚖️">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Backswing:</span>
              <span className="font-medium">{metrics.weightTransfer.backswing.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Impact:</span>
              <span className="font-medium">{metrics.weightTransfer.impact.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Finish:</span>
              <span className="font-medium">{metrics.weightTransfer.finish.toFixed(0)}%</span>
            </div>
            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {metrics.weightTransfer.score > 80 
                  ? '✅ Smooth weight transfer throughout swing' 
                  : '⚠️ Focus on shifting weight from back foot to front foot'
                }
              </p>
            </div>
          </div>
        </MetricCard>

        {/* Swing Plane Metrics */}
        <MetricCard title="Swing Plane" score={metrics.swingPlane.score} icon="📐">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Shaft Angle:</span>
              <span className="font-medium">{metrics.swingPlane.shaftAngle.toFixed(0)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Plane Deviation:</span>
              <span className="font-medium">{metrics.swingPlane.planeDeviation.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Consistency:</span>
              <span className="font-medium">{(100 - metrics.swingPlane.planeDeviation).toFixed(0)}%</span>
            </div>
            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {metrics.swingPlane.planeDeviation < 5 
                  ? '✅ Consistent swing plane' 
                  : '⚠️ Work on maintaining a more consistent swing plane'
                }
              </p>
            </div>
          </div>
        </MetricCard>

        {/* Body Alignment Metrics */}
        <MetricCard title="Body Alignment" score={metrics.bodyAlignment.score} icon="🧍">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Spine Angle:</span>
              <span className="font-medium">{metrics.bodyAlignment.spineAngle.toFixed(0)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Head Movement:</span>
              <span className="font-medium">{metrics.bodyAlignment.headMovement.toFixed(1)}cm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Knee Flex:</span>
              <span className="font-medium">{metrics.bodyAlignment.kneeFlex.toFixed(0)}°</span>
            </div>
            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {metrics.bodyAlignment.headMovement < 3 
                  ? '✅ Stable head position' 
                  : '⚠️ Keep your head still during the swing'
                }
              </p>
            </div>
          </div>
        </MetricCard>
      </div>

      {/* AI Feedback Details */}
      {aiFeedback && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strengths */}
          {aiFeedback.strengths && aiFeedback.strengths.length > 0 && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">✅</span>
                Strengths
              </h3>
              <ul className="space-y-2">
                {aiFeedback.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span className="text-green-800">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {aiFeedback.improvements && aiFeedback.improvements.length > 0 && (
            <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
              <h3 className="text-xl font-semibold text-orange-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">🎯</span>
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {aiFeedback.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span className="text-orange-800">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Technical Notes */}
      {aiFeedback?.technicalNotes && aiFeedback.technicalNotes.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🔬</span>
            Technical Notes
          </h3>
          <ul className="space-y-2">
            {aiFeedback.technicalNotes.map((note, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-gray-600 mt-1">•</span>
                <span className="text-gray-700">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MetricsPanel;
