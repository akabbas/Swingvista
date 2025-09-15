'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { UnifiedSwingData } from '@/lib/unified-analysis';
import { saveSwing } from '@/lib/supabase';

// Using UnifiedSwingData from unified-analysis.ts

export default function UploadPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<UnifiedSwingData | null>(null);
  const [selectedClub, setSelectedClub] = useState('driver');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ step: '', progress: 0 });
  const [showLandmarks, setShowLandmarks] = useState(false);

  const clubs = ['driver', 'iron', 'wedge', 'putter'];

  // Helper function to get grade colors
  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const supportedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
    if (!supportedTypes.includes(file.type)) {
      setError('Please select a supported video file (MP4, WebM, OGG, AVI, MOV)');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setAnalysisResult(null);
    setShowLandmarks(false);
    
    try {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        };
        videoRef.current.onerror = () => {
          setError('Failed to load video. Please try a different file.');
        };
      }
    } catch (error) {
      setError('Failed to process video file. Please try again.');
      console.error('File processing error:', error);
    }
  };

  const analyzeVideo = async () => {
    if (!selectedFile) {
      setError('Please select a video file first');
      return;
    }

    if (!selectedClub) {
      setError('Please select a club type');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setProgress({ step: 'Initializing analysis...', progress: 0 });

    let worker: Worker | null = null;

    try {
      // Process video to extract poses
      setProgress({ step: 'Processing video frames...', progress: 10 });
      const poses = await processVideoToPoses(selectedFile);
      
      if (poses.length === 0) {
        throw new Error('No pose landmarks detected in video. Please ensure the video shows a clear view of a person performing a golf swing.');
      }

      if (poses.length < 10) {
        throw new Error('Insufficient pose data detected. Please ensure the video is at least 1 second long and shows a complete golf swing.');
      }

      // Create unified analysis worker
      worker = new Worker(new URL('../../workers/unified-analysis.worker.ts', import.meta.url));
      
      // Set up worker message handling
      worker.onmessage = (e) => {
        const { type, data } = e.data;
        
        if (type === 'PROGRESS') {
          setProgress(data);
        } else if (type === 'SWING_ANALYZED') {
          setAnalysisResult(data);
          setVideoUrl(videoUrl);
          setShowLandmarks(true);
          setIsAnalyzing(false);
          
          // Save to Supabase
          saveSwingToDatabase(data);
          
          if (worker) worker.terminate();
        } else if (type === 'ERROR') {
          setError(data.error || 'Analysis failed. Please try again.');
          setIsAnalyzing(false);
          if (worker) worker.terminate();
        }
      };

      worker.onerror = (error) => {
        console.error('Worker error:', error);
        setError('Analysis worker failed. Please try again.');
        setIsAnalyzing(false);
        if (worker) worker.terminate();
      };

      // Start unified analysis
      worker.postMessage({
        type: 'ANALYZE_SWING',
        data: {
          poses: poses,
          club: selectedClub,
          swingId: `upload_${Date.now()}`,
          source: 'upload' as const,
          videoUrl: videoUrl
        }
      });

      // Set timeout for analysis (5 minutes max)
      setTimeout(() => {
        if (worker) {
          worker.terminate();
          setError('Analysis timed out. Please try with a shorter video.');
          setIsAnalyzing(false);
        }
      }, 5 * 60 * 1000);
      
    } catch (error) {
      console.error('Error analyzing video:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start analysis. Please try again.';
      setError(errorMessage);
      setIsAnalyzing(false);
      if (worker) worker.terminate();
    }
  };

  // Process video to extract poses
  const processVideoToPoses = async (videoFile: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const videoUrl = URL.createObjectURL(videoFile);
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      
      const poses: any[] = [];
      let frameCount = 0;
      let poseDetector: any = null;
      
      video.onloadedmetadata = async () => {
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Dynamically import MediaPipe
          const { MediaPipePoseDetector } = await import('@/lib/mediapipe');
          poseDetector = new MediaPipePoseDetector({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
          
          await poseDetector.initialize();
          
          const processFrame = async () => {
            if (video.ended || video.paused) {
              if (poseDetector) {
                poseDetector.destroy();
              }
              URL.revokeObjectURL(videoUrl);
              resolve(poses);
              return;
            }
            
            try {
              // Ensure video is playing
              if (video.paused) {
                await video.play();
              }
              
              // Detect pose in current frame
              const result = await poseDetector.detectPose(video);
              if (result) {
                poses.push({
                  ...result,
                  timestamp: video.currentTime * 1000,
                  frame: frameCount
                });
              }
              
              frameCount++;
              
              // Move to next frame (every 100ms for 10fps analysis)
              video.currentTime += 0.1;
              
              // Continue processing
              setTimeout(processFrame, 10);
            } catch (error) {
              console.warn('Pose detection failed for frame:', error);
              frameCount++;
              video.currentTime += 0.1;
              setTimeout(processFrame, 10);
            }
          };
          
          // Start processing
          video.currentTime = 0;
          await video.play();
          processFrame();
        } catch (error) {
          console.error('Error initializing pose detection:', error);
          reject(error);
        }
      };
      
      video.onerror = (error) => {
        console.error('Video loading error:', error);
        URL.revokeObjectURL(videoUrl);
        reject(new Error('Failed to load video'));
      };
      
      video.oncanplay = () => {
        // Video is ready to play
      };
    });
  };

  // Save swing to database
  const saveSwingToDatabase = async (swingData: UnifiedSwingData) => {
    try {
      const result = await saveSwing(swingData);
      if (result.success) {
        console.log('Swing saved to database successfully');
      } else {
        console.error('Failed to save swing to database:', result.error);
      }
    } catch (error) {
      console.error('Error saving swing to database:', error);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const seekTime = parseFloat(event.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Draw landmarks on video
  const drawLandmarks = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || !analysisResult || !showLandmarks) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find current frame based on video time
    const currentTime = video.currentTime * 1000; // Convert to milliseconds
    const frameIndex = Math.floor((currentTime / (video.duration * 1000)) * analysisResult.frameCount);
    
    if (frameIndex >= 0 && frameIndex < analysisResult.trajectory.rightWrist.length) {
      const rightWrist = analysisResult.trajectory.rightWrist[frameIndex];
      const leftWrist = analysisResult.trajectory.leftWrist[frameIndex];
      const rightShoulder = analysisResult.trajectory.rightShoulder[frameIndex];
      const leftShoulder = analysisResult.trajectory.leftShoulder[frameIndex];
      const rightHip = analysisResult.trajectory.rightHip[frameIndex];
      const leftHip = analysisResult.trajectory.leftHip[frameIndex];
      const clubhead = analysisResult.trajectory.clubhead[frameIndex];

      // Draw landmarks
      const landmarks = [
        { point: rightWrist, color: '#FF6B6B', label: 'RW' },
        { point: leftWrist, color: '#4ECDC4', label: 'LW' },
        { point: rightShoulder, color: '#45B7D1', label: 'RS' },
        { point: leftShoulder, color: '#96CEB4', label: 'LS' },
        { point: rightHip, color: '#FFEAA7', label: 'RH' },
        { point: leftHip, color: '#DDA0DD', label: 'LH' },
        { point: clubhead, color: '#FF8C00', label: 'CH' }
      ];

      landmarks.forEach(({ point, color, label }) => {
        if (point) {
          const x = point.x * canvas.width;
          const y = point.y * canvas.height;

          // Draw circle
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw label
          ctx.fillStyle = '#000000';
          ctx.font = '12px Arial';
          ctx.fillText(label, x + 12, y - 8);
        }
      });
    }
  }, [analysisResult, showLandmarks]);

  // Update landmarks when video time changes
  useEffect(() => {
    if (videoRef.current && analysisResult) {
      const video = videoRef.current;
      const handleTimeUpdate = () => {
        drawLandmarks();
      };
      
      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [drawLandmarks, analysisResult]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link 
              href="/" 
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Upload Video Analysis</h1>
          <p className="text-gray-600 text-lg">Upload a recorded swing video for detailed analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {!videoUrl ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-gray-400 transition-colors">
                  <div className="space-y-6">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Video</h3>
                      <p className="text-gray-500 mb-4">Choose a video file to analyze your golf swing</p>
                      <p className="text-sm text-gray-400">Supported formats: MP4, MOV, AVI (Max 100MB)</p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Select Video File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-auto"
                      controls
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      style={{ zIndex: 10 }}
                    />
                  </div>
                  
                  {/* Video Controls */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={togglePlayPause}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {isPlaying ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                          )}
                        </svg>
                        {isPlaying ? 'Pause' : 'Play'}
                      </button>
                      <span className="text-sm text-gray-600">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      step="0.1"
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls and Results */}
          <div className="space-y-6">
            {/* Club Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Club
              </label>
              <select
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isAnalyzing}
              >
                {clubs.map((club) => (
                  <option key={club} value={club}>
                    {club.charAt(0).toUpperCase() + club.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Analysis Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis</h3>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              {selectedFile && !isAnalyzing && (
                <button
                  onClick={analyzeVideo}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Analyze Video
                </button>
              )}

              {/* Demo button for testing without file upload */}
              {!selectedFile && !isAnalyzing && (
                <button
                  onClick={() => {
                    // Create a mock file for demo purposes
                    const mockFile = new File([''], 'demo-video.mp4', { type: 'video/mp4' });
                    setSelectedFile(mockFile);
                    setVideoUrl('data:video/mp4;base64,');
                    setDuration(10);
                    setError(null);
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center mb-3"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                  Try Demo Analysis (No File Required)
                </button>
              )}
              
              {isAnalyzing && (
                <div className="w-full bg-blue-100 text-blue-800 py-3 px-4 rounded-lg text-center font-medium">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Video...
                  </div>
                  <div className="text-sm">
                    <div className="mb-1">{progress.step}</div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs">{progress.progress}%</div>
                  </div>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Show Landmarks:</span>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showLandmarks}
                        onChange={(e) => setShowLandmarks(e.target.checked)}
                        className="rounded"
                      />
                      <span className="ml-2 text-sm">Overlay pose landmarks</span>
                    </label>
                  </div>
                  <div className="text-xs text-gray-500">
                    Processed {analysisResult.frameCount} frames in {analysisResult.processingTime}ms
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
                <div className="space-y-4">
                  {/* VistaSwing AI Report Card */}
                  {analysisResult.aiFeedback.reportCard && (
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">VistaSwing AI Report Card</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Setup */}
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-700">Setup</span>
                            <span className={`text-2xl font-bold ${getGradeColor(analysisResult.aiFeedback.reportCard.setup.grade)}`}>
                              {analysisResult.aiFeedback.reportCard.setup.grade}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{analysisResult.aiFeedback.reportCard.setup.tip}</p>
                        </div>

                        {/* Grip */}
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-700">Grip</span>
                            <span className={`text-2xl font-bold ${getGradeColor(analysisResult.aiFeedback.reportCard.grip.grade)}`}>
                              {analysisResult.aiFeedback.reportCard.grip.grade}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{analysisResult.aiFeedback.reportCard.grip.tip}</p>
                        </div>

                        {/* Alignment */}
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-700">Alignment</span>
                            <span className={`text-2xl font-bold ${getGradeColor(analysisResult.aiFeedback.reportCard.alignment.grade)}`}>
                              {analysisResult.aiFeedback.reportCard.alignment.grade}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{analysisResult.aiFeedback.reportCard.alignment.tip}</p>
                        </div>

                        {/* Rotation */}
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-700">Rotation</span>
                            <span className={`text-2xl font-bold ${getGradeColor(analysisResult.aiFeedback.reportCard.rotation.grade)}`}>
                              {analysisResult.aiFeedback.reportCard.rotation.grade}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{analysisResult.aiFeedback.reportCard.rotation.tip}</p>
                        </div>

                        {/* Impact */}
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-700">Impact</span>
                            <span className={`text-2xl font-bold ${getGradeColor(analysisResult.aiFeedback.reportCard.impact.grade)}`}>
                              {analysisResult.aiFeedback.reportCard.impact.grade}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{analysisResult.aiFeedback.reportCard.impact.tip}</p>
                        </div>

                        {/* Follow Through */}
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-700">Follow Through</span>
                            <span className={`text-2xl font-bold ${getGradeColor(analysisResult.aiFeedback.reportCard.followThrough.grade)}`}>
                              {analysisResult.aiFeedback.reportCard.followThrough.grade}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{analysisResult.aiFeedback.reportCard.followThrough.tip}</p>
                        </div>
                      </div>

                      {/* Overall Score */}
                      <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg border border-green-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-gray-900">Overall Score</span>
                          <span className={`text-4xl font-bold ${getGradeColor(analysisResult.aiFeedback.reportCard.overall.score)}`}>
                            {analysisResult.aiFeedback.reportCard.overall.score}
                          </span>
                        </div>
                        <p className="text-gray-700 font-medium">{analysisResult.aiFeedback.reportCard.overall.tip}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Technical Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Swing Plane:</span>
                        <span className="font-medium">{analysisResult.metrics.swingPlaneAngle.toFixed(1)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tempo Ratio:</span>
                        <span className="font-medium">{analysisResult.metrics.tempoRatio.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hip Rotation:</span>
                        <span className="font-medium">{analysisResult.metrics.hipRotation.toFixed(1)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shoulder Rotation:</span>
                        <span className="font-medium">{analysisResult.metrics.shoulderRotation.toFixed(1)}°</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Technical Feedback</h4>
                    <div className="space-y-2">
                      {analysisResult.aiFeedback.feedback.map((feedback, index) => (
                        <div
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md text-sm font-medium"
                        >
                          {feedback}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <Link
                      href="/compare"
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium text-center block"
                    >
                      Compare with Other Swings
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}