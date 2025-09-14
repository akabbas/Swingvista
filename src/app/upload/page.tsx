'use client';

import { useState, useRef, useCallback } from 'react';
import { MediaPipePoseDetector, PoseLandmark } from '@/lib/mediapipe';
import { SwingMetrics } from '@/workers/analysis.worker';

export default function UploadPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SwingMetrics | null>(null);
  const [poseDetector, setPoseDetector] = useState<MediaPipePoseDetector | null>(null);
  const [selectedClub, setSelectedClub] = useState('driver');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const clubs = ['driver', 'iron', 'wedge', 'putter'];

  const initializePoseDetector = async () => {
    if (!poseDetector) {
      const detector = new MediaPipePoseDetector();
      await detector.initialize();
      setPoseDetector(detector);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setAnalysisResult(null);
    
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          setTotalFrames(Math.floor(videoRef.current.duration * 30)); // Assuming 30fps
        }
      };
    }

    await initializePoseDetector();
  };

  const drawSkeleton = useCallback((landmarks: PoseLandmark[], canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const connections = poseDetector?.getPoseConnections() || [];
    
    // Draw connections
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    
    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      
      if (start && end && start.visibility && end.visibility && 
          start.visibility > 0.5 && end.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
        ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
        ctx.stroke();
      }
    });
    
    // Draw landmarks
    ctx.fillStyle = '#ff0000';
    landmarks.forEach((landmark) => {
      if (landmark.visibility && landmark.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  }, [poseDetector]);

  const analyzeVideo = async () => {
    if (!selectedFile || !poseDetector || !videoRef.current) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const landmarks: PoseLandmark[][] = [];
      const timestamps: number[] = [];
      
      // Extract frames at 30fps
      const video = videoRef.current;
      const frameRate = 30;
      const duration = video.duration;
      const totalFrames = Math.floor(duration * frameRate);
      
      for (let i = 0; i < totalFrames; i++) {
        const time = (i / frameRate);
        video.currentTime = time;
        
        await new Promise(resolve => {
          video.onseeked = resolve;
        });
        
        const result = await poseDetector.detectPose(video);
        if (result && result.landmarks) {
          landmarks.push(result.landmarks);
          timestamps.push(time * 1000);
        }
      }

      // Analyze with Web Worker
      const worker = new Worker(new URL('@/workers/analysis.worker.ts', import.meta.url));
      
      worker.postMessage({
        type: 'ANALYZE_SWING',
        data: {
          landmarks,
          timestamps,
          club: selectedClub,
          swingId: `upload_${Date.now()}`
        }
      });
      
      worker.onmessage = (e) => {
        const { type, data } = e.data;
        
        if (type === 'SWING_ANALYZED') {
          setAnalysisResult(data);
          saveSwing(data);
          worker.terminate();
          setIsAnalyzing(false);
        } else if (type === 'ERROR') {
          console.error('Analysis error:', data);
          setIsAnalyzing(false);
          worker.terminate();
        }
      };
    } catch (error) {
      console.error('Error analyzing video:', error);
      setIsAnalyzing(false);
    }
  };

  const saveSwing = async (swing: SwingMetrics) => {
    try {
      await fetch('/api/swings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(swing),
      });
    } catch (error) {
      console.error('Error saving swing:', error);
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
    setCurrentFrame(Math.floor(seekTime * 30));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Video Analysis</h1>
        <p className="text-gray-600">Upload a recorded swing video for detailed analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            {!videoUrl ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Upload Video</h3>
                    <p className="text-gray-500">Choose a video file to analyze</p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Select File
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
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                
                {/* Video Controls */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={togglePlayPause}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <span className="text-sm text-gray-600">
                      Frame: {currentFrame} / {totalFrames}
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max={videoRef.current?.duration || 0}
                    step="0.1"
                    value={videoRef.current?.currentTime || 0}
                    onChange={handleSeek}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls and Results */}
        <div className="space-y-6">
          {/* Club Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Club
            </label>
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="space-y-4">
            {selectedFile && !isAnalyzing && (
              <button
                onClick={analyzeVideo}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                Analyze Video
              </button>
            )}
            
            {isAnalyzing && (
              <div className="w-full bg-blue-100 text-blue-800 py-3 px-4 rounded-md text-center font-medium">
                Analyzing Video...
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Analysis Results</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Metrics</h4>
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
                  <h4 className="font-medium text-gray-900 mb-2">Feedback</h4>
                  <div className="space-y-1">
                    {analysisResult.feedback.map((feedback, index) => (
                      <div
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium"
                      >
                        {feedback}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
