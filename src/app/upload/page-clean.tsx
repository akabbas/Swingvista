"use client";

import React, { useReducer, useRef, useCallback, useMemo, useEffect } from 'react';
import { Upload, Play, Pause, RotateCcw } from 'lucide-react';
import CleanVideoAnalysisDisplay from '@/components/analysis/CleanVideoAnalysisDisplay';
import { analyzeGolfSwing } from '@/lib/unified-analysis';
import { extractPosesFromVideo } from '@/lib/video-poses';
import type { PoseResult } from '@/lib/mediapipe';

// State management
interface UploadState {
  file: File | null;
  isAnalyzing: boolean;
  poses: PoseResult[] | null;
  result: any | null;
  error: string | null;
  step: string;
  progress: number;
  videoUrl: string | null;
}

type UploadAction = 
  | { type: 'SET_FILE'; payload: File | null }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_POSES'; payload: PoseResult[] | null }
  | { type: 'SET_RESULT'; payload: any | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STEP'; payload: string }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_VIDEO_URL'; payload: string | null }
  | { type: 'RESET' };

const initialState: UploadState = {
  file: null,
  isAnalyzing: false,
  poses: null,
  result: null,
  error: null,
  step: '',
  progress: 0,
  videoUrl: null
};

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, file: action.payload };
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    case 'SET_POSES':
      return { ...state, poses: action.payload };
    case 'SET_RESULT':
      return { ...state, result: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_VIDEO_URL':
      return { ...state, videoUrl: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Clean, concise grade display component
const GradeDisplay = ({ analysis }: { analysis: any }) => {
  if (!analysis) return null;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': case 'A': return 'text-green-600 bg-green-50';
      case 'B+': case 'B': return 'text-blue-600 bg-blue-50';
      case 'C+': case 'C': return 'text-yellow-600 bg-yellow-50';
      case 'D+': case 'D': return 'text-orange-600 bg-orange-50';
      case 'F': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Swing Analysis Results</h2>
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-800">
              {analysis.overallScore || analysis.metrics?.overallScore || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">Overall Score</div>
          </div>
          <div className="text-center">
            <div className={`text-6xl font-bold px-4 py-2 rounded-lg ${getGradeColor(analysis.letterGrade || analysis.metrics?.letterGrade || 'N/A')}`}>
              {analysis.letterGrade || analysis.metrics?.letterGrade || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">Grade</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {analysis.tempo && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{analysis.tempo.score || 'N/A'}</div>
            <div className="text-sm text-gray-600">Tempo Score</div>
            <div className="text-xs text-gray-500 mt-1">
              Ratio: {analysis.tempo.tempoRatio?.toFixed(1) || 'N/A'}
            </div>
          </div>
        )}
        
        {analysis.rotation && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{analysis.rotation.score || 'N/A'}</div>
            <div className="text-sm text-gray-600">Rotation Score</div>
            <div className="text-xs text-gray-500 mt-1">
              {analysis.rotation.shoulderTurn?.toFixed(1) || 'N/A'}° Shoulder Turn
            </div>
          </div>
        )}
        
        {analysis.balance && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{analysis.balance.score || 'N/A'}</div>
            <div className="text-sm text-gray-600">Balance Score</div>
            <div className="text-xs text-gray-500 mt-1">
              {analysis.balance.weightTransfer || 'N/A'}% Weight Transfer
            </div>
          </div>
        )}
      </div>

      {/* Key Feedback */}
      {analysis.feedback && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Key Insights</h4>
          <p className="text-blue-700 text-sm leading-relaxed">{analysis.feedback}</p>
        </div>
      )}
    </div>
  );
};

// Progress bar component
const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div 
      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  </div>
);

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center mt-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

export default function CleanUploadPage() {
  const [state, dispatch] = useReducer(uploadReducer, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create video URL from file
  const videoUrl = useMemo(() => {
    if (!state.file) return null;
    try {
      return URL.createObjectURL(state.file);
    } catch (error) {
      console.error('Failed to create video URL:', error);
      return null;
    }
  }, [state.file]);

  // Update video URL in state
  useEffect(() => {
    dispatch({ type: 'SET_VIDEO_URL', payload: videoUrl });
  }, [videoUrl]);

  // Reset function
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // File change handler
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    console.log('🏌️ UPLOAD: File selected:', file?.name, 'Type:', file?.type, 'Size:', file?.size);
    
    // Validate file
    if (file) {
      if (!file.type.startsWith('video/')) {
        dispatch({ type: 'SET_ERROR', payload: 'Please select a valid video file.' });
        return;
      }
      
      if (file.size > 100 * 1024 * 1024) {
        dispatch({ type: 'SET_ERROR', payload: 'Video file is too large. Please select a file smaller than 100MB.' });
        return;
      }
    }
    
    dispatch({ type: 'SET_FILE', payload: file });
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Analysis handler
  const analyzeVideo = useCallback(async () => {
    if (!state.file) return;

    dispatch({ type: 'SET_ANALYZING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_STEP', payload: 'Starting analysis...' });
    dispatch({ type: 'SET_PROGRESS', payload: 0 });

    try {
      // Step 1: Extract poses
      dispatch({ type: 'SET_STEP', payload: 'Extracting poses from video...' });
      dispatch({ type: 'SET_PROGRESS', payload: 20 });
      
      const extracted = await extractPosesFromVideo(state.file, {
        sampleFps: 30,
        maxFrames: 1000,
        minConfidence: 0.3,
        qualityThreshold: 0.2
      }, (progress) => {
        dispatch({ type: 'SET_STEP', payload: progress.step });
        dispatch({ type: 'SET_PROGRESS', payload: 20 + (progress.progress * 0.3) });
      });
      
      console.log('🏌️ UPLOAD ANALYSIS: Extracted poses:', extracted.length);
      console.log('🏌️ UPLOAD ANALYSIS: First pose sample:', extracted[0]);
      dispatch({ type: 'SET_POSES', payload: extracted });

      // Step 2: Analyze golf swing
      dispatch({ type: 'SET_STEP', payload: 'Analyzing golf swing...' });
      dispatch({ type: 'SET_PROGRESS', payload: 60 });
      
      const analysis = await analyzeGolfSwing(state.file, (step, progress) => {
        dispatch({ type: 'SET_STEP', payload: step });
        dispatch({ type: 'SET_PROGRESS', payload: 60 + (progress * 0.3) });
      });

      console.log('🏌️ UPLOAD ANALYSIS: Analysis complete:', analysis);
      dispatch({ type: 'SET_RESULT', payload: analysis });
      dispatch({ type: 'SET_PROGRESS', payload: 100 });
      dispatch({ type: 'SET_STEP', payload: 'Analysis complete!' });

    } catch (error) {
      console.error('❌ UPLOAD ANALYSIS ERROR:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Analysis failed' });
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false });
    }
  }, [state.file]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Golf Swing Analysis</h1>
          <p className="text-lg text-gray-600">Upload your golf swing video for professional analysis</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <div className="mb-6">
              <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Upload Your Swing Video</h2>
              <p className="text-gray-600">Select a video file to analyze your golf swing</p>
            </div>

            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={onFileChange}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <Upload className="mr-2 h-5 w-5" />
                Choose Video File
              </label>
              
              {state.file && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Selected:</strong> {state.file.name} ({(state.file.size / 1024 / 1024).toFixed(1)} MB)
                  </p>
                </div>
              )}

              {state.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{state.error}</p>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                {state.file && !state.isAnalyzing && (
                  <button
                    onClick={analyzeVideo}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Analyze Swing
                  </button>
                )}
                
                {state.file && (
                  <button
                    onClick={reset}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        {state.isAnalyzing && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Analysis Progress</h3>
            <ProgressBar progress={state.progress} />
            <p className="text-gray-600 mt-2">{state.step}</p>
            <LoadingSpinner />
          </div>
        )}

        {/* Video Analysis Display - Only show after analysis is complete */}
        {state.file && videoUrl && state.result && !state.isAnalyzing && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Video Analysis with Overlays</h2>
            <p className="text-gray-600 mb-4">Your analyzed golf swing with pose detection overlays</p>
            <CleanVideoAnalysisDisplay
              videoFile={state.file}
              videoUrl={videoUrl}
              analysis={state.result?.realAnalysis || state.result}
              isAnalyzing={false}
              poses={state.poses || undefined}
            />
          </div>
        )}

        {/* Clean Results Display */}
        {state.result && (
          <GradeDisplay analysis={state.result.realAnalysis || state.result} />
        )}
      </div>
    </div>
  );
}
