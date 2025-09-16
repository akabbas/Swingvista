'use client';

import { useEffect, useMemo, useRef, useCallback, memo } from 'react';
import type { PoseResult } from '@/lib/mediapipe';

interface PoseOverlayProps {
  videoUrl: string;
  poseData: PoseResult[];
  className?: string;
}

const PoseOverlay = memo(function PoseOverlay({ videoUrl, poseData, className }: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const timestamps = useMemo(() => poseData.map(p => p.timestamp || 0), [poseData]);

  const findNearestIndex = useCallback((timeSec: number) => {
    if (timestamps.length === 0) return 0;
    const targetMs = Math.round(timeSec * 1000);
    // Binary search nearest
    let lo = 0, hi = timestamps.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (timestamps[mid] < targetMs) lo = mid + 1; else hi = mid;
    }
    // Adjust to closest among neighbors
    const i = lo;
    const prev = Math.max(0, i - 1);
    const distPrev = Math.abs(timestamps[prev] - targetMs);
    const distCurr = Math.abs(timestamps[i] - targetMs);
    return distPrev <= distCurr ? prev : i;
  }, [timestamps]);

  const draw = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const index = findNearestIndex(video.currentTime);
    const frame = poseData[index];
    if (!frame || !frame.landmarks) {
      requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw points
    for (const lm of frame.landmarks) {
      const x = lm.x * canvas.width;
      const y = lm.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16,185,129,0.9)';
      ctx.fill();
    }

    // Minimal connections (shoulders, arms, hips, legs)
    const L = frame.landmarks as any[];
    const connect = (a: number, b: number) => {
      if (!L[a] || !L[b]) return;
      ctx.beginPath();
      ctx.moveTo(L[a].x * canvas.width, L[a].y * canvas.height);
      ctx.lineTo(L[b].x * canvas.width, L[b].y * canvas.height);
      ctx.strokeStyle = 'rgba(59,130,246,0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    // Common landmark indices for MediaPipe Pose
    // 11 L-shoulder, 12 R-shoulder, 13 L-elbow, 14 R-elbow, 15 L-wrist, 16 R-wrist
    // 23 L-hip, 24 R-hip, 25 L-knee, 26 R-knee, 27 L-ankle, 28 R-ankle
    connect(11, 12); // shoulders
    connect(11, 13); connect(13, 15); // left arm
    connect(12, 14); connect(14, 16); // right arm
    connect(23, 24); // hips
    connect(23, 25); connect(25, 27); // left leg
    connect(24, 26); connect(26, 28); // right leg

    requestAnimationFrame(draw);
  }, [findNearestIndex, poseData]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || poseData.length === 0) return;

    const resizeCanvas = () => {
      if (video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    };

    const onPlay = () => requestAnimationFrame(draw);
    const onLoaded = () => resizeCanvas();
    video.addEventListener('play', onPlay);
    video.addEventListener('loadedmetadata', onLoaded);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('loadedmetadata', onLoaded);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [poseData, timestamps, draw]);

  return (
    <div className={`relative ${className || ''}`}>
      <video ref={videoRef} src={videoUrl} controls className="w-full" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
});

export default PoseOverlay;


