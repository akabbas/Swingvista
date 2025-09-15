import { TrajectoryPoint, SwingTrajectory } from './mediapipe';
import { SwingPhase } from './swing-phases';
import { TrajectoryMetrics, SwingPathAnalysis } from './trajectory-analysis';
import { SwingReportCard } from './vista-swing-ai';

export interface ExportData {
  swingId: string;
  timestamp: number;
  club: string;
  trajectory: SwingTrajectory;
  phases: SwingPhase[];
  metrics: TrajectoryMetrics;
  pathAnalysis: SwingPathAnalysis;
  reportCard: SwingReportCard;
  videoUrl?: string;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'video';
  includeTrajectory: boolean;
  includePhases: boolean;
  includeMetrics: boolean;
  includeReportCard: boolean;
  videoQuality: 'low' | 'medium' | 'high';
  frameRate: number;
}

export class SwingExporter {
  /**
   * Export swing data as JSON
   */
  static exportAsJSON(data: ExportData, options: ExportOptions): string {
    const exportData: any = {
      swingId: data.swingId,
      timestamp: data.timestamp,
      club: data.club,
      videoUrl: data.videoUrl
    };

    if (options.includeTrajectory) {
      exportData.trajectory = data.trajectory;
    }

    if (options.includePhases) {
      exportData.phases = data.phases;
    }

    if (options.includeMetrics) {
      exportData.metrics = data.metrics;
      exportData.pathAnalysis = data.pathAnalysis;
    }

    if (options.includeReportCard) {
      exportData.reportCard = data.reportCard;
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export swing data as CSV
   */
  static exportAsCSV(data: ExportData, options: ExportOptions): string {
    const rows: string[] = [];
    
    // Header
    const headers = ['Frame', 'Timestamp', 'RightWrist_X', 'RightWrist_Y', 'RightWrist_Z'];
    if (options.includePhases) {
      headers.push('Phase', 'PhaseProgress');
    }
    if (options.includeMetrics) {
      headers.push('Velocity', 'Acceleration');
    }
    rows.push(headers.join(','));

    // Data rows
    data.trajectory.rightWrist.forEach((point, index) => {
      const row = [
        point.frame.toString(),
        point.timestamp.toString(),
        point.x.toString(),
        point.y.toString(),
        point.z.toString()
      ];

      if (options.includePhases) {
        const phase = this.getPhaseAtFrame(data.phases, point.frame);
        const phaseProgress = phase ? this.getPhaseProgress(phase, point.frame) : 0;
        row.push(phase?.name || 'Unknown', phaseProgress.toString());
      }

      if (options.includeMetrics) {
        // Calculate velocity and acceleration for this point
        const velocity = index > 0 ? this.calculateVelocity(
          data.trajectory.rightWrist[index - 1],
          point
        ) : 0;
        const acceleration = index > 1 ? this.calculateAcceleration(
          data.trajectory.rightWrist[index - 2],
          data.trajectory.rightWrist[index - 1],
          point
        ) : 0;
        row.push(velocity.toString(), acceleration.toString());
      }

      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Export annotated video
   */
  static async exportAnnotatedVideo(
    videoElement: HTMLVideoElement,
    trajectory: SwingTrajectory,
    phases: SwingPhase[],
    options: ExportOptions
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas size
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const stream = canvas.captureStream(options.frameRate);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      // Start recording
      mediaRecorder.start();

      // Draw frames
      const drawFrame = (frameIndex: number) => {
        if (frameIndex >= trajectory.rightWrist.length) {
          mediaRecorder.stop();
          return;
        }

        // Draw video frame
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Draw trajectory
        this.drawTrajectory(ctx, trajectory, frameIndex, canvas.width, canvas.height);

        // Draw phases
        this.drawPhases(ctx, phases, frameIndex, canvas.width, canvas.height);

        // Draw landmarks
        this.drawLandmarks(ctx, trajectory, frameIndex);

        // Continue to next frame
        setTimeout(() => drawFrame(frameIndex + 1), 1000 / options.frameRate);
      };

      // Start drawing
      drawFrame(0);
    });
  }

  /**
   * Download file
   */
  static downloadFile(content: string | Blob, filename: string, mimeType: string) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Get phase at specific frame
   */
  private static getPhaseAtFrame(phases: SwingPhase[], frame: number): SwingPhase | null {
    return phases.find(phase => frame >= phase.startFrame && frame <= phase.endFrame) || null;
  }

  /**
   * Get phase progress (0-1) at specific frame
   */
  private static getPhaseProgress(phase: SwingPhase, frame: number): number {
    if (frame < phase.startFrame) return 0;
    if (frame > phase.endFrame) return 1;

    const totalFrames = phase.endFrame - phase.startFrame;
    const currentFrames = frame - phase.startFrame;

    return totalFrames > 0 ? currentFrames / totalFrames : 0;
  }

  /**
   * Calculate velocity between two points
   */
  private static calculateVelocity(point1: TrajectoryPoint, point2: TrajectoryPoint): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    const dt = point2.timestamp - point1.timestamp;

    if (dt === 0) return 0;

    return Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;
  }

  /**
   * Calculate acceleration between three points
   */
  private static calculateAcceleration(
    point1: TrajectoryPoint,
    point2: TrajectoryPoint,
    point3: TrajectoryPoint
  ): number {
    const v1 = this.calculateVelocity(point1, point2);
    const v2 = this.calculateVelocity(point2, point3);
    const dt = (point3.timestamp - point1.timestamp) / 2;

    if (dt === 0) return 0;

    return Math.abs(v2 - v1) / dt;
  }

  /**
   * Draw trajectory on canvas
   */
  private static drawTrajectory(
    ctx: CanvasRenderingContext2D,
    trajectory: SwingTrajectory,
    currentFrame: number,
    width: number,
    height: number
  ) {
    const rightWrist = trajectory.rightWrist;
    if (rightWrist.length < 2) return;

    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(rightWrist[0].x * width, rightWrist[0].y * height);

    for (let i = 1; i <= Math.min(currentFrame, rightWrist.length - 1); i++) {
      const point = rightWrist[i];
      ctx.lineTo(point.x * width, point.y * height);
    }

    ctx.stroke();

    // Draw current position
    if (rightWrist[currentFrame]) {
      const currentPoint = rightWrist[currentFrame];
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(
        currentPoint.x * width,
        currentPoint.y * height,
        8,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  }

  /**
   * Draw phases on canvas
   */
  private static drawPhases(
    ctx: CanvasRenderingContext2D,
    phases: SwingPhase[],
    frame: number,
    width: number,
    height: number
  ) {
    const phase = phases.find(p => frame >= p.startFrame && frame <= p.endFrame);
    
    if (phase) {
      // Draw phase background
      ctx.fillStyle = phase.color + '20';
      ctx.fillRect(0, 0, width, height);

      // Draw phase name
      ctx.fillStyle = phase.color;
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(phase.name, width / 2, 50);
    }
  }

  /**
   * Draw landmarks on canvas
   */
  private static drawLandmarks(
    ctx: CanvasRenderingContext2D,
    trajectory: SwingTrajectory,
    frame: number
  ) {
    if (frame >= trajectory.rightWrist.length) return;

    const rightWrist = trajectory.rightWrist[frame];
    const leftWrist = trajectory.leftWrist[frame];
    const rightShoulder = trajectory.rightShoulder[frame];
    const leftShoulder = trajectory.leftShoulder[frame];

    // Draw right wrist (club head)
    if (rightWrist) {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(
        rightWrist.x * ctx.canvas.width,
        rightWrist.y * ctx.canvas.height,
        6,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    // Draw left wrist
    if (leftWrist) {
      ctx.fillStyle = '#3B82F6';
      ctx.beginPath();
      ctx.arc(
        leftWrist.x * ctx.canvas.width,
        leftWrist.y * ctx.canvas.height,
        4,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    // Draw shoulders
    if (rightShoulder) {
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(
        rightShoulder.x * ctx.canvas.width,
        rightShoulder.y * ctx.canvas.height,
        4,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    if (leftShoulder) {
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(
        leftShoulder.x * ctx.canvas.width,
        leftShoulder.y * ctx.canvas.height,
        4,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  }
}

export const defaultExportOptions: ExportOptions = {
  format: 'json',
  includeTrajectory: true,
  includePhases: true,
  includeMetrics: true,
  includeReportCard: true,
  videoQuality: 'medium',
  frameRate: 30
};
