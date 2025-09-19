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
// Lazy load GolfGradeCard for future use
const _GolfGradeCard = lazy(() => import('@/components/analysis/GolfGradeCard'));
const ProgressChart = lazy(() => import('@/components/analysis/ProgressChart'));
// EMERGENCY FIX: Import pose extraction function directly
import { extractPosesFromVideo } from '@/lib/video-poses';
import { lazyAIAnalyzer } from '@/lib/lazy-ai-analyzer';
import { ProgressTracker } from '@/lib/swing-progress';
import { getWorkerPool } from '@/lib/worker-pool';
import type { PoseResult } from '@/lib/mediapipe';
import { PerformanceMonitor } from '@/lib/performance-monitoring';
import { hashVideoFile } from '@/lib/cache/video-hash';
import { getCachedAnalysis, getCachedPoses, setCachedAnalysis, setCachedPoses, CacheSchema } from '@/lib/cache/indexeddb';
import { getCachedPosesFallback, setCachedPosesFallback, getCachedAnalysisFallback, setCachedAnalysisFallback } from '@/lib/cache/fallback-cache';
import { trackEvent } from '@/lib/analytics';
import { EnhancedSwingPhaseDetector, EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

// Retry logic for robust error handling
const withRetry = async (operation: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        console.error(`❌ All ${maxRetries} attempts failed`);
        throw error;
      }
      console.log(`⏳ Waiting ${delay * attempt}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// WorkerResponse type is imported but not used in this component

interface AnalysisResult {
  trajectory: any;
  phases: any[];
  enhancedPhases?: EnhancedSwingPhase[];
  landmarks: PoseResult[];
  timestamps?: number[];
  metrics: {
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
  };
  aiFeedback?: {
    overallScore: number;
    strengths: string[];
    improvements: string[];
    technicalNotes: string[];
    swingSummary?: string;
  };
}

interface AIAnalysisResult {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  technicalNotes: string[];
  recordingQuality: {
    angle: string;
    score: number;
    recommendations: string[];
  };
  swingMetrics: {
    tempo: { ratio: number; backswingTime: number; downswingTime: number; assessment: string };
    rotation: { shoulders: number; hips: number; xFactor: number; assessment: string };
    balance: { score: number; assessment: string };
    plane: { angle: number; consistency: number; assessment: string };
  };
  grade?: any;
}

interface ProgressEntry {
  date: string;
  overallScore: number;
  metricScores: Record<string, number>;
  feedback: string[];
  videoUrl?: string;
  grade?: {
    overall: {
      letter: string;
      score: number;
    };
  };
}

interface UploadState {
  file: File | null;
  error: string | null;
  progress: number;
  step: string;
  result: AnalysisResult | null;
  poses: PoseResult[] | null;
  aiAnalysis: AIAnalysisResult | null;
  activeTab: 'analysis' | 'metrics' | 'history' | 'grading';
  isAnalyzing: boolean;
  progressHistory: ProgressEntry[];
  analysisStartTime: number | null;
  elapsedTime: number;
  videoCurrentTime: number;
  isVideoPlaying: boolean;
  videoDuration: number;
  // Visualization controls
  overlaySettings: {
    stickFigure: boolean;
    swingPlane: boolean;
    phaseMarkers: boolean;
    clubPath: boolean;
    impactZone: boolean;
    weightTransfer: boolean;
    spineAngle: boolean;
  };
  playbackSpeed: number;
  isMuted: boolean;
  selectedSwing: SwingHistoryEntry | null;
  comparison: SwingComparison | null;
}

type UploadAction = 
  | { type: 'SET_FILE'; payload: File | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_STEP'; payload: string }
  | { type: 'SET_RESULT'; payload: AnalysisResult | null }
  | { type: 'SET_POSES'; payload: PoseResult[] | null }
  | { type: 'SET_AI_ANALYSIS'; payload: AIAnalysisResult | null }
  | { type: 'SET_ACTIVE_TAB'; payload: 'analysis' | 'metrics' | 'history' | 'grading' }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_PROGRESS_HISTORY'; payload: ProgressEntry[] }
  | { type: 'SET_ANALYSIS_START_TIME'; payload: number | null }
  | { type: 'SET_ELAPSED_TIME'; payload: number }
  | { type: 'SET_VIDEO_CURRENT_TIME'; payload: number }
  | { type: 'SET_VIDEO_PLAYING'; payload: boolean }
  | { type: 'SET_VIDEO_DURATION'; payload: number }
  | { type: 'SET_OVERLAY_SETTING'; payload: { overlayType: string; enabled: boolean } }
  | { type: 'SET_PLAYBACK_SPEED'; payload: number }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_SELECTED_SWING'; payload: SwingHistoryEntry | null }
  | { type: 'SET_COMPARISON'; payload: SwingComparison | null }
  | { type: 'RESET' };

const initialState: UploadState = {
  file: null,
  error: null,
  progress: 0,
  step: '',
  result: null,
  poses: null,
  aiAnalysis: null,
  activeTab: 'analysis',
  isAnalyzing: false,
  progressHistory: [],
  analysisStartTime: null,
  elapsedTime: 0,
  videoCurrentTime: 0,
  isVideoPlaying: false,
  videoDuration: 0,
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
  isMuted: false,
  selectedSwing: null,
  comparison: null
};

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, file: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_RESULT':
      return { ...state, result: action.payload };
    case 'SET_POSES':
      return { ...state, poses: action.payload };
    case 'SET_AI_ANALYSIS':
      return { ...state, aiAnalysis: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    case 'SET_PROGRESS_HISTORY':
      return { ...state, progressHistory: action.payload };
    case 'SET_ANALYSIS_START_TIME':
      return { ...state, analysisStartTime: action.payload };
    case 'SET_ELAPSED_TIME':
      return { ...state, elapsedTime: action.payload };
    case 'SET_VIDEO_CURRENT_TIME':
      return { ...state, videoCurrentTime: action.payload };
    case 'SET_VIDEO_PLAYING':
      return { ...state, isVideoPlaying: action.payload };
    case 'SET_VIDEO_DURATION':
      return { ...state, videoDuration: action.payload };
    case 'SET_OVERLAY_SETTING':
      return {
        ...state,
        overlaySettings: {
          ...state.overlaySettings,
          [action.payload.overlayType]: action.payload.enabled
        }
      };
    case 'SET_PLAYBACK_SPEED':
      return { ...state, playbackSpeed: action.payload };
    case 'SET_MUTED':
      return { ...state, isMuted: action.payload };
    case 'SET_SELECTED_SWING':
      return { ...state, selectedSwing: action.payload };
    case 'SET_COMPARISON':
      return { ...state, comparison: action.payload };
    case 'RESET':
      return { ...initialState, progressHistory: state.progressHistory };
    default:
      return state;
  }
}

export default function UploadPage() {
  // console.log('UploadPage component mounted'); // Disabled to reduce console spam
  const [state, dispatch] = useReducer(uploadReducer, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debug state changes
  React.useEffect(() => {
    console.log('UploadPage state changed:', { isAnalyzing: state.isAnalyzing, progress: state.progress, step: state.step });
  }, [state.isAnalyzing, state.progress, state.step]);

  // Debug mount state
  useEffect(() => {
    console.log('UploadPage mounted, inputRef:', inputRef.current);
    return () => console.log('UploadPage unmounted');
  }, []);

  // Store original file reference to recreate blob URLs when needed
  const originalFileRef = useRef<File | null>(null);
  
  // Force video URL refresh when analysis completes
  const [videoUrlKey, setVideoUrlKey] = useState(0);
  const refreshVideoUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      console.log('🎥 VIDEO URL DEBUG: Refreshing video URL...');
      setVideoUrlKey(prev => prev + 1);
    }
  }, []);

  // Force component refresh when video URL changes
  const [forceRefresh, setForceRefresh] = useState(0);
  const forceComponentRefresh = useCallback(() => {
    if (typeof window !== 'undefined') {
      console.log('🎥 VIDEO URL DEBUG: Force refreshing component...');
      setForceRefresh(prev => prev + 1);
    }
  }, []);
  
  const videoUrl = useMemo(() => {
    if (typeof window === 'undefined' || !state.file) return null;
    
    // Store original file reference
    originalFileRef.current = state.file;
    
    // Handle sample videos
    if ((window as any).sampleVideoUrl) {
      console.log('🎥 SAMPLE VIDEO DEBUG: Using sample video URL:', (window as any).sampleVideoUrl);
      return (window as any).sampleVideoUrl;
    }
    
    // Handle regular uploaded files - create a fresh blob URL
    try {
      const url = URL.createObjectURL(state.file);
      console.log('🎥 VIDEO URL DEBUG: Created blob URL:', url);
      return url;
    } catch (error) {
      console.error('🎥 VIDEO URL DEBUG: Failed to create blob URL:', error);
      return null;
    }
  }, [state.file, videoUrlKey]);

  // Function to recreate video URL if it becomes stale
  const recreateVideoUrl = useCallback(() => {
    if (originalFileRef.current) {
      try {
        // Revoke old URL if it exists
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl);
        }
        
        const newUrl = URL.createObjectURL(originalFileRef.current);
        console.log('🎥 VIDEO URL DEBUG: Recreated blob URL:', newUrl);
        return newUrl;
      } catch (error) {
        console.error('🎥 VIDEO URL DEBUG: Failed to recreate blob URL:', error);
        return null;
      }
    }
    return null;
  }, [videoUrl]);

  // Handle video reload
  const handleVideoReload = useCallback(() => {
    console.log('🔄 VIDEO RELOAD: Reloading video...');
    
    // For sample videos, keep the same URL
    if ((window as any).sampleVideoUrl) {
      console.log('🔄 VIDEO RELOAD: Sample video detected, keeping URL');
      forceComponentRefresh();
      return;
    }
    
    // For uploaded files, recreate the blob URL
    if (originalFileRef.current) {
      refreshVideoUrl();
      forceComponentRefresh();
      console.log('🔄 VIDEO RELOAD: Blob URL refreshed');
    }
  }, [refreshVideoUrl, forceComponentRefresh]);

  // Video event handlers
  const handleVideoTimeUpdate = useCallback((currentTime: number) => {
    dispatch({ type: 'SET_VIDEO_CURRENT_TIME', payload: currentTime * 1000 }); // Convert to milliseconds
  }, []);

  const handleVideoPlay = useCallback(() => {
    dispatch({ type: 'SET_VIDEO_PLAYING', payload: true });
  }, []);

  const handleVideoPause = useCallback(() => {
    dispatch({ type: 'SET_VIDEO_PLAYING', payload: false });
  }, []);

  const handleVideoLoadedMetadata = useCallback((duration: number) => {
    dispatch({ type: 'SET_VIDEO_DURATION', payload: duration * 1000 }); // Convert to milliseconds
  }, []);

  // Visualization control handlers
  const handleOverlayToggle = useCallback((overlayType: string, enabled: boolean) => {
    console.log('🎬 OVERLAY TOGGLE DEBUG: Toggling overlay:', overlayType, 'to', enabled);
    dispatch({ type: 'SET_OVERLAY_SETTING', payload: { overlayType, enabled } });
  }, []);

  const handlePlaybackSpeedChange = useCallback((speed: number) => {
    console.log('🎬 PLAYBACK SPEED DEBUG: Changing speed to:', speed);
    dispatch({ type: 'SET_PLAYBACK_SPEED', payload: speed });
  }, []);

  const handleResetVisualizationSettings = useCallback(() => {
    // Reset all overlay settings to default
    const defaultSettings = {
      stickFigure: true,
      swingPlane: true,
      phaseMarkers: true,
      clubPath: true,
      impactZone: true,
      weightTransfer: true,
      spineAngle: true
    };
    
    Object.entries(defaultSettings).forEach(([key, value]) => {
      dispatch({ type: 'SET_OVERLAY_SETTING', payload: { overlayType: key, enabled: value } });
    });
    
    dispatch({ type: 'SET_PLAYBACK_SPEED', payload: 1.0 });
  }, []);

  // Audio control handlers
  const handleMuteToggle = useCallback((muted: boolean) => {
    dispatch({ type: 'SET_MUTED', payload: muted });
  }, []);

  // Swing history handlers
  const handleSwingSelect = useCallback((swing: SwingHistoryEntry) => {
    dispatch({ type: 'SET_SELECTED_SWING', payload: swing });
  }, []);

  const handleSwingCompare = useCallback((comparison: SwingComparison) => {
    dispatch({ type: 'SET_COMPARISON', payload: comparison });
  }, []);

  const handleCloseComparison = useCallback(() => {
    dispatch({ type: 'SET_COMPARISON', payload: null });
  }, []);

  // Save current swing to history
  const saveCurrentSwingToHistory = useCallback(() => {
    if (!state.result || !state.poses || !state.file) return;

    try {
      const swingEntry: Omit<SwingHistoryEntry, 'id' | 'timestamp' | 'date'> = {
        fileName: state.file.name,
        fileSize: state.file.size,
        duration: state.videoDuration,
        poses: state.poses,
        phases: (state.result.enhancedPhases || []) as any,
        metrics: {
          tempo: state.result.metrics.tempo,
          rotation: state.result.metrics.rotation,
          weightTransfer: state.result.metrics.weightTransfer,
          swingPlane: state.result.metrics.swingPlane,
          bodyAlignment: state.result.metrics.bodyAlignment,
          overallScore: state.result.metrics.overallScore,
          letterGrade: state.result.metrics.letterGrade
        },
        grade: (state.result as any).grade || {
          overall: {
            score: state.result.metrics.overallScore,
            letter: state.result.metrics.letterGrade,
            description: 'Analysis completed'
          },
          categories: {
            tempo: { score: state.result.metrics.tempo.score, letter: 'B', description: 'Tempo analysis' },
            rotation: { score: state.result.metrics.rotation.score, letter: 'B', description: 'Rotation analysis' },
            balance: { score: state.result.metrics.weightTransfer.score, letter: 'B', description: 'Balance analysis' },
            plane: { score: state.result.metrics.swingPlane.score, letter: 'B', description: 'Swing plane analysis' },
            power: { score: 75, letter: 'B', description: 'Power analysis' },
            consistency: { score: 75, letter: 'B', description: 'Consistency analysis' }
          }
        },
        videoUrl: videoUrl || undefined
      };

      const id = SwingHistoryManager.saveSwing(swingEntry);
      console.log('Swing saved to history with ID:', id);
    } catch (error) {
      console.error('Failed to save swing to history:', error);
    }
  }, [state.result, state.poses, state.file, state.videoDuration, videoUrl]);

  // Sample video handler - will be defined after analyze function

  const workerPool = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return getWorkerPool();
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const loadProgressHistory = useCallback(() => {
    const history = ProgressTracker.getHistory();
    dispatch({ type: 'SET_PROGRESS_HISTORY', payload: history });
  }, []);

  // Load progress history on component mount
  React.useEffect(() => {
    console.log('UploadPage useEffect: loadProgressHistory');
    loadProgressHistory();
  }, [loadProgressHistory]);

  // Timer effect for analysis
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (state.isAnalyzing && state.analysisStartTime) {
      interval = setInterval(() => {
        const elapsed = state.analysisStartTime ? Math.floor((Date.now() - state.analysisStartTime) / 1000) : 0;
        dispatch({ type: 'SET_ELAPSED_TIME', payload: elapsed });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isAnalyzing, state.analysisStartTime]);

  // Calculate estimated time remaining
  const getEstimatedTimeRemaining = () => {
    if (!state.isAnalyzing || !state.analysisStartTime || state.progress === 0) return null;
    
    const elapsed = state.elapsedTime;
    const progress = state.progress / 100;
    
    if (progress === 0) return null;
    
    const totalEstimated = Math.ceil(elapsed / progress);
    const remaining = Math.max(0, totalEstimated - elapsed);
    
    return remaining;
  };

  const estimatedRemaining = getEstimatedTimeRemaining();

  const onChooseFile = () => {
    console.log('Choose file button clicked');
    try {
      if (!inputRef.current) {
        console.error('inputRef is null!');
        return;
      }
      console.log('Clicking input ref:', inputRef.current);
      inputRef.current.click();
    } catch (err) {
      console.error('Error in onChooseFile:', err);
    }
  };

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    console.log('🎬 VIDEO UPLOAD DEBUG: File selected:', f?.name, 'Size:', f?.size, 'bytes');
    console.log('🎬 VIDEO UPLOAD DEBUG: File type:', f?.type);
    console.log('🎬 VIDEO UPLOAD DEBUG: File last modified:', f?.lastModified);
    dispatch({ type: 'SET_FILE', payload: f });
    dispatch({ type: 'SET_RESULT', payload: null });
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const useTigerSample = useCallback(async () => {
    try {
      console.log('Loading Tiger Woods sample video...');
      dispatch({ type: 'SET_ERROR', payload: null });
      const res = await fetch('/fixtures/swings/tiger-woods-swing.mp4');
      console.log('Fetch response:', res.status, res.ok);
      if (!res.ok) {
        throw new Error('Tiger Woods sample video not found. Please add a Tiger Woods swing video to public/fixtures/swings/tiger-woods-swing.mp4. You can find high-quality Tiger Woods swing videos on YouTube or golf instruction websites.');
      }
      const blob = await res.blob();
      console.log('Blob created:', blob.size, 'bytes');
      const sampleFile = new File([blob], 'tiger-woods-swing.mp4', { type: blob.type || 'video/mp4' });
      dispatch({ type: 'SET_FILE', payload: sampleFile });
      dispatch({ type: 'SET_RESULT', payload: null });
      dispatch({ type: 'SET_POSES', payload: null });
      if (inputRef.current) inputRef.current.value = '';
      console.log('Tiger Woods sample loaded successfully');
    } catch (err: any) {
      console.error('Error loading Tiger Woods sample:', err);
      dispatch({ type: 'SET_ERROR', payload: err?.message || 'Failed to load Tiger Woods sample video' });
    }
  }, []);

  const useAbergSample = useCallback(async () => {
    try {
      console.log('Loading Åberg sample video...');
      dispatch({ type: 'SET_ERROR', payload: null });
      const res = await fetch('/fixtures/swings/ludvig_aberg_driver.mp4');
      console.log('Fetch response:', res.status, res.ok);
      if (!res.ok) throw new Error('Sample video not found. Please add it to public/fixtures/swings/ludvig_aberg_driver.mp4');
      const blob = await res.blob();
      console.log('Blob created:', blob.size, 'bytes');
      const sampleFile = new File([blob], 'ludvig_aberg_driver.mp4', { type: blob.type || 'video/mp4' });
      dispatch({ type: 'SET_FILE', payload: sampleFile });
      dispatch({ type: 'SET_RESULT', payload: null });
      dispatch({ type: 'SET_POSES', payload: null });
      if (inputRef.current) inputRef.current.value = '';
      console.log('Åberg sample loaded successfully');
    } catch (err: any) {
      console.error('Error loading Åberg sample:', err);
      dispatch({ type: 'SET_ERROR', payload: err?.message || 'Failed to load sample video' });
    }
  }, []);

  const useHomaSample = useCallback(async () => {
    try {
      console.log('Loading Homa sample video...');
      dispatch({ type: 'SET_ERROR', payload: null });
      const res = await fetch('/fixtures/swings/max_homa_iron.mp4');
      console.log('Fetch response:', res.status, res.ok);
      if (!res.ok) throw new Error('Sample video not found. Please add it to public/fixtures/swings/max_homa_iron.mp4');
      const blob = await res.blob();
      console.log('Blob created:', blob.size, 'bytes');
      const sampleFile = new File([blob], 'max_homa_iron.mp4', { type: blob.type || 'video/mp4' });
      dispatch({ type: 'SET_FILE', payload: sampleFile });
      dispatch({ type: 'SET_RESULT', payload: null });
      dispatch({ type: 'SET_POSES', payload: null });
      if (inputRef.current) inputRef.current.value = '';
      console.log('Homa sample loaded successfully');
    } catch (err: any) {
      console.error('Error loading Homa sample:', err);
      dispatch({ type: 'SET_ERROR', payload: err?.message || 'Failed to load sample video' });
    }
  }, []);

  const analyze = useCallback(async () => {
    console.log('Analyze button clicked, current state:', {
      file: state.file?.name,
      isAnalyzing: state.isAnalyzing,
      error: state.error,
      step: state.step
    });
    
    if (!state.file) { 
      console.log('No file selected, showing error');
      dispatch({ type: 'SET_ERROR', payload: 'Please choose a video file first.' }); 
      return; 
    }
    reset();
    dispatch({ type: 'SET_ANALYZING', payload: true });
    dispatch({ type: 'SET_ANALYSIS_START_TIME', payload: typeof window !== 'undefined' ? Date.now() : 0 });
    dispatch({ type: 'SET_ELAPSED_TIME', payload: 0 });
    
      // Add timeout protection with longer duration for worker processing
      const timeoutId = setTimeout(() => {
        console.error('Analysis timeout triggered after 180 seconds');
        console.error('Current step:', state.step);
        console.error('Current progress:', state.progress);
        dispatch({ type: 'SET_ERROR', payload: 'Analysis is taking longer than expected. Please try a shorter video or check your internet connection.' });
        dispatch({ type: 'SET_ANALYZING', payload: false });
        dispatch({ type: 'SET_ANALYSIS_START_TIME', payload: null });
      }, 180000); // 3 minute timeout for worker processing
    
    try {
      dispatch({ type: 'SET_STEP', payload: 'Initializing...' }); 
      dispatch({ type: 'SET_PROGRESS', payload: 5 });
      const startTime = performance.now();

      // MediaPipe diagnostics removed - using TensorFlow.js only
      console.log('🔍 POSE DETECTION: Using TensorFlow.js (MoveNet) - MediaPipe disabled');

      // EMERGENCY FIX: Temporarily disable cache system to prevent errors
      dispatch({ type: 'SET_STEP', payload: 'Skipping cache (emergency mode)...' });
      
      const contentHash = null;
      const cacheKey = null;
      const cachedPoses = null;
      const cachedAnalysis = null;
      
      // EMERGENCY FIX: Disable cache entirely to prevent IndexedDB errors
      console.log('EMERGENCY FIX: Cache system disabled to prevent errors');
      
      console.log('Cache check results:', {
        cacheKey,
        hasCachedPoses: !!cachedPoses,
        hasCachedAnalysis: !!cachedAnalysis,
        posesCount: (cachedPoses as unknown as PoseResult[])?.length || 0,
        analysisKeys: cachedAnalysis ? Object.keys(cachedAnalysis) : []
      });
      
      // EMERGENCY FIX: Force fresh analysis for all videos since cache is disabled
      const isSampleVideo = state.file?.name?.includes('max_homa') || 
                           state.file?.name?.includes('ludvig_aberg') || 
                           state.file?.name?.includes('Tiger Woods') ||
                           (window as any).sampleVideoUrl;
      const hasDatabaseError = true; // EMERGENCY FIX: Always skip cache
      
      console.log('🎥 SAMPLE VIDEO DEBUG: Sample video detection:', {
        fileName: state.file?.name,
        isSampleVideo,
        sampleVideoUrl: (window as any).sampleVideoUrl
      });
      
      if (isSampleVideo || hasDatabaseError) {
        console.log('Sample video or database error detected, skipping cache for fresh analysis');
      } else if (cachedPoses && cachedAnalysis) {
        dispatch({ type: 'SET_STEP', payload: 'Loaded from cache' });
        dispatch({ type: 'SET_POSES', payload: cachedPoses });
        dispatch({ type: 'SET_RESULT', payload: cachedAnalysis });
        dispatch({ type: 'SET_STEP', payload: 'Generating AI analysis...' });
        dispatch({ type: 'SET_PROGRESS', payload: 80 });
        const aiFromCache = await lazyAIAnalyzer.analyze(cachedPoses, (cachedAnalysis as any).trajectory, (cachedAnalysis as any).phases, 'driver');
        dispatch({ type: 'SET_AI_ANALYSIS', payload: aiFromCache });
        const endTimeCached = performance.now();
        const memCached = (performance as any).memory?.usedJSHeapSize || 0;
        const v = document.createElement('video');
        v.src = URL.createObjectURL(state.file);
        await new Promise(res => v.onloadedmetadata = res);
        PerformanceMonitor.trackAnalysis({
          memoryUsage: memCached,
          processingTime: endTimeCached - startTime,
          videoDuration: v.duration || 0,
          poseCount: (cachedPoses as unknown as PoseResult[]).length,
          analysisScore: aiFromCache?.overallScore
        });
        URL.revokeObjectURL(v.src);
        try { trackEvent('analysis_completed', { cacheHit: true, duration: endTimeCached - startTime, score: aiFromCache?.overallScore }); } catch {}
        dispatch({ type: 'SET_STEP', payload: 'Done' });
        dispatch({ type: 'SET_PROGRESS', payload: 100 });
        clearTimeout(timeoutId);
        return;
      }
      
      // Extract poses with better progress reporting
      dispatch({ type: 'SET_STEP', payload: 'Extracting poses from video...' });
      dispatch({ type: 'SET_PROGRESS', payload: 10 });
      
      console.log('🔍 PIPELINE DEBUG: ===== VIDEO TO ANALYSIS PIPELINE =====');
      console.log('🔍 PIPELINE DEBUG: Step 1 - Starting pose extraction...');
      console.log('🔍 PIPELINE DEBUG: Video file:', state.file?.name, 'Size:', state.file?.size, 'bytes');
      console.log('🔍 PIPELINE DEBUG: Sample video URL:', (window as any).sampleVideoUrl);
      
      let extracted;
      try {
        // Handle sample videos differently
        if ((window as any).sampleVideoUrl) {
          console.log('🎥 SAMPLE VIDEO DEBUG: Processing sample video from URL:', (window as any).sampleVideoUrl);
          
          // For sample videos, we need to fetch the video and create a File object
          const response = await fetch((window as any).sampleVideoUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch sample video: ${response.status} ${response.statusText}`);
          }
          
          const videoBlob = await response.blob();
          const sampleFile = new File([videoBlob], state.file?.name || 'sample-video.mp4', { type: 'video/mp4' });
          
          console.log('🎥 SAMPLE VIDEO DEBUG: Created file from sample video:', sampleFile.name, 'Size:', sampleFile.size);
          
          extracted = await withRetry(
            () => extractPosesFromVideo(sampleFile, { sampleFps: 20, maxFrames: 200, minConfidence: 0.4, qualityThreshold: 0.3 }, (progress: { step: string; progress: number; frame?: number; totalFrames?: number }) => { 
              const message = progress.step === 'Reading video frames...' ? `Processing sample video frame ${progress.progress}%` : progress.step;
              dispatch({ type: 'SET_STEP', payload: message }); 
              // Map progress 0-100 to 10-60% of overall progress
              const mappedProgress = 10 + (progress.progress * 0.5);
              dispatch({ type: 'SET_PROGRESS', payload: Math.round(mappedProgress) });
              console.log(`🎥 SAMPLE VIDEO DEBUG: Progress update: ${message} (${Math.round(mappedProgress)}%)`);
            }),
            3, // retry 3 times
            2000 // 2 second delay between retries
          );
        } else {
          // Regular file upload
          extracted = await withRetry(
            () => extractPosesFromVideo(state.file!, { sampleFps: 20, maxFrames: 200, minConfidence: 0.4, qualityThreshold: 0.3 }, (progress: { step: string; progress: number; frame?: number; totalFrames?: number }) => { 
              const message = progress.step === 'Reading video frames...' ? `Processing frame ${progress.progress}%` : progress.step;
              dispatch({ type: 'SET_STEP', payload: message }); 
              // Map progress 0-100 to 10-60% of overall progress
              const mappedProgress = 10 + (progress.progress * 0.5);
              dispatch({ type: 'SET_PROGRESS', payload: Math.round(mappedProgress) });
              console.log(`🔍 POSE DETECTION DEBUG: Progress update: ${message} (${Math.round(mappedProgress)}%)`);
            }),
            3, // retry 3 times
            2000 // 2 second delay between retries
          );
        }
        
        console.log('🔍 PIPELINE DEBUG: Step 1 - Pose extraction completed!');
        console.log('🔍 PIPELINE DEBUG: Total poses extracted:', extracted.length);
        console.log('🔍 PIPELINE DEBUG: Pose quality warnings:', (extracted as any).qualityWarnings?.length || 0);
        console.log('🔍 PIPELINE DEBUG: Recording angle detected:', (extracted as any).recordingAngle || 'unknown');
        console.log('✅ POSE DETECTION DEBUG: Overall quality score:', (extracted as any).overallQuality?.score || 'unknown');
        
        // CRITICAL: Validate pose data quality
        if (extracted.length > 0) {
          const firstPose = extracted[0];
          const isMockData = firstPose.landmarks?.every((lm: any) => lm.x === 0.5 && lm.y === 0.5) || false;
          
          console.log('🔍 PIPELINE DEBUG: Step 1 - Pose data validation:', {
            hasLandmarks: !!firstPose.landmarks,
            landmarksCount: firstPose.landmarks?.length || 0,
            hasTimestamp: !!firstPose.timestamp,
            timestamp: firstPose.timestamp,
            isMockData: isMockData,
            dataQuality: isMockData ? 'MOCK DATA - INVALID' : 'REAL DATA - VALID'
          });
          
          if (isMockData) {
            console.error('❌ PIPELINE DEBUG: CRITICAL ERROR - Mock data detected! This should not happen with real pose detection.');
            throw new Error('Mock data detected in pose extraction. Real pose detection failed.');
          } else {
            console.log('✅ PIPELINE DEBUG: Real pose data validated successfully');
          }
        } else {
          console.error('❌ PIPELINE DEBUG: No poses extracted from video');
          throw new Error('No poses could be extracted from the video. Please try a different video.');
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('too long')) {
            throw new Error('Please trim your video to 20 seconds or less for optimal analysis.');
          } else if (error.message.includes('too large')) {
            throw new Error('Please compress your video to under 50MB for optimal analysis.');
          } else if (error.message.includes('timed out')) {
            throw new Error('Video processing took too long. Try a shorter video or check your connection.');
          }
        }
        throw error;
      }
      
      if (extracted.length < 5) throw new Error('Could not detect enough pose frames. Try a clearer video with better lighting and ensure your full body is visible.');
      
      console.log('Setting poses in state:', extracted.length, 'poses');
      dispatch({ type: 'SET_POSES', payload: extracted });
      
      // Store poses in a ref to prevent loss during re-mounts
      const posesRef = { current: extracted };
      console.log('Poses stored in ref:', posesRef.current.length, 'poses');
      
      dispatch({ type: 'SET_STEP', payload: 'Saving poses to cache...' });
      
      try {
        if (cacheKey && typeof cacheKey === 'string') {
          await setCachedPosesFallback(cacheKey, extracted);
          console.log('Poses saved to cache successfully');
        } else {
          console.log('No cache key available, skipping pose cache save');
        }
      } catch (error) {
        console.error('Failed to save poses to cache:', error);
        console.log('Continuing without pose cache save');
      }

      const club = 'driver';
      const swingId = `swing_${typeof window !== 'undefined' ? Date.now() : Math.floor(Math.random() * 1000000)}`;
      const source = 'upload' as const;

      // Use worker pool for better performance
      dispatch({ type: 'SET_STEP', payload: 'Analyzing swing mechanics...' });
      dispatch({ type: 'SET_PROGRESS', payload: 65 });
      console.log('🔍 PIPELINE DEBUG: Step 2 - Starting swing mechanics analysis...');
      console.log('🔍 PIPELINE DEBUG: Worker pool available:', !!workerPool);
      console.log('🔍 PIPELINE DEBUG: Poses to analyze:', extracted.length);
      console.log('🔍 PIPELINE DEBUG: Using real pose data:', !extracted[0]?.landmarks?.every((lm: any) => lm.x === 0.5 && lm.y === 0.5));
      
      // Set up progress tracking for worker
      const workerProgressHandler = (event: MessageEvent) => {
        if (event.data.type === 'PROGRESS') {
          const { step, progress } = event.data.data;
          const mappedProgress = 65 + (progress * 0.3); // Map 0-100 to 65-95
          dispatch({ type: 'SET_PROGRESS', payload: Math.round(mappedProgress) });
          dispatch({ type: 'SET_STEP', payload: step });
          console.log(`Worker progress: ${step} (${Math.round(mappedProgress)}%)`);
        }
      };
      
      // Add progress listener
      if (workerPool) {
        workerPool.addEventListener(workerProgressHandler);
      }
      
      let analysis;
      
      if (workerPool) {
        console.log('Using worker pool for analysis...');
        console.log('Sending message to worker pool...');
        
        // Add specific timeout for worker processing
        const workerTimeout = setTimeout(() => {
          console.error('Worker processing timeout after 90 seconds (fallback to main thread)');
          throw new Error('Swing mechanics analysis timed out. Please try again.');
        }, 90000);
        
        try {
          // Use worker with timeout, no race condition needed
          analysis = await workerPool.processMessage({ 
            type: 'ANALYZE_SWING', 
            data: { poses: extracted, club, swingId, source } 
          });
          
          clearTimeout(workerTimeout);
          console.log('Swing mechanics analysis completed');
          console.log('Analysis result:', analysis);
        } catch (error) {
          clearTimeout(workerTimeout);
          console.error('Worker processing error:', error);
          console.log('Falling back to main thread analysis...');
          
          // Fallback to main thread analysis
          const { analyzeSwing } = await import('@/lib/unified-analysis');
          analysis = await analyzeSwing({ poses: extracted, club, swingId, source });
          console.log('Main thread analysis completed');
        } finally {
          // Clean up progress listener
          if (workerPool) {
            workerPool.removeEventListener(workerProgressHandler);
          }
        }
      } else {
        console.log('Worker pool not available, using main thread...');
        try {
          const { analyzeSwing } = await import('@/lib/unified-analysis');
          analysis = await analyzeSwing({ poses: extracted, club, swingId, source });
          console.log('Main thread analysis completed');
        } catch (error) {
          console.error('Main thread analysis failed:', error);
          // Create a basic analysis result if everything fails
          console.warn('⚠️ GRADING DEBUG: All analysis methods failed, creating fallback analysis');
          console.warn('⚠️ GRADING DEBUG: This will give inaccurate results!');
          
          analysis = {
            trajectory: { clubhead: [], rightWrist: [] },
            phases: [],
            landmarks: extracted,
            metrics: {
              tempo: { backswingTime: 0.8, downswingTime: 0.25, tempoRatio: 3.2, score: 75 },
              rotation: { shoulderTurn: 85, hipTurn: 45, xFactor: 40, score: 80 },
              weightTransfer: { backswing: 80, impact: 85, finish: 90, score: 85 },
              swingPlane: { shaftAngle: 60, planeDeviation: 3, score: 70 },
              bodyAlignment: { spineAngle: 40, headMovement: 2, kneeFlex: 25, score: 75 },
              overallScore: 77,
              letterGrade: 'C'
            },
            aiFeedback: {
              overallScore: 77,
              strengths: ['Basic swing fundamentals present'],
              improvements: ['Work on consistency and timing'],
              technicalNotes: ['Analysis completed with basic metrics - FALLBACK DATA'],
              swingSummary: '⚠️ FALLBACK ANALYSIS: This analysis used placeholder data due to processing errors. Please try a different video or check your connection.'
            },
            isFallback: true,
            error: 'Analysis failed - using fallback data'
          };
          console.log('⚠️ GRADING DEBUG: Fallback analysis created with warning flags');
        }
      }
      
      console.log('🔍 PIPELINE DEBUG: Step 3 - Setting analysis result...');
      console.log('🔍 PIPELINE DEBUG: Analysis structure check:', {
        hasPhases: !!analysis?.phases,
        phasesCount: analysis?.phases?.length || 0,
        hasMetrics: !!analysis?.metrics,
        hasTrajectory: !!analysis?.trajectory,
        hasLandmarks: !!analysis?.landmarks,
        landmarksCount: analysis?.landmarks?.length || 0
      });
      
      // CRITICAL: Validate metrics quality
      if (analysis?.metrics) {
        const isFallbackData = analysis.isFallback || (analysis.metrics.overallScore === 77 && analysis.metrics.letterGrade === 'C');
        
        console.log('🔍 PIPELINE DEBUG: Step 3 - Metrics validation:', {
          overallScore: analysis.metrics.overallScore,
          letterGrade: analysis.metrics.letterGrade,
          tempoScore: analysis.metrics.tempo?.score,
          rotationScore: analysis.metrics.rotation?.score,
          isFallbackData: isFallbackData,
          dataQuality: isFallbackData ? 'FALLBACK DATA - INVALID' : 'REAL DATA - VALID'
        });
        
        if (isFallbackData) {
          console.error('❌ PIPELINE DEBUG: CRITICAL ERROR - Fallback/mock metrics detected! This indicates analysis failure.');
          throw new Error('Analysis failed and returned fallback data. Please try a different video.');
        } else {
          console.log('✅ PIPELINE DEBUG: Real metrics validated successfully');
        }
      }
      
      // Create enhanced swing phases
      dispatch({ type: 'SET_STEP', payload: 'Analyzing swing phases...' });
      const phaseDetector = new EnhancedSwingPhaseDetector();
      const enhancedPhases = phaseDetector.detectPhases(
        extracted.map((p: any) => p.landmarks || []),
        analysis.trajectory || { clubhead: [], rightWrist: [] },
        analysis.timestamps || extracted.map((p: any) => p.timestamp || 0)
      );
      
      console.log('Enhanced phases detected:', enhancedPhases.length);
      
      // Ensure analysis result has the correct structure
      const normalizedAnalysis = {
        ...analysis,
        phases: analysis?.phases || [],
        enhancedPhases: enhancedPhases,
        timestamps: analysis?.timestamps || extracted.map((p: any) => p.timestamp || 0),
        metrics: analysis?.metrics || {},
        trajectory: analysis?.trajectory || { clubhead: [], rightWrist: [] },
        landmarks: analysis?.landmarks || extracted
      };
      
      console.log('Normalized analysis structure:', {
        phasesCount: normalizedAnalysis.phases.length,
        timestampsCount: normalizedAnalysis.timestamps.length,
        metricsKeys: Object.keys(normalizedAnalysis.metrics),
        trajectoryKeys: Object.keys(normalizedAnalysis.trajectory),
        landmarksCount: normalizedAnalysis.landmarks.length
      });
      
      dispatch({ type: 'SET_RESULT', payload: normalizedAnalysis });
      dispatch({ type: 'SET_STEP', payload: 'Saving analysis to cache...' });
      
      // Ensure poses are still set in the result
      console.log('Final state check before AI analysis:', {
        poses: state.poses?.length,
        result: !!normalizedAnalysis,
        phases: normalizedAnalysis.phases?.length
      });
      
      try {
        if (cacheKey && typeof cacheKey === 'string') {
          await setCachedAnalysisFallback(cacheKey, normalizedAnalysis);
          console.log('Analysis result saved to cache successfully');
        } else {
          console.log('No cache key available, skipping cache save');
        }
      } catch (error) {
        console.error('Failed to save analysis to cache:', error);
        console.log('Continuing without cache save');
      }
      
      console.log('Analysis result set successfully');
      
      // Generate AI analysis (lazy loaded)
      dispatch({ type: 'SET_STEP', payload: 'Generating AI analysis...' });
      dispatch({ type: 'SET_PROGRESS', payload: 80 });
      console.log('🔍 PIPELINE DEBUG: Step 4 - Starting AI analysis...');
      console.log('🔍 PIPELINE DEBUG: Input data:', {
        posesCount: extracted.length,
        trajectoryPoints: normalizedAnalysis.trajectory?.clubhead?.length || 0,
        phasesCount: normalizedAnalysis.phases?.length || 0,
        club: club
      });
      
      const aiResult = await lazyAIAnalyzer.analyze(extracted, normalizedAnalysis.trajectory, normalizedAnalysis.phases, club);
      console.log('🔍 PIPELINE DEBUG: Step 4 - AI analysis completed:', {
        overallScore: aiResult?.overallScore,
        strengthsCount: aiResult?.strengths?.length || 0,
        improvementsCount: aiResult?.improvements?.length || 0,
        technicalNotesCount: aiResult?.technicalNotes?.length || 0
      });
      
      dispatch({ type: 'SET_AI_ANALYSIS', payload: aiResult });
      
      // Save to progress history
      dispatch({ type: 'SET_STEP', payload: 'Saving to progress history...' });
      dispatch({ type: 'SET_PROGRESS', payload: 90 });
      ProgressTracker.saveAnalysis(aiResult, videoUrl || undefined);
      loadProgressHistory();
      
      // Performance monitoring
      const endTime = performance.now();
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      const videoElement = document.createElement('video');
      videoElement.src = URL.createObjectURL(state.file);
      await new Promise(resolve => videoElement.onloadedmetadata = resolve);
      PerformanceMonitor.trackAnalysis({
        memoryUsage,
        processingTime: endTime - startTime,
        videoDuration: videoElement.duration,
        poseCount: extracted.length,
        analysisScore: aiResult?.overallScore
      });
      URL.revokeObjectURL(videoElement.src);
      try { trackEvent('analysis_completed', { cacheHit: false, duration: endTime - startTime, score: aiResult?.overallScore }); } catch {}

      dispatch({ type: 'SET_STEP', payload: 'Done' }); 
      dispatch({ type: 'SET_PROGRESS', payload: 100 });
      
      // Automatically switch to video analysis tab when analysis completes
      console.log('Analysis completed, switching to video-analysis tab. Current state:', { 
        poses: state.poses?.length, 
        result: !!normalizedAnalysis, 
        activeTab: state.activeTab,
        phases: normalizedAnalysis?.phases?.length || 0,
        metrics: !!normalizedAnalysis?.metrics,
        trajectory: !!normalizedAnalysis?.trajectory,
        landmarksInResult: normalizedAnalysis?.landmarks?.length || 0
      });
      
      // Refresh video URL to prevent blob URL issues
      refreshVideoUrl();
      forceComponentRefresh();
      
      // Ensure poses are set in the result for video analysis
      if (normalizedAnalysis && extracted) {
        normalizedAnalysis.landmarks = extracted;
        console.log('Ensuring poses are in analysis result:', extracted.length, 'poses');
        
        // Also store poses in a more accessible way
        (normalizedAnalysis as any).poses = extracted;
        console.log('Poses also stored as poses property:', (normalizedAnalysis as any).poses?.length, 'poses');
        
        // EMERGENCY FIX: Store video URL in the analysis result for video display with validation
        if (videoUrl) {
          (normalizedAnalysis as any).videoUrl = videoUrl;
          console.log('Video URL stored in analysis result:', videoUrl);
        } else {
          console.error('EMERGENCY: Video URL is undefined - this will cause video display issues');
          // Try to regenerate the video URL from the file
          if (state.file) {
            try {
              const regeneratedUrl = URL.createObjectURL(state.file);
              (normalizedAnalysis as any).videoUrl = regeneratedUrl;
              console.log('EMERGENCY FIX: Regenerated video URL:', regeneratedUrl);
            } catch (urlError) {
              console.error('EMERGENCY: Failed to regenerate video URL:', urlError);
            }
          }
        }
      }
      
      // Force a small delay to ensure state is updated
      setTimeout(() => {
        console.log('🔍 PIPELINE DEBUG: ===== PIPELINE COMPLETE =====');
        console.log('🔍 PIPELINE DEBUG: Final validation:', {
          posesCount: state.poses?.length || 0,
          hasResult: !!state.result,
          hasAIAnalysis: !!state.aiAnalysis,
          activeTab: state.activeTab,
          isAnalyzing: state.isAnalyzing
        });
        
        // CRITICAL: Final validation of the complete pipeline
        console.log('🔍 PIPELINE DEBUG: Checking complete pipeline...');
        if (state.poses && state.poses.length > 0) {
          const isRealPoses = !state.poses[0]?.landmarks?.every((lm: any) => lm.x === 0.5 && lm.y === 0.5);
          console.log('🔍 FINAL VALIDATION DEBUG: Pose data quality:', isRealPoses ? 'REAL' : 'MOCK');
        }
        
        if (state.result?.metrics) {
          const isRealMetrics = !(state.result.metrics.overallScore === 77 && state.result.metrics.letterGrade === 'C');
          console.log('🔍 FINAL VALIDATION DEBUG: Metrics quality:', isRealMetrics ? 'REAL' : 'MOCK');
        }
        
        if (state.aiAnalysis) {
          console.log('🔍 FINAL VALIDATION DEBUG: AI analysis quality:', state.aiAnalysis.overallScore > 0 ? 'REAL' : 'MOCK');
        }
        
        dispatch({ type: 'SET_ACTIVE_TAB', payload: 'analysis' });
      }, 100);
      
      clearTimeout(timeoutId);
    } catch (err: any) {
      console.error('Analysis error:', err);
      dispatch({ type: 'SET_ERROR', payload: err?.message || 'Failed to analyze video. Please try a different video or check your internet connection.' });
      clearTimeout(timeoutId);
      
      // Even if analysis fails, try to show the video
      if (videoUrl) {
        console.log('🎥 VIDEO DEBUG: Analysis failed but video URL available, showing video anyway');
        dispatch({ type: 'SET_ACTIVE_TAB', payload: 'analysis' });
      }
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false });
      dispatch({ type: 'SET_ANALYSIS_START_TIME', payload: null });
    }
  }, [state.file, workerPool, videoUrl, reset, loadProgressHistory, state.error, state.isAnalyzing, state.progress, state.step]);

  // Sample video handler
  const handleSampleVideoSelect = useCallback(async (videoUrl: string, videoName: string) => {
    console.log('🎥 SAMPLE VIDEO DEBUG: Selected sample video:', videoName, 'URL:', videoUrl);
    
    try {
      // Create a mock file object for the sample video
      const mockFile = new File([], videoName, { type: 'video/mp4' });
      dispatch({ type: 'SET_FILE', payload: mockFile });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Set the video URL for display
      const fullVideoUrl = videoUrl.startsWith('/') ? videoUrl : `/${videoUrl}`;
      console.log('🎥 SAMPLE VIDEO DEBUG: Full video URL:', fullVideoUrl);
      
      // Verify the video exists by trying to fetch it
      try {
        const response = await fetch(fullVideoUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Sample video not found: ${response.status} ${response.statusText}`);
        }
        console.log('🎥 SAMPLE VIDEO DEBUG: Video exists and is accessible');
      } catch (error) {
        console.error('🎥 SAMPLE VIDEO DEBUG: Video fetch failed:', error);
        console.warn('🎥 SAMPLE VIDEO DEBUG: Continuing anyway - video might be accessible during analysis');
        // Don't return here - let the analysis try to handle it
      }
      
      // Store the video URL for later use
      (window as any).sampleVideoUrl = fullVideoUrl;
      
      // Automatically trigger analysis
      console.log('🎥 SAMPLE VIDEO DEBUG: Triggering automatic analysis...');
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'analysis' });
      
      // Start analysis after a short delay to ensure state is updated
      setTimeout(() => {
        console.log('🎥 SAMPLE VIDEO DEBUG: Starting sample video analysis...');
        analyze();
      }, 200);
      
    } catch (error) {
      console.error('🎥 SAMPLE VIDEO DEBUG: Error selecting sample video:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to load sample video: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  }, [analyze]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-16" suppressHydrationWarning>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-900">
          📤 Upload Video
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Upload your golf swing videos for detailed analysis and personalized feedback.
        </p>
        
        {/* Sample Video Selector */}
        <div className="mb-12">
          <SampleVideoSelector
            onSelectVideo={handleSampleVideoSelect}
            className="max-w-md mx-auto"
          />
        </div>
        
        <div className="bg-gray-50 rounded-2xl p-8 md:p-12 mb-12 text-left">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Upload Area</h2>
          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onFileChange} />
          {state.error && <ErrorAlert message={state.error} className="mb-4" />}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <button onClick={onChooseFile} className="w-full md:w-auto bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all shadow">
              📁 {state.file ? 'Change File' : 'Choose File'}
            </button>
            <button onClick={analyze} disabled={!state.file || state.isAnalyzing} className="w-full md:w-auto bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow">
              🔍 {state.isAnalyzing ? `Analyzing... (${state.elapsedTime}s)` : 'Analyze Video'}
            </button>
            <button onClick={useTigerSample} disabled={state.isAnalyzing} className="w-full md:w-auto bg-purple-600 disabled:bg-purple-300 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all shadow">
              🐯 Use Tiger Woods Sample
            </button>
            <button onClick={useAbergSample} disabled={state.isAnalyzing} className="w-full md:w-auto bg-indigo-600 disabled:bg-indigo-300 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow">
              🇸🇪 Use Åberg Sample
            </button>
            <button onClick={useHomaSample} disabled={state.isAnalyzing} className="w-full md:w-auto bg-rose-600 disabled:bg-rose-300 text-white px-6 py-3 rounded-xl font-semibold hover:bg-rose-700 transition-all shadow">
              🇺🇸 Use Homa Sample
            </button>
            {state.file && (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-gray-600 truncate">Selected: {state.file.name}</span>
                <VideoPreview file={state.file} className="mt-4" />
              </div>
            )}
          </div>

          {(state.isAnalyzing || state.progress > 0) && (
            <div className="mt-6">
              <ProgressBar progress={state.progress} step={state.step} />
              {state.isAnalyzing && (
                <div className="mt-3 flex items-center justify-between">
                  <LoadingSpinner size="sm" text="Processing in background" />
                  <div className="text-sm text-gray-600">
                    ⏱️ Elapsed: {state.elapsedTime}s
                    {estimatedRemaining !== null && (
                      <span className="ml-2">
                        | ⏳ Est. remaining: {estimatedRemaining}s
                      </span>
                    )}
                    {state.analysisStartTime && (
                      <span className="ml-2">
                        | Started: {new Date(state.analysisStartTime).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button onClick={() => { dispatch({ type: 'SET_FILE', payload: null }); reset(); if (inputRef.current) inputRef.current.value = ''; }} className="w-full sm:w-auto bg-gray-100 text-gray-900 px-10 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center min-w-[200px]">
            Reset
          </button>
          <Link 
            href="/" 
            className="w-full sm:w-auto bg-gray-100 text-gray-900 px-10 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center min-w-[200px]"
          >
            ← Back to Home
          </Link>
        </div>

        {state.result && (
          <div className="mt-12 text-left">
            <div className="flex border-b border-gray-200 mb-6">
              <button
                className={`py-2 px-4 font-medium ${state.activeTab === 'analysis' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'analysis' })}
              >
                Video Analysis
              </button>
              <button
                className={`py-2 px-4 font-medium ${state.activeTab === 'metrics' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'metrics' })}
              >
                Swing Metrics
              </button>
              <button
                className={`py-2 px-4 font-medium ${state.activeTab === 'history' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'history' })}
              >
                Swing History
              </button>
              <button
                className={`py-2 px-4 font-medium ${state.activeTab === 'grading' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'grading' })}
              >
                Comprehensive Grading
              </button>
            </div>

            {state.activeTab === 'analysis' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Swing Analysis</h2>
                  <p className="text-gray-600">Interactive video analysis with real-time overlays</p>
                </div>

                {/* Video URL Debug Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-900 mb-2">Debug Information</h3>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <div>Video URL: {videoUrl || 'No video URL'}</div>
                    <div>Video URL Key: {videoUrlKey}</div>
                    <div>Force Refresh: {forceRefresh}</div>
                    <div>Poses count: {state.poses?.length || 0}</div>
                    <div>Phases count: {state.result?.enhancedPhases?.length || 0}</div>
                    <div>File name: {state.file?.name || 'No file'}</div>
                    <div>Result exists: {state.result ? 'Yes' : 'No'}</div>
                    <div>Result video URL: {(state.result as any)?.videoUrl || 'No result video URL'}</div>
                  </div>
                </div>

                {(videoUrl || (state.result as any)?.videoUrl) ? (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Video Player */}
                    <div className="xl:col-span-2">
                      <VideoPlayerWithOverlay
                        key={`video-${videoUrlKey}-${forceRefresh}`}
                        videoUrl={videoUrl || (state.result as any)?.videoUrl}
                        poses={state.poses || []}
                        phases={state.result?.enhancedPhases || []}
                        overlaySettings={state.overlaySettings || {
                          stickFigure: true,
                          swingPlane: true,
                          phaseMarkers: true,
                          clubPath: true,
                          impactZone: true,
                          weightTransfer: true,
                          spineAngle: true
                        }}
                        playbackSpeed={state.playbackSpeed || 1.0}
                        onTimeUpdate={handleVideoTimeUpdate}
                        onPlay={handleVideoPlay}
                        onPause={handleVideoPause}
                        onLoadedMetadata={handleVideoLoadedMetadata}
                        isMuted={state.isMuted}
                        onMuteChange={handleMuteToggle}
                        onVideoError={() => {
                          console.log('🎥 VIDEO ERROR: Attempting to refresh video URL...');
                          refreshVideoUrl();
                          forceComponentRefresh();
                        }}
                        onReloadVideo={handleVideoReload}
                        className="w-full"
                      />
                    </div>

                    {/* Controls Panel */}
                    <div className="space-y-6">
                      <VisualizationControls
                        onToggleOverlay={handleOverlayToggle}
                        onPlaybackSpeedChange={handlePlaybackSpeedChange}
                        onResetSettings={handleResetVisualizationSettings}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎥</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Video Not Available</h3>
                    <p className="text-gray-600 mb-6">
                      {!videoUrl ? 'No video URL available' : 
                       !state.poses ? 'No pose data available' : 
                       'Pose data is empty'}
                    </p>
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'metrics' })}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      View Metrics Instead
                    </button>
                  </div>
                )}

                {/* Analysis Features Info */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🎯</span>
                    Analysis Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Visual Overlays</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Real-time stick figure pose detection</li>
                        <li>• Swing plane visualization with angle measurements</li>
                        <li>• Phase-specific markers with grades and recommendations</li>
                        <li>• Club path tracking and impact zone highlighting</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Interactive Controls</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Toggle individual overlay types on/off</li>
                        <li>• Adjust playback speed (0.25x to 2x)</li>
                        <li>• Quick preset configurations</li>
                        <li>• Reset all settings to defaults</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {state.activeTab === 'history' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Swing History</h2>
                  <p className="text-gray-600">Track your progress and compare swings over time</p>
                </div>

                {/* Save Current Swing Button */}
                {state.result && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-blue-900">Save Current Analysis</h3>
                        <p className="text-sm text-blue-700">
                          Save this swing to your history for future comparison and progress tracking.
                        </p>
                      </div>
                      <button
                        onClick={saveCurrentSwingToHistory}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Save to History
                      </button>
                    </div>
                  </div>
                )}

                {/* Swing History Panel */}
                <SwingHistoryPanel
                  currentSwing={state.selectedSwing || undefined}
                  onSelectSwing={handleSwingSelect}
                  onCompareSwings={handleSwingCompare}
                />

                {/* Comparison Panel */}
                {state.comparison && (
                  <SwingComparisonPanel
                    comparison={state.comparison}
                    onClose={handleCloseComparison}
                  />
                )}
              </div>
            )}

            {state.activeTab === 'metrics' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Swing Metrics</h2>
                  <p className="text-gray-600">Detailed analysis of your swing performance</p>
                </div>

                {state.result ? (
                  <div className="space-y-8">
                    {/* Main Metrics Panel */}
                    <MetricsPanel
                      metrics={state.result.metrics}
                      aiFeedback={state.result.aiFeedback}
                    />

                    {/* Drill Recommendations */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="text-2xl mr-2">🏌️</span>
                        Drill Recommendations
                      </h3>
                      <Suspense fallback={<LoadingSpinner text="Loading recommendations..." />}>
                        <DrillRecommendations metrics={state.result.metrics} />
                      </Suspense>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Data</h3>
                    <p className="text-gray-600 mb-6">
                      Complete your swing analysis to view detailed metrics and recommendations.
                    </p>
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'analysis' })}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Analyze Your Swing
                    </button>
                  </div>
                )}
              </div>
            )}



            {state.activeTab === 'grading' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Comprehensive Golf Grading</h2>
                  <p className="text-gray-600">Professional-grade swing analysis with 12-level grading system</p>
                </div>

                {state.result ? (
                  <div className="space-y-8">
                    {/* Comprehensive Grading Display */}
                    <ComprehensiveGradingDisplay
                      grade={state.result as any}
                      className="w-full"
                    />
                    
                    {/* Debug Panel */}
                    <GradingDebugPanel
                      poses={state.poses || []}
                      phases={state.result?.phases || []}
                      trajectory={state.result?.trajectory || { rightWrist: [], leftWrist: [] }}
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Test the grading system */}
                    <GradingSystemTest className="w-full" />
                    
                    {/* Professional Swing Validator */}
                    <ProfessionalSwingValidator className="w-full" />
                    
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏌️</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Data</h3>
                      <p className="text-gray-600 mb-6">
                        Complete your swing analysis to view comprehensive grading results.
                      </p>
                      <button
                        onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'analysis' })}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Analyze Your Swing
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}


