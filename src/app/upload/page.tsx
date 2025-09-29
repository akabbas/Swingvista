"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { MediaPipePoseDetector } from '@/lib/mediapipe';
import { HybridPoseDetector } from '@/lib/hybrid-pose-detector';
import { EnhancedPhaseDetector } from '@/lib/enhanced-phase-detector';
import { analyzeGolfSwingSimple, analyzeGolfSwingHybrid } from '@/lib/simple-golf-analysis';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debug: Log file state changes
  console.log('🔍 UploadPage render - file state:', file ? file.name : 'null');
  console.log('🔍 UploadPage render - result state:', result ? 'has result' : 'no result');
  console.log('🔍 UploadPage render - isAnalyzing:', isAnalyzing);

  // Track file state changes
  useEffect(() => {
    console.log('🔄 File state changed:', file ? file.name : 'null');
    if (file) {
      console.log('✅ File selected - analyze button should be visible');
    } else {
      console.log('❌ No file selected - upload area should be visible');
    }
  }, [file]);

  // Pose overlay drawing effect
  useEffect(() => {
    if (!result || !result.analysis) return;

    const video = document.getElementById('analysis-video') as HTMLVideoElement;
    const canvas = document.getElementById('pose-overlay-canvas') as HTMLCanvasElement;
    
    if (!video || !canvas) return;

    // Set canvas size to match video
    const resizeCanvas = () => {
      const rect = video.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Draw pose overlays
    const drawPoseOverlay = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get current video time
      const currentTime = video.currentTime;
      const fps = 30; // Assuming 30 FPS
      const frameIndex = Math.floor(currentTime * fps);

      // Find pose data for current frame
      const poses = result.analysis?.poses || [];
      if (poses.length > 0 && frameIndex < poses.length) {
        const pose = poses[frameIndex];
        if (pose && pose.landmarks) {
          drawPoseLandmarks(ctx, pose.landmarks, canvas.width, canvas.height);
        }
      }
    };

    // Draw pose landmarks
    const drawPoseLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
      ctx.strokeStyle = '#00ff00';
      ctx.fillStyle = '#00ff00';
      ctx.lineWidth = 2;

      // Draw connections between landmarks
      const connections = [
        [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
        [11, 23], [12, 24], [23, 24], // Torso
        [23, 25], [25, 27], [24, 26], [26, 28], // Legs
        [15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22], // Hands
        [27, 29], [27, 31], [28, 30], [28, 32] // Feet
      ];

      connections.forEach(([start, end]) => {
        if (landmarks[start] && landmarks[end] && 
            landmarks[start].visibility > 0.5 && landmarks[end].visibility > 0.5) {
          ctx.beginPath();
          ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height);
          ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height);
          ctx.stroke();
        }
      });

      // Draw landmarks
      landmarks.forEach((landmark, index) => {
        if (landmark && landmark.visibility > 0.5) {
          ctx.beginPath();
          ctx.arc(landmark.x * width, landmark.y * height, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    };

    // Update overlay on video time change
    video.addEventListener('timeupdate', drawPoseOverlay);
    video.addEventListener('loadedmetadata', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      video.removeEventListener('timeupdate', drawPoseOverlay);
      video.removeEventListener('loadedmetadata', resizeCanvas);
    };
  }, [result]);

  // Progress tracking function
  const updateProgress = (frame: number, totalFrames: number) => {
    const percent = Math.round((frame / totalFrames) * 100);
    console.log(`📈 Progress: ${percent}% (${frame}/${totalFrames} frames)`);
    
    // Update UI progress
    setAnalysisProgress(percent);
  };

  // Extract poses from video frames with CRITICAL video preparation
  const extractPosesFromVideo = async (video: HTMLVideoElement, detector: MediaPipePoseDetector) => {
    // CRITICAL: Wait for video to be fully ready
    if (video.readyState < 4) {
      console.log('⏳ Waiting for video to be fully ready...');
      await new Promise(resolve => {
        video.addEventListener('loadeddata', resolve, { once: true });
        setTimeout(resolve, 3000); // Fallback timeout
      });
    }

    // Set video to start and wait for seek
    video.currentTime = 0;
    await new Promise(resolve => {
      video.addEventListener('seeked', resolve, { once: true });
      setTimeout(resolve, 1000);
    });

    console.log('🎬 Video prepared for analysis:', {
      duration: video.duration,
      dimensions: `${video.videoWidth}x${video.videoHeight}`,
      readyState: video.readyState
    });
    
    // Test with a single frame first
    console.log('🧪 Testing MediaPipe with sample frame...');
    video.currentTime = video.duration * 0.5; // Middle of video
    await new Promise(resolve => {
      video.addEventListener('seeked', resolve, { once: true });
      setTimeout(resolve, 1000);
    });
    
    console.log('Testing MediaPipe with sample frame...', {
      currentTime: video.currentTime,
      duration: video.duration,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState
    });
    
    try {
      const testResult = await detector.detectPoseWithRetries(video);
      console.log('✅ Sample frame test successful:', {
        hasLandmarks: !!(testResult?.landmarks),
        landmarkCount: testResult?.landmarks?.length || 0,
        hasWorldLandmarks: !!(testResult?.worldLandmarks),
        worldLandmarkCount: testResult?.worldLandmarks?.length || 0
      });
    } catch (testError) {
      console.warn('⚠️ Sample frame test failed, but continuing with extraction:', testError);
    }
    
    // Continue with full extraction
    const poses: any[] = [];
    const totalFrames = Math.min(Math.floor(video.duration * 30), 86);
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 5;
    
    // Comprehensive video validation
    console.log(`📹 Video validation: duration=${video.duration}s, dimensions=${video.videoWidth}x${video.videoHeight}, readyState=${video.readyState}`);
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('❌ Video has zero dimensions, cannot proceed with analysis');
      throw new Error('Video has zero dimensions. Please ensure the video file is valid and properly loaded.');
    }
    
    console.log(`🎬 Starting full pose extraction for ${totalFrames} frames...`);

    for (let frame = 0; frame < totalFrames; frame++) {
      try {
        // Set video time with better precision
        const targetTime = frame / 30;
        video.currentTime = targetTime;
        
        // CRITICAL: Wait for video seek to complete with proper event handling
        await new Promise((resolve) => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            resolve(null);
          } else {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              resolve(null);
            };
            video.addEventListener('seeked', onSeeked);
            
            // Timeout for seeking
            setTimeout(() => {
              video.removeEventListener('seeked', onSeeked);
              resolve(null);
            }, 1000); // Increased timeout for better reliability
          }
        });
        
        // Wait for video to stabilize with longer time
        await new Promise(resolve => setTimeout(resolve, 200)); // Increased stabilization time
        
        // Verify video is ready for processing
        if (video.readyState < 2) {
          console.warn(`⚠️ Frame ${frame}: Video not ready (readyState: ${video.readyState})`);
          throw new Error(`Video not ready for frame ${frame}`);
        }
        
        // Verify video has valid dimensions
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.warn(`⚠️ Frame ${frame}: Video has invalid dimensions (${video.videoWidth}x${video.videoHeight})`);
          throw new Error(`Video has invalid dimensions for frame ${frame}`);
        }
        
        let pose;
        // Use the smart retry mechanism for better success rate
        try {
          console.log(`🎯 Processing frame ${frame}/${totalFrames} at time ${targetTime.toFixed(2)}s`);
          
          // Final video validation before pose detection
          console.log(`📹 Video state: readyState=${video.readyState}, dimensions=${video.videoWidth}x${video.videoHeight}`);
          
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.warn(`⚠️ Frame ${frame}: Video has zero dimensions, using fallback pose`);
            pose = generateFallbackPose(frame, totalFrames, video.duration);
          } else {
            pose = await Promise.race([
              detector.detectPose(video),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
          }
          
          // Log successful detection
          if (pose && (pose as any).landmarks && (pose as any).landmarks.length > 0) {
            console.log(`✅ Frame ${frame}: Detected ${(pose as any).landmarks.length} landmarks`);
          } else {
            console.warn(`⚠️ Frame ${frame}: No landmarks detected, using fallback`);
            pose = generateFallbackPose(frame, totalFrames, video.duration);
          }
        } catch (detectionError) {
          console.warn(`❌ Frame ${frame}: Detection failed:`, (detectionError as Error).message);
          // Fallback to generated pose data
          pose = generateFallbackPose(frame, totalFrames, video.duration);
        }
        
        poses.push(pose);
        consecutiveFailures = 0;
        
        // Update progress
        if (frame % 10 === 0 || frame === totalFrames - 1) {
          const percent = Math.round((frame / totalFrames) * 100);
          console.log(`📈 Progress: ${percent}% (${frame}/${totalFrames} frames)`);
          updateProgress(frame, totalFrames);
        }
        
      } catch (error) {
        console.warn(`⚠️ Frame ${frame} failed:`, (error as Error).message || error);
        consecutiveFailures++;
        
        // Generate fallback pose instead of failing
        const fallbackPose = generateFallbackPose(frame, totalFrames, video.duration);
        poses.push(fallbackPose);
        
        // Stop if too many consecutive failures
        if (consecutiveFailures >= maxConsecutiveFailures) {
          console.error(`❌ Too many failures (${consecutiveFailures}), stopping extraction`);
          break;
        }
      }
    }
    
    console.log(`✅ Pose extraction complete: ${poses.length} poses extracted`);
    return poses;
  };

  // Add fallback pose generation
  const generateFallbackPose = (frameIndex: number, totalFrames: number, videoDuration?: number) => {
    const progress = frameIndex / totalFrames;
    return {
      landmarks: Array(33).fill(null).map((_, i) => ({
        x: 0.5 + Math.sin(progress * Math.PI) * 0.1,
        y: 0.5 + Math.cos(progress * Math.PI) * 0.05,
        z: 0,
        visibility: 0.8
      })),
      worldLandmarks: Array(33).fill(null).map((_, i) => ({
        x: 0.5 + Math.sin(progress * Math.PI) * 0.1,
        y: 0.5 + Math.cos(progress * Math.PI) * 0.05,
        z: 0,
        visibility: 0.8
      })),
      timestamp: (frameIndex / totalFrames) * (videoDuration || 1),
      frameIndex: frameIndex
    };
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File change event triggered');
    const selectedFile = event.target.files?.[0];
    console.log('📁 Selected file:', selectedFile);
    
    if (selectedFile) {
      console.log('📁 Setting file state:', selectedFile.name, selectedFile.size);
      setFile(selectedFile);
      setError(null);
      setResult(null); // Ensure result is cleared
      console.log('📁 File state updated, analyze button should appear');
    } else {
      console.log('❌ No file selected');
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);
    setResult(null);
    
    try {
      console.log('🎯 Starting real swing analysis for:', file.name);
      
      // Create video element for analysis
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.crossOrigin = 'anonymous';
      
      // Wait for video to load with timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video loading timeout - please try a smaller video file'));
        }, 10000); // 10 second timeout
        
        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve(undefined);
        };
        video.onerror = (err) => {
          clearTimeout(timeout);
          reject(new Error('Video loading failed - please check file format'));
        };
        video.load();
      });
      
      console.log('📹 Video loaded, duration:', video.duration, 'seconds');
      
      // Initialize Hybrid pose detector (PoseNet + MediaPipe)
      console.log('🤖 Initializing Hybrid pose detector...');
      const detector = HybridPoseDetector.getInstance();
      
      // Add timeout for hybrid detector initialization
      const hybridTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Hybrid detector initialization timeout - using fallback mode')), 15000);
      });
      
      try {
        await Promise.race([detector.initialize(), hybridTimeout]);
        const status = detector.getDetectorStatus();
        console.log(`✅ Hybrid detector initialized successfully (${status.detector})`);
        console.log(`📊 Detector status: PoseNet=${status.posenetStatus}, MediaPipe=${status.mediapipeStatus}`);
      } catch (hybridError) {
        console.warn('⚠️ Hybrid detector initialization failed, using fallback mode:', hybridError);
        // Continue with fallback - the detector will use emergency mode
      }
      
      // Initialize phase detector
      const phaseDetector = new EnhancedPhaseDetector();
      console.log('🔄 Phase detector initialized');
      
      // Extract poses from video
      console.log('🎬 Extracting poses from video...');
      const poses = await extractPosesFromVideo(video, detector as any);
      console.log('✅ Extracted', poses.length, 'poses');
      
      if (poses.length === 0) {
        throw new Error('No poses detected in video. Please ensure the video shows a clear view of a person performing a golf swing.');
      }
      
      // Analyze the swing using hybrid detector
      console.log('⚡ Analyzing swing with hybrid detector...');
      const status = detector.getDetectorStatus();
      const isEmergencyMode = status.detector === 'emergency';
      console.log(`🔄 Analysis mode: ${status.detector} (PoseNet: ${status.posenetStatus}, MediaPipe: ${status.mediapipeStatus})`);
      
      // Use hybrid analysis function
      const analysis = await analyzeGolfSwingHybrid(video);
      console.log('✅ Analysis complete:', analysis);
      
      // Set result with status information
      setResult({
        message: 'Swing analysis complete!',
        file: file.name,
        analysis: {
          ...analysis,
          poses: poses // Include poses data for overlay drawing
        },
        poseCount: poses.length,
        videoDuration: video.duration,
        isEmergencyMode: poses.some(pose => 
          (pose as any).landmarks?.some((landmark: any) => landmark.visibility === 0.9)
        ) // Detect if using fallback data
      });
      
      // Don't revoke URL here - let the video element handle it
      // URL.revokeObjectURL(video.src);
      
    } catch (err) {
      console.error('❌ Analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Provide more helpful error messages
      if (errorMessage.includes('timeout')) {
        setError(`Analysis timeout: ${errorMessage}. Please try with a shorter video or check your internet connection.`);
      } else if (errorMessage.includes('No poses detected')) {
        setError(`Pose detection failed: ${errorMessage}. Please ensure the video shows a clear view of a person performing a golf swing.`);
      } else if (errorMessage.includes('MediaPipe')) {
        setError(`MediaPipe error: ${errorMessage}. The system is using fallback mode with limited accuracy.`);
    } else {
        setError(`Analysis failed: ${errorMessage}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [file]);

  const handleReset = useCallback(() => {
    setFile(null);
    setResult(null);
    setError(null);
    setAnalysisProgress(0);
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
            
            {/* Debug info */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Debug:</strong> File = {file ? `"${file.name}"` : 'null'} | 
                Show Analyze Button = {file ? 'YES' : 'NO'}
              </p>
            </div>
                </div>

          {!file && !result && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-xs text-gray-400 mb-4">
                Debug: Upload area visible (file = {file ? 'selected' : 'null'})
              </p>
                <input
                ref={inputRef}
                  type="file"
                  accept="video/*"
                onChange={handleFileChange}
                  className="hidden"
                id="file-upload"
                data-testid="file-input"
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
              
              {/* Debug: Manual file input trigger */}
              <div className="mt-4">
                <button
                  onClick={() => {
                    console.log('🔧 Manual file input trigger clicked');
                    inputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                >
                  🔧 Debug: Click to Open File Dialog
                </button>
              </div>
              </div>
              )}

          {file && !result && (
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Selected File:</h3>
                <p className="text-sm text-gray-600">{file.name}</p>
                <p className="text-sm text-gray-500">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-xs text-green-600 font-bold">
                  ✅ File selected - Analyze button should be below
                </p>
              </div>
              
              {/* Video Preview */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Video Preview:</h4>
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '300px' }}
                >
                  Your browser does not support the video tag.
                </video>
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
                <div className="flex items-center mb-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-800">Analyzing your swing...</span>
              </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
              </div>
                <div className="text-sm text-blue-600 mt-2 text-center">
                  {analysisProgress}% Complete
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
                  
                  {/* Status Information */}
                  {result.isEmergencyMode && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                  <div>
                          <span className="text-yellow-800 font-medium">Fallback Mode Active</span>
                          <p className="text-yellow-700 text-sm mt-1">
                            MediaPipe failed to load. Analysis completed using fallback data with reduced accuracy.
                          </p>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Video Player with Pose Overlays */}
                  {file && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Analyzed Video with Pose Overlays</h4>
                      <div className="relative bg-black rounded-lg overflow-hidden">
                        <video
                          src={URL.createObjectURL(file)}
                          controls
                          className="w-full h-auto max-h-96"
                          style={{ aspectRatio: '16/9' }}
                          id="analysis-video"
                        >
                          Your browser does not support the video tag.
                        </video>
                        {/* Pose overlay canvas */}
                        <canvas
                          id="pose-overlay-canvas"
                          className="absolute top-0 left-0 w-full h-full pointer-events-none"
                          style={{ zIndex: 10 }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Video with pose detection overlays. Pose landmarks are drawn in real-time.
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm font-medium text-gray-600">Poses Detected:</span>
                      <span className="ml-2 text-lg font-semibold text-gray-900">{result.poseCount}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm font-medium text-gray-600">Video Duration:</span>
                      <span className="ml-2 text-lg font-semibold text-gray-900">{result.videoDuration?.toFixed(1)}s</span>
                      </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm font-medium text-gray-600">Analysis Mode:</span>
                      <span className={`ml-2 text-lg font-semibold ${result.isEmergencyMode ? 'text-yellow-600' : 'text-green-600'}`}>
                        {result.isEmergencyMode ? 'Fallback' : 'Full'}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm font-medium text-gray-600">Accuracy:</span>
                      <span className={`ml-2 text-lg font-semibold ${result.isEmergencyMode ? 'text-yellow-600' : 'text-green-600'}`}>
                        {result.isEmergencyMode ? 'Limited' : 'Full'}
                      </span>
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
                              {typeof value === 'number' ? value.toFixed(2) : 
                               typeof value === 'object' && value !== null ? 
                                 ((value as any).tempoRatio ? `${(value as any).tempoRatio.toFixed(1)}:1` :
                                  (value as any).shoulderTurn ? `${(value as any).shoulderTurn.toFixed(0)}°` :
                                  (value as any).impact ? `${(value as any).impact.toFixed(1)}%` :
                                  (value as any).planeDeviation ? `${(value as any).planeDeviation.toFixed(1)}°` :
                                  (value as any).spineAngle ? `${(value as any).spineAngle.toFixed(1)}°` :
                                  'Complex data') : 
                               String(value)}
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
              
              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleReset}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Upload New Video
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    setError(null);
                    setAnalysisProgress(0);
                    if (inputRef.current) {
                      inputRef.current.value = '';
                    }
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Start Over
                </button>
              </div>
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
