import type { PoseResult } from './mediapipe';
import type { EnhancedSwingPhase } from './enhanced-swing-phases';
import type { ProfessionalGolfMetrics } from './professional-golf-metrics';
import type { AIAnalysisResult } from './ai-predictive-analysis';

export interface SwingMetrics {
  sessionId: string;
  studentId: string;
  timestamp: Date;
  overallScore: number;
  phases: PhaseMetrics[];
  faults: FaultMetrics[];
  drills: DrillMetrics[];
  progress: ProgressMetrics;
  health: HealthMetrics;
}

export interface PhaseMetrics {
  phaseName: string;
  startTime: number;
  endTime: number;
  duration: number;
  grade: string;
  confidence: number;
  tempo: number;
  balance: number;
  posture: number;
  power: number;
  accuracy: number;
}

export interface FaultMetrics {
  faultId: string;
  faultName: string;
  severity: string;
  category: string;
  confidence: number;
  detectedAt: number;
  impactOnScore: number;
  correctionSuggestions: string[];
}

export interface DrillMetrics {
  drillId: string;
  drillName: string;
  category: string;
  difficulty: string;
  duration: number;
  repetitions: number;
  effectivenessScore: number;
  completionRate: number;
  improvementRate: number;
}

export interface ProgressMetrics {
  currentScore: number;
  previousScore: number;
  improvement: number;
  trend: string;
  milestones: MilestoneMetrics[];
  goals: GoalMetrics[];
}

export interface MilestoneMetrics {
  milestoneId: string;
  name: string;
  achievedAt: Date;
  metric: string;
  value: number;
  category: string;
}

export interface GoalMetrics {
  goalId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  deadline: Date;
  isAchieved: boolean;
}

export interface HealthMetrics {
  heartRate: number;
  caloriesBurned: number;
  steps: number;
  distance: number;
  duration: number;
  intensity: string;
  recoveryTime: number;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'xml' | 'excel';
  includePhases: boolean;
  includeFaults: boolean;
  includeDrills: boolean;
  includeProgress: boolean;
  includeHealth: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
  compression: boolean;
  encryption: boolean;
}

export interface APIEndpoint {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  authentication: {
    type: 'bearer' | 'basic' | 'api-key' | 'oauth';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
  };
}

export interface ThirdPartyIntegration {
  id: string;
  name: string;
  type: 'health' | 'fitness' | 'golf' | 'analytics' | 'social';
  enabled: boolean;
  endpoints: APIEndpoint[];
  syncFrequency: number; // minutes
  lastSync: Date;
  status: 'active' | 'inactive' | 'error';
}

export interface VideoExportOptions {
  format: 'mp4' | 'mov' | 'avi' | 'webm';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  includeOverlays: boolean;
  overlaySettings: {
    showPose: boolean;
    showPhases: boolean;
    showMetrics: boolean;
    showAnnotations: boolean;
    showVoiceNotes: boolean;
  };
  compression: boolean;
  watermark: boolean;
}

/**
 * CSV export for swing metrics
 */
export class CSVExporter {
  /**
   * Export swing metrics to CSV
   */
  static exportSwingMetrics(metrics: SwingMetrics[], options: ExportOptions): string {
    const csvData: string[] = [];
    
    // Add headers
    const headers = this.generateHeaders(options);
    csvData.push(headers.join(','));
    
    // Add data rows
    metrics.forEach(metric => {
      const row = this.generateDataRow(metric, options);
      csvData.push(row.join(','));
    });
    
    return csvData.join('\n');
  }

  /**
   * Export phases to CSV
   */
  static exportPhases(phases: EnhancedSwingPhase[], options: ExportOptions): string {
    const csvData: string[] = [];
    
    // Add headers
    const headers = [
      'Phase Name',
      'Start Time',
      'End Time',
      'Duration',
      'Grade',
      'Confidence',
      'Tempo',
      'Balance',
      'Posture',
      'Power',
      'Accuracy'
    ];
    csvData.push(headers.join(','));
    
    // Add data rows
    phases.forEach(phase => {
      const row = [
        phase.name,
        phase.startTime.toString(),
        phase.endTime.toString(),
        phase.duration.toString(),
        phase.grade,
        phase.confidence.toString(),
        phase.metrics?.tempo?.toString() || '0',
        phase.metrics?.balance?.toString() || '0',
        phase.metrics?.posture?.toString() || '0',
        phase.metrics?.power?.toString() || '0',
        phase.metrics?.accuracy?.toString() || '0'
      ];
      csvData.push(row.join(','));
    });
    
    return csvData.join('\n');
  }

  /**
   * Export faults to CSV
   */
  static exportFaults(faults: any[], options: ExportOptions): string {
    const csvData: string[] = [];
    
    // Add headers
    const headers = [
      'Fault ID',
      'Fault Name',
      'Severity',
      'Category',
      'Confidence',
      'Detected At',
      'Impact on Score',
      'Correction Suggestions'
    ];
    csvData.push(headers.join(','));
    
    // Add data rows
    faults.forEach(fault => {
      const row = [
        fault.id,
        fault.name,
        fault.severity,
        fault.category,
        fault.confidence.toString(),
        fault.detectedAt.toString(),
        fault.impactOnScore.toString(),
        fault.correctionSuggestions.join(';')
      ];
      csvData.push(row.join(','));
    });
    
    return csvData.join('\n');
  }

  /**
   * Export drills to CSV
   */
  static exportDrills(drills: any[], options: ExportOptions): string {
    const csvData: string[] = [];
    
    // Add headers
    const headers = [
      'Drill ID',
      'Drill Name',
      'Category',
      'Difficulty',
      'Duration',
      'Repetitions',
      'Effectiveness Score',
      'Completion Rate',
      'Improvement Rate'
    ];
    csvData.push(headers.join(','));
    
    // Add data rows
    drills.forEach(drill => {
      const row = [
        drill.id,
        drill.name,
        drill.category,
        drill.difficulty,
        drill.duration.toString(),
        drill.repetitions.toString(),
        drill.effectivenessScore.toString(),
        drill.completionRate.toString(),
        drill.improvementRate.toString()
      ];
      csvData.push(row.join(','));
    });
    
    return csvData.join('\n');
  }

  private static generateHeaders(options: ExportOptions): string[] {
    const headers = [
      'Session ID',
      'Student ID',
      'Timestamp',
      'Overall Score'
    ];
    
    if (options.includePhases) {
      headers.push('Phase Count', 'Average Phase Score');
    }
    
    if (options.includeFaults) {
      headers.push('Fault Count', 'Critical Faults', 'High Severity Faults');
    }
    
    if (options.includeDrills) {
      headers.push('Drill Count', 'Average Effectiveness', 'Completion Rate');
    }
    
    if (options.includeProgress) {
      headers.push('Current Score', 'Previous Score', 'Improvement', 'Trend');
    }
    
    if (options.includeHealth) {
      headers.push('Heart Rate', 'Calories Burned', 'Steps', 'Distance', 'Duration');
    }
    
    return headers;
  }

  private static generateDataRow(metric: SwingMetrics, options: ExportOptions): string[] {
    const row = [
      metric.sessionId,
      metric.studentId,
      metric.timestamp.toISOString(),
      metric.overallScore.toString()
    ];
    
    if (options.includePhases) {
      const phaseCount = metric.phases.length;
      const avgPhaseScore = metric.phases.reduce((sum, phase) => sum + phase.confidence, 0) / phaseCount;
      row.push(phaseCount.toString(), avgPhaseScore.toString());
    }
    
    if (options.includeFaults) {
      const faultCount = metric.faults.length;
      const criticalFaults = metric.faults.filter(f => f.severity === 'critical').length;
      const highFaults = metric.faults.filter(f => f.severity === 'high').length;
      row.push(faultCount.toString(), criticalFaults.toString(), highFaults.toString());
    }
    
    if (options.includeDrills) {
      const drillCount = metric.drills.length;
      const avgEffectiveness = metric.drills.reduce((sum, drill) => sum + drill.effectivenessScore, 0) / drillCount;
      const completionRate = metric.drills.reduce((sum, drill) => sum + drill.completionRate, 0) / drillCount;
      row.push(drillCount.toString(), avgEffectiveness.toString(), completionRate.toString());
    }
    
    if (options.includeProgress) {
      row.push(
        metric.progress.currentScore.toString(),
        metric.progress.previousScore.toString(),
        metric.progress.improvement.toString(),
        metric.progress.trend
      );
    }
    
    if (options.includeHealth) {
      row.push(
        metric.health.heartRate.toString(),
        metric.health.caloriesBurned.toString(),
        metric.health.steps.toString(),
        metric.health.distance.toString(),
        metric.health.duration.toString()
      );
    }
    
    return row;
  }
}

/**
 * API for integration with other golf apps
 */
export class APIIntegrationManager {
  private integrations: Map<string, ThirdPartyIntegration> = new Map();
  private apiEndpoints: Map<string, APIEndpoint> = new Map();

  constructor() {
    this.initializeDefaultIntegrations();
  }

  private initializeDefaultIntegrations(): void {
    // Initialize default integrations
    this.integrations.set('golfshot', {
      id: 'golfshot',
      name: 'GolfShot',
      type: 'golf',
      enabled: false,
      endpoints: [],
      syncFrequency: 60,
      lastSync: new Date(),
      status: 'inactive'
    });

    this.integrations.set('18birdies', {
      id: '18birdies',
      name: '18Birdies',
      type: 'golf',
      enabled: false,
      endpoints: [],
      syncFrequency: 30,
      lastSync: new Date(),
      status: 'inactive'
    });

    this.integrations.set('golfnow', {
      id: 'golfnow',
      name: 'GolfNow',
      type: 'golf',
      enabled: false,
      endpoints: [],
      syncFrequency: 120,
      lastSync: new Date(),
      status: 'inactive'
    });
  }

  /**
   * Add new integration
   */
  addIntegration(integration: ThirdPartyIntegration): void {
    this.integrations.set(integration.id, integration);
  }

  /**
   * Update integration
   */
  updateIntegration(id: string, updates: Partial<ThirdPartyIntegration>): boolean {
    const integration = this.integrations.get(id);
    if (!integration) return false;

    const updatedIntegration = { ...integration, ...updates };
    this.integrations.set(id, updatedIntegration);
    return true;
  }

  /**
   * Remove integration
   */
  removeIntegration(id: string): boolean {
    return this.integrations.delete(id);
  }

  /**
   * Get integration
   */
  getIntegration(id: string): ThirdPartyIntegration | null {
    return this.integrations.get(id) || null;
  }

  /**
   * Get all integrations
   */
  getAllIntegrations(): ThirdPartyIntegration[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Get active integrations
   */
  getActiveIntegrations(): ThirdPartyIntegration[] {
    return this.getAllIntegrations().filter(integration => integration.enabled);
  }

  /**
   * Sync data with integration
   */
  async syncWithIntegration(integrationId: string, data: any): Promise<boolean> {
    const integration = this.integrations.get(integrationId);
    if (!integration || !integration.enabled) return false;

    try {
      // Simulate API call
      await this.makeAPICall(integration, data);
      
      // Update last sync time
      integration.lastSync = new Date();
      integration.status = 'active';
      this.integrations.set(integrationId, integration);
      
      return true;
    } catch (error) {
      integration.status = 'error';
      this.integrations.set(integrationId, integration);
      return false;
    }
  }

  /**
   * Sync all active integrations
   */
  async syncAllIntegrations(data: any): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    const activeIntegrations = this.getActiveIntegrations();

    for (const integration of activeIntegrations) {
      const result = await this.syncWithIntegration(integration.id, data);
      results.set(integration.id, result);
    }

    return results;
  }

  private async makeAPICall(integration: ThirdPartyIntegration, data: any): Promise<any> {
    // Simulate API call based on integration type
    switch (integration.type) {
      case 'golf':
        return this.syncGolfApp(integration, data);
      case 'health':
        return this.syncHealthApp(integration, data);
      case 'fitness':
        return this.syncFitnessApp(integration, data);
      case 'analytics':
        return this.syncAnalyticsApp(integration, data);
      case 'social':
        return this.syncSocialApp(integration, data);
      default:
        throw new Error(`Unsupported integration type: ${integration.type}`);
    }
  }

  private async syncGolfApp(integration: ThirdPartyIntegration, data: any): Promise<any> {
    // Simulate golf app sync
    console.log(`Syncing with ${integration.name}:`, data);
    return { success: true, message: 'Golf app sync successful' };
  }

  private async syncHealthApp(integration: ThirdPartyIntegration, data: any): Promise<any> {
    // Simulate health app sync
    console.log(`Syncing with ${integration.name}:`, data);
    return { success: true, message: 'Health app sync successful' };
  }

  private async syncFitnessApp(integration: ThirdPartyIntegration, data: any): Promise<any> {
    // Simulate fitness app sync
    console.log(`Syncing with ${integration.name}:`, data);
    return { success: true, message: 'Fitness app sync successful' };
  }

  private async syncAnalyticsApp(integration: ThirdPartyIntegration, data: any): Promise<any> {
    // Simulate analytics app sync
    console.log(`Syncing with ${integration.name}:`, data);
    return { success: true, message: 'Analytics app sync successful' };
  }

  private async syncSocialApp(integration: ThirdPartyIntegration, data: any): Promise<any> {
    // Simulate social app sync
    console.log(`Syncing with ${integration.name}:`, data);
    return { success: true, message: 'Social app sync successful' };
  }
}

/**
 * Apple Health/Garmin Connect integration
 */
export class HealthIntegrationManager {
  private healthKit: any = null;
  private garminConnect: any = null;

  constructor() {
    this.initializeHealthKit();
    this.initializeGarminConnect();
  }

  private initializeHealthKit(): void {
    // Initialize Apple HealthKit integration
    if (typeof window !== 'undefined' && 'navigator' in window) {
      // Check if HealthKit is available
      this.healthKit = {
        available: true,
        permissions: {
          read: ['heartRate', 'steps', 'calories', 'distance'],
          write: ['workout', 'heartRate', 'steps', 'calories']
        }
      };
    }
  }

  private initializeGarminConnect(): void {
    // Initialize Garmin Connect integration
    this.garminConnect = {
      available: true,
      apiKey: process.env.GARMIN_CONNECT_API_KEY,
      baseUrl: 'https://connectapi.garmin.com'
    };
  }

  /**
   * Request HealthKit permissions
   */
  async requestHealthKitPermissions(): Promise<boolean> {
    if (!this.healthKit?.available) return false;

    try {
      // Simulate permission request
      console.log('Requesting HealthKit permissions...');
      return true;
    } catch (error) {
      console.error('HealthKit permission request failed:', error);
      return false;
    }
  }

  /**
   * Read health data from HealthKit
   */
  async readHealthData(startDate: Date, endDate: Date): Promise<HealthMetrics> {
    if (!this.healthKit?.available) {
      throw new Error('HealthKit not available');
    }

    try {
      // Simulate reading health data
      const healthData: HealthMetrics = {
        heartRate: 75,
        caloriesBurned: 250,
        steps: 5000,
        distance: 3.5,
        duration: 45,
        intensity: 'moderate',
        recoveryTime: 24
      };

      return healthData;
    } catch (error) {
      console.error('Failed to read health data:', error);
      throw error;
    }
  }

  /**
   * Write workout data to HealthKit
   */
  async writeWorkoutToHealthKit(workoutData: any): Promise<boolean> {
    if (!this.healthKit?.available) return false;

    try {
      // Simulate writing workout data
      console.log('Writing workout to HealthKit:', workoutData);
      return true;
    } catch (error) {
      console.error('Failed to write workout to HealthKit:', error);
      return false;
    }
  }

  /**
   * Sync with Garmin Connect
   */
  async syncWithGarminConnect(data: any): Promise<boolean> {
    if (!this.garminConnect?.available) return false;

    try {
      // Simulate Garmin Connect sync
      console.log('Syncing with Garmin Connect:', data);
      return true;
    } catch (error) {
      console.error('Failed to sync with Garmin Connect:', error);
      return false;
    }
  }

  /**
   * Get available health integrations
   */
  getAvailableIntegrations(): string[] {
    const integrations: string[] = [];
    
    if (this.healthKit?.available) {
      integrations.push('Apple Health');
    }
    
    if (this.garminConnect?.available) {
      integrations.push('Garmin Connect');
    }
    
    return integrations;
  }
}

/**
 * Video export with overlay graphics
 */
export class VideoExporter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private videoElement: HTMLVideoElement;

  constructor(canvas: HTMLCanvasElement, videoElement: HTMLVideoElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.videoElement = videoElement;
  }

  /**
   * Export video with overlays
   */
  async exportVideoWithOverlays(
    options: VideoExportOptions,
    poses: PoseResult[],
    phases: EnhancedSwingPhase[],
    annotations: any[],
    voiceNotes: any[]
  ): Promise<Blob> {
    const { format, quality, resolution, frameRate, includeOverlays, overlaySettings } = options;
    
    // Create video stream
    const stream = this.canvas.captureStream(frameRate);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: this.getMimeType(format),
      videoBitsPerSecond: this.getBitrate(quality)
    });

    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: this.getMimeType(format) });
        resolve(blob);
      };

      mediaRecorder.onerror = (error) => {
        reject(error);
      };

      // Start recording
      mediaRecorder.start();
      
      // Render overlays frame by frame
      this.renderOverlays(poses, phases, annotations, voiceNotes, overlaySettings);
      
      // Stop recording after video duration
      setTimeout(() => {
        mediaRecorder.stop();
      }, this.videoElement.duration * 1000);
    });
  }

  /**
   * Render overlays on canvas
   */
  private renderOverlays(
    poses: PoseResult[],
    phases: EnhancedSwingPhase[],
    annotations: any[],
    voiceNotes: any[],
    overlaySettings: any
  ): void {
    const frameCount = poses.length;
    let currentFrame = 0;

    const renderFrame = () => {
      if (currentFrame >= frameCount) return;

      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw video frame
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
      
      // Draw overlays
      if (overlaySettings.showPose) {
        this.drawPoseOverlay(poses[currentFrame]);
      }
      
      if (overlaySettings.showPhases) {
        this.drawPhaseOverlay(phases, currentFrame);
      }
      
      if (overlaySettings.showMetrics) {
        this.drawMetricsOverlay(poses[currentFrame]);
      }
      
      if (overlaySettings.showAnnotations) {
        this.drawAnnotationsOverlay(annotations, currentFrame);
      }
      
      if (overlaySettings.showVoiceNotes) {
        this.drawVoiceNotesOverlay(voiceNotes, currentFrame);
      }
      
      currentFrame++;
      requestAnimationFrame(renderFrame);
    };

    renderFrame();
  }

  /**
   * Draw pose overlay
   */
  private drawPoseOverlay(pose: PoseResult): void {
    if (!pose.landmarks) return;

    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2;
    
    // Draw pose connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 7],
      [0, 4], [4, 5], [5, 6], [6, 8],
      [9, 10], [11, 12], [11, 23], [12, 24],
      [23, 24], [11, 13], [13, 15], [12, 14],
      [14, 16], [23, 25], [25, 27], [24, 26], [26, 28]
    ];

    connections.forEach(([startIdx, endIdx]) => {
      const start = pose.landmarks[startIdx];
      const end = pose.landmarks[endIdx];
      
      if (start && end && (start.visibility ?? 0) > 0.5 && (end.visibility ?? 0) > 0.5) {
        this.ctx.beginPath();
        this.ctx.moveTo(start.x * this.canvas.width, start.y * this.canvas.height);
        this.ctx.lineTo(end.x * this.canvas.width, end.y * this.canvas.height);
        this.ctx.stroke();
      }
    });

    // Draw landmarks
    pose.landmarks.forEach(landmark => {
      if ((landmark.visibility ?? 0) > 0.5) {
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(
          landmark.x * this.canvas.width,
          landmark.y * this.canvas.height,
          3,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
      }
    });
  }

  /**
   * Draw phase overlay
   */
  private drawPhaseOverlay(phases: EnhancedSwingPhase[], frameIndex: number): void {
    const currentPhase = phases.find(phase => 
      frameIndex >= phase.startFrame && frameIndex <= phase.endFrame
    );
    
    if (currentPhase) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(10, 10, 200, 40);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText(currentPhase.name.toUpperCase(), 20, 30);
    }
  }

  /**
   * Draw metrics overlay
   */
  private drawMetricsOverlay(pose: PoseResult): void {
    // Draw metrics in top-right corner
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(this.canvas.width - 150, 10, 140, 80);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`Confidence: ${(pose.confidence * 100).toFixed(0)}%`, this.canvas.width - 140, 30);
    this.ctx.fillText(`Timestamp: ${pose.timestamp.toFixed(2)}s`, this.canvas.width - 140, 50);
  }

  /**
   * Draw annotations overlay
   */
  private drawAnnotationsOverlay(annotations: any[], frameIndex: number): void {
    const relevantAnnotations = annotations.filter(annotation => 
      annotation.timestamp <= frameIndex / 30 // Assuming 30fps
    );
    
    relevantAnnotations.forEach(annotation => {
      this.ctx.strokeStyle = annotation.color || '#ffff00';
      this.ctx.lineWidth = 2;
      
      if (annotation.type === 'arrow') {
        this.drawArrow(annotation.position, annotation.size);
      } else if (annotation.type === 'circle') {
        this.drawCircle(annotation.position, annotation.size);
      } else if (annotation.type === 'text') {
        this.drawText(annotation.position, annotation.content);
      }
    });
  }

  /**
   * Draw voice notes overlay
   */
  private drawVoiceNotesOverlay(voiceNotes: any[], frameIndex: number): void {
    const relevantVoiceNotes = voiceNotes.filter(voiceNote => 
      voiceNote.timestamp <= frameIndex / 30
    );
    
    if (relevantVoiceNotes.length > 0) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(10, this.canvas.height - 60, 200, 50);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '12px Arial';
      this.ctx.fillText('Voice Note Available', 20, this.canvas.height - 40);
    }
  }

  private drawArrow(position: { x: number; y: number }, size: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(position.x, position.y);
    this.ctx.lineTo(position.x + size, position.y - size);
    this.ctx.lineTo(position.x + size - 5, position.y - size + 5);
    this.ctx.moveTo(position.x + size, position.y - size);
    this.ctx.lineTo(position.x + size - 5, position.y - size - 5);
    this.ctx.stroke();
  }

  private drawCircle(position: { x: number; y: number }, size: number): void {
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, size / 2, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private drawText(position: { x: number; y: number }, text: string): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(text, position.x, position.y);
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'webm': 'video/webm'
    };
    return mimeTypes[format] || 'video/mp4';
  }

  private getBitrate(quality: string): number {
    const bitrates: Record<string, number> = {
      'low': 500000,
      'medium': 1000000,
      'high': 2000000,
      'ultra': 4000000
    };
    return bitrates[quality] || 1000000;
  }
}

/**
 * Main data export and integration manager
 */
export class DataExportIntegrationManager {
  private csvExporter: CSVExporter;
  private apiManager: APIIntegrationManager;
  private healthManager: HealthIntegrationManager;
  private videoExporter: VideoExporter | null = null;

  constructor() {
    this.csvExporter = new CSVExporter();
    this.apiManager = new APIIntegrationManager();
    this.healthManager = new HealthIntegrationManager();
  }

  /**
   * Initialize video exporter
   */
  initializeVideoExporter(canvas: HTMLCanvasElement, videoElement: HTMLVideoElement): void {
    this.videoExporter = new VideoExporter(canvas, videoElement);
  }

  /**
   * Export swing metrics to CSV
   */
  exportSwingMetricsToCSV(metrics: SwingMetrics[], options: ExportOptions): string {
    return this.csvExporter.exportSwingMetrics(metrics, options);
  }

  /**
   * Export phases to CSV
   */
  exportPhasesToCSV(phases: EnhancedSwingPhase[], options: ExportOptions): string {
    return this.csvExporter.exportPhases(phases, options);
  }

  /**
   * Export faults to CSV
   */
  exportFaultsToCSV(faults: any[], options: ExportOptions): string {
    return this.csvExporter.exportFaults(faults, options);
  }

  /**
   * Export drills to CSV
   */
  exportDrillsToCSV(drills: any[], options: ExportOptions): string {
    return this.csvExporter.exportDrills(drills, options);
  }

  /**
   * Sync with third-party integrations
   */
  async syncWithIntegrations(data: any): Promise<Map<string, boolean>> {
    return this.apiManager.syncAllIntegrations(data);
  }

  /**
   * Sync with health apps
   */
  async syncWithHealthApps(data: any): Promise<boolean> {
    const integrations = this.healthManager.getAvailableIntegrations();
    let success = true;

    for (const integration of integrations) {
      if (integration === 'Apple Health') {
        const result = await this.healthManager.writeWorkoutToHealthKit(data);
        success = success && result;
      } else if (integration === 'Garmin Connect') {
        const result = await this.healthManager.syncWithGarminConnect(data);
        success = success && result;
      }
    }

    return success;
  }

  /**
   * Export video with overlays
   */
  async exportVideoWithOverlays(
    options: VideoExportOptions,
    poses: PoseResult[],
    phases: EnhancedSwingPhase[],
    annotations: any[],
    voiceNotes: any[]
  ): Promise<Blob> {
    if (!this.videoExporter) {
      throw new Error('Video exporter not initialized');
    }

    return this.videoExporter.exportVideoWithOverlays(
      options,
      poses,
      phases,
      annotations,
      voiceNotes
    );
  }

  /**
   * Get available integrations
   */
  getAvailableIntegrations(): {
    api: ThirdPartyIntegration[];
    health: string[];
  } {
    return {
      api: this.apiManager.getAllIntegrations(),
      health: this.healthManager.getAvailableIntegrations()
    };
  }
}
