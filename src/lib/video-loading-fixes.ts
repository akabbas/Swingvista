/**
 * Video Loading Fixes and Diagnostics
 * 
 * Addresses common issues with sample video loading and provides
 * comprehensive error handling and recovery mechanisms
 */

export interface VideoLoadingStatus {
  isLoaded: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  videoInfo?: {
    duration: number;
    width: number;
    height: number;
    readyState: number;
    networkState: number;
  };
}

export interface VideoLoadingOptions {
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
  fallbackUrls?: string[];
}

/**
 * Enhanced video loading with comprehensive error handling
 */
export class VideoLoader {
  private videoElement: HTMLVideoElement;
  private options: VideoLoadingOptions;
  private retryCount: number = 0;
  private status: VideoLoadingStatus;

  constructor(videoElement: HTMLVideoElement, options: Partial<VideoLoadingOptions> = {}) {
    this.videoElement = videoElement;
    this.options = {
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 10000,
      ...options
    };
    this.status = {
      isLoaded: false,
      isLoading: false,
      hasError: false
    };
  }

  /**
   * Load video with comprehensive error handling and retry logic
   */
  async loadVideo(url: string): Promise<VideoLoadingStatus> {
    console.log('🎥 VIDEO LOADER: Starting video load:', url);
    
    this.status = {
      isLoaded: false,
      isLoading: true,
      hasError: false
    };

    try {
      // Set up event listeners
      this.setupEventListeners();
      
      // Set video source
      this.videoElement.src = url;
      this.videoElement.load();
      
      // Wait for video to load with timeout
      await this.waitForVideoLoad();
      
      this.status.isLoaded = true;
      this.status.isLoading = false;
      
      console.log('✅ VIDEO LOADER: Video loaded successfully');
      return this.status;
      
    } catch (error) {
      console.error('❌ VIDEO LOADER: Video load failed:', error);
      
      // Try fallback URLs if available
      if (this.options.fallbackUrls && this.retryCount < this.options.retryAttempts) {
        console.log(`🔄 VIDEO LOADER: Trying fallback URL ${this.retryCount + 1}/${this.options.retryAttempts}`);
        this.retryCount++;
        
        const fallbackUrl = this.options.fallbackUrls[this.retryCount - 1];
        if (fallbackUrl) {
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
          return this.loadVideo(fallbackUrl);
        }
      }
      
      this.status = {
        isLoaded: false,
        isLoading: false,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
      
      return this.status;
    }
  }

  /**
   * Set up comprehensive event listeners for video loading
   */
  private setupEventListeners(): void {
    const video = this.videoElement;
    
    // Clear existing listeners
    video.removeEventListener('loadstart', this.handleLoadStart);
    video.removeEventListener('loadedmetadata', this.handleLoadedMetadata);
    video.removeEventListener('loadeddata', this.handleLoadedData);
    video.removeEventListener('canplay', this.handleCanPlay);
    video.removeEventListener('error', this.handleError);
    video.removeEventListener('stalled', this.handleStalled);
    video.removeEventListener('suspend', this.handleSuspend);
    
    // Add new listeners
    video.addEventListener('loadstart', this.handleLoadStart.bind(this));
    video.addEventListener('loadedmetadata', this.handleLoadedMetadata.bind(this));
    video.addEventListener('loadeddata', this.handleLoadedData.bind(this));
    video.addEventListener('canplay', this.handleCanPlay.bind(this));
    video.addEventListener('error', this.handleError.bind(this));
    video.addEventListener('stalled', this.handleStalled.bind(this));
    video.addEventListener('suspend', this.handleSuspend.bind(this));
  }

  /**
   * Wait for video to load with timeout
   */
  private async waitForVideoLoad(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Video loading timeout'));
      }, this.options.timeout);

      const checkReady = () => {
        if (this.videoElement.readyState >= 3) { // HAVE_FUTURE_DATA
          clearTimeout(timeout);
          resolve();
        } else if (this.status.hasError) {
          clearTimeout(timeout);
          reject(new Error(this.status.errorMessage || 'Video loading failed'));
        } else {
          setTimeout(checkReady, 100);
        }
      };

      checkReady();
    });
  }

  // Event handlers
  private handleLoadStart = (): void => {
    console.log('🎥 VIDEO LOADER: Load started');
  };

  private handleLoadedMetadata = (): void => {
    console.log('🎥 VIDEO LOADER: Metadata loaded');
    this.status.videoInfo = {
      duration: this.videoElement.duration,
      width: this.videoElement.videoWidth,
      height: this.videoElement.videoHeight,
      readyState: this.videoElement.readyState,
      networkState: this.videoElement.networkState
    };
  };

  private handleLoadedData = (): void => {
    console.log('🎥 VIDEO LOADER: Data loaded');
  };

  private handleCanPlay = (): void => {
    console.log('🎥 VIDEO LOADER: Can play');
  };

  private handleError = (event: Event): void => {
    const video = event.target as HTMLVideoElement;
    const error = video.error;
    
    let errorMessage = 'Unknown video error';
    if (error) {
      switch (error.code) {
        case 1:
          errorMessage = 'MEDIA_ERR_ABORTED - Video loading aborted';
          break;
        case 2:
          errorMessage = 'MEDIA_ERR_NETWORK - Network error';
          break;
        case 3:
          errorMessage = 'MEDIA_ERR_DECODE - Video decode error';
          break;
        case 4:
          errorMessage = 'MEDIA_ERR_SRC_NOT_SUPPORTED - Video format not supported';
          break;
        default:
          errorMessage = `Error code: ${error.code}`;
      }
    }
    
    console.error('❌ VIDEO LOADER: Video error:', errorMessage);
    this.status.hasError = true;
    this.status.errorMessage = errorMessage;
  };

  private handleStalled = (): void => {
    console.warn('⚠️ VIDEO LOADER: Video loading stalled');
  };

  private handleSuspend = (): void => {
    console.warn('⚠️ VIDEO LOADER: Video loading suspended');
  };

  /**
   * Get current loading status
   */
  getStatus(): VideoLoadingStatus {
    return { ...this.status };
  }
}

/**
 * Check if a video URL is accessible
 */
export async function checkVideoAccessibility(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('❌ Video accessibility check failed:', error);
    return false;
  }
}

/**
 * Get fallback URLs for common video files
 */
export function getFallbackUrls(originalUrl: string): string[] {
  const fallbacks: string[] = [];
  
  // Common fallback patterns
  if (originalUrl.includes('tiger-woods-swing.mp4')) {
    fallbacks.push('/fixtures/swings/tiger-woods-swing-original.mp4');
    fallbacks.push('/fixtures/swings/pga_tiger_woods_driver_1.mp4');
  }
  
  if (originalUrl.includes('tiger-woods-swing-slow.mp4')) {
    fallbacks.push('/fixtures/swings/tiger-woods-swing-slow.mp4');
  }
  
  if (originalUrl.includes('ludvig_aberg_driver.mp4')) {
    fallbacks.push('/fixtures/swings/ludvig_aberg_driver.mp4');
  }
  
  if (originalUrl.includes('max_homa_iron.mp4')) {
    fallbacks.push('/fixtures/swings/max_homa_iron.mp4');
  }
  
  // Add generic fallbacks
  fallbacks.push('/fixtures/swings/pga_adam_scott_driver_3.mp4');
  fallbacks.push('/fixtures/swings/pga_collin_morikawa_driver_1.mp4');
  
  return fallbacks;
}

/**
 * Enhanced video loading with automatic fallback handling
 */
export async function loadVideoWithFallbacks(
  videoElement: HTMLVideoElement,
  primaryUrl: string,
  options: Partial<VideoLoadingOptions> = {}
): Promise<VideoLoadingStatus> {
  console.log('🎥 ENHANCED LOADER: Loading video with fallbacks:', primaryUrl);
  
  // Check if primary URL is accessible
  const isAccessible = await checkVideoAccessibility(primaryUrl);
  
  if (!isAccessible) {
    console.warn('⚠️ ENHANCED LOADER: Primary URL not accessible, trying fallbacks');
    const fallbackUrls = getFallbackUrls(primaryUrl);
    options.fallbackUrls = fallbackUrls;
  }
  
  const loader = new VideoLoader(videoElement, options);
  return loader.loadVideo(primaryUrl);
}

/**
 * Diagnose video loading issues
 */
export function diagnoseVideoLoading(videoElement: HTMLVideoElement): {
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check video element state
  if (!videoElement.src) {
    issues.push('No video source set');
    recommendations.push('Set video.src to a valid URL');
  }
  
  if (videoElement.error) {
    const error = videoElement.error;
    switch (error.code) {
      case 1:
        issues.push('Video loading was aborted');
        recommendations.push('Check if the video URL is correct and accessible');
        break;
      case 2:
        issues.push('Network error while loading video');
        recommendations.push('Check network connection and video server availability');
        break;
      case 3:
        issues.push('Video decoding error');
        recommendations.push('Try a different video format or codec');
        break;
      case 4:
        issues.push('Video format not supported');
        recommendations.push('Use a supported video format (MP4, WebM)');
        break;
    }
  }
  
  // Check video properties
  if (videoElement.readyState === 0) {
    issues.push('Video not initialized');
    recommendations.push('Call video.load() after setting the source');
  }
  
  if (videoElement.networkState === 3) {
    issues.push('Network error detected');
    recommendations.push('Check network connection and video server');
  }
  
  return { issues, recommendations };
}

/**
 * Create a video element with enhanced error handling
 */
export function createVideoElementWithErrorHandling(
  src: string,
  options: {
    controls?: boolean;
    preload?: string;
    className?: string;
    onError?: (error: string) => void;
    onLoad?: () => void;
  } = {}
): HTMLVideoElement {
  const video = document.createElement('video');
  
  if (options.controls !== false) video.controls = true;
  if (options.preload) video.preload = options.preload;
  if (options.className) video.className = options.className;
  
  // Enhanced error handling
  video.addEventListener('error', (event) => {
    const videoElement = event.target as HTMLVideoElement;
    const error = videoElement.error;
    
    let errorMessage = 'Unknown video error';
    if (error) {
      switch (error.code) {
        case 1: errorMessage = 'Video loading aborted'; break;
        case 2: errorMessage = 'Network error'; break;
        case 3: errorMessage = 'Video decode error'; break;
        case 4: errorMessage = 'Video format not supported'; break;
      }
    }
    
    console.error('❌ Video error:', errorMessage);
    options.onError?.(errorMessage);
  });
  
  video.addEventListener('loadeddata', () => {
    console.log('✅ Video loaded successfully');
    options.onLoad?.();
  });
  
  video.src = src;
  video.load();
  
  return video;
}
