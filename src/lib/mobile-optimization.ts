import type { PoseResult } from './mediapipe';
import type { EnhancedSwingPhase } from './enhanced-swing-phases';
import type { ProfessionalGolfMetrics } from './professional-golf-metrics';

export interface MobileCameraConfig {
  facingMode: 'user' | 'environment';
  width: number;
  height: number;
  frameRate: number;
  quality: number;
  stabilization: boolean;
  flash: 'auto' | 'on' | 'off';
}

export interface TouchControlConfig {
  enableSwipe: boolean;
  enablePinch: boolean;
  enableTap: boolean;
  enableDoubleTap: boolean;
  swipeThreshold: number;
  pinchThreshold: number;
  tapThreshold: number;
}

export interface MobileVisualizationConfig {
  landmarkSize: number;
  connectionWidth: number;
  textSize: number;
  overlayOpacity: number;
  enableGestures: boolean;
  enableHapticFeedback: boolean;
  colorScheme: 'light' | 'dark' | 'auto';
}

export interface OfflineAnalysisConfig {
  enableOfflineMode: boolean;
  cacheSize: number;
  syncOnConnect: boolean;
  compressionLevel: number;
  encryptionEnabled: boolean;
}

export interface MobilePerformanceMetrics {
  frameRate: number;
  memoryUsage: number;
  batteryLevel: number;
  networkStatus: 'online' | 'offline' | 'slow';
  deviceOrientation: 'portrait' | 'landscape';
  screenSize: { width: number; height: number };
}

/**
 * Mobile camera integration for live swing recording
 */
export class MobileCameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private config: MobileCameraConfig;
  private isRecording = false;
  private recordingChunks: Blob[] = [];
  private mediaRecorder: MediaRecorder | null = null;

  constructor(config: Partial<MobileCameraConfig> = {}) {
    this.config = {
      facingMode: 'environment',
      width: 1280,
      height: 720,
      frameRate: 30,
      quality: 0.8,
      stabilization: true,
      flash: 'auto',
      ...config
    };
  }

  /**
   * Initialize camera with mobile-optimized settings
   */
  async initializeCamera(videoElement: HTMLVideoElement): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.config.facingMode,
          width: { ideal: this.config.width },
          height: { ideal: this.config.height },
          frameRate: { ideal: this.config.frameRate },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement = videoElement;
      videoElement.srcObject = this.stream;
      
      // Enable mobile-specific optimizations
      await this.enableMobileOptimizations();
      
    } catch (error) {
      throw new Error(`Camera initialization failed: ${error}`);
    }
  }

  /**
   * Start recording video
   */
  async startRecording(): Promise<void> {
    if (!this.stream || !this.videoElement) {
      throw new Error('Camera not initialized');
    }

    try {
      this.recordingChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 1000000
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordingChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Record in 100ms chunks
      this.isRecording = true;
      
    } catch (error) {
      throw new Error(`Recording start failed: ${error}`);
    }
  }

  /**
   * Stop recording and return video blob
   */
  async stopRecording(): Promise<Blob> {
    if (!this.mediaRecorder || !this.isRecording) {
      throw new Error('No active recording');
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.recordingChunks, { type: 'video/webm' });
        resolve(blob);
      };

      this.mediaRecorder!.onerror = (error) => {
        reject(new Error(`Recording error: ${error}`));
      };

      this.mediaRecorder!.stop();
      this.isRecording = false;
    });
  }

  /**
   * Capture current frame as image
   */
  async captureFrame(): Promise<Blob> {
    if (!this.videoElement) {
      throw new Error('Camera not initialized');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    ctx.drawImage(this.videoElement, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/jpeg', this.config.quality);
    });
  }

  /**
   * Enable mobile-specific optimizations
   */
  private async enableMobileOptimizations(): Promise<void> {
    if (!this.videoElement) return;

    // Enable autoplay for mobile
    this.videoElement.autoplay = true;
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;

    // Enable touch events
    this.videoElement.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.videoElement.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.videoElement.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Enable device orientation handling
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
  }

  private handleTouchStart(event: TouchEvent): void {
    // Handle touch start for camera controls
    event.preventDefault();
  }

  private handleTouchMove(event: TouchEvent): void {
    // Handle touch move for camera controls
    event.preventDefault();
  }

  private handleTouchEnd(event: TouchEvent): void {
    // Handle touch end for camera controls
    event.preventDefault();
  }

  private handleOrientationChange(): void {
    // Handle device orientation changes
    setTimeout(() => {
      if (this.videoElement) {
        this.videoElement.style.transform = this.getOrientationTransform();
      }
    }, 100);
  }

  private getOrientationTransform(): string {
    const orientation = screen.orientation?.angle || 0;
    return `rotate(${orientation}deg)`;
  }

  /**
   * Clean up camera resources
   */
  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }
}

/**
 * Touch-friendly controls for video playback
 */
export class TouchControlManager {
  private videoElement: HTMLVideoElement;
  private config: TouchControlConfig;
  private touchStartTime = 0;
  private touchStartX = 0;
  private touchStartY = 0;
  private lastTouchTime = 0;
  private isDragging = false;
  private initialDistance = 0;
  private initialScale = 1;

  constructor(videoElement: HTMLVideoElement, config: Partial<TouchControlConfig> = {}) {
    this.videoElement = videoElement;
    this.config = {
      enableSwipe: true,
      enablePinch: true,
      enableTap: true,
      enableDoubleTap: true,
      swipeThreshold: 50,
      pinchThreshold: 0.1,
      tapThreshold: 300,
      ...config
    };

    this.initializeTouchControls();
  }

  private initializeTouchControls(): void {
    // Prevent default touch behaviors
    this.videoElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.videoElement.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.videoElement.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.videoElement.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      // Single touch
      const touch = event.touches[0];
      this.touchStartTime = Date.now();
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.isDragging = false;
    } else if (event.touches.length === 2 && this.config.enablePinch) {
      // Pinch gesture
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.initialDistance = this.getDistance(touch1, touch2);
      this.initialScale = this.videoElement.style.transform ? 
        parseFloat(this.videoElement.style.transform.match(/scale\(([^)]+)\)/)?.[1] || '1') : 1;
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1 && this.config.enableSwipe) {
      // Swipe gesture
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;
      
      if (Math.abs(deltaX) > this.config.swipeThreshold || Math.abs(deltaY) > this.config.swipeThreshold) {
        this.isDragging = true;
        this.handleSwipe(deltaX, deltaY);
      }
    } else if (event.touches.length === 2 && this.config.enablePinch) {
      // Pinch gesture
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = this.getDistance(touch1, touch2);
      const scale = currentDistance / this.initialDistance;
      
      if (Math.abs(scale - 1) > this.config.pinchThreshold) {
        this.handlePinch(scale);
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    const touchDuration = Date.now() - this.touchStartTime;
    
    if (touchDuration < this.config.tapThreshold && !this.isDragging) {
      // Tap gesture
      if (Date.now() - this.lastTouchTime < 300) {
        // Double tap
        if (this.config.enableDoubleTap) {
          this.handleDoubleTap();
        }
      } else {
        // Single tap
        if (this.config.enableTap) {
          this.handleTap();
        }
      }
      this.lastTouchTime = Date.now();
    }

    this.isDragging = false;
  }

  private handleSwipe(deltaX: number, deltaY: number): void {
    // Horizontal swipe for seeking
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      const seekTime = (deltaX / this.videoElement.clientWidth) * this.videoElement.duration;
      this.videoElement.currentTime = Math.max(0, Math.min(this.videoElement.duration, 
        this.videoElement.currentTime + seekTime));
    }
    // Vertical swipe for volume
    else {
      const volumeChange = -deltaY / this.videoElement.clientHeight;
      this.videoElement.volume = Math.max(0, Math.min(1, this.videoElement.volume + volumeChange));
    }
  }

  private handlePinch(scale: number): void {
    // Pinch to zoom
    const newScale = Math.max(0.5, Math.min(3, this.initialScale * scale));
    this.videoElement.style.transform = `scale(${newScale})`;
  }

  private handleTap(): void {
    // Toggle play/pause
    if (this.videoElement.paused) {
      this.videoElement.play();
    } else {
      this.videoElement.pause();
    }
  }

  private handleDoubleTap(): void {
    // Toggle fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.videoElement.requestFullscreen();
    }
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

/**
 * Mobile-optimized pose visualization
 */
export class MobilePoseVisualizer {
  private canvas: HTMLCanvasElement;
  private config: MobileVisualizationConfig;
  private isVisible = true;
  private lastRenderTime = 0;
  private targetFrameRate = 30;

  constructor(canvas: HTMLCanvasElement, config: Partial<MobileVisualizationConfig> = {}) {
    this.canvas = canvas;
    this.config = {
      landmarkSize: 6,
      connectionWidth: 3,
      textSize: 14,
      overlayOpacity: 0.8,
      enableGestures: true,
      enableHapticFeedback: true,
      colorScheme: 'auto',
      ...config
    };

    this.initializeMobileOptimizations();
  }

  private initializeMobileOptimizations(): void {
    // Enable high DPI rendering
    this.setupHighDPICanvas();
    
    // Enable touch events for interaction
    if (this.config.enableGestures) {
      this.setupTouchGestures();
    }
    
    // Setup haptic feedback
    if (this.config.enableHapticFeedback && 'vibrate' in navigator) {
      this.setupHapticFeedback();
    }
  }

  private setupHighDPICanvas(): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  private setupTouchGestures(): void {
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private setupHapticFeedback(): void {
    // Setup haptic feedback for touch interactions
    this.canvas.addEventListener('touchstart', () => {
      navigator.vibrate(10); // Short vibration
    });
  }

  private handleTouchStart(event: TouchEvent): void {
    // Handle touch interactions with pose visualization
    event.preventDefault();
  }

  private handleTouchMove(event: TouchEvent): void {
    // Handle touch interactions with pose visualization
    event.preventDefault();
  }

  private handleTouchEnd(event: TouchEvent): void {
    // Handle touch interactions with pose visualization
    event.preventDefault();
  }

  /**
   * Render pose visualization optimized for mobile
   */
  renderPose(pose: PoseResult, phases: EnhancedSwingPhase[], currentTime: number): void {
    const now = Date.now();
    const deltaTime = now - this.lastRenderTime;
    const targetDelta = 1000 / this.targetFrameRate;
    
    // Throttle rendering for performance
    if (deltaTime < targetDelta) return;
    
    this.lastRenderTime = now;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx || !pose.landmarks) return;

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set mobile-optimized styles
    ctx.lineWidth = this.config.connectionWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Render pose connections
    this.renderPoseConnections(ctx, pose.landmarks);
    
    // Render landmarks
    this.renderLandmarks(ctx, pose.landmarks);
    
    // Render current phase
    this.renderCurrentPhase(ctx, phases, currentTime);
    
    // Render mobile-specific UI elements
    this.renderMobileUI(ctx);
  }

  private renderPoseConnections(ctx: CanvasRenderingContext2D, landmarks: any[]): void {
    const connections = [
      // Face
      [0, 1], [1, 2], [2, 3], [3, 7],
      [0, 4], [4, 5], [5, 6], [6, 8],
      [9, 10],
      // Torso
      [11, 12], [11, 23], [12, 24], [23, 24],
      // Arms
      [11, 13], [13, 15], [12, 14], [14, 16],
      // Legs
      [23, 25], [25, 27], [24, 26], [26, 28]
    ];

    ctx.strokeStyle = `rgba(0, 255, 0, ${this.config.overlayOpacity})`;
    
    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      
      if (start && end && (start.visibility ?? 0) > 0.5 && (end.visibility ?? 0) > 0.5) {
        ctx.beginPath();
        ctx.moveTo(start.x * this.canvas.width, start.y * this.canvas.height);
        ctx.lineTo(end.x * this.canvas.width, end.y * this.canvas.height);
        ctx.stroke();
      }
    });
  }

  private renderLandmarks(ctx: CanvasRenderingContext2D, landmarks: any[]): void {
    landmarks.forEach((landmark, index) => {
      if ((landmark.visibility ?? 0) > 0.5) {
        const x = landmark.x * this.canvas.width;
        const y = landmark.y * this.canvas.height;
        
        // Draw landmark
        ctx.fillStyle = `rgba(255, 0, 0, ${this.config.overlayOpacity})`;
        ctx.beginPath();
        ctx.arc(x, y, this.config.landmarkSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw landmark outline
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.config.overlayOpacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, this.config.landmarkSize, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  private renderCurrentPhase(ctx: CanvasRenderingContext2D, phases: EnhancedSwingPhase[], currentTime: number): void {
    const currentPhase = phases.find(phase => 
      currentTime >= phase.startTime && currentTime <= phase.endTime
    );
    
    if (currentPhase) {
      ctx.fillStyle = `rgba(0, 0, 0, 0.7)`;
      ctx.fillRect(10, 10, 200, 40);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${this.config.textSize}px Arial`;
      ctx.fillText(currentPhase.name.toUpperCase(), 20, 30);
    }
  }

  private renderMobileUI(ctx: CanvasRenderingContext2D): void {
    // Render mobile-specific UI elements
    const rect = this.canvas.getBoundingClientRect();
    
    // Touch indicators
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(rect.width - 60, rect.height - 60, 50, 50);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.config.textSize}px Arial`;
    ctx.fillText('👆', rect.width - 40, rect.height - 20);
  }
}

/**
 * Offline analysis capability
 */
export class OfflineAnalysisManager {
  private config: OfflineAnalysisConfig;
  private cache: Map<string, any> = new Map();
  private isOffline = false;
  private syncQueue: any[] = [];

  constructor(config: Partial<OfflineAnalysisConfig> = {}) {
    this.config = {
      enableOfflineMode: true,
      cacheSize: 100 * 1024 * 1024, // 100MB
      syncOnConnect: true,
      compressionLevel: 6,
      encryptionEnabled: false,
      ...config
    };

    this.initializeOfflineMode();
  }

  private initializeOfflineMode(): void {
    // Monitor network status
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Initialize service worker for offline functionality
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  private handleOnline(): void {
    this.isOffline = false;
    if (this.config.syncOnConnect) {
      this.syncOfflineData();
    }
  }

  private handleOffline(): void {
    this.isOffline = true;
  }

  /**
   * Store analysis data for offline access
   */
  async storeOfflineData(key: string, data: any): Promise<void> {
    if (!this.config.enableOfflineMode) return;

    try {
      // Compress data if needed
      const compressedData = await this.compressData(data);
      
      // Store in cache
      this.cache.set(key, {
        data: compressedData,
        timestamp: Date.now(),
        size: JSON.stringify(compressedData).length
      });
      
      // Store in IndexedDB for persistence
      await this.storeInIndexedDB(key, compressedData);
      
    } catch (error) {
      console.error('Failed to store offline data:', error);
    }
  }

  /**
   * Retrieve analysis data from offline storage
   */
  async getOfflineData(key: string): Promise<any> {
    if (!this.config.enableOfflineMode) return null;

    try {
      // Check cache first
      const cached = this.cache.get(key);
      if (cached) {
        return await this.decompressData(cached.data);
      }
      
      // Check IndexedDB
      const stored = await this.getFromIndexedDB(key);
      if (stored) {
        return await this.decompressData(stored);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to retrieve offline data:', error);
      return null;
    }
  }

  /**
   * Perform analysis offline
   */
  async performOfflineAnalysis(input: any): Promise<any> {
    if (!this.isOffline && !this.config.enableOfflineMode) {
      throw new Error('Offline analysis not enabled');
    }

    try {
      // Check if analysis exists in cache
      const cacheKey = this.generateCacheKey(input);
      const cached = await this.getOfflineData(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Perform analysis (simplified for offline)
      const result = await this.runOfflineAnalysis(input);
      
      // Store result for future use
      await this.storeOfflineData(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Offline analysis failed:', error);
      throw error;
    }
  }

  private async runOfflineAnalysis(input: any): Promise<any> {
    // Simplified offline analysis
    return {
      poses: [],
      phases: [],
      metrics: {
        overallProfessionalScore: 0.8,
        professionalGrade: 'B+'
      },
      timestamp: Date.now(),
      offline: true
    };
  }

  private async compressData(data: any): Promise<any> {
    // Simple compression using JSON stringify
    return JSON.stringify(data);
  }

  private async decompressData(compressedData: any): Promise<any> {
    // Simple decompression
    return JSON.parse(compressedData);
  }

  private generateCacheKey(input: any): string {
    // Generate cache key from input
    return btoa(JSON.stringify(input)).replace(/[^a-zA-Z0-9]/g, '');
  }

  private async storeInIndexedDB(key: string, data: any): Promise<void> {
    // Store in IndexedDB for persistence
    const request = indexedDB.open('OfflineAnalysis', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('analyses')) {
        db.createObjectStore('analyses', { keyPath: 'key' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['analyses'], 'readwrite');
      const store = transaction.objectStore('analyses');
      store.put({ key, data, timestamp: Date.now() });
    };
  }

  private async getFromIndexedDB(key: string): Promise<any> {
    // Retrieve from IndexedDB
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OfflineAnalysis', 1);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['analyses'], 'readonly');
        const store = transaction.objectStore('analyses');
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result?.data || null);
        };
        
        getRequest.onerror = () => {
          reject(getRequest.error);
        };
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async syncOfflineData(): Promise<void> {
    // Sync offline data when connection is restored
    for (const item of this.syncQueue) {
      try {
        // Sync item to server
        await this.syncToServer(item);
      } catch (error) {
        console.error('Sync failed for item:', item, error);
      }
    }
    
    this.syncQueue = [];
  }

  private async syncToServer(item: any): Promise<void> {
    // Sync item to server
    console.log('Syncing to server:', item);
  }
}

/**
 * Mobile performance monitoring
 */
export class MobilePerformanceMonitor {
  private metrics: MobilePerformanceMetrics[] = [];
  private isMonitoring = false;

  startMonitoring(): void {
    this.isMonitoring = true;
    
    // Monitor frame rate
    this.monitorFrameRate();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor battery level
    this.monitorBatteryLevel();
    
    // Monitor network status
    this.monitorNetworkStatus();
    
    // Monitor device orientation
    this.monitorOrientation();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  private monitorFrameRate(): void {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFrameRate = () => {
      if (!this.isMonitoring) return;
      
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const frameRate = frameCount / ((currentTime - lastTime) / 1000);
        this.recordMetric({ frameRate });
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }

  private monitorMemoryUsage(): void {
    setInterval(() => {
      if (!this.isMonitoring) return;
      
      const memory = (performance as any).memory;
      if (memory) {
        this.recordMetric({ memoryUsage: memory.usedJSHeapSize });
      }
    }, 1000);
  }

  private monitorBatteryLevel(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.recordMetric({ batteryLevel: battery.level });
        
        battery.addEventListener('levelchange', () => {
          this.recordMetric({ batteryLevel: battery.level });
        });
      });
    }
  }

  private monitorNetworkStatus(): void {
    const updateNetworkStatus = () => {
      if (!this.isMonitoring) return;
      
      const status = navigator.onLine ? 'online' : 'offline';
      this.recordMetric({ networkStatus: status });
    };
    
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();
  }

  private monitorOrientation(): void {
    const updateOrientation = () => {
      if (!this.isMonitoring) return;
      
      const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      this.recordMetric({ 
        deviceOrientation: orientation,
        screenSize: { width: window.innerWidth, height: window.innerHeight }
      });
    };
    
    window.addEventListener('orientationchange', updateOrientation);
    window.addEventListener('resize', updateOrientation);
    updateOrientation();
  }

  private recordMetric(metric: Partial<MobilePerformanceMetrics>): void {
    this.metrics.push({
      frameRate: 0,
      memoryUsage: 0,
      batteryLevel: 0,
      networkStatus: 'online',
      deviceOrientation: 'portrait',
      screenSize: { width: 0, height: 0 },
      ...metric
    });
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  getMetrics(): MobilePerformanceMetrics[] {
    return [...this.metrics];
  }

  getLatestMetrics(): MobilePerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }
}
