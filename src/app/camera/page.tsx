"use client";
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaPipePoseDetector, type PoseResult } from '@/lib/mediapipe';
import { trackEvent } from '@/lib/analytics';

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameHandleRef = useRef<number | null>(null);
  const detectorRef = useRef<MediaPipePoseDetector | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [fps, setFps] = useState(0);

  // Simple moving FPS calculator
  const fpsSamples = useRef<number[]>([]);
  const updateFps = useCallback((instantFps: number) => {
    fpsSamples.current.push(instantFps);
    if (fpsSamples.current.length > 20) fpsSamples.current.shift();
    const avg = fpsSamples.current.reduce((a, b) => a + b, 0) / fpsSamples.current.length;
    setFps(Math.round(avg));
  }, []);

  const drawPose = useCallback((pose: PoseResult | null) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (video.videoWidth && video.videoHeight) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!pose || !pose.landmarks) return;

    // Low-GPU cost drawing: circles + a few connections
    const points = pose.landmarks;
    ctx.fillStyle = 'rgba(16,185,129,0.9)';
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const connect = (a: number, b: number) => {
      const pa = points[a];
      const pb = points[b];
      if (!pa || !pb) return;
      ctx.beginPath();
      ctx.moveTo(pa.x * canvas.width, pa.y * canvas.height);
      ctx.lineTo(pb.x * canvas.width, pb.y * canvas.height);
      ctx.strokeStyle = 'rgba(59,130,246,0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    // Shoulders, arms, hips
    connect(11, 12);
    connect(11, 13); connect(13, 15);
    connect(12, 14); connect(14, 16);
    connect(23, 24);
  }, []);

  const stopCamera = useCallback(() => {
    setIsRunning(false);
    if (frameHandleRef.current && (videoRef.current as any)?.cancelVideoFrameCallback) {
      try { (videoRef.current as any).cancelVideoFrameCallback(frameHandleRef.current); } catch {}
    }
    frameHandleRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (detectorRef.current) {
      detectorRef.current.destroy();
      detectorRef.current = null;
    }
    try { trackEvent('camera_session_end'); } catch {}
  }, []);

  const startCamera = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      const video = videoRef.current;
      if (!video) return;

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: { ideal: 'environment' as any }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const detector = MediaPipePoseDetector.getInstance();
      await detector.initialize();
      detectorRef.current = detector;

      // Throttle to ~25fps using mediaTime delta
      let lastTime = -1;
      const targetDelta = 1 / 25; // ~25fps

      const loop = async (_now: number, metadata?: { mediaTime?: number }) => {
        if (!isRunning) return; // stop if state changed
        const v = videoRef.current;
        if (!v) return;
        const mediaTime = metadata && typeof metadata.mediaTime === 'number' ? metadata.mediaTime : v.currentTime;
        if (lastTime < 0 || (mediaTime - lastTime) >= targetDelta) {
          const t0 = performance.now();
          const pose = await detector.detectPose(v);
          drawPose(pose);
          const t1 = performance.now();
          const instantFps = 1000 / Math.max(1, (t1 - t0));
          updateFps(instantFps);
          lastTime = mediaTime;
        }
        frameHandleRef.current = (v as any).requestVideoFrameCallback(loop);
      };

      (video as any).requestVideoFrameCallback(loop);
      try { trackEvent('camera_session_start'); } catch {}
    } catch (err) {
      console.error('Camera start failed', err);
      stopCamera();
    }
  }, [drawPose, isRunning, stopCamera, updateFps]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-900">
          📹 Camera Analysis
        </h1>
        <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
          Real-time golf swing analysis using on-device AI. No upload required.
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <div className="relative w-full max-w-3xl mx-auto">
            <video ref={videoRef} className="w-full rounded-lg bg-black" playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
            <span>FPS: {fps}</span>
            {isRunning ? (
              <span className="inline-flex items-center text-green-700">● Live</span>
            ) : (
              <span className="inline-flex items-center text-gray-500">● Idle</span>
            )}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {!isRunning ? (
              <button onClick={startCamera} className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all shadow">
                🎬 Start Live Analysis
              </button>
            ) : (
              <button onClick={stopCamera} className="w-full sm:w-auto bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all shadow">
                ⏹️ Stop
              </button>
            )}
            <Link 
              href="/" 
              className="w-full sm:w-auto bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow text-center"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

