'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PoseResult } from '@/lib/mediapipe';
import { detectSwingPhases, SwingPhaseAnalysis } from '@/lib/professional-phase-detection';
import { calculateProfessionalSwingMetrics, ProfessionalSwingMetrics } from '@/lib/professional-swing-metrics';
import { validateAnalysisResults, validateProfessionalStandards } from '@/lib/professional-validation';
import ProfessionalOverlaySystem from './ProfessionalOverlaySystem';
import OverlayControlPanel from './OverlayControlPanel';
import PhaseTimeline from './PhaseTimeline';
import SwingMetricsGraphs from './SwingMetricsGraphs';

interface OverlaySettings {
  stickFigure: boolean;
  swingPlane: boolean;
  phaseMarkers: boolean;
  clubPath: boolean;
  impactZone: boolean;
  weightTransfer: boolean;
  spineAngle: boolean;
  tempoGuide: boolean;
  groundForce: boolean;
  releasePoint: boolean;
}

interface ProfessionalSwingAnalyzerProps {
  videoUrl: string;
  poses: PoseResult[];
  className?: string;
}

export default function ProfessionalSwingAnalyzer({ 
  videoUrl, 
  poses, 
  className = '' 
}: ProfessionalSwingAnalyzerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [phaseAnalysis, setPhaseAnalysis] = useState<SwingPhaseAnalysis | null>(null);
  const [swingMetrics, setSwingMetrics] = useState<ProfessionalSwingMetrics | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [professionalStandards, setProfessionalStandards] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
    stickFigure: true,
    swingPlane: true,
    phaseMarkers: true,
    clubPath: false,
    impactZone: false,
    weightTransfer: false,
    spineAngle: false,
    tempoGuide: false,
    groundForce: false,
    releasePoint: false
  });

  // Analyze swing when poses are available
  useEffect(() => {
    if (poses && poses.length >= 30 && !analysisComplete) {
      analyzeSwing();
    }
  }, [poses, analysisComplete]);

  const analyzeSwing = useCallback(async () => {
    if (!poses || poses.length < 30) {
      setError('Insufficient pose data for analysis. Need at least 30 frames.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Step 1: Detect swing phases
      console.log('🔍 Starting phase detection...');
      const phases = detectSwingPhases(poses);
      setPhaseAnalysis(phases);
      console.log('✅ Phase detection complete:', phases);

      // Step 2: Calculate professional metrics
      console.log('📊 Calculating professional metrics...');
      const metrics = calculateProfessionalSwingMetrics(poses, phases);
      setSwingMetrics(metrics);
      console.log('✅ Metrics calculation complete:', metrics);

      // Step 3: Validate results
      console.log('🔍 Validating analysis results...');
      const validation = validateAnalysisResults(poses, metrics, phases);
      setValidationResult(validation);
      console.log('✅ Validation complete:', validation);

      // Step 4: Check professional standards
      console.log('🏆 Checking professional standards...');
      const standards = validateProfessionalStandards(metrics);
      setProfessionalStandards(standards);
      console.log('✅ Professional standards check complete:', standards);

      setAnalysisComplete(true);
      console.log('🎉 Professional swing analysis complete!');

    } catch (err) {
      console.error('❌ Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [poses]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleOverlaySettingsChange = useCallback((settings: OverlaySettings) => {
    setOverlaySettings(settings);
  }, []);

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">❌</span>
          <div>
            <h3 className="text-lg font-semibold text-red-800">Analysis Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setAnalysisComplete(false);
                analyzeSwing();
              }}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Video Player with Overlays */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-auto"
          onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget.currentTime)}
        />
        
        {/* Canvas for overlays */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
        
        {/* Overlay System */}
        {phaseAnalysis && (
          <ProfessionalOverlaySystem
            videoRef={videoRef}
            canvasRef={canvasRef}
            poses={poses}
            phaseAnalysis={phaseAnalysis}
            currentTime={currentTime}
            overlaySettings={overlaySettings}
          />
        )}
        
        {/* Analysis Status */}
        {isAnalyzing && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Analyzing swing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Control Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overlay Control Panel */}
        <OverlayControlPanel
          overlaySettings={overlaySettings}
          onSettingsChange={handleOverlaySettingsChange}
        />
        
        {/* Phase Timeline */}
        {phaseAnalysis && (
          <PhaseTimeline
            phaseAnalysis={phaseAnalysis}
            currentTime={currentTime}
          />
        )}
      </div>

      {/* Analysis Results */}
      {analysisComplete && swingMetrics && (
        <div className="space-y-6">
          {/* Validation Results */}
          {validationResult && (
            <div className={`p-4 rounded-lg ${
              validationResult.isValid 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {validationResult.isValid ? '✅' : '❌'}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">
                    {validationResult.isValid ? 'Analysis Valid' : 'Analysis Issues'}
                  </h3>
                  <p className="text-sm">
                    Confidence: {(validationResult.confidence * 100).toFixed(0)}%
                  </p>
                  {validationResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-800">Errors:</p>
                      <ul className="text-sm text-red-600 list-disc list-inside">
                        {validationResult.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validationResult.warnings.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-yellow-800">Warnings:</p>
                      <ul className="text-sm text-yellow-600 list-disc list-inside">
                        {validationResult.warnings.map((warning: string, index: number) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Professional Standards */}
          {professionalStandards && (
            <div className={`p-4 rounded-lg ${
              professionalStandards.meetsStandards 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {professionalStandards.meetsStandards ? '🏆' : '📈'}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">
                    {professionalStandards.meetsStandards 
                      ? 'Meets Professional Standards' 
                      : 'Needs Improvement'
                    }
                  </h3>
                  <p className="text-sm">
                    Score: {(professionalStandards.score * 100).toFixed(0)}/100
                  </p>
                  {professionalStandards.recommendations.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Recommendations:</p>
                      <ul className="text-sm list-disc list-inside">
                        {professionalStandards.recommendations.map((rec: string, index: number) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Swing Metrics Graphs */}
          <SwingMetricsGraphs metrics={swingMetrics} />
        </div>
      )}

      {/* Analysis Summary */}
      {analysisComplete && swingMetrics && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Analysis Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {swingMetrics.letterGrade}
              </div>
              <div className="text-sm text-gray-600">Overall Grade</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {swingMetrics.overallScore.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {swingMetrics.tempoRatio.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Tempo Ratio</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {(swingMetrics.confidence * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Confidence</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







