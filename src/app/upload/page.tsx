"use client";
import Link from 'next/link';
import React, { useMemo, useRef, useReducer, useCallback, useEffect, useState } from 'react';
import VideoPreview from '@/components/ui/VideoPreview';
import ProgressBar from '@/components/ui/ProgressBar';
import ErrorAlert from '@/components/ui/ErrorAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import VideoPlayerWithOverlay from '@/components/ui/VideoPlayerWithOverlay';
import MetricsPanel from '@/components/ui/MetricsPanel';
import VisualizationControls from '@/components/ui/VisualizationControls';
import ComprehensiveGradingDisplay from '@/components/ui/ComprehensiveGradingDisplay';
import GradingSystemTest from '@/components/ui/GradingSystemTest';
import GradingDebugPanel from '@/components/ui/GradingDebugPanel';
import ProfessionalSwingValidator from '@/components/ui/ProfessionalSwingValidator';
import SwingHistoryPanel from '@/components/ui/SwingHistoryPanel';
import SwingComparisonPanel from '@/components/ui/SwingComparisonPanel';
import SampleVideoSelector from '@/components/ui/SampleVideoSelector';
import VideoAnalysisDisplay from '@/components/analysis/VideoAnalysisDisplay';
import SimpleVideoTest from '@/components/analysis/SimpleVideoTest';
import VideoDebugger from '@/components/analysis/VideoDebugger';
import ProfessionalGolfStandards from '@/components/analysis/ProfessionalGolfStandards';
import ProfessionalAIFeedback from '@/components/analysis/ProfessionalAIFeedback';
import { SwingHistoryManager, SwingHistoryEntry, SwingComparison } from '@/lib/swing-history';
import { lazy, Suspense } from 'react';
import SwingFeedback from '@/components/analysis/SwingFeedback';
import MetricsVisualizer from '@/components/analysis/MetricsVisualizer';
import PoseOverlay from '@/components/analysis/PoseOverlay';
import SwingAnalysisOverlay from '@/components/analysis/SwingAnalysisOverlay';
import VideoAnalysisPlayer from '@/components/analysis/VideoAnalysisPlayer';
import EnhancedVideoAnalysisPlayer from '@/components/analysis/EnhancedVideoAnalysisPlayer';
import ProcessedVideoPlayer from '@/components/analysis/ProcessedVideoPlayer';
import SwingSummary from '@/components/analysis/SwingSummary';

// Lazy load heavy components
const DrillRecommendations = lazy(() => import('@/components/analysis/DrillRecommendations'));
const _GolfGradeCard = lazy(() => import('@/components/analysis/GolfGradeCard'));
const ProgressChart = lazy(() => import('@/components/analysis/ProgressChart'));

// Import unified analysis system
import { analyzeGolfSwing, validateVideoFile, getAnalysisStatus } from '@/lib/unified-analysis';
import type { PoseResult } from '@/lib/mediapipe';

// State management
interface UploadState {
  file: File | null;
  isAnalyzing: boolean;
  poses: PoseResult[] | null;
  result: any | null;
  aiAnalysis: any | null;
  error: string | null;
  step: string;
  progress: number;
  activeTab: 'upload' | 'analysis' | 'history' | 'comparison';
  videoUrl: string | null;
  videoDuration: number;
  videoCurrentTime: number;
  videoPlaying: boolean;
  overlaySettings: Record<string, boolean>;
  playbackSpeed: number;
  muted: boolean;
  progressHistory: any[];
  isSampleVideo: boolean;
  selectedSwing: SwingHistoryEntry | null;
  comparison: SwingComparison | null;
  analysisStartTime: number | null;
  elapsedTime: number;
}

type UploadAction = 
  | { type: 'SET_FILE'; payload: File | null }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_POSES'; payload: PoseResult[] | null }
  | { type: 'SET_RESULT'; payload: any | null }
  | { type: 'SET_AI_ANALYSIS'; payload: any | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STEP'; payload: string }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_ACTIVE_TAB'; payload: 'upload' | 'analysis' | 'history' | 'comparison' }
  | { type: 'SET_VIDEO_URL'; payload: string | null }
  | { type: 'SET_VIDEO_DURATION'; payload: number }
  | { type: 'SET_VIDEO_CURRENT_TIME'; payload: number }
  | { type: 'SET_VIDEO_PLAYING'; payload: boolean }
  | { type: 'SET_OVERLAY_SETTINGS'; payload: Record<string, boolean> }
  | { type: 'SET_PLAYBACK_SPEED'; payload: number }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_PROGRESS_HISTORY'; payload: any[] }
  | { type: 'SET_IS_SAMPLE_VIDEO'; payload: boolean }
  | { type: 'SET_SELECTED_SWING'; payload: SwingHistoryEntry | null }
  | { type: 'SET_COMPARISON'; payload: SwingComparison | null }
  | { type: 'SET_ANALYSIS_START_TIME'; payload: number | null }
  | { type: 'SET_ELAPSED_TIME'; payload: number };

const initialState: UploadState = {
  file: null,
  isAnalyzing: false,
  poses: null,
  result: null,
  aiAnalysis: null,
  error: null,
  step: 'Ready to analyze',
  progress: 0,
  activeTab: 'upload',
  videoUrl: null,
  videoDuration: 0,
  videoCurrentTime: 0,
  videoPlaying: false,
  overlaySettings: {
    stickFigure: true,
    swingPlane: false,
    phases: false,
    clubPath: false,
    alignment: false
  },
  playbackSpeed: 1.0,
  muted: false,
  progressHistory: [],
  isSampleVideo: false,
  selectedSwing: null,
  comparison: null,
  analysisStartTime: null,
  elapsedTime: 0
};

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, file: action.payload, error: null };
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    case 'SET_POSES':
      return { ...state, poses: action.payload };
    case 'SET_RESULT':
      return { ...state, result: action.payload };
    case 'SET_AI_ANALYSIS':
      return { ...state, aiAnalysis: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_VIDEO_URL':
      return { ...state, videoUrl: action.payload };
    case 'SET_VIDEO_DURATION':
      return { ...state, videoDuration: action.payload };
    case 'SET_VIDEO_CURRENT_TIME':
      return { ...state, videoCurrentTime: action.payload };
    case 'SET_VIDEO_PLAYING':
      return { ...state, videoPlaying: action.payload };
    case 'SET_OVERLAY_SETTINGS':
      return { ...state, overlaySettings: action.payload };
    case 'SET_PLAYBACK_SPEED':
      return { ...state, playbackSpeed: action.payload };
    case 'SET_MUTED':
      return { ...state, muted: action.payload };
    case 'SET_PROGRESS_HISTORY':
      return { ...state, progressHistory: action.payload };
    case 'SET_IS_SAMPLE_VIDEO':
      return { ...state, isSampleVideo: action.payload };
    case 'SET_SELECTED_SWING':
      return { ...state, selectedSwing: action.payload };
    case 'SET_COMPARISON':
      return { ...state, comparison: action.payload };
    case 'SET_ANALYSIS_START_TIME':
      return { ...state, analysisStartTime: action.payload };
    case 'SET_ELAPSED_TIME':
      return { ...state, elapsedTime: action.payload };
    default:
      return state;
  }
}

export default function UploadPage() {
  const [state, dispatch] = useReducer(uploadReducer, initialState);
  const inputRef = useRef<HTMLInputElement>(null);

  // File input handler
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    dispatch({ type: 'SET_FILE', payload: file || null });

    if (file) {
      (window as any).currentFileName = file.name;
    }
  }, []);

  // Unified analysis function
  const analyze = useCallback(async () => {
    console.log('🏌️ UNIFIED ANALYSIS: Analyze button clicked!');
    console.log('🏌️ UNIFIED ANALYSIS: File:', state.file?.name);
    
    if (!state.file) { 
      console.log('🏌️ UNIFIED ANALYSIS: No file selected');
      dispatch({ type: 'SET_ERROR', payload: 'Please choose a video file first.' }); 
      return; 
    }
    
    // Validate video file (skip for sample videos)
    if (!state.isSampleVideo) {
      const validation = validateVideoFile(state.file);
      if (!validation.valid) {
        console.log('🏌️ UNIFIED ANALYSIS: Video validation failed:', validation.error);
        dispatch({ type: 'SET_ERROR', payload: validation.error || 'Invalid video file.' });
        return;
      }
    } else {
      console.log('🎥 SAMPLE VIDEO: Skipping file validation for sample video');
    }
    
    // Start unified analysis
    dispatch({ type: 'SET_ANALYZING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_ANALYSIS_START_TIME', payload: Date.now() });
    dispatch({ type: 'SET_ELAPSED_TIME', payload: 0 });
    
    // Simple timeout protection
    const timeoutId = setTimeout(() => {
      console.error('🏌️ UNIFIED ANALYSIS: Analysis timeout after 60 seconds');
      dispatch({ type: 'SET_ERROR', payload: 'Analysis is taking longer than expected. Please try a shorter video.' });
      dispatch({ type: 'SET_ANALYZING', payload: false });
    }, 60000);
    
    try {
      // Use unified analysis system
      // For sample videos, pass the video URL instead of the file
      const result = state.isSampleVideo && state.videoUrl
        ? await analyzeGolfSwing(state.videoUrl, (step, progress) => {
            dispatch({ type: 'SET_STEP', payload: getAnalysisStatus(progress) });
            dispatch({ type: 'SET_PROGRESS', payload: progress });
          })
        : await analyzeGolfSwing(state.file!, (step, progress) => {
            dispatch({ type: 'SET_STEP', payload: getAnalysisStatus(progress) });
            dispatch({ type: 'SET_PROGRESS', payload: progress });
          });
      
      clearTimeout(timeoutId);
      
      if (result.success && result.analysis) {
        console.log('✅ UNIFIED ANALYSIS: Analysis completed successfully!');
        console.log('✅ UNIFIED ANALYSIS: Grade:', result.analysis.letterGrade, 'Score:', result.analysis.overallScore);
        
        // Create result object
        const analysisResult = {
          swingId: `swing_${Date.now()}`,
          timestamp: Date.now(),
          filename: state.file.name,
          videoUrl: state.isSampleVideo ? state.videoUrl : URL.createObjectURL(state.file),
          poses: (result.analysis as any).poses || [], // Use actual pose data from analysis
          analysis: result.analysis,
          realAnalysis: result.analysis,
          processingTime: result.processingTime,
          poseCount: result.poseCount
        };
        
        dispatch({ type: 'SET_RESULT', payload: analysisResult });
        dispatch({ type: 'SET_AI_ANALYSIS', payload: result.analysis.aiInsights });
        dispatch({ type: 'SET_STEP', payload: 'Analysis complete!' });
        dispatch({ type: 'SET_PROGRESS', payload: 100 });
        dispatch({ type: 'SET_ANALYZING', payload: false });
        
        // Update elapsed time
        if (state.analysisStartTime) {
          const elapsed = Date.now() - state.analysisStartTime;
          dispatch({ type: 'SET_ELAPSED_TIME', payload: elapsed });
        }
        
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
      
    } catch (error) {
      console.error('❌ UNIFIED ANALYSIS: Analysis failed:', error);
      clearTimeout(timeoutId);
      
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_ANALYZING', payload: false });
    }
  }, [state.file, state.analysisStartTime]);

  // Video URL management
  const videoUrl = useMemo(() => {
    if (!state.file) return null;
    console.log('🎥 VIDEO URL: Creating URL for file:', state.file.name);
    const url = URL.createObjectURL(state.file);
    console.log('✅ VIDEO URL CREATED:', url);
    return url;
  }, [state.file]);

  // Update video URL in state
  useEffect(() => {
    dispatch({ type: 'SET_VIDEO_URL', payload: videoUrl });
  }, [videoUrl]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            🏌️ SwingVista - AI Golf Analysis
          </h1>
          
          {/* Error Display */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">❌</span>
                <p className="text-red-700">{state.error}</p>
                <button
                  onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
        </div>
          )}

          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upload Golf Swing Video</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                ref={inputRef}
                  type="file"
                  accept="video/*"
                  onChange={onFileChange}
                  className="hidden"
                />
              
              {!state.file ? (
                <div>
                  <div className="text-6xl mb-4">📹</div>
                  <p className="text-gray-600 mb-4">
                    Choose a video file to analyze your golf swing
                  </p>
                <button
                    onClick={() => inputRef.current?.click()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Select Video File
                  </button>
                    </div>
                  ) : (
                <div>
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-gray-600 mb-4">
                    Selected: <strong>{state.file.name}</strong>
                  </p>
                  <div className="flex gap-4 justify-center">
                <button
                      onClick={() => inputRef.current?.click()}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                      Change Video
                </button>
                <button
                      onClick={analyze}
                  disabled={state.isAnalyzing}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      {state.isAnalyzing ? 'Analyzing...' : 'Analyze Swing'}
                </button>
              </div>
              </div>
              )}
            </div>
          </div>

          {/* Sample Videos Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Try Sample Videos</h2>
            <p className="text-gray-600 mb-4">
              Test the analysis system with these professional golf swing videos
            </p>
            
            <SampleVideoSelector
              onSelectVideo={(videoUrl, videoName) => {
                console.log('🎥 Sample video selected:', videoName, videoUrl);
                console.log('🎥 Full video URL:', window.location.origin + videoUrl);
                
                // Create a mock file object for the sample video with proper size
                const mockFile = new File(['sample-video-content'], videoName, { 
                  type: 'video/mp4',
                  lastModified: Date.now()
                });
                // Override the size property to make it valid
                Object.defineProperty(mockFile, 'size', {
                  value: 5 * 1024 * 1024, // 5MB
                  writable: false
                });
                dispatch({ type: 'SET_FILE', payload: mockFile });
                dispatch({ type: 'SET_VIDEO_URL', payload: videoUrl });
                dispatch({ type: 'SET_IS_SAMPLE_VIDEO', payload: true });
                
                console.log('🎥 State updated - videoUrl:', videoUrl, 'isSampleVideo: true');
              }}
              className="mb-4"
            />
          </div>

          {/* Video Preview Section */}
          {state.file && !state.result?.realAnalysis && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Video Preview</h3>
              
              {/* Video Debugger */}
              {(() => {
                const videoUrl = state.isSampleVideo ? (state.videoUrl || '') : (state.file ? URL.createObjectURL(state.file) : '');
                console.log('🎥 VideoDebugger props:', {
                  videoUrl,
                  videoName: state.file.name,
                  isSampleVideo: state.isSampleVideo,
                  urlType: videoUrl.startsWith('blob:') ? 'BLOB' : 'FILE'
                });
                return (
                  <VideoDebugger
                    key={`debugger-${state.file.name}-${state.isSampleVideo}`}
                    videoUrl={videoUrl}
                    videoName={state.file.name}
                    isSampleVideo={state.isSampleVideo}
                  />
                );
              })()}
              
              <div className="mt-4 text-center">
                <p className="text-gray-600 mb-4">
                  Selected: <strong>{state.file.name}</strong>
                </p>
                <button
                  onClick={analyze}
                  disabled={state.isAnalyzing}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {state.isAnalyzing ? 'Analyzing...' : 'Analyze Swing'}
                </button>
              </div>
            </div>
          )}

          {/* Progress Section */}
            {state.isAnalyzing && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Analysis Progress</h3>
                <ProgressBar progress={state.progress} />
              <p className="text-gray-600 mt-2">{state.step}</p>
              <LoadingSpinner />
              </div>
            )}


          {/* Video Analysis Display */}
          {state.result?.realAnalysis && state.file && (
            <>
              {console.log('🎥 VideoAnalysisDisplay props:', {
                videoFile: state.file?.name,
                videoUrl: state.videoUrl,
                isSampleVideo: state.isSampleVideo,
                hasAnalysis: !!state.result?.realAnalysis
              })}
            <VideoAnalysisDisplay
              videoFile={state.file}
                videoUrl={state.isSampleVideo ? state.videoUrl : (state.file ? URL.createObjectURL(state.file) : undefined)}
                analysis={state.result.realAnalysis}
              isAnalyzing={state.isAnalyzing}
              isSampleVideo={state.isSampleVideo}
              />
            </>
          )}

          {/* Professional Golf Standards */}
          {state.result?.realAnalysis && (
            <ProfessionalGolfStandards 
              analysis={state.result.realAnalysis}
              className="mb-6"
            />
          )}

          {/* Professional AI Feedback */}
          {state.result?.realAnalysis?.professionalAIFeedback && (
            <ProfessionalAIFeedback 
              feedback={state.result.realAnalysis.professionalAIFeedback}
              className="mb-6"
            />
          )}

          {/* Comprehensive Analysis Results */}
          {state.result && (
            <div className="space-y-6">
              {/* Basic Results Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Analysis Results</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Metrics */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3">Swing Metrics</h3>
                    <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Overall Score:</span>
                        <span className="font-semibold">{state.result.analysis?.overallScore || state.result.realAnalysis?.overallScore || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Letter Grade:</span>
                        <span className="font-semibold">{state.result.analysis?.letterGrade || state.result.realAnalysis?.letterGrade || 'N/A'}</span>
                    </div>
                      <div className="flex justify-between">
                        <span>Confidence:</span>
                        <span className="font-semibold">{Math.round((state.result.analysis?.confidence || state.result.realAnalysis?.confidence || 0) * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing Time:</span>
                        <span className="font-semibold">{state.result.processingTime ? `${(state.result.processingTime / 1000).toFixed(1)}s` : 'N/A'}</span>
                    </div>
                      <div className="flex justify-between">
                        <span>Pose Frames:</span>
                        <span className="font-semibold">{state.result.poseCount || 'N/A'}</span>
                      </div>
                    </div>
                    </div>
                    
                  {/* Feedback */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Key Feedback</h3>
                    <div className="space-y-2">
                      {(state.result.analysis?.feedback || state.result.realAnalysis?.feedback || []).slice(0, 3).map((item: string, index: number) => (
                        <div key={index} className="text-sm text-gray-600">
                          • {item}
                      </div>
                      ))}
                    </div>
                  </div>
                      </div>
                    </div>
                    
              {/* Swing Summary */}
              {state.result.realAnalysis && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Swing Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{state.result.realAnalysis.overallScore || 'N/A'}</div>
                      <div className="text-sm text-blue-800">Overall Score</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{state.result.realAnalysis.letterGrade || 'N/A'}</div>
                      <div className="text-sm text-green-800">Letter Grade</div>
                      </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{Math.round((state.result.realAnalysis.confidence || 0) * 100)}%</div>
                      <div className="text-sm text-purple-800">Confidence</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Metrics Visualizer */}
              {state.result.realAnalysis && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Detailed Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(state.result.realAnalysis.metrics || {}).map(([key, metric]: [string, any]) => (
                      <div key={key} className="p-4 border border-gray-200 rounded-lg">
                        <div className="text-sm font-medium text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="text-lg font-semibold text-gray-800">{metric.score || 'N/A'}/100</div>
                        {metric.feedback && (
                          <div className="text-xs text-gray-500 mt-1">{metric.feedback}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Swing Feedback */}
              {state.result.realAnalysis && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Swing Feedback</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Strengths</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {(state.result.realAnalysis.feedback || []).slice(0, 3).map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Key Improvements</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {(state.result.realAnalysis.keyImprovements || []).slice(0, 3).map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Drill Recommendations */}
              {state.result.realAnalysis && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Recommended Drills</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">Tempo Drills</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Practice with a metronome (3:1 ratio)</li>
                        <li>• Slow motion swings</li>
                        <li>• Pause at the top drill</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Weight Transfer</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Step-through drill</li>
                        <li>• Hip bump drill</li>
                        <li>• Finish in balance</li>
                  </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Chart */}
              {state.result.realAnalysis && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Swing Phases</h3>
                  <div className="space-y-2">
                    {(state.result.realAnalysis.phases || []).map((phase: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-700 capitalize">{phase.name}</div>
                        <div className="text-sm text-gray-500">
                          {phase.duration ? `${phase.duration.toFixed(2)}s` : 'N/A'}
                </div>
              </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
