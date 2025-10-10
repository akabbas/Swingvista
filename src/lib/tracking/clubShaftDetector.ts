// Club shaft detection via edge detection and Hough line transform
// Pure JS implementation with no external dependencies

export type Point = { x: number; y: number };
export type Line = { x1: number; y1: number; x2: number; y2: number; angle: number; length: number };
export type ROI = { x: number; y: number; w: number; h: number };

export interface ShaftDetectionResult {
  clubHead: Point; // normalized [0..1]
  shaftLine: Line | null; // pixel coordinates
  confidence: number;
  method: 'edge_detected' | 'pose_fallback' | 'interpolated';
  debug?: {
    roi?: ROI;
    candidateLines?: Array<Line>;
    chosenAngleDeg?: number;
  };
}

export class ClubShaftDetector {
  private width = 0;
  private height = 0;
  private lastGoodDetection: ShaftDetectionResult | null = null;
  private detectionHistory: ShaftDetectionResult[] = [];
  private lastAngleDeg: number | null = null;
  private calibratedShaftLengthPx: number | null = null;
  private calibrationCount = 0;
  private prevGrayFrame: Float32Array | null = null;

  init(width: number, height: number) {
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    this.lastGoodDetection = null;
    this.detectionHistory = [];
  }

  detectClubHead(frameData: ImageData, pose: any, wristSeparation: number): ShaftDetectionResult {
    // Get ROI from pose and last head position (adaptive)
    const poseRoi = this.getROIFromPose(pose);
    const roi = this.expandROIWithLastHead(poseRoi);
    if (!roi) {
      return this.poseBasedFallback(pose, wristSeparation);
    }

    // Extract and process ROI
    let roiGray = this.extractGrayscaleROI(frameData, roi);
    // Contrast boost (normalize then gain)
    roiGray = this.contrastBoost(roiGray);
    
    // Detect edges
    const edges = this.detectEdges(roiGray, roi.w, roi.h);
    
    // Find lines via Hough transform
    const angleCenter = this.estimateAngleConstraint(pose);
    const lines = this.houghLineTransform(edges, roi.w, roi.h, angleCenter);
    
    if (lines.length === 0) {
      // Try optical flow fallback if available
      const flow = this.opticalFlowFallback(frameData, pose);
      if (flow) return flow;
      return this.interpolateOrFallback(pose, wristSeparation);
    }

    // Score and filter lines based on pose
    const wristCenter = this.getWristCenter(pose);
    const forearmAngle = this.getForearmAngle(pose);
    const bestLine = this.selectBestLine(lines, roi, wristCenter, forearmAngle);
    
    if (!bestLine) {
      const flow = this.opticalFlowFallback(frameData, pose);
      if (flow) return flow;
      return this.interpolateOrFallback(pose, wristSeparation);
    }

    // Extrapolate to club head
    const clubHead = this.extrapolateClubHead(bestLine, wristSeparation, wristCenter);
    
    const result: ShaftDetectionResult = {
      clubHead: {
        x: Math.max(0, Math.min(1, clubHead.x / this.width)),
        y: Math.max(0, Math.min(1, clubHead.y / this.height))
      },
      shaftLine: bestLine,
      confidence: 0.85,
      method: 'edge_detected',
      debug: { roi, candidateLines: lines.slice(0, 8), chosenAngleDeg: bestLine.angle }
    };

    // Update temporal state
    this.lastGoodDetection = result;
    this.detectionHistory.push(result);
    if (this.detectionHistory.length > 30) this.detectionHistory.shift();
    this.lastAngleDeg = bestLine.angle;
    this.updateShaftCalibration(bestLine.length);
    // Keep previous gray for optical flow
    this.prevGrayFrame = this.extractFullGray(frameData);
    
    return result;
  }

  private getROIFromPose(pose: any): ROI | null {
    if (!pose || !pose.landmarks) return null;
    
    const lw = pose.landmarks[9];  // left wrist
    const rw = pose.landmarks[10]; // right wrist
    const le = pose.landmarks[7];  // left elbow
    const re = pose.landmarks[8];  // right elbow
    
    const points: Point[] = [];
    if (lw && (lw.visibility || 0) > 0.1) points.push({ x: lw.x * this.width, y: lw.y * this.height });
    if (rw && (rw.visibility || 0) > 0.1) points.push({ x: rw.x * this.width, y: rw.y * this.height });
    if (le && (le.visibility || 0) > 0.1) points.push({ x: le.x * this.width, y: le.y * this.height });
    if (re && (re.visibility || 0) > 0.1) points.push({ x: re.x * this.width, y: re.y * this.height });
    
    if (points.length < 2) return null;
    
    // Compute bounding box with generous margin for club extension
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    
    const margin = Math.max(this.width, this.height) * 0.3; // 30% margin for club extension
    
    return {
      x: Math.max(0, Math.floor(minX - margin)),
      y: Math.max(0, Math.floor(minY - margin)),
      w: Math.min(this.width, Math.ceil(maxX - minX + 2 * margin)),
      h: Math.min(this.height, Math.ceil(maxY - minY + 2 * margin))
    };
  }

  private extractGrayscaleROI(frameData: ImageData, roi: ROI): Float32Array {
    const W = frameData.width;
    const H = frameData.height;
    const data = frameData.data;
    
    const clampedROI = {
      x: Math.max(0, Math.min(W - 1, roi.x)),
      y: Math.max(0, Math.min(H - 1, roi.y)),
      w: Math.max(1, Math.min(W - roi.x, roi.w)),
      h: Math.max(1, Math.min(H - roi.y, roi.h))
    };
    
    const gray = new Float32Array(clampedROI.w * clampedROI.h);
    let idx = 0;
    
    for (let y = 0; y < clampedROI.h; y++) {
      const row = (clampedROI.y + y) * W;
      for (let x = 0; x < clampedROI.w; x++) {
        const px = (row + (clampedROI.x + x)) * 4;
        const r = data[px];
        const g = data[px + 1];
        const b = data[px + 2];
        gray[idx++] = 0.299 * r + 0.587 * g + 0.114 * b;
      }
    }
    
    return gray;
  }

  private detectEdges(gray: Float32Array, w: number, h: number): Uint8Array {
    // Sobel edge detection
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    const gradMag = new Float32Array(w * h);
    const gradDir = new Float32Array(w * h);
    
    // Compute gradients
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let gx = 0;
        let gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * w + (x + kx);
            const kidx = (ky + 1) * 3 + (kx + 1);
            gx += gray[idx] * sobelX[kidx];
            gy += gray[idx] * sobelY[kidx];
          }
        }
        
        const idx = y * w + x;
        gradMag[idx] = Math.sqrt(gx * gx + gy * gy);
        gradDir[idx] = Math.atan2(gy, gx);
      }
    }
    
    // Adaptive threshold based on gradient statistics
    let sum = 0, sumSq = 0, count = 0;
    for (let i = 0; i < gradMag.length; i++) { const m = gradMag[i]; if (m > 0) { sum += m; sumSq += m * m; count++; } }
    const mean = count > 0 ? sum / count : 0;
    const variance = count > 0 ? Math.max(0, (sumSq / count) - mean * mean) : 0;
    const std = Math.sqrt(variance);
    const baseThresh = mean + 0.5 * std;
    const threshold = Math.max(20, Math.min(120, baseThresh));

    // Non-maximum suppression
    const edges = new Uint8Array(w * h);
    
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const mag = gradMag[idx];
        
        if (mag < threshold) continue;
        
        const dir = gradDir[idx];
        const angle = (dir * 180 / Math.PI + 180) % 180;
        
        let n1 = 0, n2 = 0;
        if ((angle >= 0 && angle < 22.5) || (angle >= 157.5)) {
          n1 = gradMag[idx - 1];
          n2 = gradMag[idx + 1];
        } else if (angle >= 22.5 && angle < 67.5) {
          n1 = gradMag[idx - w + 1];
          n2 = gradMag[idx + w - 1];
        } else if (angle >= 67.5 && angle < 112.5) {
          n1 = gradMag[idx - w];
          n2 = gradMag[idx + w];
        } else {
          n1 = gradMag[idx - w - 1];
          n2 = gradMag[idx + w + 1];
        }
        
        if (mag >= n1 && mag >= n2) {
          edges[idx] = 255;
        }
      }
    }
    
    return edges;
  }

  private houghLineTransform(edges: Uint8Array, w: number, h: number, angleCenterDeg: number | null): Line[] {
    const thetaSteps = 180;
    const maxRho = Math.ceil(Math.sqrt(w * w + h * h));
    const rhoSteps = maxRho * 2;
    
    const accumulator = new Uint32Array(thetaSteps * rhoSteps);
    
    // Vote for lines
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (edges[y * w + x] === 0) continue;
        
        // Sample angles from -90 to +89 degrees, constrained if angleCenterDeg provided
        let thetaStart = 0, thetaEnd = thetaSteps;
        if (angleCenterDeg !== null) {
          const centerIdx = Math.floor((angleCenterDeg + 90) % 180);
          const band = 35; // ±35°
          thetaStart = Math.max(0, centerIdx - band);
          thetaEnd = Math.min(thetaSteps, centerIdx + band);
        }
        for (let thetaIdx = thetaStart; thetaIdx < thetaEnd; thetaIdx++) {
          const theta = (thetaIdx - 90) * Math.PI / 180;
          const rho = x * Math.cos(theta) + y * Math.sin(theta);
          const rhoIdx = Math.floor(rho + maxRho);
          
          if (rhoIdx >= 0 && rhoIdx < rhoSteps) {
            accumulator[thetaIdx * rhoSteps + rhoIdx]++;
          }
        }
      }
    }
    
    // Find peaks
    const threshold = Math.max(20, Math.floor(Math.min(w, h) * 0.15)); // Dynamic threshold
    const lines: Line[] = [];
    
    for (let thetaIdx = 0; thetaIdx < thetaSteps; thetaIdx++) {
      for (let rhoIdx = 0; rhoIdx < rhoSteps; rhoIdx++) {
        const votes = accumulator[thetaIdx * rhoSteps + rhoIdx];
        if (votes < threshold) continue;
        
        const theta = (thetaIdx - 90) * Math.PI / 180;
        const rho = rhoIdx - maxRho;
        
        // Convert to line endpoints
        const line = this.rhoThetaToLine(rho, theta, w, h);
        if (line) {
          lines.push(line);
        }
        
        if (lines.length >= 20) break; // Limit to top 20 lines
      }
      if (lines.length >= 20) break;
    }
    
    return lines;
  }

  private rhoThetaToLine(rho: number, theta: number, w: number, h: number): Line | null {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    
    const x0 = cos * rho;
    const y0 = sin * rho;
    
    // Extend line across image bounds
    const len = Math.max(w, h) * 2;
    const x1 = Math.round(x0 + len * (-sin));
    const y1 = Math.round(y0 + len * cos);
    const x2 = Math.round(x0 - len * (-sin));
    const y2 = Math.round(y0 - len * cos);
    
    // Clip to bounds
    const clipped = this.clipLine(x1, y1, x2, y2, w, h);
    if (!clipped) return null;
    
    const length = Math.sqrt(
      Math.pow(clipped.x2 - clipped.x1, 2) + 
      Math.pow(clipped.y2 - clipped.y1, 2)
    );
    
    return {
      x1: clipped.x1,
      y1: clipped.y1,
      x2: clipped.x2,
      y2: clipped.y2,
      angle: theta * 180 / Math.PI,
      length
    };
  }

  private clipLine(x1: number, y1: number, x2: number, y2: number, w: number, h: number): { x1: number; y1: number; x2: number; y2: number } | null {
    // Cohen-Sutherland line clipping (simplified)
    let cx1 = x1, cy1 = y1, cx2 = x2, cy2 = y2;
    
    // Clip to bounds [0, w] x [0, h]
    if (cx1 < 0 || cx1 >= w || cy1 < 0 || cy1 >= h || cx2 < 0 || cx2 >= w || cy2 < 0 || cy2 >= h) {
      // Simple clamping (not perfect but sufficient)
      cx1 = Math.max(0, Math.min(w - 1, cx1));
      cy1 = Math.max(0, Math.min(h - 1, cy1));
      cx2 = Math.max(0, Math.min(w - 1, cx2));
      cy2 = Math.max(0, Math.min(h - 1, cy2));
    }
    
    return { x1: cx1, y1: cy1, x2: cx2, y2: cy2 };
  }

  private getWristCenter(pose: any): Point | null {
    if (!pose || !pose.landmarks) return null;
    
    const lw = pose.landmarks[9];
    const rw = pose.landmarks[10];
    
    let sumX = 0, sumY = 0, count = 0;
    if (lw && (lw.visibility || 0) > 0.1) {
      sumX += lw.x * this.width;
      sumY += lw.y * this.height;
      count++;
    }
    if (rw && (rw.visibility || 0) > 0.1) {
      sumX += rw.x * this.width;
      sumY += rw.y * this.height;
      count++;
    }
    
    if (count === 0) return null;
    return { x: sumX / count, y: sumY / count };
  }

  private getForearmAngle(pose: any): number | null {
    if (!pose || !pose.landmarks) return null;
    
    const lw = pose.landmarks[9];
    const rw = pose.landmarks[10];
    const le = pose.landmarks[7];
    const re = pose.landmarks[8];
    
    const angles: number[] = [];
    
    if (lw && le && (lw.visibility || 0) > 0.2 && (le.visibility || 0) > 0.2) {
      const dx = lw.x - le.x;
      const dy = lw.y - le.y;
      angles.push(Math.atan2(dy, dx) * 180 / Math.PI);
    }
    
    if (rw && re && (rw.visibility || 0) > 0.2 && (re.visibility || 0) > 0.2) {
      const dx = rw.x - re.x;
      const dy = rw.y - re.y;
      angles.push(Math.atan2(dy, dx) * 180 / Math.PI);
    }
    
    if (angles.length === 0) return null;
    return angles.reduce((a, b) => a + b) / angles.length;
  }

  private selectBestLine(lines: Line[], roi: ROI, wristCenter: Point | null, forearmAngle: number | null): Line | null {
    if (lines.length === 0) return null;
    
    let bestLine: Line | null = null;
    let bestScore = -1;
    
    for (const line of lines) {
      let score = 0;
      
      // Score by length (longer is better, up to a point)
      const lengthScore = Math.min(1, line.length / Math.min(roi.w, roi.h));
      score += lengthScore * 0.4;
      
      // Score by proximity to wrist center
      if (wristCenter) {
        // Convert line to ROI coordinates
        const lineInFrame = {
          x1: roi.x + line.x1,
          y1: roi.y + line.y1,
          x2: roi.x + line.x2,
          y2: roi.y + line.y2
        };
        
        const dist = this.pointToLineDistance(wristCenter, lineInFrame);
        const maxDist = Math.max(this.width, this.height) * 0.3;
        const proximityScore = Math.max(0, 1 - dist / maxDist);
        score += proximityScore * 0.4;
      }
      
      // Score by angle alignment with forearm
      if (forearmAngle !== null) {
        let angleDiff = Math.abs(line.angle - forearmAngle);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        const angleScore = Math.max(0, 1 - angleDiff / 60); // ±60° tolerance
        score += angleScore * 0.2;
      }

      // Temporal consistency: prefer lines near last angle and last midpoint
      if (this.lastAngleDeg !== null) {
        let aDiff = Math.abs(line.angle - this.lastAngleDeg);
        if (aDiff > 180) aDiff = 360 - aDiff;
        const temporalAngleScore = Math.max(0, 1 - aDiff / 40); // tighter ±40°
        score += temporalAngleScore * 0.3; // weight
      }
      if (this.lastGoodDetection && this.lastGoodDetection.shaftLine) {
        const lastLine = this.lastGoodDetection.shaftLine;
        const mx = roi.x + (line.x1 + line.x2) / 2;
        const my = roi.y + (line.y1 + line.y2) / 2;
        const lmx = (lastLine.x1 + lastLine.x2) / 2;
        const lmy = (lastLine.y1 + lastLine.y2) / 2;
        const d = Math.hypot(mx - lmx, my - lmy);
        const maxD = Math.max(this.width, this.height) * 0.25;
        const temporalPosScore = Math.max(0, 1 - d / maxD);
        score += temporalPosScore * 0.2;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestLine = line;
      }
    }
    
    return bestScore > 0.3 ? bestLine : null; // Require minimum score
  }

  private pointToLineDistance(point: Point, line: { x1: number; y1: number; x2: number; y2: number }): number {
    const { x1, y1, x2, y2 } = line;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    
    if (lenSq === 0) return Math.hypot(point.x - x1, point.y - y1);
    
    const t = Math.max(0, Math.min(1, ((point.x - x1) * dx + (point.y - y1) * dy) / lenSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    return Math.hypot(point.x - projX, point.y - projY);
  }

  private extrapolateClubHead(line: Line, wristSeparation: number, wristCenter: Point | null): Point {
    // Determine which end of line is closer to wrists (grip end)
    let gripX: number, gripY: number, dirX: number, dirY: number;
    
    if (wristCenter) {
      const dist1 = Math.hypot(line.x1 - wristCenter.x, line.y1 - wristCenter.y);
      const dist2 = Math.hypot(line.x2 - wristCenter.x, line.y2 - wristCenter.y);
      
      if (dist1 < dist2) {
        gripX = line.x1;
        gripY = line.y1;
        dirX = line.x2 - line.x1;
        dirY = line.y2 - line.y1;
      } else {
        gripX = line.x2;
        gripY = line.y2;
        dirX = line.x1 - line.x2;
        dirY = line.y1 - line.y2;
      }
    } else {
      // Default to first endpoint
      gripX = line.x1;
      gripY = line.y1;
      dirX = line.x2 - line.x1;
      dirY = line.y2 - line.y1;
    }
    
    // Normalize direction
    const len = Math.hypot(dirX, dirY) || 1;
    dirX /= len;
    dirY /= len;
    
    // Dynamic extension based on wrist separation and per-video shaft calibration
    const frameScale = Math.max(this.width, this.height);
    let extBase = frameScale * 0.18 + wristSeparation * frameScale * 0.35;
    if (this.calibratedShaftLengthPx) {
      extBase = Math.min(frameScale * 0.45, this.calibratedShaftLengthPx * 0.9);
    }
    const extension = extBase;
    
    return {
      x: gripX + dirX * extension,
      y: gripY + dirY * extension
    };
  }

  private interpolateOrFallback(pose: any, wristSeparation: number): ShaftDetectionResult {
    // Try velocity-based interpolation from history
    const n = this.detectionHistory.length;
    if (n >= 2) {
      const prev = this.detectionHistory[n - 1];
      const prev2 = this.detectionHistory[n - 2];
      const vx = prev.clubHead.x - prev2.clubHead.x;
      const vy = prev.clubHead.y - prev2.clubHead.y;
      // Predict next with capped velocity
      const maxStep = 0.05; // normalized cap
      let px = prev.clubHead.x + Math.max(-maxStep, Math.min(maxStep, vx));
      let py = prev.clubHead.y + Math.max(-maxStep, Math.min(maxStep, vy));
      px = Math.max(0, Math.min(1, px));
      py = Math.max(0, Math.min(1, py));
      const res: ShaftDetectionResult = {
        clubHead: { x: px, y: py },
        shaftLine: null,
        confidence: 0.5,
        method: 'interpolated'
      };
      this.lastGoodDetection = res;
      this.detectionHistory.push(res);
      if (this.detectionHistory.length > 30) this.detectionHistory.shift();
      return res;
    }
    // Fallback to pose-based estimation
    return this.poseBasedFallback(pose, wristSeparation);
  }

  // Helpers
  private contrastBoost(gray: Float32Array): Float32Array {
    let sum = 0, sumSq = 0;
    for (let i = 0; i < gray.length; i++) { sum += gray[i]; sumSq += gray[i] * gray[i]; }
    const mean = sum / gray.length;
    const std = Math.sqrt(Math.max(1e-6, sumSq / gray.length - mean * mean));
    const gain = 1.2; // mild
    const out = new Float32Array(gray.length);
    for (let i = 0; i < gray.length; i++) out[i] = (gray[i] - mean) / std * 32 * gain + 128;
    return out;
  }

  private estimateAngleConstraint(pose: any): number | null {
    // Prefer last angle; otherwise use forearm angle
    if (this.lastAngleDeg !== null) return this.lastAngleDeg;
    const a = this.getForearmAngle(pose);
    return a;
  }

  private updateShaftCalibration(lengthPx: number) {
    // Running average of shaft length in early frames
    const maxCalibFrames = 20;
    if (this.calibrationCount < maxCalibFrames) {
      if (this.calibratedShaftLengthPx == null) this.calibratedShaftLengthPx = lengthPx;
      else this.calibratedShaftLengthPx = this.calibratedShaftLengthPx * 0.8 + lengthPx * 0.2;
      this.calibrationCount++;
    }
  }

  private extractFullGray(frameData: ImageData): Float32Array {
    const W = frameData.width;
    const H = frameData.height;
    const data = frameData.data;
    const out = new Float32Array(W * H);
    let idx = 0;
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) {
        const px = (row + x) * 4;
        const r = data[px], g = data[px + 1], b = data[px + 2];
        out[idx++] = 0.299 * r + 0.587 * g + 0.114 * b;
      }
    }
    return out;
  }

  private opticalFlowFallback(frameData: ImageData, pose: any): ShaftDetectionResult | null {
    if (!this.prevGrayFrame || !this.lastGoodDetection) {
      this.prevGrayFrame = this.extractFullGray(frameData);
      return null;
    }
    const currGray = this.extractFullGray(frameData);
    const last = this.lastGoodDetection.clubHead;
    const cx = Math.floor(last.x * this.width);
    const cy = Math.floor(last.y * this.height);
    const patch = 15; // patch size
    const radius = 20; // search radius
    let bestScore = -Infinity, bestX = cx, bestY = cy;
    const tpl = this.getPatch(this.prevGrayFrame, this.width, this.height, cx, cy, patch);
    const { mean: tMean, std: tStd } = this.meanStd(tpl);
    const tplNorm = this.normalize(tpl, tMean, tStd || 1);
    for (let dy = -radius; dy <= radius; dy += 2) {
      for (let dx = -radius; dx <= radius; dx += 2) {
        const px = cx + dx, py = cy + dy;
        const cand = this.getPatch(currGray, this.width, this.height, px, py, patch);
        const { mean, std } = this.meanStd(cand);
        if (std < 1e-3) continue;
        const candNorm = this.normalize(cand, mean, std);
        const score = this.ncc(tplNorm, candNorm);
        if (score > bestScore) { bestScore = score; bestX = px; bestY = py; }
      }
    }
    this.prevGrayFrame = currGray;
    if (bestScore < 0.3) return null;
    const res: ShaftDetectionResult = {
      clubHead: { x: bestX / this.width, y: bestY / this.height },
      shaftLine: null,
      confidence: 0.6,
      method: 'interpolated'
    };
    this.lastGoodDetection = res;
    this.detectionHistory.push(res);
    if (this.detectionHistory.length > 30) this.detectionHistory.shift();
    return res;
  }

  private getPatch(gray: Float32Array, W: number, H: number, cx: number, cy: number, size: number): Float32Array {
    const half = Math.floor(size / 2);
    const out = new Float32Array(size * size);
    let k = 0;
    for (let y = -half; y <= half; y++) {
      const yy = Math.max(0, Math.min(H - 1, cy + y));
      for (let x = -half; x <= half; x++) {
        const xx = Math.max(0, Math.min(W - 1, cx + x));
        out[k++] = gray[yy * W + xx];
      }
    }
    return out;
  }

  private meanStd(data: Float32Array): { mean: number; std: number } {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const mean = sum / data.length;
    
    let sumSq = 0;
    for (let i = 0; i < data.length; i++) {
      const diff = data[i] - mean;
      sumSq += diff * diff;
    }
    const variance = sumSq / data.length;
    const std = Math.sqrt(variance);
    
    return { mean, std };
  }

  private normalize(data: Float32Array, mean: number, std: number): Float32Array {
    const out = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      out[i] = (data[i] - mean) / std;
    }
    return out;
  }

  private ncc(template: Float32Array, candidate: Float32Array): number {
    if (template.length !== candidate.length) return -1;
    
    let sum = 0;
    for (let i = 0; i < template.length; i++) {
      sum += template[i] * candidate[i];
    }
    return sum / template.length;
  }

  private expandROIWithLastHead(poseRoi: ROI | null): ROI | null {
    // If we have last head, include a window around it
    let roi = poseRoi;
    if (this.lastGoodDetection) {
      const hx = this.lastGoodDetection.clubHead.x * this.width;
      const hy = this.lastGoodDetection.clubHead.y * this.height;
      const size = Math.max(this.width, this.height) * 0.25;
      const box: ROI = { x: Math.floor(hx - size/2), y: Math.floor(hy - size/2), w: Math.floor(size), h: Math.floor(size) };
      roi = roi ? this.unionROI(roi, box) : box;
    }
    return roi;
  }

  private unionROI(a: ROI, b: ROI): ROI {
    const x1 = Math.max(0, Math.min(a.x, b.x));
    const y1 = Math.max(0, Math.min(a.y, b.y));
    const x2 = Math.min(this.width, Math.max(a.x + a.w, b.x + b.w));
    const y2 = Math.min(this.height, Math.max(a.y + a.h, b.y + b.h));
    return { x: x1, y: y1, w: Math.max(1, x2 - x1), h: Math.max(1, y2 - y1) };
  }

  private poseBasedFallback(pose: any, wristSeparation: number): ShaftDetectionResult {
    if (!pose || !pose.landmarks) {
      return {
        clubHead: { x: 0.5, y: 0.7 },
        shaftLine: null,
        confidence: 0.1,
        method: 'pose_fallback'
      };
    }
    
    const lw = pose.landmarks[9];
    const rw = pose.landmarks[10];
    const le = pose.landmarks[7];
    const re = pose.landmarks[8];
    
    // Use dominant hand extrapolation
    let clubX = 0.5, clubY = 0.7;
    
    if (lw && le && (lw.visibility || 0) > 0.2 && (le.visibility || 0) > 0.2) {
      const dx = lw.x - le.x;
      const dy = lw.y - le.y;
      const len = Math.hypot(dx, dy) || 1;
      const ext = Math.max(0.10, Math.min(0.28, len * 0.9 + wristSeparation * 0.6));
      clubX = lw.x + (dx / len) * ext;
      clubY = lw.y + (dy / len) * ext;
    } else if (rw && re && (rw.visibility || 0) > 0.2 && (re.visibility || 0) > 0.2) {
      const dx = rw.x - re.x;
      const dy = rw.y - re.y;
      const len = Math.hypot(dx, dy) || 1;
      const ext = Math.max(0.10, Math.min(0.28, len * 0.9 + wristSeparation * 0.6));
      clubX = rw.x + (dx / len) * ext;
      clubY = rw.y + (dy / len) * ext;
    }
    
    return {
      clubHead: {
        x: Math.max(0, Math.min(1, clubX)),
        y: Math.max(0, Math.min(1, clubY))
      },
      shaftLine: null,
      confidence: 0.4,
      method: 'pose_fallback'
    };
  }
}

