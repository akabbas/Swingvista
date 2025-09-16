import React from 'react';
import { SwingMetrics } from '@/lib/golf-metrics';

interface MetricsVisualizerProps {
  metrics: SwingMetrics;
  className?: string;
}

export default function MetricsVisualizer({ metrics, className = '' }: MetricsVisualizerProps) {
  // Add error handling for missing metrics
  if (!metrics) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No metrics available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Overall Score */}
      <div className="text-center">
        <div className="text-6xl font-bold mb-2">{metrics.letterGrade || 'N/A'}</div>
        <div className="text-xl text-gray-600">Overall Score: {metrics.overallScore?.toFixed(1) || 'N/A'}</div>
      </div>

      {/* Tempo Metrics */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Tempo & Timing</h3>
        <div className="space-y-4">
          <TempoVisualizer
            backswingTime={metrics.tempo?.backswingTime || 0}
            downswingTime={metrics.tempo?.downswingTime || 0}
            tempoRatio={metrics.tempo?.tempoRatio || 0}
            score={metrics.tempo?.score || 0}
          />
        </div>
      </div>

      {/* Rotation Metrics */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Body Rotation</h3>
        <div className="space-y-4">
          <RotationVisualizer
            shoulderTurn={metrics.rotation?.shoulderTurn || 0}
            hipTurn={metrics.rotation?.hipTurn || 0}
            xFactor={metrics.rotation?.xFactor || 0}
            score={metrics.rotation?.score || 0}
          />
        </div>
      </div>

      {/* Weight Transfer */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Weight Transfer</h3>
        <div className="space-y-4">
          <WeightTransferVisualizer
            backswing={metrics.weightTransfer?.backswing || 0}
            impact={metrics.weightTransfer?.impact || 0}
            finish={metrics.weightTransfer?.finish || 0}
            score={metrics.weightTransfer?.score || 0}
          />
        </div>
      </div>

      {/* Swing Plane */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Swing Plane</h3>
        <div className="space-y-4">
          <SwingPlaneVisualizer
            shaftAngle={metrics.swingPlane?.shaftAngle || 0}
            planeDeviation={metrics.swingPlane?.planeDeviation || 0}
            score={metrics.swingPlane?.score || 0}
          />
        </div>
      </div>

      {/* Body Alignment */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Body Alignment</h3>
        <div className="space-y-4">
          <BodyAlignmentVisualizer
            spineAngle={metrics.bodyAlignment?.spineAngle || 0}
            headMovement={metrics.bodyAlignment?.headMovement || 0}
            kneeFlex={metrics.bodyAlignment?.kneeFlex || 0}
            score={metrics.bodyAlignment?.score || 0}
          />
        </div>
      </div>
    </div>
  );
}

function TempoVisualizer({ backswingTime, downswingTime, tempoRatio, score }: SwingMetrics['tempo']) {
  return (
    <div className="space-y-4">
      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${score}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
          Score: {score.toFixed(1)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-600">Backswing</div>
          <div className="text-lg font-semibold">{backswingTime.toFixed(2)}s</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Downswing</div>
          <div className="text-lg font-semibold">{downswingTime.toFixed(2)}s</div>
        </div>
      </div>
      <div>
        <div className="text-sm text-gray-600">Tempo Ratio</div>
        <div className="text-lg font-semibold">{tempoRatio.toFixed(1)}:1</div>
      </div>
    </div>
  );
}

function RotationVisualizer({ shoulderTurn, hipTurn, xFactor, score }: SwingMetrics['rotation']) {
  return (
    <div className="space-y-4">
      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-green-500 transition-all duration-500"
          style={{ width: `${score}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
          Score: {score.toFixed(1)}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-gray-600">Shoulder Turn</div>
          <div className="text-lg font-semibold">{shoulderTurn.toFixed(1)}°</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Hip Turn</div>
          <div className="text-lg font-semibold">{hipTurn.toFixed(1)}°</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">X-Factor</div>
          <div className="text-lg font-semibold">{xFactor.toFixed(1)}°</div>
        </div>
      </div>
    </div>
  );
}

function WeightTransferVisualizer({ backswing, impact, finish, score }: SwingMetrics['weightTransfer']) {
  return (
    <div className="space-y-4">
      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-purple-500 transition-all duration-500"
          style={{ width: `${score}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
          Score: {score.toFixed(1)}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-gray-600">Backswing</div>
          <div className="text-lg font-semibold">{backswing.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Impact</div>
          <div className="text-lg font-semibold">{impact.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Finish</div>
          <div className="text-lg font-semibold">{finish.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

function SwingPlaneVisualizer({ shaftAngle, planeDeviation, score }: SwingMetrics['swingPlane']) {
  return (
    <div className="space-y-4">
      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-orange-500 transition-all duration-500"
          style={{ width: `${score}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
          Score: {score.toFixed(1)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-600">Shaft Angle</div>
          <div className="text-lg font-semibold">{shaftAngle.toFixed(1)}°</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Plane Deviation</div>
          <div className="text-lg font-semibold">{planeDeviation.toFixed(1)}°</div>
        </div>
      </div>
    </div>
  );
}

function BodyAlignmentVisualizer({ spineAngle, headMovement, kneeFlex, score }: SwingMetrics['bodyAlignment']) {
  return (
    <div className="space-y-4">
      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-red-500 transition-all duration-500"
          style={{ width: `${score}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
          Score: {score.toFixed(1)}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-gray-600">Spine Angle</div>
          <div className="text-lg font-semibold">{spineAngle.toFixed(1)}°</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Head Movement</div>
          <div className="text-lg font-semibold">{headMovement.toFixed(1)}"</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Knee Flex</div>
          <div className="text-lg font-semibold">{kneeFlex.toFixed(1)}°</div>
        </div>
      </div>
    </div>
  );
}
