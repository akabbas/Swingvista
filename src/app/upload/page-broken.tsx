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
// import VideoDebugger from '@/components/analysis/VideoDebugger'; // DISABLED - causing infinite loops
import SimpleVideoInfo from '@/components/analysis/SimpleVideoInfo';
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
import useRenderCounter from '@/hooks/useRenderCounter';

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
  | { type: 'SET_ELAPSED_TIME'; payload: number }
  | { type: 'TOGGLE_OVERLAY'; payload: string }
  | { type: 'UPDATE_OVERLAY_SETTINGS'; payload: Partial<Record<string, boolean>> }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

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
    swingPlane: true,
    phaseMarkers: true,
    clubPath: true,
    impactZone: true,
    weightTransfer: true,
    spineAngle: true
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
      // Only update if file actually changed
      if (state.file === action.payload) return state;
      return { ...state, file: action.payload, error: null };
    
    case 'SET_ANALYZING':
      // Only update if analyzing state actually changed
      if (state.isAnalyzing === action.payload) return state;
      return { ...state, isAnalyzing: action.payload };
    
    case 'SET_POSES':
      // Only update if poses actually changed
      if (state.poses === action.payload) return state;
      return { ...state, poses: action.payload };
    
    case 'SET_RESULT':
      // Only update if result actually changed
      if (state.result === action.payload) return state;
      return { ...state, result: action.payload };
    
    case 'SET_AI_ANALYSIS':
      // Only update if AI analysis actually changed
      if (state.aiAnalysis === action.payload) return state;
      return { ...state, aiAnalysis: action.payload };
    
    case 'SET_ERROR':
      // Only update if error actually changed
      if (state.error === action.payload) return state;
      return { ...state, error: action.payload };
    
    case 'SET_STEP':
      // Only update if step actually changed
      if (state.step === action.payload) return state;
      return { ...state, step: action.payload };
    
    case 'SET_PROGRESS':
      // Only update if progress actually changed
      if (state.progress === action.payload) return state;
      return { ...state, progress: action.payload };
    
    case 'SET_ACTIVE_TAB':
      // Only update if active tab actually changed
      if (state.activeTab === action.payload) return state;
      return { ...state, activeTab: action.payload };
    
    case 'SET_VIDEO_URL':
      // Only update if video URL actually changed
      if (state.videoUrl === action.payload) return state;
      
      // Clean up previous blob URL before setting new one
      if (state.videoUrl && state.videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(state.videoUrl);
      }
      
      return { ...state, videoUrl: action.payload };
    
    case 'SET_VIDEO_DURATION':
      // Only update if video duration actually changed
      if (state.videoDuration === action.payload) return state;
      return { ...state, videoDuration: action.payload };
    
    case 'SET_VIDEO_CURRENT_TIME':
      // Only update if video current time actually changed
      if (state.videoCurrentTime === action.payload) return state;
      return { ...state, videoCurrentTime: action.payload };
    
    case 'SET_VIDEO_PLAYING':
      // Only update if video playing state actually changed
      if (state.videoPlaying === action.payload) return state;
      return { ...state, videoPlaying: action.payload };
    
    case 'SET_OVERLAY_SETTINGS':
      // Only update if overlay settings actually changed
      if (state.overlaySettings === action.payload) return state;
      return { ...state, overlaySettings: action.payload };
    
    case 'SET_PLAYBACK_SPEED':
      // Only update if playback speed actually changed
      if (state.playbackSpeed === action.payload) return state;
      return { ...state, playbackSpeed: action.payload };
    
    case 'SET_MUTED':
      // Only update if muted state actually changed
      if (state.muted === action.payload) return state;
      return { ...state, muted: action.payload };
    
    case 'SET_PROGRESS_HISTORY':
      // Only update if progress history actually changed
      if (state.progressHistory === action.payload) return state;
      return { ...state, progressHistory: action.payload };
    
    case 'SET_IS_SAMPLE_VIDEO':
      // Only update if sample video state actually changed
      if (state.isSampleVideo === action.payload) return state;
      return { ...state, isSampleVideo: action.payload };
    
    case 'SET_SELECTED_SWING':
      // Only update if selected swing actually changed
      if (state.selectedSwing === action.payload) return state;
      return { ...state, selectedSwing: action.payload };
    
    case 'SET_COMPARISON':
      // Only update if comparison actually changed
      if (state.comparison === action.payload) return state;
      return { ...state, comparison: action.payload };
    
    case 'SET_ANALYSIS_START_TIME':
      // Only update if analysis start time actually changed
      if (state.analysisStartTime === action.payload) return state;
      return { ...state, analysisStartTime: action.payload };
    
    case 'SET_ELAPSED_TIME':
      // Only update if elapsed time actually changed
      if (state.elapsedTime === action.payload) return state;
      return { ...state, elapsedTime: action.payload };
    
    case 'TOGGLE_OVERLAY':
      // Toggle specific overlay setting
      const newOverlaySettings = {
        ...state.overlaySettings,
        [action.payload]: !state.overlaySettings[action.payload]
      };
      return { ...state, overlaySettings: newOverlaySettings };
    
    case 'UPDATE_OVERLAY_SETTINGS':
      // Update multiple overlay settings at once
      const updatedOverlaySettings = {
        ...state.overlaySettings,
        ...action.payload
      };
      // Filter out undefined values to maintain type safety
      const filteredOverlaySettings = Object.fromEntries(
        Object.entries(updatedOverlaySettings).filter(([_, value]) => value !== undefined)
      ) as Record<string, boolean>;
      return { ...state, overlaySettings: filteredOverlaySettings };
    
    case 'CLEAR_ERROR':
      // Clear error state
      if (state.error === null) return state;
      return { ...state, error: null };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

export default function UploadPage() {
  // ALL HOOKS MUST BE AT THE TOP LEVEL - NO EXCEPTIONS
  
  // 1. State and refs
  const [state, dispatch] = useReducer(uploadReducer, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 2. Emergency loop breaker hooks
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(0);
  const emergencyTriggeredRef = useRef(false);
  const previousFile = useRef<File | null>(null);
  const previousVideoUrl = useRef<string | null>(null);
  
  // 3. Hydration tracking
  const [isHydrated, setIsHydrated] = useState(false);

  // 4. Memoized selectors to prevent unnecessary re-renders
  const isVideoReady = useMemo(() => 
    state.videoUrl && state.file && !state.isAnalyzing, 
    [state.videoUrl, state.file, state.isAnalyzing]
  );
  
  const hasAnalysisResults = useMemo(() => 
    state.result && state.poses && state.aiAnalysis, 
    [state.result, state.poses, state.aiAnalysis]
  );
  
  const isErrorState = useMemo(() => 
    state.error !== null, 
    [state.error]
  );
  
  const videoControls = useMemo(() => ({
    isPlaying: state.videoPlaying,
    currentTime: state.videoCurrentTime,
    duration: state.videoDuration,
    playbackSpeed: state.playbackSpeed,
    muted: state.muted
  }), [state.videoPlaying, state.videoCurrentTime, state.videoDuration, state.playbackSpeed, state.muted]);

  // 5. Video URL memoization
  const videoUrl = useMemo(() => {
    if (state.videoUrl) {
      return state.videoUrl;
    }
    return null;
  }, [state.videoUrl]);

  // 6. ALL useCallback hooks - MUST BE AT TOP LEVEL
  // File handling callbacks
  const handleFileSelect = useCallback((file: File) => {
    // Clean up previous URL first
    if (state.videoUrl) {
      URL.revokeObjectURL(state.videoUrl);
    }
    
    // Create new URL and update state
    const newVideoUrl = URL.createObjectURL(file);
    
    dispatch({ type: 'SET_FILE', payload: file });
    dispatch({ type: 'SET_VIDEO_URL', payload: newVideoUrl });
    dispatch({ type: 'SET_IS_SAMPLE_VIDEO', payload: false });
    dispatch({ type: 'CLEAR_ERROR' });
  }, [state.videoUrl]);

  const handleSampleVideoSelect = useCallback((filename: string, videoData: any) => {
    console.log('🎥 SAMPLE VIDEO SELECT: Starting selection process');
    console.log('🎥 SAMPLE VIDEO SELECT: Filename:', filename);
    console.log('🎥 SAMPLE VIDEO SELECT: Video data keys:', Object.keys(videoData));
    
    // Clean up previous URL first
    if (state.videoUrl) {
      URL.revokeObjectURL(state.videoUrl);
    }
    
    // Create new URL from video data
    const newVideoUrl = URL.createObjectURL(videoData);
    
    dispatch({ type: 'SET_FILE', payload: videoData });
    dispatch({ type: 'SET_VIDEO_URL', payload: newVideoUrl });
    dispatch({ type: 'SET_IS_SAMPLE_VIDEO', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    console.log('🎥 SAMPLE VIDEO SELECT: Selection completed successfully');
  }, [state.videoUrl]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleToggleOverlay = useCallback((overlayName: string) => {
    dispatch({ type: 'TOGGLE_OVERLAY', payload: overlayName });
  }, []);

  const handlePlaybackSpeedChange = useCallback((speed: number) => {
    dispatch({ type: 'SET_PLAYBACK_SPEED', payload: speed });
  }, []);

  const handleClearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const handleReset = useCallback(() => {
    // Clean up current blob URL
    if (state.videoUrl && state.videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(state.videoUrl);
    }
    
    dispatch({ type: 'RESET' });
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [state.videoUrl]);

  const createVideoUrl = useCallback((file: File) => {
    // Move logic inside, avoid state dependencies
    if (state.videoUrl && state.videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(state.videoUrl);
    }
    const url = URL.createObjectURL(file);
    dispatch({ type: 'SET_VIDEO_URL', payload: url });
    return url;
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('📁 File selected:', file.name, file.size, file.type);
      
      // Validate file
      if (!validateVideoFile(file)) {
        dispatch({ type: 'SET_ERROR', payload: 'Invalid video file. Please select a valid video file.' });
        return;
      }
      
      // Clean up previous URL
      if (state.videoUrl && state.videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(state.videoUrl);
      }
      
      // Create new URL
      const newVideoUrl = createVideoUrl(file);
      
      dispatch({ type: 'SET_FILE', payload: file });
      dispatch({ type: 'SET_VIDEO_URL', payload: newVideoUrl });
      dispatch({ type: 'SET_IS_SAMPLE_VIDEO', payload: false });
      dispatch({ type: 'CLEAR_ERROR' });
    }
  }, [state.videoUrl, createVideoUrl]);

  const analyze = useCallback(async () => {
    if (!state.file || !state.videoUrl) {
      dispatch({ type: 'SET_ERROR', payload: 'No video file selected' });
      return;
    }

    console.log('🚀 Starting analysis...');
    dispatch({ type: 'SET_ANALYZING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      console.log('📊 Analyzing video:', state.file.name);
      
      // Simulate analysis process
      const result = await analyzeGolfSwing(state.file, (step: string, progress: number) => {
        console.log(`Analysis step: ${step} (${progress}%)`);
      });

      console.log('✅ Analysis completed:', result);
      
      dispatch({ type: 'SET_RESULT', payload: result });
      dispatch({ type: 'SET_POSES', payload: [] });
      dispatch({ type: 'SET_AI_ANALYSIS', payload: null });
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      dispatch({ type: 'SET_ERROR', payload: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false });
    }
  }, [state.file, state.videoUrl]);

  const reset = useCallback(() => {
    // Comprehensive debugging
    console.group('Reset Function Debug');
    console.log('Current File:', state.file?.name);
    console.log('Current Video URL:', state.videoUrl);
    console.log('Is Sample Video:', state.isSampleVideo);
    console.log('Input Ref Current:', inputRef.current);
    console.groupEnd();
    
    console.log('🔄 Resetting upload state...');
    
    // Clean up current blob URL
    if (state.videoUrl && state.videoUrl.startsWith('blob:')) {
      console.log('🧹 CLEANUP: Revoking blob URL on reset:', state.videoUrl);
      URL.revokeObjectURL(state.videoUrl);
    } else if (state.videoUrl) {
      console.log('ℹ️ Video URL is not a blob URL, no cleanup needed:', state.videoUrl);
    } else {
      console.log('ℹ️ No video URL to clean up');
    }
    
    // Reset all state
    console.log('📝 Dispatching RESET action');
    dispatch({ type: 'RESET' });
    
    // Clear file input
    if (inputRef.current) {
      console.log('🧹 Clearing file input value');
      inputRef.current.value = '';
    } else {
      console.log('⚠️ Input ref is not available');
    }
    
    console.log('✅ Reset completed successfully');
  }, [state.videoUrl, state.file, state.isSampleVideo]);

  // Video event handlers - moved from JSX to prevent conditional hooks
  const handleVideoTimeUpdate = useCallback((time: number) => {
    console.log('🎥 Video time update:', time);
  }, []);

  const handleVideoPlay = useCallback(() => {
    console.log('🎥 Video play');
  }, []);

  const handleVideoPause = useCallback(() => {
    console.log('🎥 Video pause');
  }, []);

  const handleVideoLoadedMetadata = useCallback((duration: number) => {
    console.log('🎥 Video loaded, duration:', duration);
  }, []);

  const handleVideoMuteChange = useCallback((muted: boolean) => {
    console.log('🎥 Video mute change:', muted);
  }, []);

  const handleVideoError = useCallback(() => {
    console.error('🎥 Video error');
  }, []);

  // 7. ALL useEffect hooks - MUST BE AT TOP LEVEL
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Only log when actual changes occur
    if (state.file !== previousFile.current || state.videoUrl !== previousVideoUrl.current) {
      console.log('📊 UploadPage State Change Detected:');
      console.log('  File:', state.file?.name || 'None');
      console.log('  Video URL:', state.videoUrl || 'None');
      console.log('  Is Analyzing:', state.isAnalyzing);
      console.log('  Error:', state.error || 'None');
      
      // Update refs
      previousFile.current = state.file;
      previousVideoUrl.current = state.videoUrl;
    }
  }, [state.file, state.videoUrl, state.isAnalyzing, state.error]);

  useEffect(() => {
    // Cleanup effect for video URL
    return () => {
      if (state.videoUrl && state.videoUrl.startsWith('blob:')) {
        console.log('🧹 CLEANUP: Revoking blob URL in cleanup:', state.videoUrl);
        URL.revokeObjectURL(state.videoUrl);
      }
    };
  }, [state.videoUrl]);

  useEffect(() => {
    // Emergency loop breaker
    renderCountRef.current += 1;
    const now = Date.now();
    
    if (now - lastRenderTimeRef.current < 16) { // Less than 16ms between renders
      console.warn('⚠️ Rapid re-renders detected');
    }
    
    lastRenderTimeRef.current = now;
    
    if (renderCountRef.current > 50) {
      console.error('🚨 EMERGENCY: Too many renders detected');
      if (!emergencyTriggeredRef.current) {
        emergencyTriggeredRef.current = true;
        setEmergencyError('Too many re-renders detected. Please refresh the page.');
      }
    }
  });

  useEffect(() => {
    // Reset emergency trigger when component unmounts or state resets
    if (!state.file && !state.videoUrl) {
      emergencyTriggeredRef.current = false;
      setEmergencyError(null);
    }
  }, [state.file, state.videoUrl]);

  // Proper state change detection - NO INFINITE LOOPS
  useEffect(() => {
    // Only log when actual changes occur
    if (state.file !== previousFile.current || state.videoUrl !== previousVideoUrl.current) {
      console.log('🔄 State changed:', {
        file: state.file?.name,
        videoUrl: state.videoUrl?.substring(0, 50) + '...',
        isSample: state.isSampleVideo
      });
      
      previousFile.current = state.file;
      previousVideoUrl.current = state.videoUrl;
    }
  }, [state.file, state.videoUrl, state.isSampleVideo]);

  // Clear errors when sample video is selected
  useEffect(() => {
    if (state.isSampleVideo && state.videoUrl && state.error) {
      console.log('🧹 Auto-clearing error for sample video');
      dispatch({ type: 'CLEAR_ERROR' });
    }
  }, [state.isSampleVideo, state.videoUrl, state.error, dispatch]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    // Skip if emergency error is active
    if (emergencyError) {
      console.log('🚨 Emergency mode active, skipping cleanup registration');
      return;
    }
    
    console.log('🔧 Cleanup useEffect registered for video URL:', state.videoUrl);
    
    return () => {
      console.group('Component Unmount Cleanup');
      console.log('Video URL to clean up:', state.videoUrl);
      console.log('URL Type:', state.videoUrl?.startsWith('blob:') ? 'Blob URL' : 'File URL');
      console.groupEnd();
      
      if (state.videoUrl && state.videoUrl.startsWith('blob:')) {
        console.log('🧹 CLEANUP: Revoking blob URL on unmount:', state.videoUrl);
        URL.revokeObjectURL(state.videoUrl);
        console.log('✅ Blob URL revoked successfully');
      } else if (state.videoUrl) {
        console.log('ℹ️ Video URL is not a blob URL, no cleanup needed:', state.videoUrl);
      } else {
        console.log('ℹ️ No video URL to clean up on unmount');
      }
    };
  }, [state.videoUrl, emergencyError]);

  // Additional cleanup on unmount - runs once
  useEffect(() => {
    return () => {
      // Cleanup blob URLs when component unmounts
      if (state.videoUrl && state.videoUrl.startsWith('blob:')) {
        console.log('🧹 FINAL CLEANUP: Revoking blob URL on unmount:', state.videoUrl);
        URL.revokeObjectURL(state.videoUrl);
      }
    };
  }, []); // Empty dependencies - runs once on unmount

  // Emergency cleanup for critical situations
  useEffect(() => {
    if (emergencyError) {
      console.log('🚨 Emergency cleanup triggered');
      // Clean up any blob URLs immediately
      if (state.videoUrl && state.videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(state.videoUrl);
        console.log('🧹 Emergency blob URL cleanup completed');
      }
    }
  }, [emergencyError, state.videoUrl]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            🏌️ SwingVista - AI Golf Analysis
          </h1>
          
          {/* Debug Panel - Only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium">Debug Info:</span>
                  <span>Render Count: <strong>N/A (Disabled)</strong></span>
                  <span>Emergency Mode: <strong>N/A (Disabled)</strong></span>
                  <span>Emergency Error: <strong>{emergencyError ? 'ACTIVE' : 'Normal'}</strong></span>
                  <span>File: <strong>{state.file?.name || 'None'}</strong></span>
                  <span>Video URL: <strong>{state.videoUrl ? 'Present' : 'None'}</strong></span>
                </div>
                <button
                  onClick={() => {
                    setEmergencyError(null);
                    // resetRenderCounter(); // DISABLED
                    emergencyTriggeredRef.current = false;
                    renderCountRef.current = 0;
                    lastRenderTimeRef.current = 0;
                    console.log('🔄 Debug panel reset');
                  }}
                  className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700"
                >
                  Reset Debug
                </button>
              </div>
            </div>
          )}
          
          {/* Emergency Error Display */}
          {emergencyError && (
            <div className="bg-red-200 border border-red-500 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-red-700 mr-2">🚨</span>
                <div className="flex-1">
                  <p className="text-red-800 font-semibold">Emergency System Protection Activated</p>
                  <p className="text-red-700 text-sm mt-1">{emergencyError}</p>
                  <p className="text-red-600 text-xs mt-2">Render count exceeded safety threshold. System has been stabilized.</p>
                </div>
                <button
                  onClick={() => {
                    setEmergencyError(null);
                    // resetRenderCounter(); // DISABLED
                    emergencyTriggeredRef.current = false;
                    renderCountRef.current = 0;
                    lastRenderTimeRef.current = 0;
                    console.log('🔄 Emergency reset - all systems reset');
                  }}
                  className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Emergency Reset
                </button>
              </div>
            </div>
          )}

          {/* Regular Error Display */}
          {state.error && !emergencyError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">❌</span>
                <p className="text-red-700">{state.error}</p>
                <button
                  onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
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
                
                // Use the stable sample video handler
                handleSampleVideoSelect(videoName, { url: videoUrl });
                console.log('🎬 Sample video loaded:', videoUrl);
              }}
              className="mb-4"
            />
            
            {/* Debug State Information */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Debug State Info:</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p><strong>state.file:</strong> {state.file ? state.file.name : 'null'}</p>
                  <p><strong>state.isSampleVideo:</strong> {state.isSampleVideo ? 'true' : 'false'}</p>
                  <p><strong>state.videoUrl:</strong> {state.videoUrl ? state.videoUrl.substring(0, 50) + '...' : 'null'}</p>
                  <p><strong>videoUrl (computed):</strong> {videoUrl ? videoUrl.substring(0, 50) + '...' : 'null'}</p>
                  <p><strong>currentFileName:</strong> {isHydrated ? ((window as any).currentFileName || 'not set') : 'Loading...'}</p>
                  <p><strong>Should show preview:</strong> {(state.file || (state.isSampleVideo && state.videoUrl)) ? 'YES' : 'NO'}</p>
                  <p><strong>Current Error:</strong> {state.error || 'None'}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      console.log('🧹 Manual error clear');
                      dispatch({ type: 'CLEAR_ERROR' });
                    }}
                    className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                  >
                    Clear Error
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔄 Force re-render');
                      dispatch({ type: 'SET_IS_SAMPLE_VIDEO', payload: true });
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Force Refresh
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Video Preview Section */}
          {(() => {
            const shouldShow = state.file || (state.isSampleVideo && state.videoUrl);
            console.log('🎯 Video Preview Condition Check:', {
              hasFile: !!state.file,
              isSampleVideo: state.isSampleVideo,
              hasVideoUrl: !!state.videoUrl,
              shouldShow
            });
            return shouldShow;
          })() && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Video Preview</h3>
              
              {/* Basic Video Player with Overlays */}
              <div className="mb-6">
                <VideoPlayerWithOverlay
                  videoUrl={videoUrl || ''}
                  poses={[]} // Empty poses before analysis
                  phases={[]} // Empty phases before analysis
                  overlaySettings={state.overlaySettings as any}
                  playbackSpeed={state.playbackSpeed}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  isMuted={false}
                  onMuteChange={handleVideoMuteChange}
                  onVideoError={handleVideoError}
                />
              </div>

              {/* Video Controls */}
              <div className="mb-6">
                <VisualizationControls
                  onToggleOverlay={(overlayType, enabled) => {
                    dispatch({
                      type: 'UPDATE_OVERLAY_SETTINGS',
                      payload: { [overlayType]: enabled }
                    });
                  }}
                  onPlaybackSpeedChange={(speed) => {
                    dispatch({ type: 'SET_PLAYBACK_SPEED', payload: speed });
                  }}
                  onResetSettings={() => {
                    dispatch({
                      type: 'UPDATE_OVERLAY_SETTINGS',
                      payload: {
                        stickFigure: true,
                        swingPlane: true,
                        phaseMarkers: true,
                        clubPath: true,
                        impactZone: true,
                        weightTransfer: true,
                        spineAngle: true
                      }
                    });
                    dispatch({ type: 'SET_PLAYBACK_SPEED', payload: 1.0 });
                  }}
                />
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-gray-600 mb-4">
                  Selected: <strong>{state.file?.name || (isHydrated ? (window as any).currentFileName : null) || 'Sample Video'}</strong>
                </p>
                <div className="flex gap-4 justify-center">
                <button
                  onClick={analyze}
                  disabled={state.isAnalyzing}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {state.isAnalyzing ? 'Analyzing...' : 'Analyze Swing'}
                </button>
                  {state.result?.realAnalysis && (
                    <button
                      onClick={() => {
                        dispatch({ type: 'RESET' });
                        dispatch({ type: 'SET_FILE', payload: state.file });
                        dispatch({ type: 'SET_VIDEO_URL', payload: videoUrl });
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      New Analysis
                    </button>
                  )}
              </div>
              </div>

              {/* Simple Video Info - Safe alternative to VideoDebugger */}
              {process.env.NODE_ENV === 'development' && (state.file || (state.isSampleVideo && state.videoUrl)) && (
                <SimpleVideoInfo
                  videoUrl={videoUrl || ''}
                  videoName={state.file?.name || (isHydrated ? (window as any).currentFileName : null) || 'Sample Video'}
                  isSampleVideo={state.isSampleVideo}
                />
              )}
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


          {/* Video Analysis Display with Overlays */}
          {state.result?.realAnalysis && state.file && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Video Analysis with Overlays</h3>
              
              {/* Visualization Controls */}
              <div className="mb-6">
                <VisualizationControls
                  onToggleOverlay={(overlayType, enabled) => {
                    dispatch({
                      type: 'SET_OVERLAY_SETTINGS',
                      payload: {
                        ...state.overlaySettings,
                        [overlayType]: enabled
                      }
                    });
                  }}
                  onPlaybackSpeedChange={(speed) => {
                    dispatch({ type: 'SET_PLAYBACK_SPEED', payload: speed });
                  }}
                  onResetSettings={() => {
                    dispatch({ 
                      type: 'SET_OVERLAY_SETTINGS', 
                      payload: {
                        stickFigure: true,
                        swingPlane: true,
                        phaseMarkers: true,
                        clubPath: true,
                        impactZone: true,
                        weightTransfer: true,
                        spineAngle: true
                      }
                    });
                    dispatch({ type: 'SET_PLAYBACK_SPEED', payload: 1.0 });
                  }}
                />
              </div>
              
              {/* Video Player with Overlays */}
              <div className="relative">
                <VideoPlayerWithOverlay
                  videoUrl={videoUrl || ''}
                  poses={state.result.realAnalysis.poses || []}
                  phases={state.result.realAnalysis.phases || []}
                  overlaySettings={state.overlaySettings as any}
                  playbackSpeed={state.playbackSpeed}
                  onTimeUpdate={(time) => {
                    console.log('🎥 Video time update:', time);
                  }}
                  onPlay={() => {
                    console.log('🎥 Video play');
                  }}
                  onPause={() => {
                    console.log('🎥 Video pause');
                  }}
                  onLoadedMetadata={(duration) => {
                    console.log('🎥 Video loaded, duration:', duration);
                  }}
                  isMuted={false}
                  onMuteChange={(muted) => {
                    console.log('🎥 Video mute change:', muted);
                  }}
                  onVideoError={() => {
                    console.error('🎥 Video error');
                  }}
                />
              </div>
              
              {/* Metrics Visualization */}
              {state.result?.realAnalysis?.metrics && (
                <div className="mt-6">
                  <MetricsVisualizer
                    metrics={state.result.realAnalysis.metrics}
                    className="w-full"
                  />
                </div>
              )}
            </div>
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
