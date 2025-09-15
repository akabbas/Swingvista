'use client';

// Future-proofing configuration and utilities for SwingVista

export interface FutureProofingConfig {
  // Feature flags for gradual rollouts
  features: {
    advancedAI: boolean;
    socialFeatures: boolean;
    mobileApp: boolean;
    videoEditing: boolean;
    multiLanguage: boolean;
    coachDashboard: boolean;
  };
  
  // Performance thresholds
  performance: {
    maxVideoSize: number; // MB
    maxAnalysisTime: number; // seconds
    maxConcurrentUsers: number;
    cacheExpiration: number; // hours
  };
  
  // API versioning
  api: {
    version: string;
    supportedVersions: string[];
    deprecationWarnings: boolean;
  };
  
  // Analytics and monitoring
  analytics: {
    enabled: boolean;
    trackUserInteractions: boolean;
    trackPerformance: boolean;
    trackErrors: boolean;
  };
}

export const defaultFutureProofingConfig: FutureProofingConfig = {
  features: {
    advancedAI: false,
    socialFeatures: false,
    mobileApp: false,
    videoEditing: false,
    multiLanguage: false,
    coachDashboard: false,
  },
  performance: {
    maxVideoSize: 100, // 100MB
    maxAnalysisTime: 300, // 5 minutes
    maxConcurrentUsers: 1000,
    cacheExpiration: 24, // 24 hours
  },
  api: {
    version: '1.0.0',
    supportedVersions: ['1.0.0'],
    deprecationWarnings: true,
  },
  analytics: {
    enabled: process.env.NODE_ENV === 'production',
    trackUserInteractions: true,
    trackPerformance: true,
    trackErrors: true,
  },
};

// Feature flag utilities
export class FeatureFlags {
  private config: FutureProofingConfig;

  constructor(config: FutureProofingConfig = defaultFutureProofingConfig) {
    this.config = config;
  }

  isEnabled(feature: keyof FutureProofingConfig['features']): boolean {
    return this.config.features[feature];
  }

  enableFeature(feature: keyof FutureProofingConfig['features']): void {
    this.config.features[feature] = true;
  }

  disableFeature(feature: keyof FutureProofingConfig['features']): void {
    this.config.features[feature] = false;
  }

  getConfig(): FutureProofingConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<FutureProofingConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// API versioning utilities
export class APIVersionManager {
  private currentVersion: string;
  private supportedVersions: string[];

  constructor(version: string = '1.0.0', supported: string[] = ['1.0.0']) {
    this.currentVersion = version;
    this.supportedVersions = supported;
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  isVersionSupported(version: string): boolean {
    return this.supportedVersions.includes(version);
  }

  getSupportedVersions(): string[] {
    return [...this.supportedVersions];
  }

  addSupportedVersion(version: string): void {
    if (!this.supportedVersions.includes(version)) {
      this.supportedVersions.push(version);
    }
  }

  removeSupportedVersion(version: string): void {
    const index = this.supportedVersions.indexOf(version);
    if (index > -1) {
      this.supportedVersions.splice(index, 1);
    }
  }

  getVersionHeader(): string {
    return `SwingVista-API/${this.currentVersion}`;
  }
}

// Performance monitoring and optimization
export class PerformanceOptimizer {
  private config: FutureProofingConfig['performance'];

  constructor(config: FutureProofingConfig['performance']) {
    this.config = config;
  }

  validateVideoSize(sizeInMB: number): { valid: boolean; message?: string } {
    if (sizeInMB > this.config.maxVideoSize) {
      return {
        valid: false,
        message: `Video size (${sizeInMB}MB) exceeds maximum allowed size (${this.config.maxVideoSize}MB)`
      };
    }
    return { valid: true };
  }

  validateAnalysisTime(timeInSeconds: number): { valid: boolean; message?: string } {
    if (timeInSeconds > this.config.maxAnalysisTime) {
      return {
        valid: false,
        message: `Analysis time (${timeInSeconds}s) exceeds maximum allowed time (${this.config.maxAnalysisTime}s)`
      };
    }
    return { valid: true };
  }

  getCacheKey(key: string): string {
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60 * this.config.cacheExpiration));
    return `${key}_${timestamp}`;
  }

  shouldCache(data: any): boolean {
    // Simple heuristic: cache if data is not too large
    const size = JSON.stringify(data).length;
    return size < 1024 * 1024; // 1MB
  }
}

// Analytics and tracking utilities
export class AnalyticsManager {
  private config: FutureProofingConfig['analytics'];
  private events: Array<{ event: string; data: any; timestamp: number }> = [];

  constructor(config: FutureProofingConfig['analytics']) {
    this.config = config;
  }

  track(event: string, data: any = {}): void {
    if (!this.config.enabled) return;

    const eventData = {
      event,
      data,
      timestamp: Date.now(),
    };

    this.events.push(eventData);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // In a real implementation, you would send this to your analytics service
    console.log('Analytics Event:', eventData);
  }

  trackUserInteraction(action: string, target: string, data: any = {}): void {
    if (!this.config.trackUserInteractions) return;
    
    this.track('user_interaction', {
      action,
      target,
      ...data,
    });
  }

  trackPerformance(metrics: any): void {
    if (!this.config.trackPerformance) return;
    
    this.track('performance', metrics);
  }

  trackError(error: Error, context: string): void {
    if (!this.config.trackErrors) return;
    
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  getEvents(): Array<{ event: string; data: any; timestamp: number }> {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

// Migration utilities for future updates
export class MigrationManager {
  private migrations: Map<string, () => Promise<void>> = new Map();

  registerMigration(version: string, migration: () => Promise<void>): void {
    this.migrations.set(version, migration);
  }

  async runMigrations(fromVersion: string, toVersion: string): Promise<void> {
    const versions = Array.from(this.migrations.keys()).sort();
    const fromIndex = versions.indexOf(fromVersion);
    const toIndex = versions.indexOf(toVersion);

    if (fromIndex === -1 || toIndex === -1) {
      throw new Error('Invalid version specified');
    }

    for (let i = fromIndex + 1; i <= toIndex; i++) {
      const version = versions[i];
      const migration = this.migrations.get(version);
      
      if (migration) {
        console.log(`Running migration for version ${version}`);
        await migration();
      }
    }
  }
}

// Export singleton instances
export const featureFlags = new FeatureFlags();
export const apiVersionManager = new APIVersionManager();
export const performanceOptimizer = new PerformanceOptimizer(defaultFutureProofingConfig.performance);
export const analyticsManager = new AnalyticsManager(defaultFutureProofingConfig.analytics);
export const migrationManager = new MigrationManager();

// Utility functions for easy access
export const isFeatureEnabled = (feature: keyof FutureProofingConfig['features']): boolean => {
  return featureFlags.isEnabled(feature);
};

export const trackEvent = (event: string, data: any = {}): void => {
  analyticsManager.track(event, data);
};

export const trackUserInteraction = (action: string, target: string, data: any = {}): void => {
  analyticsManager.trackUserInteraction(action, target, data);
};

export const validateVideoSize = (sizeInMB: number): { valid: boolean; message?: string } => {
  return performanceOptimizer.validateVideoSize(sizeInMB);
};

export const getCacheKey = (key: string): string => {
  return performanceOptimizer.getCacheKey(key);
};

// Future-proofing hooks for React components
export const useFeatureFlag = (feature: keyof FutureProofingConfig['features']): boolean => {
  return featureFlags.isEnabled(feature);
};

export const useAnalytics = () => {
  return {
    track: trackEvent,
    trackUserInteraction,
  };
};

export const usePerformanceOptimization = () => {
  return {
    validateVideoSize,
    getCacheKey,
  };
};
