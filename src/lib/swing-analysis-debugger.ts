export interface DebugComponent {
  name: string;
  status: 'ok' | 'warning' | 'error' | 'unknown';
  lastUpdate: number;
  metrics: Record<string, any>;
  details?: any;
  errors: string[];
  warnings: string[];
}

export interface DebugMetrics {
  frameRate: number;
  processingTime: number;
  confidenceScore: number;
  dataQuality: number;
  memoryUsage?: number;
}

export interface ValidationTest {
  name: string;
  test: () => boolean | Promise<boolean>;
  description: string;
  critical: boolean;
}

export interface ValidationResult {
  component: string;
  test: string;
  passed: boolean;
  error?: string;
  timestamp: number;
}

export class SwingAnalysisDebugger {
  private components: Map<string, DebugComponent> = new Map();
  private isVisible: boolean = false;
  private verboseLogging: boolean = false;
  private validationResults: ValidationResult[] = [];
  private performanceMetrics: DebugMetrics = {
    frameRate: 0,
    processingTime: 0,
    confidenceScore: 0,
    dataQuality: 0
  };

  // Component registration
  registerComponent(name: string, initialMetrics: Record<string, any> = {}): void {
    this.components.set(name, {
      name,
      status: 'unknown',
      lastUpdate: Date.now(),
      metrics: initialMetrics,
      errors: [],
      warnings: []
    });
    
    if (this.verboseLogging) {
      console.log(`🔧 Debug: Registered component "${name}"`);
    }
  }

  // Update component status
  updateComponentStatus(
    name: string, 
    status: 'ok' | 'warning' | 'error' | 'unknown', 
    details?: any,
    metrics?: Record<string, any>
  ): void {
    const component = this.components.get(name);
    if (!component) {
      console.warn(`🔧 Debug: Component "${name}" not found`);
      return;
    }

    const oldStatus = component.status;
    component.status = status;
    component.lastUpdate = Date.now();
    
    if (details) {
      component.details = details;
    }
    
    if (metrics) {
      component.metrics = { ...component.metrics, ...metrics };
    }

    // Log status changes
    if (oldStatus !== status) {
      this.logStatusChange(name, oldStatus, status, details);
    }

    // Update performance metrics
    this.updatePerformanceMetrics();
  }

  // Add error to component
  addError(componentName: string, error: string): void {
    const component = this.components.get(componentName);
    if (component) {
      component.errors.push(`${new Date().toISOString()}: ${error}`);
      component.status = 'error';
      this.logError(componentName, error);
    }
  }

  // Add warning to component
  addWarning(componentName: string, warning: string): void {
    const component = this.components.get(componentName);
    if (component) {
      component.warnings.push(`${new Date().toISOString()}: ${warning}`);
      if (component.status === 'ok') {
        component.status = 'warning';
      }
      this.logWarning(componentName, warning);
    }
  }

  // Clear errors and warnings
  clearIssues(componentName: string): void {
    const component = this.components.get(componentName);
    if (component) {
      component.errors = [];
      component.warnings = [];
      if (component.status === 'error' || component.status === 'warning') {
        component.status = 'ok';
      }
    }
  }

  // Get component status
  getComponentStatus(name: string): DebugComponent | undefined {
    return this.components.get(name);
  }

  // Get all components
  getAllComponents(): Map<string, DebugComponent> {
    return this.components;
  }

  // Toggle debug visibility
  toggleVisibility(): void {
    this.isVisible = !this.isVisible;
    console.log(`🔧 Debug: ${this.isVisible ? 'Enabled' : 'Disabled'}`);
  }

  // Set visibility
  setVisibility(visible: boolean): void {
    this.isVisible = visible;
  }

  // Toggle verbose logging
  setVerboseLogging(enabled: boolean): void {
    this.verboseLogging = enabled;
    console.log(`🔧 Debug: Verbose logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Update performance metrics
  private updatePerformanceMetrics(): void {
    const now = Date.now();
    const components = Array.from(this.components.values());
    
    // Calculate average confidence
    const confidenceScores = components
      .map(c => c.metrics.confidenceScore || 0)
      .filter(score => score > 0);
    this.performanceMetrics.confidenceScore = confidenceScores.length > 0 
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length 
      : 0;

    // Calculate data quality (based on component statuses)
    const totalComponents = components.length;
    const okComponents = components.filter(c => c.status === 'ok').length;
    this.performanceMetrics.dataQuality = totalComponents > 0 ? (okComponents / totalComponents) * 100 : 0;

    // Update frame rate (simplified calculation)
    this.performanceMetrics.frameRate = this.calculateFrameRate();
  }

  // Calculate frame rate
  private calculateFrameRate(): number {
    // This is a simplified calculation - in a real implementation,
    // you'd track frame timestamps more precisely
    return 60; // Placeholder
  }

  // Log status changes
  private logStatusChange(
    componentName: string, 
    oldStatus: string, 
    newStatus: string, 
    details?: any
  ): void {
    const statusEmoji = {
      'ok': '✅',
      'warning': '⚠️',
      'error': '❌',
      'unknown': '❓'
    };

    console.log(
      `🔧 Debug: ${componentName} status changed: ${statusEmoji[oldStatus]} → ${statusEmoji[newStatus]}`
    );
    
    if (details && this.verboseLogging) {
      console.log(`🔧 Debug: ${componentName} details:`, details);
    }
  }

  // Log errors
  private logError(componentName: string, error: string): void {
    console.error(`🔧 Debug: ${componentName} ERROR:`, error);
  }

  // Log warnings
  private logWarning(componentName: string, warning: string): void {
    console.warn(`🔧 Debug: ${componentName} WARNING:`, warning);
  }

  // Run validation suite
  async runValidationSuite(): Promise<ValidationResult[]> {
    console.log('🔧 Debug: Running validation suite...');
    const results: ValidationResult[] = [];
    
    // Define validation tests for each component
    const validationTests: Record<string, ValidationTest[]> = {
      stickFigure: [
        {
          name: 'landmarksDetected',
          test: () => this.validateLandmarksDetected(),
          description: 'Check if landmarks are detected',
          critical: true
        },
        {
          name: 'confidenceScore',
          test: () => this.validateConfidenceScore(),
          description: 'Check if confidence score is adequate',
          critical: true
        },
        {
          name: 'renderingStatus',
          test: () => this.validateRenderingStatus(),
          description: 'Check if rendering is working',
          critical: true
        }
      ],
      swingPlane: [
        {
          name: 'planeCalculated',
          test: () => this.validateSwingPlaneCalculated(),
          description: 'Check if swing plane is calculated',
          critical: true
        },
        {
          name: 'angleRange',
          test: () => this.validateSwingPlaneAngle(),
          description: 'Check if swing plane angle is valid',
          critical: false
        },
        {
          name: 'consistency',
          test: () => this.validateSwingPlaneConsistency(),
          description: 'Check swing plane consistency',
          critical: false
        }
      ],
      clubPath: [
        {
          name: 'pointsTracked',
          test: () => this.validateClubPathPoints(),
          description: 'Check if club path points are tracked',
          critical: true
        },
        {
          name: 'smoothness',
          test: () => this.validateClubPathSmoothness(),
          description: 'Check club path smoothness',
          critical: false
        },
        {
          name: 'accuracy',
          test: () => this.validateClubPathAccuracy(),
          description: 'Check club path accuracy',
          critical: true
        }
      ],
      phaseDetection: [
        {
          name: 'phasesDetected',
          test: () => this.validatePhasesDetected(),
          description: 'Check if swing phases are detected',
          critical: true
        },
        {
          name: 'phaseSequence',
          test: () => this.validatePhaseSequence(),
          description: 'Check phase sequence validity',
          critical: true
        },
        {
          name: 'phaseTiming',
          test: () => this.validatePhaseTiming(),
          description: 'Check phase timing',
          critical: false
        }
      ],
      metricsCalculation: [
        {
          name: 'tempoCalculated',
          test: () => this.validateTempoCalculated(),
          description: 'Check if tempo is calculated',
          critical: true
        },
        {
          name: 'balanceCalculated',
          test: () => this.validateBalanceCalculated(),
          description: 'Check if balance is calculated',
          critical: true
        },
        {
          name: 'metricsRange',
          test: () => this.validateMetricsRange(),
          description: 'Check if metrics are in valid range',
          critical: false
        }
      ],
      gradingSystem: [
        {
          name: 'scoresCalculated',
          test: () => this.validateScoresCalculated(),
          description: 'Check if scores are calculated',
          critical: true
        },
        {
          name: 'scoreRange',
          test: () => this.validateScoreRange(),
          description: 'Check if scores are in valid range',
          critical: true
        },
        {
          name: 'gradingConsistency',
          test: () => this.validateGradingConsistency(),
          description: 'Check grading consistency',
          critical: false
        }
      ]
    };

    // Run all validation tests
    for (const [componentName, tests] of Object.entries(validationTests)) {
      for (const test of tests) {
        try {
          const passed = await test.test();
          const result: ValidationResult = {
            component: componentName,
            test: test.name,
            passed,
            timestamp: Date.now()
          };
          
          if (!passed) {
            result.error = `Test "${test.name}" failed for component "${componentName}"`;
            if (test.critical) {
              this.addError(componentName, result.error);
            } else {
              this.addWarning(componentName, result.error);
            }
          }
          
          results.push(result);
        } catch (error) {
          const result: ValidationResult = {
            component: componentName,
            test: test.name,
            passed: false,
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now()
          };
          results.push(result);
          this.addError(componentName, result.error);
        }
      }
    }

    this.validationResults = results;
    console.log(`🔧 Debug: Validation suite completed. ${results.filter(r => r.passed).length}/${results.length} tests passed`);
    
    return results;
  }

  // Validation test implementations (placeholders - to be implemented based on actual analysis components)
  private validateLandmarksDetected(): boolean {
    const component = this.components.get('stickFigure');
    return component?.metrics.landmarksDetected > 0;
  }

  private validateConfidenceScore(): boolean {
    const component = this.components.get('stickFigure');
    return (component?.metrics.confidenceScore || 0) > 0.6;
  }

  private validateRenderingStatus(): boolean {
    const component = this.components.get('stickFigure');
    return component?.metrics.renderingStatus === 'ok';
  }

  private validateSwingPlaneCalculated(): boolean {
    const component = this.components.get('swingPlane');
    return !!component?.metrics.planeCalculated;
  }

  private validateSwingPlaneAngle(): boolean {
    const component = this.components.get('swingPlane');
    const angle = component?.metrics.angle;
    return angle !== undefined && angle > 0 && angle < 90;
  }

  private validateSwingPlaneConsistency(): boolean {
    const component = this.components.get('swingPlane');
    return (component?.metrics.consistency || 0) > 0.7;
  }

  private validateClubPathPoints(): boolean {
    const component = this.components.get('clubPath');
    return (component?.metrics.pointsTracked || 0) > 10;
  }

  private validateClubPathSmoothness(): boolean {
    const component = this.components.get('clubPath');
    return (component?.metrics.smoothness || 0) > 0.8;
  }

  private validateClubPathAccuracy(): boolean {
    const component = this.components.get('clubPath');
    return (component?.metrics.accuracy || 0) > 0.7;
  }

  private validatePhasesDetected(): boolean {
    const component = this.components.get('phaseDetection');
    return (component?.metrics.phasesDetected || 0) >= 4; // At least 4 phases
  }

  private validatePhaseSequence(): boolean {
    const component = this.components.get('phaseDetection');
    return component?.metrics.phaseSequence === 'valid';
  }

  private validatePhaseTiming(): boolean {
    const component = this.components.get('phaseDetection');
    return (component?.metrics.phaseTiming || 0) > 0.8;
  }

  private validateTempoCalculated(): boolean {
    const component = this.components.get('metricsCalculation');
    return !!component?.metrics.tempoCalculated;
  }

  private validateBalanceCalculated(): boolean {
    const component = this.components.get('metricsCalculation');
    return !!component?.metrics.balanceCalculated;
  }

  private validateMetricsRange(): boolean {
    const component = this.components.get('metricsCalculation');
    return component?.metrics.metricsRange === 'valid';
  }

  private validateScoresCalculated(): boolean {
    const component = this.components.get('gradingSystem');
    return !!component?.metrics.scoresCalculated;
  }

  private validateScoreRange(): boolean {
    const component = this.components.get('gradingSystem');
    return component?.metrics.scoreRange === 'valid';
  }

  private validateGradingConsistency(): boolean {
    const component = this.components.get('gradingSystem');
    return (component?.metrics.gradingConsistency || 0) > 0.8;
  }

  // Export debug data
  exportDebugData(): string {
    const debugData = {
      timestamp: new Date().toISOString(),
      components: Object.fromEntries(this.components),
      performanceMetrics: this.performanceMetrics,
      validationResults: this.validationResults,
      systemInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };

    return JSON.stringify(debugData, null, 2);
  }

  // Download debug data
  downloadDebugData(): void {
    const data = this.exportDebugData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swing-analysis-debug-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Get debug summary
  getDebugSummary(): {
    totalComponents: number;
    okComponents: number;
    warningComponents: number;
    errorComponents: number;
    overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
    performanceScore: number;
  } {
    const components = Array.from(this.components.values());
    const totalComponents = components.length;
    const okComponents = components.filter(c => c.status === 'ok').length;
    const warningComponents = components.filter(c => c.status === 'warning').length;
    const errorComponents = components.filter(c => c.status === 'error').length;

    let overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
    if (errorComponents === 0 && warningComponents === 0) {
      overallHealth = 'excellent';
    } else if (errorComponents === 0 && warningComponents <= 2) {
      overallHealth = 'good';
    } else if (errorComponents <= 2) {
      overallHealth = 'warning';
    } else {
      overallHealth = 'critical';
    }

    const performanceScore = this.performanceMetrics.dataQuality;

    return {
      totalComponents,
      okComponents,
      warningComponents,
      errorComponents,
      overallHealth,
      performanceScore
    };
  }

  // Check if debug is visible
  isDebugVisible(): boolean {
    return this.isVisible;
  }

  // Get performance metrics
  getPerformanceMetrics(): DebugMetrics {
    return this.performanceMetrics;
  }

  // Get validation results
  getValidationResults(): ValidationResult[] {
    return this.validationResults;
  }
}

