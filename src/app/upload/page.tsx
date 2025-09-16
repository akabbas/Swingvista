"use client";
import Link from 'next/link';
import React, { useMemo, useRef, useReducer, useCallback, useEffect } from 'react';
import ProgressBar from '@/components/ui/ProgressBar';
import ErrorAlert from '@/components/ui/ErrorAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { lazy, Suspense } from 'react';
import SwingFeedback from '@/components/analysis/SwingFeedback';
import PoseOverlay from '@/components/analysis/PoseOverlay';

// Lazy load heavy components
const DrillRecommendations = lazy(() => import('@/components/analysis/DrillRecommendations'));
const GolfGradeCard = lazy(() => import('@/components/analysis/GolfGradeCard'));
const ProgressChart = lazy(() => import('@/components/analysis/ProgressChart'));
import { extractPosesFromVideo } from '@/lib/video-poses';
import { lazyAIAnalyzer } from '@/lib/lazy-ai-analyzer';
import { ProgressTracker } from '@/lib/swing-progress';
import { getWorkerPool } from '@/lib/worker-pool';
import type { PoseResult } from '@/lib/mediapipe';
import { PerformanceMonitor } from '@/lib/performance-monitoring';
import { hashVideoFile } from '@/lib/cache/video-hash';
import { getCachedAnalysis, getCachedPoses, setCachedAnalysis, setCachedPoses, CacheSchema } from '@/lib/cache/indexeddb';
import { trackEvent } from '@/lib/analytics';

// WorkerResponse type is imported but not used in this component

interface AnalysisResult {
  trajectory: any;
  phases: any[];
  landmarks: PoseResult[];
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
  activeTab: 'video' | 'metrics' | 'progress';
  isAnalyzing: boolean;
  progressHistory: ProgressEntry[];
}

type UploadAction = 
  | { type: 'SET_FILE'; payload: File | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_STEP'; payload: string }
  | { type: 'SET_RESULT'; payload: AnalysisResult | null }
  | { type: 'SET_POSES'; payload: PoseResult[] | null }
  | { type: 'SET_AI_ANALYSIS'; payload: AIAnalysisResult | null }
  | { type: 'SET_ACTIVE_TAB'; payload: 'video' | 'metrics' | 'progress' }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_PROGRESS_HISTORY'; payload: ProgressEntry[] }
  | { type: 'RESET' };

const initialState: UploadState = {
  file: null,
  error: null,
  progress: 0,
  step: '',
  result: null,
  poses: null,
  aiAnalysis: null,
  activeTab: 'video',
  isAnalyzing: false,
  progressHistory: []
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
    case 'RESET':
      return { ...initialState, progressHistory: state.progressHistory };
    default:
      return state;
  }
}

export default function UploadPage() {
  console.log('UploadPage component mounted');
  const [state, dispatch] = useReducer(uploadReducer, initialState);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debug mount state
  useEffect(() => {
    console.log('UploadPage mounted, inputRef:', inputRef.current);
    return () => console.log('UploadPage unmounted');
  }, []);

  const videoUrl = useMemo(() => {
    if (!state.file) return null;
    return URL.createObjectURL(state.file);
  }, [state.file]);

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
    loadProgressHistory();
  }, [loadProgressHistory]);

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
    console.log('File selected:', f?.name, f?.size);
    dispatch({ type: 'SET_FILE', payload: f });
    dispatch({ type: 'SET_RESULT', payload: null });
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const useTigerSample = useCallback(async () => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const res = await fetch('/fixtures/swings/tiger-iron.mp4');
      if (!res.ok) throw new Error('Sample video not found. Please add it to public/fixtures/swings/tiger-iron.mp4');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'tiger-iron.mp4', { type: blob.type || 'video/mp4' });
      dispatch({ type: 'SET_FILE', payload: sampleFile });
      dispatch({ type: 'SET_RESULT', payload: null });
      dispatch({ type: 'SET_POSES', payload: null });
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err?.message || 'Failed to load sample video' });
    }
  }, []);

  const useAbergSample = useCallback(async () => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const res = await fetch('/fixtures/swings/ludvig_aberg_driver.mp4');
      if (!res.ok) throw new Error('Sample video not found. Please add it to public/fixtures/swings/ludvig_aberg_driver.mp4');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'ludvig_aberg_driver.mp4', { type: blob.type || 'video/mp4' });
      dispatch({ type: 'SET_FILE', payload: sampleFile });
      dispatch({ type: 'SET_RESULT', payload: null });
      dispatch({ type: 'SET_POSES', payload: null });
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err?.message || 'Failed to load sample video' });
    }
  }, []);

  const useHomaSample = useCallback(async () => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const res = await fetch('/fixtures/swings/max_homa_iron.mp4');
      if (!res.ok) throw new Error('Sample video not found. Please add it to public/fixtures/swings/max_homa_iron.mp4');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'max_homa_iron.mp4', { type: blob.type || 'video/mp4' });
      dispatch({ type: 'SET_FILE', payload: sampleFile });
      dispatch({ type: 'SET_RESULT', payload: null });
      dispatch({ type: 'SET_POSES', payload: null });
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err?.message || 'Failed to load sample video' });
    }
  }, []);

  const analyze = useCallback(async () => {
    const currentState = {
      file: state.file?.name,
      isAnalyzing: state.isAnalyzing,
      error: state.error,
      step: state.step
    };
    console.log('Analyze button clicked, current state:', currentState);
    
    if (!state.file) { 
      console.log('No file selected, showing error');
      dispatch({ type: 'SET_ERROR', payload: 'Please choose a video file first.' }); 
      return; 
    }
    reset();
    dispatch({ type: 'SET_ANALYZING', payload: true });
    
    // Add timeout protection
    const timeoutId = setTimeout(() => {
      dispatch({ type: 'SET_ERROR', payload: 'Analysis timed out. Please try a shorter video or check your internet connection.' });
      dispatch({ type: 'SET_ANALYZING', payload: false });
    }, 120000); // 2 minute timeout
    
    try {
      dispatch({ type: 'SET_STEP', payload: 'Initializing...' }); 
      dispatch({ type: 'SET_PROGRESS', payload: 5 });
      const startTime = performance.now();

      // Advanced cache hydration by content hash
      dispatch({ type: 'SET_STEP', payload: 'Checking cache...' });
      const contentHash = await hashVideoFile(state.file);
      const cacheKey = `${CacheSchema.appVersion}:${CacheSchema.schemaVersion}:${contentHash}`;

      const cachedPoses = await getCachedPoses<PoseResult[]>(cacheKey);
      const cachedAnalysis = await getCachedAnalysis<any>(cacheKey);
      if (cachedPoses && cachedAnalysis) {
        dispatch({ type: 'SET_STEP', payload: 'Loaded from cache' });
        dispatch({ type: 'SET_POSES', payload: cachedPoses });
        dispatch({ type: 'SET_RESULT', payload: cachedAnalysis });
        dispatch({ type: 'SET_STEP', payload: 'Generating AI analysis...' });
        dispatch({ type: 'SET_PROGRESS', payload: 80 });
        const aiFromCache = await lazyAIAnalyzer.analyze(cachedPoses, cachedAnalysis.trajectory, cachedAnalysis.phases, 'driver');
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
          poseCount: cachedPoses.length,
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
      
      const extracted = await extractPosesFromVideo(state.file, { sampleFps: 30, maxFrames: 600 }, (s, p) => { 
        dispatch({ type: 'SET_STEP', payload: s }); 
        dispatch({ type: 'SET_PROGRESS', payload: 10 + (p * 0.5) }); // 10-60%
      });
      
      if (extracted.length < 10) throw new Error('Could not detect enough pose frames. Try a clearer video with better lighting and ensure your full body is visible.');
      dispatch({ type: 'SET_POSES', payload: extracted });
      dispatch({ type: 'SET_STEP', payload: 'Saving poses to cache...' });
      await setCachedPoses(cacheKey, extracted);

      if (!workerPool) throw new Error('Worker pool not available');
      const club = 'driver';
      const swingId = `swing_${Date.now()}`;
      const source = 'upload' as const;

      // Use worker pool for better performance
      dispatch({ type: 'SET_STEP', payload: 'Analyzing swing mechanics...' });
      dispatch({ type: 'SET_PROGRESS', payload: 65 });
      const analysis = await workerPool.processMessage({ 
        type: 'ANALYZE_SWING', 
        data: { poses: extracted, club, swingId, source } 
      });
      dispatch({ type: 'SET_RESULT', payload: analysis });
      dispatch({ type: 'SET_STEP', payload: 'Saving analysis to cache...' });
      await setCachedAnalysis(cacheKey, analysis);
      
      // Generate AI analysis (lazy loaded)
      dispatch({ type: 'SET_STEP', payload: 'Generating AI analysis...' });
      dispatch({ type: 'SET_PROGRESS', payload: 80 });
      const aiResult = await lazyAIAnalyzer.analyze(extracted, analysis.trajectory, analysis.phases, club);
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
      clearTimeout(timeoutId);
    } catch (err: any) {
      console.error('Analysis error:', err);
      dispatch({ type: 'SET_ERROR', payload: err?.message || 'Failed to analyze video. Please try a different video or check your internet connection.' });
      clearTimeout(timeoutId);
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false });
    }
  }, [state.file, workerPool, videoUrl, reset, loadProgressHistory]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-900">
          📤 Upload Video
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Upload your golf swing videos for detailed analysis and personalized feedback.
        </p>
        
        <div className="bg-gray-50 rounded-2xl p-8 md:p-12 mb-12 text-left">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Upload Area</h2>
          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onFileChange} />
          {state.error && <ErrorAlert message={state.error} className="mb-4" />}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <button onClick={onChooseFile} className="w-full md:w-auto bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all shadow">
              📁 {state.file ? 'Change File' : 'Choose File'}
            </button>
            <button onClick={analyze} disabled={!state.file || state.isAnalyzing} className="w-full md:w-auto bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow">
              🔍 {state.isAnalyzing ? 'Analyzing...' : 'Analyze Video'}
            </button>
            <button onClick={useTigerSample} disabled={state.isAnalyzing} className="w-full md:w-auto bg-purple-600 disabled:bg-purple-300 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all shadow">
              🐯 Use Tiger Sample
            </button>
            <button onClick={useAbergSample} disabled={state.isAnalyzing} className="w-full md:w-auto bg-indigo-600 disabled:bg-indigo-300 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow">
              🇸🇪 Use Åberg Sample
            </button>
            <button onClick={useHomaSample} disabled={state.isAnalyzing} className="w-full md:w-auto bg-rose-600 disabled:bg-rose-300 text-white px-6 py-3 rounded-xl font-semibold hover:bg-rose-700 transition-all shadow">
              🇺🇸 Use Homa Sample
            </button>
            {state.file && (
              <span className="text-sm text-gray-600 truncate">Selected: {state.file.name}</span>
            )}
          </div>

          {(state.isAnalyzing || state.progress > 0) && (
            <div className="mt-6">
              <ProgressBar progress={state.progress} step={state.step} />
              {state.isAnalyzing && <LoadingSpinner className="mt-3" size="sm" text="Processing in background" />}
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
                className={`py-2 px-4 font-medium ${state.activeTab === 'video' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'video' })}
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
                className={`py-2 px-4 font-medium ${state.activeTab === 'progress' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'progress' })}
              >
                Progress Tracking
              </button>
            </div>

            {state.activeTab === 'video' && videoUrl && state.poses && (
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Your Swing with Pose Detection</h2>
                <PoseOverlay videoUrl={videoUrl} poseData={state.poses} className="mb-6" />
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">How to interpret this visualization:</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Green dots show your body's key positions throughout the swing</li>
                    <li>Blue lines connect related joints to show alignment</li>
                    <li>Look for smooth, connected movement without sudden jerks</li>
                  </ul>
                </div>
              </div>
            )}

            {state.activeTab === 'metrics' && (
              <div className="space-y-8">
                {state.aiAnalysis ? (
                  <>
                    {state.aiAnalysis.grade && (
                      <Suspense fallback={<LoadingSpinner size="md" text="Loading grade card..." />}>
                        <GolfGradeCard grade={state.aiAnalysis.grade} />
                      </Suspense>
                    )}
                    <SwingFeedback analysis={state.aiAnalysis} />
                    <Suspense fallback={<LoadingSpinner size="md" text="Loading drill recommendations..." />}>
                      <DrillRecommendations metrics={state.aiAnalysis.swingMetrics} />
                    </Suspense>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <LoadingSpinner size="lg" text="Generating AI analysis..." />
                  </div>
                )}
              </div>
            )}

            {state.activeTab === 'progress' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Progress</h2>
                  <p className="text-gray-600">Track your improvement over time</p>
                </div>

                {state.progressHistory.length > 0 ? (
                  <>
                    {/* Overall Progress */}
                    <div className="bg-white rounded-lg border p-6">
                      <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
                      <ProgressChart metric="overall" className="mb-6" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {state.progressHistory.length}
                          </div>
                          <div className="text-sm text-gray-600">Sessions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {ProgressTracker.getAverageScore().toFixed(0)}
                          </div>
                          <div className="text-sm text-gray-600">Average Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {ProgressTracker.getImprovementRate() > 0 ? '+' : ''}{ProgressTracker.getImprovementRate().toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">Improvement Rate</div>
                        </div>
                      </div>
                    </div>

                    {/* Individual Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <Suspense fallback={<div className="h-40 bg-gray-100 rounded animate-pulse" />}>
                        <ProgressChart metric="tempo" />
                      </Suspense>
                      <Suspense fallback={<div className="h-40 bg-gray-100 rounded animate-pulse" />}>
                        <ProgressChart metric="rotation" />
                      </Suspense>
                      <Suspense fallback={<div className="h-40 bg-gray-100 rounded animate-pulse" />}>
                        <ProgressChart metric="balance" />
                      </Suspense>
                      <Suspense fallback={<div className="h-40 bg-gray-100 rounded animate-pulse" />}>
                        <ProgressChart metric="plane" />
                      </Suspense>
                      <Suspense fallback={<div className="h-40 bg-gray-100 rounded animate-pulse" />}>
                        <ProgressChart metric="power" />
                      </Suspense>
                      <Suspense fallback={<div className="h-40 bg-gray-100 rounded animate-pulse" />}>
                        <ProgressChart metric="consistency" />
                      </Suspense>
                    </div>

                    {/* Recent Sessions */}
                    <div className="bg-white rounded-lg border p-6">
                      <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
                      <div className="space-y-3">
                        {state.progressHistory.slice(-5).reverse().map((session: ProgressEntry, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">
                                Session {state.progressHistory.length - index}
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(session.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {session.overallScore}/100
                              </div>
                              {session.grade && (
                                <div className="text-sm text-gray-600">
                                  Grade: {session.grade.overall.letter}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📈</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Progress Data Yet</h3>
                    <p className="text-gray-600 mb-6">
                      Complete your first swing analysis to start tracking your progress!
                    </p>
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'video' })}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Analyze Your Swing
                    </button>
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


