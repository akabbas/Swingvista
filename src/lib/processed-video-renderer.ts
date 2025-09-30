import { PoseResult } from './mediapipe';
import { RealGolfAnalysis } from './real-golf-analysis';

export interface RenderOptions {
  file: File;
  poses: PoseResult[];
  analysis: RealGolfAnalysis;
  fps?: number;
  drawStickFigure?: boolean;
  drawSwingPlane?: boolean;
  drawKeyFrames?: boolean;
  drawMetrics?: boolean;
  // pro options
  brandWatermark?: boolean;
  titleCard?: { userName?: string; swingType?: string; date?: string } | false;
  slowMoImpact?: boolean;
  sideBySide?: { showOriginalLeft?: boolean } | false;
  // advanced viz
  handTrails?: boolean;
  clubPath?: boolean;
  planeTunnel?: boolean;
  onProgress?: (progress: number) => void;
}

export interface RenderResult {
  blobUrl: string;
  size: number;
  duration: number;
}

export async function renderProcessedSwingVideo(options: RenderOptions): Promise<RenderResult> {
  const {
    file,
    poses,
    analysis,
    fps = 30,
    drawStickFigure = true,
    drawSwingPlane = true,
    drawKeyFrames = true,
    drawMetrics = true,
    brandWatermark = true,
    titleCard = { userName: 'Player', swingType: 'Full Swing', date: new Date().toLocaleDateString() },
    slowMoImpact = true,
    sideBySide = false,
    handTrails = true,
    clubPath = true,
    planeTunnel = true,
    onProgress
  } = options;

  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true as any;

  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Video load timeout')), 10000);
    video.onloadedmetadata = () => { clearTimeout(t); resolve(); };
    video.onerror = () => { clearTimeout(t); reject(new Error('Video load error')); };
    video.load();
  });

  const baseWidth = video.videoWidth || 1280;
  const baseHeight = video.videoHeight || 720;
  const width = sideBySide ? baseWidth * 2 : baseWidth;
  const height = baseHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get 2D context');

  const stream = (canvas as any).captureStream ? canvas.captureStream(fps) : (canvas as any).mozCaptureStream?.(fps);
  if (!stream) throw new Error('Canvas captureStream not supported');

  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  const stopped = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });
  recorder.start(100);

  const totalFrames = Math.max(1, Math.floor(video.duration * fps));
  const hasPoses = poses && poses.length > 0;
  const leftHandTrail: Array<{x:number;y:number;speed:number}> = [];
  const rightHandTrail: Array<{x:number;y:number;speed:number}> = [];
  const maxTrailLen = 120;

  function addTrailPoint(arr: Array<{x:number;y:number;speed:number}>, x: number, y: number, speed: number) {
    arr.push({ x, y, speed });
    if (arr.length > maxTrailLen) arr.shift();
  }

  // Helper: draw overlays for a single frame index
  const drawOverlays = (frameIndex: number) => {
    const offsetX = sideBySide ? baseWidth : 0; // draw overlays on right pane in side-by-side
    
    // Base video frame (side-by-side support)
    if (sideBySide) {
      // Left: original frame
      ctx.drawImage(video, 0, 0, baseWidth, baseHeight);
      // Right: processed frame background (copy base frame)
      ctx.drawImage(video, baseWidth, 0, baseWidth, baseHeight);
    } else {
      ctx.drawImage(video, 0, 0, width, height);
    }

    const pose = hasPoses ? poses[Math.min(frameIndex, poses.length - 1)] : null;
    // Motion trails (hands)
    if (handTrails && pose?.landmarks) {
      const lm = pose.landmarks as any[];
      const leftWrist = lm[15]; // left wrist index in MP
      const rightWrist = lm[16];
      const lpx = offsetX + (leftWrist?.x ?? 0.5) * baseWidth;
      const lpy = (leftWrist?.y ?? 0.5) * baseHeight;
      const rpx = offsetX + (rightWrist?.x ?? 0.5) * baseWidth;
      const rpy = (rightWrist?.y ?? 0.5) * baseHeight;
      const prevL = leftHandTrail[leftHandTrail.length - 1];
      const prevR = rightHandTrail[rightHandTrail.length - 1];
      const lSpeed = prevL ? Math.hypot(lpx - prevL.x, lpy - prevL.y) : 0;
      const rSpeed = prevR ? Math.hypot(rpx - prevR.x, rpy - prevR.y) : 0;
      addTrailPoint(leftHandTrail, lpx, lpy, lSpeed);
      addTrailPoint(rightHandTrail, rpx, rpy, rSpeed);
      const drawTrail = (trail: Array<{x:number;y:number;speed:number}>, color: string) => {
        for (let i = 1; i < trail.length; i++) {
          const p0 = trail[i - 1];
          const p1 = trail[i];
          const alpha = i / trail.length;
          const speed = p1.speed;
          // Speed-based color from blue (slow) to red (fast)
          const hue = Math.min(0, 0) + Math.max(0, Math.min(1, speed / 8)) * 0; // keep fixed hue; use brightness instead
          const brightness = Math.min(1, 0.3 + speed / 12);
          ctx.strokeStyle = `rgba(255, 99, 71, ${alpha * 0.6 * brightness})`;
          ctx.lineWidth = Math.max(1, speed * 0.5);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
      };
      drawTrail(leftHandTrail, '#00FF88');
      drawTrail(rightHandTrail, '#00CCFF');
    }

    // Club path estimation (approximate club head midway between wrists and extended along forearm)
    if (clubPath && pose?.landmarks) {
      const lm = pose.landmarks as any[];
      const lw = lm[15], rw = lm[16];
      if (lw?.visibility > 0.4 && rw?.visibility > 0.4) {
        const midX = offsetX + ((lw.x + rw.x) * 0.5) * baseWidth;
        const midY = ((lw.y + rw.y) * 0.5) * baseHeight;
        // Estimate direction using wrist to elbow vector
        const le = lm[13], re = lm[14];
        const vx = ((rw.x - re?.x) + (lw.x - le?.x)) * 0.5;
        const vy = ((rw.y - re?.y) + (lw.y - le?.y)) * 0.5;
        const len = Math.hypot(vx, vy) || 0.001;
        const dirX = (vx / len) * baseWidth;
        const dirY = (vy / len) * baseHeight;
        // Draw small path segment and head marker
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(midX - dirX * 0.2, midY - dirY * 0.2);
        ctx.lineTo(midX + dirX * 0.8, midY + dirY * 0.8);
        ctx.stroke();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(midX + dirX * 0.8, midY + dirY * 0.8, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Swing plane tunnel (simple dual-line band around shoulder plane)
    if (planeTunnel && pose?.landmarks) {
      const ls = pose.landmarks[11];
      const rs = pose.landmarks[12];
      if (ls?.visibility > 0.5 && rs?.visibility > 0.5) {
        const x1 = offsetX + ls.x * baseWidth;
        const y1 = ls.y * baseHeight;
        const x2 = offsetX + rs.x * baseWidth;
        const y2 = rs.y * baseHeight;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);
        const len = Math.hypot(baseWidth, baseHeight);
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const nX = -Math.sin(angle);
        const nY = Math.cos(angle);
        const band = 30; // pixels half-width of tunnel
        const drawBandLine = (offset: number, color: string, alpha: number) => {
          const ex1 = cx - Math.cos(angle) * len + nX * offset;
          const ey1 = cy - Math.sin(angle) * len + nY * offset;
          const ex2 = cx + Math.cos(angle) * len + nX * offset;
          const ey2 = cy + Math.sin(angle) * len + nY * offset;
          ctx.strokeStyle = color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ex1, ey1);
          ctx.lineTo(ex2, ey2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        };
        drawBandLine(-band, '#7FDBFF', 0.5);
        drawBandLine(band, '#7FDBFF', 0.5);
      }
    }

    if (drawStickFigure && pose && pose.landmarks) {
      ctx.strokeStyle = '#00ff00';
      ctx.fillStyle = '#00ff00';
      ctx.lineWidth = 2;
      const connections = [
        [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
        [11, 23], [12, 24], [23, 24],
        [23, 25], [25, 27], [24, 26], [26, 28],
        [15, 17], [16, 18], [27, 29], [28, 30]
      ] as Array<[number, number]>;
      connections.forEach(([a, b]) => {
        const p1 = pose.landmarks[a];
        const p2 = pose.landmarks[b];
        if (p1?.visibility > 0.5 && p2?.visibility > 0.5) {
          ctx.beginPath();
          ctx.moveTo(offsetX + p1.x * baseWidth, p1.y * baseHeight);
          ctx.lineTo(offsetX + p2.x * baseWidth, p2.y * baseHeight);
          ctx.stroke();
        }
      });
      pose.landmarks.forEach((lm: any) => {
        if (lm && lm.visibility > 0.5) {
          ctx.beginPath();
          ctx.arc(offsetX + lm.x * baseWidth, lm.y * baseHeight, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    if (drawSwingPlane && hasPoses) {
      const pose = poses[Math.min(frameIndex, poses.length - 1)];
      const ls = pose?.landmarks?.[11];
      const rs = pose?.landmarks?.[12];
      if (ls?.visibility > 0.5 && rs?.visibility > 0.5) {
        const x1 = offsetX + ls.x * baseWidth, y1 = ls.y * baseHeight;
        const x2 = offsetX + rs.x * baseWidth, y2 = rs.y * baseHeight;
        const dx = x2 - x1, dy = y2 - y1;
        const angle = Math.atan2(dy, dx);
        const len = Math.hypot(baseWidth, baseHeight);
        const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
        const ex1 = cx - Math.cos(angle) * len;
        const ey1 = cy - Math.sin(angle) * len;
        const ex2 = cx + Math.cos(angle) * len;
        const ey2 = cy + Math.sin(angle) * len;
        ctx.strokeStyle = '#00BFFF';
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(ex1, ey1);
        ctx.lineTo(ex2, ey2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (drawKeyFrames && analysis) {
      // Impact marker
      const impactIdx = analysis.impactFrame ?? -1;
      if (impactIdx >= 0) {
        const isImpact = Math.abs(frameIndex - impactIdx) <= 1;
        if (isImpact) {
          ctx.strokeStyle = '#FF4136';
          ctx.lineWidth = 3;
          ctx.strokeRect(offsetX + 8, 8, baseWidth - 16, baseHeight - 16);
          ctx.font = 'bold 18px sans-serif';
          ctx.fillStyle = '#FF4136';
          ctx.fillText('Impact', offsetX + 16, 32);
        }
      }

      // Top of backswing and finish
      const top = analysis.phases?.find(p => /top/i.test(p.phase || ''));
      const finish = analysis.phases?.find(p => /finish|follow/i.test(p.phase || ''));
      if (top?.startFrame !== undefined) {
        const near = Math.abs(frameIndex - top.startFrame) <= 1;
        if (near) {
          ctx.font = 'bold 16px sans-serif';
          ctx.fillStyle = '#F39C12';
          ctx.fillText('Top of Backswing', offsetX + 16, 56);
        }
      }
      if (finish?.startFrame !== undefined) {
        const near = Math.abs(frameIndex - finish.startFrame) <= 1;
        if (near) {
          ctx.font = 'bold 16px sans-serif';
          ctx.fillStyle = '#2ECC71';
          ctx.fillText('Finish', offsetX + 16, 80);
        }
      }
    }

    if (drawMetrics && analysis?.metrics) {
      const { tempo, rotation, swingPlane, weightTransfer } = analysis.metrics as any;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(offsetX + baseWidth - 260, 8, 252, 88);
      ctx.fillStyle = '#ffffff';
      const lines = [
        `Tempo: ${tempo?.ratio ? tempo.ratio.toFixed(2) : tempo?.score ?? 'N/A'}`,
        `Rotation: ${rotation?.xFactor ? rotation.xFactor.toFixed(0) + '°' : rotation?.score ?? 'N/A'}`,
        `Swing Plane: ${swingPlane?.deviation ? swingPlane.deviation.toFixed(1) + '°' : swingPlane?.score ?? 'N/A'}`,
        `Weight Transfer: ${weightTransfer?.transfer ? Math.round(weightTransfer.transfer * 100) + '%' : weightTransfer?.score ?? 'N/A'}`
      ];
      lines.forEach((t, i) => ctx.fillText(t, offsetX + baseWidth - 250, 28 + i * 18));
    }

    // Branding watermark
    if (brandWatermark) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(offsetX + baseWidth - 180, baseHeight - 36, 172, 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('SWINGVISTA', offsetX + baseWidth - 170, baseHeight - 17);
      ctx.restore();
    }
  };

  // Rendering loop (title card, slow-mo, outro)
  await video.play().catch(() => {/* ignore autoplay block */});

  let lastReported = -1;
  // Title card (1s)
  if (titleCard) {
    const startTs = performance.now();
    while (performance.now() - startTs < 1000) {
      // background
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText('SWINGVISTA', 40, 80);
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(`${titleCard.userName || 'Player'} • ${titleCard.swingType || 'Swing'} • ${titleCard.date || ''}`, 40, 130);
      ctx.font = '16px sans-serif';
      ctx.fillText('Professional Analysis Video', 40, 160);
      await new Promise(r => requestAnimationFrame(() => r(undefined)));
    }
  }

  // Main pass with optional slow-mo near impact
  const impactIdx = analysis.impactFrame ?? Math.floor(totalFrames * 0.5);
  const slowWindow = 10; // frames around impact
  const slowFactor = 0.3; // 30% speed
  
  // Frame limiting to prevent side-by-side freezing
  const MAX_FRAMES = 300; // Limit processing to prevent memory issues
  const frameSkip = Math.max(1, Math.ceil(totalFrames / MAX_FRAMES));
  console.log('🎬 Video export: limiting frames', { totalFrames, frameSkip, maxFrames: MAX_FRAMES });
  
  await new Promise<void>((resolve) => {
    let frameCount = 0;
    const render = () => {
      const frameIndex = Math.floor((video.currentTime / video.duration) * totalFrames);
      
      // Only process every Nth frame to prevent freezing
      if (frameCount % frameSkip === 0) {
        drawOverlays(Math.max(0, Math.min(totalFrames - 1, frameIndex)));
      }
      
      const framesFromImpact = Math.abs(frameIndex - impactIdx);
      if (slowMoImpact && framesFromImpact <= slowWindow) {
        // hold frame a bit longer by not advancing time too quickly
      } else {
        // nothing special
      }
      const progress = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
      if (progress !== lastReported) {
        onProgress?.(progress);
        lastReported = progress;
      }
      if (video.ended || video.currentTime >= video.duration) {
        console.log('🎬 Video export complete:', { framesProcessed: frameCount });
        resolve();
        return;
      }
      frameCount++;
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  });

  // Outro (metrics summary, 1s)
  {
    const startTs = performance.now();
    while (performance.now() - startTs < 1000) {
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Summary', 40, 80);
      ctx.font = '16px sans-serif';
      const m: any = analysis.metrics || {};
      const lines = [
        `Tempo: ${m.tempo?.ratio ? m.tempo.ratio.toFixed(2) : m.tempo?.score ?? 'N/A'}`,
        `X-Factor: ${m.rotation?.xFactor ? m.rotation.xFactor.toFixed(0) + '°' : m.rotation?.score ?? 'N/A'}`,
        `Plane Dev: ${m.swingPlane?.deviation ? m.swingPlane.deviation.toFixed(1) + '°' : m.swingPlane?.score ?? 'N/A'}`,
        `Weight Transfer: ${m.weightTransfer?.transfer ? Math.round(m.weightTransfer.transfer * 100) + '%' : m.weightTransfer?.score ?? 'N/A'}`
      ];
      lines.forEach((t, i) => ctx.fillText(t, 40, 120 + i * 22));
      await new Promise(r => requestAnimationFrame(() => r(undefined)));
    }
  }

  recorder.stop();
  await stopped;

  const blob = new Blob(chunks, { type: 'video/webm' });
  const blobUrl = URL.createObjectURL(blob);
  return { blobUrl, size: blob.size, duration: video.duration };
}


