'use client';

import React, { useRef, useState, useEffect } from 'react';
import OverlaySystem from '@/components/analysis/OverlaySystem';
import { PoseResult } from '@/lib/mediapipe';
import { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

const TestClubTracerPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poses, setPoses] = useState<PoseResult[]>([]);
  const [phases, setPhases] = useState<EnhancedSwingPhase[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [overlayMode, setOverlayMode] = useState<'clean' | 'analysis' | 'technical'>('analysis');

  // Dummy data for testing
  useEffect(() => {
    // Simulate loading pose data
    const dummyPoses: PoseResult[] = Array.from({ length: 100 }, (_, i) => ({
      frame: i,
      timestamp: i * 33.33, // ~30fps
      landmarks: Array.from({ length: 33 }, (_, j) => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        visibility: Math.random() > 0.1 ? 0.9 : 0.1 // Simulate some low confidence
      })),
      worldLandmarks: Array.from({ length: 33 }, (_, j) => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        visibility: Math.random() > 0.1 ? 0.9 : 0.1
      }))
    }));
    setPoses(dummyPoses);

    // Simulate swing phases
    const dummyPhases: EnhancedSwingPhase[] = [
      { name: 'address', startFrame: 0, endFrame: 10, duration: 10, confidence: 0.9 },
      { name: 'backswing', startFrame: 11, endFrame: 40, duration: 30, confidence: 0.8 },
      { name: 'top', startFrame: 41, endFrame: 45, duration: 5, confidence: 0.95 },
      { name: 'downswing', startFrame: 46, endFrame: 60, duration: 15, confidence: 0.85 },
      { name: 'impact', startFrame: 61, endFrame: 63, duration: 3, confidence: 0.98 },
      { name: 'follow-through', startFrame: 64, endFrame: 99, duration: 36, confidence: 0.8 }
    ];
    setPhases(dummyPhases);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime * 1000);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && videoRef.current) {
      const videoURL = URL.createObjectURL(file);
      videoRef.current.src = videoURL;
      videoRef.current.play();
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 flex items-center justify-center">
      <div className="relative w-[80%] h-[80%] bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          loop
          muted
        >
          <source src="/golf_swing_example.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        <OverlaySystem
          canvasRef={canvasRef}
          videoRef={videoRef}
          poses={poses}
          phases={phases}
          currentTime={currentTime}
          overlayMode={overlayMode}
          isPlaying={isPlaying}
        />
      </div>

      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
        <input type="file" accept="video/*" onChange={handleFileChange} className="text-white" />
        <select 
          value={overlayMode} 
          onChange={(e) => setOverlayMode(e.target.value as any)}
          className="p-2 rounded bg-gray-700 text-white"
        >
          <option value="clean">Clean</option>
          <option value="analysis">Analysis</option>
          <option value="technical">Technical</option>
        </select>
        <div className="text-white text-sm">
          <p>Club Head Tracer Test Page</p>
          <p>Mode: {overlayMode}</p>
          <p>Poses: {poses.length}</p>
          <p>Phases: {phases.length}</p>
        </div>
      </div>
    </div>
  );
};

export default TestClubTracerPage;

