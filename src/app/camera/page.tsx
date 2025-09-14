'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MediaPipePoseDetector, PoseLandmark } from '@/lib/mediapipe';
import { SwingMetrics } from '@/workers/analysis.worker';
import { SwingReportCard } from '@/lib/vista-swing-ai';

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<string[]>([]);
  const [poseDetector, setPoseDetector] = useState<MediaPipePoseDetector | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [swingData, setSwingData] = useState<PoseLandmark[][]>([]);
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [selectedClub, setSelectedClub] = useState('driver');
  const [analysisResult, setAnalysisResult] = useState<SwingMetrics | null>(null);

  const clubs = ['driver', 'iron', 'wedge', 'putter'];

  useEffect(() => {
    initializeCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (poseDetector) {
        poseDetector.destroy();
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }

      const detector = new MediaPipePoseDetector();
      await detector.initialize();
      setPoseDetector(detector);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
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

  const analyzeFrame = useCallback(async () => {
    if (!poseDetector || !videoRef.current || !canvasRef.current) return;

    try {
      const result = await poseDetector.detectPose(videoRef.current);
      
      if (result && result.landmarks) {
        drawSkeleton(result.landmarks, canvasRef.current);
        
        if (isRecording) {
          setSwingData(prev => [...prev, result.landmarks]);
          setTimestamps(prev => [...prev, Date.now()]);
        }
      }
    } catch (error) {
      console.error('Error analyzing frame:', error);
    }
  }, [poseDetector, isRecording, drawSkeleton]);

  useEffect(() => {
    if (isRecording || isAnalyzing) {
      const interval = setInterval(analyzeFrame, 33); // ~30fps
      return () => clearInterval(interval);
    }
  }, [isRecording, isAnalyzing, analyzeFrame]);

  const startRecording = () => {
    setSwingData([]);
    setTimestamps([]);
    setCurrentFeedback([]);
    setAnalysisResult(null);
    setIsRecording(true);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsAnalyzing(true);
    
    try {
      // Create Web Worker for analysis
      const worker = new Worker(new URL('@/workers/analysis.worker.ts', import.meta.url));
      
      worker.postMessage({
        type: 'ANALYZE_SWING',
        data: {
          landmarks: swingData,
          timestamps,
          club: selectedClub,
          swingId: `swing_${Date.now()}`
        }
      });
      
      worker.onmessage = (e) => {
        const { type, data } = e.data;
        
        if (type === 'SWING_ANALYZED') {
          setAnalysisResult(data);
          setCurrentFeedback(data.feedback);
          
          // Save to backend
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
      console.error('Error analyzing swing:', error);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Swing Analysis</h1>
        <p className="text-gray-600">Get real-time feedback on your golf swing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Camera Feed */}
        <div className="lg:col-span-2">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            />
            
            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Recording...</span>
              </div>
            )}
            
            {/* Analysis Indicator */}
            {isAnalyzing && (
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Analyzing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls and Feedback */}
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
              disabled={isRecording || isAnalyzing}
            >
              {clubs.map((club) => (
                <option key={club} value={club}>
                  {club.charAt(0).toUpperCase() + club.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Recording Controls */}
          <div className="space-y-4">
            {!isRecording && !isAnalyzing && (
              <button
                onClick={startRecording}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Start Recording
              </button>
            )}
            
            {isRecording && (
              <button
                onClick={stopRecording}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors font-medium"
              >
                Stop Recording
              </button>
            )}
            
            {isAnalyzing && (
              <div className="w-full bg-blue-100 text-blue-800 py-3 px-4 rounded-md text-center font-medium">
                Analyzing Swing...
              </div>
            )}
          </div>

          {/* Live Feedback */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Live Feedback</h3>
            <div className="space-y-2">
              {currentFeedback.length > 0 ? (
                currentFeedback.map((feedback, index) => (
                  <div
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {feedback}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">
                  {isRecording ? 'Recording swing...' : 'Start recording to see feedback'}
                </div>
              )}
            </div>
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Analysis Results</h3>
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
          )}
        </div>
      </div>
    </div>
  );
}
