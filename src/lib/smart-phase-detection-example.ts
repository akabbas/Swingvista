/**
 * Smart Phase Detection Example
 * 
 * Demonstrates how to use the enhanced phase detector with velocity-based
 * smoothing, hysteresis, and temporal smoothing to reduce jitter.
 */

import { EnhancedPhaseDetector } from './enhanced-phase-detector';
import { PoseResult } from './mediapipe';

// 🎯 SMART PHASE DETECTION EXAMPLE
export class SmartPhaseDetectionExample {
  private detector: EnhancedPhaseDetector;

  constructor() {
    this.detector = new EnhancedPhaseDetector();
  }

  /**
   * Initialize smart phase detection with optimal settings
   */
  initializeSmartDetection(): void {
    console.log('🚀 SMART DETECTION: Initializing smart phase detection...');
    
    // Configure smart detection parameters
    this.detector.configureSmartDetection({
      smoothingWindow: 5,        // 5 frames for temporal smoothing
      hysteresisThreshold: 0.15, // 15% confidence threshold for phase changes
      phaseChangeCooldown: 100   // 100ms minimum between phase changes
    });
    
    console.log('✅ SMART DETECTION: Smart phase detection initialized');
  }

  /**
   * Process swing with smart phase detection
   */
  processSwingWithSmartDetection(poses: PoseResult[]): void {
    console.log('🏌️‍♂️ SMART DETECTION: Processing swing with smart phase detection...');
    
    const detectedPhases: string[] = [];
    const phaseTransitions: number[] = [];
    let lastPhase = 'address';
    
    poses.forEach((pose, frameIndex) => {
      const currentTime = frameIndex * (1000 / 30); // Assuming 30 FPS
      
      // Detect phase with smart enhancements
      const phase = this.detector.detectSwingPhase(poses, frameIndex, currentTime);
      
      // Track phase transitions
      if (phase.name !== lastPhase) {
        phaseTransitions.push(frameIndex);
        console.log(`🔄 PHASE TRANSITION: ${lastPhase} → ${phase.name} at frame ${frameIndex}`);
        lastPhase = phase.name;
      }
      
      detectedPhases.push(phase.name);
      
      // Log smart detection stats every 10 frames
      if (frameIndex % 10 === 0) {
        const stats = this.detector.getSmartDetectionStats();
        console.log(`📊 FRAME ${frameIndex}: Phase=${phase.name}, Confidence=${phase.confidence.toFixed(3)}`);
        console.log(`   Buffer: [${stats.phaseBuffer.join(', ')}]`);
        console.log(`   Avg Velocity: ${stats.averageVelocity.toFixed(3)}`);
        console.log(`   Avg Confidence: ${stats.averageConfidence.toFixed(3)}`);
      }
    });
    
    console.log('✅ SMART DETECTION: Swing processing completed');
    console.log(`📈 RESULTS: ${phaseTransitions.length} phase transitions detected`);
    console.log(`🎯 PHASES: ${detectedPhases.join(' → ')}`);
  }

  /**
   * Compare smart vs basic phase detection
   */
  compareDetectionMethods(poses: PoseResult[]): void {
    console.log('🔍 COMPARISON: Comparing smart vs basic phase detection...');
    
    // Reset detector for fair comparison
    this.detector.reset();
    
    // Test with basic settings (no smoothing)
    this.detector.configureSmartDetection({
      smoothingWindow: 1,        // No smoothing
      hysteresisThreshold: 0.0,   // No hysteresis
      phaseChangeCooldown: 0     // No cooldown
    });
    
    const basicPhases: string[] = [];
    poses.forEach((pose, frameIndex) => {
      const currentTime = frameIndex * (1000 / 30);
      const phase = this.detector.detectSwingPhase(poses, frameIndex, currentTime);
      basicPhases.push(phase.name);
    });
    
    // Reset and test with smart settings
    this.detector.reset();
    this.detector.configureSmartDetection({
      smoothingWindow: 5,
      hysteresisThreshold: 0.15,
      phaseChangeCooldown: 100
    });
    
    const smartPhases: string[] = [];
    poses.forEach((pose, frameIndex) => {
      const currentTime = frameIndex * (1000 / 30);
      const phase = this.detector.detectSwingPhase(poses, frameIndex, currentTime);
      smartPhases.push(phase.name);
    });
    
    // Analyze differences
    const basicTransitions = this.countPhaseTransitions(basicPhases);
    const smartTransitions = this.countPhaseTransitions(smartPhases);
    
    console.log('📊 COMPARISON RESULTS:');
    console.log(`   Basic Detection: ${basicTransitions} transitions`);
    console.log(`   Smart Detection: ${smartTransitions} transitions`);
    console.log(`   Jitter Reduction: ${((basicTransitions - smartTransitions) / basicTransitions * 100).toFixed(1)}%`);
    
    // Show phase sequences
    console.log('\n📈 PHASE SEQUENCES:');
    console.log(`   Basic: ${basicPhases.join(' → ')}`);
    console.log(`   Smart:  ${smartPhases.join(' → ')}`);
  }

  /**
   * Test different smoothing configurations
   */
  testSmoothingConfigurations(poses: PoseResult[]): void {
    console.log('🧪 TESTING: Testing different smoothing configurations...');
    
    const configurations = [
      { name: 'No Smoothing', smoothingWindow: 1, hysteresisThreshold: 0.0, phaseChangeCooldown: 0 },
      { name: 'Light Smoothing', smoothingWindow: 3, hysteresisThreshold: 0.1, phaseChangeCooldown: 50 },
      { name: 'Medium Smoothing', smoothingWindow: 5, hysteresisThreshold: 0.15, phaseChangeCooldown: 100 },
      { name: 'Heavy Smoothing', smoothingWindow: 7, hysteresisThreshold: 0.2, phaseChangeCooldown: 150 }
    ];
    
    const results: { [key: string]: number } = {};
    
    configurations.forEach(config => {
      this.detector.reset();
      this.detector.configureSmartDetection(config);
      
      const phases: string[] = [];
      poses.forEach((pose, frameIndex) => {
        const currentTime = frameIndex * (1000 / 30);
        const phase = this.detector.detectSwingPhase(poses, frameIndex, currentTime);
        phases.push(phase.name);
      });
      
      const transitions = this.countPhaseTransitions(phases);
      results[config.name] = transitions;
      
      console.log(`   ${config.name}: ${transitions} transitions`);
    });
    
    // Find optimal configuration
    const optimalConfig = Object.entries(results).reduce((best, [name, transitions]) => {
      return transitions < best.transitions ? { name, transitions } : best;
    }, { name: '', transitions: Infinity });
    
    console.log(`\n🏆 OPTIMAL CONFIGURATION: ${optimalConfig.name} (${optimalConfig.transitions} transitions)`);
  }

  /**
   * Demonstrate velocity-based phase transitions
   */
  demonstrateVelocityBasedTransitions(poses: PoseResult[]): void {
    console.log('⚡ VELOCITY: Demonstrating velocity-based phase transitions...');
    
    this.detector.reset();
    this.detector.configureSmartDetection({
      smoothingWindow: 5,
      hysteresisThreshold: 0.15,
      phaseChangeCooldown: 100
    });
    
    const velocityData: { frame: number; velocity: number; phase: string }[] = [];
    
    poses.forEach((pose, frameIndex) => {
      const currentTime = frameIndex * (1000 / 30);
      const phase = this.detector.detectSwingPhase(poses, frameIndex, currentTime);
      const stats = this.detector.getSmartDetectionStats();
      
      velocityData.push({
        frame: frameIndex,
        velocity: stats.averageVelocity,
        phase: phase.name
      });
    });
    
    // Analyze velocity patterns
    const velocityPatterns = this.analyzeVelocityPatterns(velocityData);
    
    console.log('📊 VELOCITY PATTERNS:');
    Object.entries(velocityPatterns).forEach(([phase, pattern]) => {
      console.log(`   ${phase}: ${pattern.avgVelocity.toFixed(3)} avg velocity, ${pattern.velocityChange.toFixed(3)} change`);
    });
  }

  /**
   * Count phase transitions in a sequence
   */
  private countPhaseTransitions(phases: string[]): number {
    let transitions = 0;
    for (let i = 1; i < phases.length; i++) {
      if (phases[i] !== phases[i - 1]) {
        transitions++;
      }
    }
    return transitions;
  }

  /**
   * Analyze velocity patterns by phase
   */
  private analyzeVelocityPatterns(velocityData: { frame: number; velocity: number; phase: string }[]): { [key: string]: { avgVelocity: number; velocityChange: number } } {
    const patterns: { [key: string]: { velocities: number[]; changes: number[] } } = {};
    
    velocityData.forEach((data, index) => {
      if (!patterns[data.phase]) {
        patterns[data.phase] = { velocities: [], changes: [] };
      }
      
      patterns[data.phase].velocities.push(data.velocity);
      
      if (index > 0) {
        const change = data.velocity - velocityData[index - 1].velocity;
        patterns[data.phase].changes.push(change);
      }
    });
    
    const result: { [key: string]: { avgVelocity: number; velocityChange: number } } = {};
    
    Object.entries(patterns).forEach(([phase, data]) => {
      result[phase] = {
        avgVelocity: data.velocities.reduce((sum, v) => sum + v, 0) / data.velocities.length,
        velocityChange: data.changes.reduce((sum, c) => sum + c, 0) / data.changes.length
      };
    });
    
    return result;
  }

  /**
   * Get comprehensive detection statistics
   */
  getDetectionStatistics(): any {
    const stats = this.detector.getSmartDetectionStats();
    const history = this.detector.getPhaseHistory();
    
    return {
      smartDetection: stats,
      phaseHistory: history,
      totalTransitions: history.length,
      currentPhase: stats.currentPhase,
      bufferSize: stats.bufferSize,
      averageVelocity: stats.averageVelocity,
      averageConfidence: stats.averageConfidence,
      smoothingWindow: stats.smoothingWindow,
      hysteresisThreshold: stats.hysteresisThreshold,
      phaseChangeCooldown: stats.phaseChangeCooldown
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.detector.reset();
  }
}

// 🎯 USAGE EXAMPLES

/**
 * Example 1: Basic smart phase detection
 */
export function basicSmartPhaseDetection(poses: PoseResult[]): void {
  console.log('🚀 BASIC SMART DETECTION: Running basic smart phase detection...');
  
  const example = new SmartPhaseDetectionExample();
  example.initializeSmartDetection();
  
  try {
    example.processSwingWithSmartDetection(poses);
    
    const stats = example.getDetectionStatistics();
    console.log('📊 DETECTION STATISTICS:');
    console.log(`   Total Transitions: ${stats.totalTransitions}`);
    console.log(`   Average Velocity: ${stats.averageVelocity.toFixed(3)}`);
    console.log(`   Average Confidence: ${stats.averageConfidence.toFixed(3)}`);
    
  } finally {
    example.dispose();
  }
}

/**
 * Example 2: Compare detection methods
 */
export function compareDetectionMethods(poses: PoseResult[]): void {
  console.log('🔍 COMPARISON: Comparing detection methods...');
  
  const example = new SmartPhaseDetectionExample();
  
  try {
    example.compareDetectionMethods(poses);
  } finally {
    example.dispose();
  }
}

/**
 * Example 3: Test smoothing configurations
 */
export function testSmoothingConfigurations(poses: PoseResult[]): void {
  console.log('🧪 TESTING: Testing smoothing configurations...');
  
  const example = new SmartPhaseDetectionExample();
  
  try {
    example.testSmoothingConfigurations(poses);
  } finally {
    example.dispose();
  }
}

/**
 * Example 4: Demonstrate velocity-based transitions
 */
export function demonstrateVelocityBasedTransitions(poses: PoseResult[]): void {
  console.log('⚡ VELOCITY: Demonstrating velocity-based transitions...');
  
  const example = new SmartPhaseDetectionExample();
  
  try {
    example.demonstrateVelocityBasedTransitions(poses);
  } finally {
    example.dispose();
  }
}

export default SmartPhaseDetectionExample;
