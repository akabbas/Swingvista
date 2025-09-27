'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { PoseResult } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';
import { 
  performAdvancedGolfAnalysis, 
  type AdvancedGolfAnalysis,
  type ClubPathPoint,
  type SwingTempoAnalysis,
  type BodyRotationMetrics,
  type FollowThroughAssessment
} from '@/lib/advanced-golf-analysis';
import AdvancedGolfVisualization from './AdvancedGolfVisualization';
import GolfAnalysisOverlay from './GolfAnalysisOverlay';

export interface ComprehensiveGolfAnalyzerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  poses: PoseResult[];
  phases?: EnhancedSwingPhase[];
  currentTime?: number;
  showAdvancedAnalysis?: boolean;
  showComparison?: boolean;
  comparisonPoses?: PoseResult[];
  className?: string;
}

export default function ComprehensiveGolfAnalyzer({
  videoRef,
  poses,
  phases = [],
  currentTime = 0,
  showAdvancedAnalysis = true,
  showComparison = false,
  comparisonPoses = [],
  className = ''
}: ComprehensiveGolfAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analysis, setAnalysis] = useState<AdvancedGolfAnalysis | null>(null);
  const [clubPath, setClubPath] = useState<ClubPathPoint[]>([]);
  const [tempoAnalysis, setTempoAnalysis] = useState<SwingTempoAnalysis | null>(null);
  const [bodyRotation, setBodyRotation] = useState<BodyRotationMetrics | null>(null);
  const [followThrough, setFollowThrough] = useState<FollowThroughAssessment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Perform comprehensive analysis
  useEffect(() => {
    if (poses.length === 0 || phases.length === 0) return;

    setIsAnalyzing(true);
    
    try {
      const advancedAnalysis = performAdvancedGolfAnalysis(poses, phases);
      setAnalysis(advancedAnalysis);
      setClubPath(advancedAnalysis.clubPath);
      setTempoAnalysis(advancedAnalysis.swingTempo);
      setBodyRotation(advancedAnalysis.bodyRotation);
      setFollowThrough(advancedAnalysis.followThrough);
    } catch (error) {
      console.error('Error performing advanced golf analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [poses, phases]);

  // Render comprehensive analysis dashboard
  const renderAnalysisDashboard = () => {
    if (!analysis) return null;

    return (
      <div className="absolute top-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg max-w-md">
        <h3 className="text-lg font-bold mb-3">Golf Swing Analysis</h3>
        
        {/* Overall Grade */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Grade:</span>
            <span className={`text-xl font-bold ${
              analysis.overallGrade.startsWith('A') ? 'text-green-400' :
              analysis.overallGrade.startsWith('B') ? 'text-yellow-400' :
              analysis.overallGrade.startsWith('C') ? 'text-orange-400' : 'text-red-400'
            }`}>
              {analysis.overallGrade}
            </span>
          </div>
        </div>

        {/* Tempo Analysis */}
        {tempoAnalysis && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Swing Tempo</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Backswing:</span>
                <span>{tempoAnalysis.backswingTempo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Transition:</span>
                <span>{tempoAnalysis.transitionTempo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Downswing:</span>
                <span>{tempoAnalysis.downswingTempo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Follow-through:</span>
                <span>{tempoAnalysis.followThroughTempo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Consistency:</span>
                <span className={tempoAnalysis.tempoConsistency > 0.7 ? 'text-green-400' : 'text-red-400'}>
                  {(tempoAnalysis.tempoConsistency * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Body Rotation */}
        {bodyRotation && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Body Rotation</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Shoulder Max:</span>
                <span>{bodyRotation.shoulderRotation.maxAngle.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Hip Max:</span>
                <span>{bodyRotation.hipRotation.maxAngle.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Sequence Quality:</span>
                <span className={bodyRotation.rotationSequence.sequenceQuality > 0.6 ? 'text-green-400' : 'text-red-400'}>
                  {(bodyRotation.rotationSequence.sequenceQuality * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Spine Stability:</span>
                <span className={bodyRotation.spineAngle.stability > 0.7 ? 'text-green-400' : 'text-red-400'}>
                  {(bodyRotation.spineAngle.stability * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Follow-through */}
        {followThrough && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Follow-through</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Extension:</span>
                <span className={followThrough.extension > 0.6 ? 'text-green-400' : 'text-red-400'}>
                  {(followThrough.extension * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Balance:</span>
                <span className={followThrough.balance > 0.6 ? 'text-green-400' : 'text-red-400'}>
                  {(followThrough.balance * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Finish:</span>
                <span className={followThrough.finish > 0.6 ? 'text-green-400' : 'text-red-400'}>
                  {(followThrough.finish * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Overall:</span>
                <span className={followThrough.overallQuality > 0.6 ? 'text-green-400' : 'text-red-400'}>
                  {(followThrough.overallQuality * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
            <div className="space-y-1">
              {analysis.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="text-xs text-gray-300">
                  • {rec}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render club path visualization
  const renderClubPathVisualization = () => {
    if (clubPath.length === 0) return null;

    return (
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg max-w-sm">
        <h4 className="text-sm font-semibold mb-2">Club Path Analysis</h4>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Total Points:</span>
            <span>{clubPath.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Max Velocity:</span>
            <span>{Math.max(...clubPath.map(p => p.velocity)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Avg Velocity:</span>
            <span>{(clubPath.reduce((sum, p) => sum + p.velocity, 0) / clubPath.length).toFixed(2)}</span>
          </div>
        </div>
        
        {/* Phase breakdown */}
        <div className="mt-3">
          <h5 className="text-xs font-semibold mb-1">Phase Breakdown</h5>
          <div className="space-y-1">
            {Object.entries(
              clubPath.reduce((acc, point) => {
                acc[point.phase] = (acc[point.phase] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([phase, count]) => (
              <div key={phase} className="flex justify-between text-xs">
                <span className="capitalize">{phase}:</span>
                <span>{count} points</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render phase timeline
  const renderPhaseTimeline = () => {
    if (!phases || phases.length === 0) return null;

    return (
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg max-w-md">
        <h4 className="text-sm font-semibold mb-2">Swing Phase Timeline</h4>
        <div className="space-y-2">
          {phases.map((phase, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: phase.color }}
              />
              <div className="flex-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize font-medium">{phase.name}</span>
                  <span>{(phase.endTime - phase.startTime).toFixed(2)}s</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Grade: {phase.grade}</span>
                  <span>Confidence: {(phase.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Canvas for visualization */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Advanced Golf Visualization */}
      <AdvancedGolfVisualization
        videoRef={videoRef}
        canvasRef={canvasRef}
        poses={poses}
        phases={phases}
        currentTime={currentTime}
        showAdvancedMetrics={showAdvancedAnalysis}
        showClubPath={true}
        showTempoAnalysis={true}
        showBodyRotation={true}
        showFollowThrough={true}
      />

      {/* Golf Analysis Overlay */}
      <GolfAnalysisOverlay
        videoRef={videoRef}
        canvasRef={canvasRef}
        poses={poses}
        phases={phases}
        currentTime={currentTime}
        overlaySettings={{
          showStickFigure: true,
          showClubPath: true,
          showAngleMeasurements: true,
          showPhaseIndicators: true,
          showComparison: showComparison,
          showSwingPlane: true,
          showWeightTransfer: true,
          showTempoGuide: true,
        }}
        comparisonPoses={comparisonPoses}
      />

      {/* Analysis Dashboard */}
      {renderAnalysisDashboard()}

      {/* Club Path Visualization */}
      {renderClubPathVisualization()}

      {/* Phase Timeline */}
      {renderPhaseTimeline()}

      {/* Loading indicator */}
      {isAnalyzing && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Analyzing swing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
