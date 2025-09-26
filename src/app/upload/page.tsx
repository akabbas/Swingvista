"use client";
import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { MediaPipePoseDetector } from '@/lib/mediapipe';
import { EnhancedPhaseDetector } from '@/lib/enhanced-phase-detector';
import { analyzeGolfSwingSimple } from '@/lib/simple-golf-analysis';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract poses from video frames
  const extractPosesFromVideo = async (video: HTMLVideoElement, detector: MediaPipePoseDetector) => {
    const poses: any[] = [];
    const frameRate = 30; // Target frame rate
    const frameInterval = 1000 / frameRate; // ms between frames
    
    console.log('🎬 Starting pose extraction...');
    
    // Set video to first frame
    video.currentTime = 0;
    await new Promise(resolve => {
      video.onseeked = resolve;
    });
    
    const totalFrames = Math.floor(video.duration * frameRate);
    console.log('📊 Total frames to process:', totalFrames);
    
    for (let i = 0; i < totalFrames; i++) {
      const currentTime = (i * frameInterval) / 1000;
      video.currentTime = currentTime;
      
      await new Promise(resolve => {
        video.onseeked = resolve;
      });
      
      try {
        const pose = await detector.detectPose(video);
        if (pose && pose.landmarks && pose.landmarks.length > 0) {
          poses.push({
            ...pose,
            timestamp: currentTime,
            frameIndex: i
          });
        }
      } catch (error) {
        console.warn('⚠️ Pose detection failed for frame', i, ':', error);
      }
      
      // Update progress every 10 frames
      if (i % 10 === 0) {
        console.log(`📈 Progress: ${Math.round((i / totalFrames) * 100)}% (${i}/${totalFrames} frames)`);
      }
    }
    
    console.log('✅ Pose extraction complete:', poses.length, 'poses extracted');
    return poses;
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('🎯 Starting real swing analysis for:', file.name);
      
      // Create video element for analysis
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.crossOrigin = 'anonymous';
      
      // Wait for video to load
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
        video.load();
      });
      
      console.log('📹 Video loaded, duration:', video.duration, 'seconds');
      
      // Initialize MediaPipe pose detector
      console.log('🤖 Initializing MediaPipe pose detector...');
      const detector = MediaPipePoseDetector.getInstance();
      await detector.initialize();
      console.log('✅ MediaPipe initialized successfully');
      
      // Initialize phase detector
      const phaseDetector = new EnhancedPhaseDetector();
      console.log('🔄 Phase detector initialized');
      
      // Extract poses from video
      console.log('🎬 Extracting poses from video...');
      const poses = await extractPosesFromVideo(video, detector);
      console.log('✅ Extracted', poses.length, 'poses');
      
      if (poses.length === 0) {
        throw new Error('No poses detected in video. Please ensure the video shows a clear view of a person performing a golf swing.');
      }
      
      // Analyze the swing
      console.log('⚡ Analyzing swing...');
      const analysis = await analyzeGolfSwingSimple(poses);
      console.log('✅ Analysis complete:', analysis);
      
      // Set result
      setResult({
        message: 'Swing analysis complete!',
        file: file.name,
        analysis: analysis,
        poseCount: poses.length,
        videoDuration: video.duration
      });
      
      // Clean up
      URL.revokeObjectURL(video.src);
      
    } catch (err) {
      console.error('❌ Analysis failed:', err);
      setError(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [file]);

  const handleReset = useCallback(() => {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Golf Swing Analysis
            </h1>
            <p className="text-gray-600">
              Upload a video of your golf swing for AI-powered analysis
            </p>
          </div>

          {!file && !result && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-lg font-medium text-gray-700">
                  Click to upload video
                </span>
                <span className="text-sm text-gray-500 mt-1">
                  MP4, MOV, AVI files supported
                </span>
              </label>
            </div>
          )}

          {file && (
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Selected File:</h3>
                <p className="text-sm text-gray-600">{file.name}</p>
                <p className="text-sm text-gray-500">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              
              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Swing'}
                </button>
                
                <button
                  onClick={handleReset}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-800">Analyzing your swing...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-800">{result.message}</span>
                </div>
              </div>
              
              {/* Analysis Results */}
              {result.analysis && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm font-medium text-gray-600">Poses Detected:</span>
                      <span className="ml-2 text-lg font-semibold text-gray-900">{result.poseCount}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm font-medium text-gray-600">Video Duration:</span>
                      <span className="ml-2 text-lg font-semibold text-gray-900">{result.videoDuration?.toFixed(1)}s</span>
                    </div>
                  </div>
                  
                  {/* Swing Metrics */}
                  {result.analysis.metrics && (
                    <div className="mb-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-2">Swing Metrics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {Object.entries(result.analysis.metrics).map(([key, value]) => (
                          <div key={key} className="bg-blue-50 p-3 rounded">
                            <span className="text-sm font-medium text-blue-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="ml-2 text-sm font-semibold text-blue-900">
                              {typeof value === 'number' ? value.toFixed(2) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Swing Phases */}
                  {result.analysis.phases && result.analysis.phases.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-2">Swing Phases Detected</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.analysis.phases.map((phase: any, index: number) => (
                          <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            {phase.phase} ({phase.startTime?.toFixed(1)}s - {phase.endTime?.toFixed(1)}s)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Overall Grade */}
                  {result.analysis.overallGrade && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-yellow-800 mb-2">Overall Swing Grade</h4>
                      <div className="text-2xl font-bold text-yellow-900">
                        {result.analysis.overallGrade}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
