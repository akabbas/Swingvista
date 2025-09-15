'use client';

export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBaseUrl: string;
  appName: string;
  version: string;
}

class EnvironmentManager {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadEnvironmentConfig();
  }

  private loadEnvironmentConfig(): EnvironmentConfig {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    // Determine API base URL based on environment
    const apiBaseUrl = isDevelopment 
      ? 'http://localhost:3000/api'
      : process.env.NEXT_PUBLIC_API_URL || 'https://swingvista.vercel.app/api';

    return {
      isDevelopment,
      isProduction,
      supabaseUrl,
      supabaseAnonKey,
      apiBaseUrl,
      appName: 'SwingVista',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
    };
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public async testConnection(): Promise<{
    success: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      // Test Supabase connection
      if (!this.config.supabaseUrl || !this.config.supabaseAnonKey) {
        return {
          success: false,
          error: 'Missing Supabase configuration'
        };
      }

      // Test Supabase connection with timeout
      const supabaseResponse = await Promise.race([
        fetch(`${this.config.supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': this.config.supabaseAnonKey,
            'Authorization': `Bearer ${this.config.supabaseAnonKey}`
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Supabase connection timeout')), 5000)
        )
      ]) as Response;

      if (!supabaseResponse.ok) {
        return {
          success: false,
          error: `Supabase connection failed: ${supabaseResponse.status} ${supabaseResponse.statusText}`
        };
      }

      // Test API endpoints with timeout
      let apiSuccess = false;
      try {
        const apiResponse = await Promise.race([
          fetch(`${this.config.apiBaseUrl}/test-supabase`),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('API connection timeout')), 3000)
          )
        ]) as Response;
        apiSuccess = apiResponse.ok;
      } catch (apiError) {
        console.warn('API endpoint test failed:', apiError);
      }

      return {
        success: true,
        details: {
          supabase: supabaseResponse.ok,
          api: apiSuccess,
          environment: this.config.isDevelopment ? 'development' : 'production',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
  }

  public getEnvironmentBanner(): string | null {
    if (this.config.isDevelopment) {
      return 'Development Environment - Debug mode enabled';
    }
    return null;
  }

  public getConsoleInfo(): void {
    if (this.config.isDevelopment) {
      console.group('🔧 SwingVista Environment Info');
      console.log('Environment:', this.config.isDevelopment ? 'Development' : 'Production');
      console.log('Version:', this.config.version);
      console.log('API Base URL:', this.config.apiBaseUrl);
      console.log('Supabase URL:', this.config.supabaseUrl);
      console.log('Supabase Key:', this.config.supabaseAnonKey ? '✅ Set' : '❌ Missing');
      console.groupEnd();
    }
  }
}

// Create singleton instance
export const environment = new EnvironmentManager();

// Export individual config getters for convenience
export const getEnvironmentConfig = () => environment.getConfig();
export const testEnvironmentConnection = () => environment.testConnection();
export const getEnvironmentBanner = () => environment.getEnvironmentBanner();
export const logEnvironmentInfo = () => environment.getConsoleInfo();
