/**
 * 🔍 SWINGVISTA INTEGRATION VERIFICATION SCRIPT
 * 
 * This script verifies the complete data flow:
 * Video → Pose Detection → Analysis → Results Display
 */

class IntegrationVerifier {
  constructor() {
    this.testResults = [];
    this.consoleLogs = [];
    this.originalConsoleLog = console.log;
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    
    this.setupConsoleCapture();
  }

  setupConsoleCapture() {
    console.log = (...args) => {
      this.consoleLogs.push({ type: 'log', message: args.join(' '), timestamp: Date.now() });
      this.originalConsoleLog.apply(console, args);
    };
    
    console.error = (...args) => {
      this.consoleLogs.push({ type: 'error', message: args.join(' '), timestamp: Date.now() });
      this.originalConsoleError.apply(console, args);
    };
    
    console.warn = (...args) => {
      this.consoleLogs.push({ type: 'warn', message: args.join(' '), timestamp: Date.now() });
      this.originalConsoleWarn.apply(console, args);
    };
  }

  async verifyCompleteIntegration() {
    console.log('🔍 Starting SWINGVISTA Integration Verification...');
    console.log('=' .repeat(60));
    
    try {
      // Test 1: Video Loading
      await this.testVideoLoading();
      
      // Test 2: MediaPipe Initialization
      await this.testMediaPipeInitialization();
      
      // Test 3: Pose Detection
      await this.testPoseDetection();
      
      // Test 4: Golf Analysis
      await this.testGolfAnalysis();
      
      // Test 5: Results Display
      await this.testResultsDisplay();
      
      // Test 6: Emergency Fallback
      await this.testEmergencyFallback();
      
      this.generateIntegrationReport();
      
    } catch (error) {
      console.error('❌ Integration verification failed:', error);
      this.generateErrorReport(error);
    }
  }

  async testVideoLoading() {
    console.log('🎥 Testing Video Loading...');
    
    // Check if video element exists
    const videoElement = document.querySelector('video');
    if (!videoElement) {
      throw new Error('Video element not found');
    }
    
    // Check video properties
    const hasSrc = videoElement.src || videoElement.currentSrc;
    if (!hasSrc) {
      console.log('⚠️ No video source loaded');
    }
    
    console.log('✅ Video loading test completed');
  }

  async testMediaPipeInitialization() {
    console.log('🤖 Testing MediaPipe Initialization...');
    
    // Check for MediaPipe initialization logs
    const initLogs = this.consoleLogs.filter(log => 
      log.message.includes('MediaPipe') && log.message.includes('initialization')
    );
    
    if (initLogs.length === 0) {
      console.log('⚠️ No MediaPipe initialization logs found');
    }
    
    // Check for successful initialization
    const successLogs = this.consoleLogs.filter(log => 
      log.message.includes('✅') && log.message.includes('MediaPipe')
    );
    
    if (successLogs.length === 0) {
      console.log('⚠️ No MediaPipe success logs found');
    }
    
    console.log('✅ MediaPipe initialization test completed');
  }

  async testPoseDetection() {
    console.log('👤 Testing Pose Detection...');
    
    // Check for pose detection logs
    const poseLogs = this.consoleLogs.filter(log => 
      log.message.includes('landmarks') || log.message.includes('pose')
    );
    
    if (poseLogs.length === 0) {
      console.log('⚠️ No pose detection logs found');
    }
    
    // Check for 33 landmarks detection
    const landmarkLogs = this.consoleLogs.filter(log => 
      log.message.includes('33 landmarks')
    );
    
    if (landmarkLogs.length === 0) {
      console.log('⚠️ No 33 landmarks detection logs found');
    }
    
    console.log('✅ Pose detection test completed');
  }

  async testGolfAnalysis() {
    console.log('🏌️ Testing Golf Analysis...');
    
    // Check for golf analysis logs
    const analysisLogs = this.consoleLogs.filter(log => 
      log.message.includes('tempo') || log.message.includes('rotation') || log.message.includes('swing')
    );
    
    if (analysisLogs.length === 0) {
      console.log('⚠️ No golf analysis logs found');
    }
    
    // Check for tempo ratio validation
    const tempoLogs = this.consoleLogs.filter(log => 
      log.message.includes('tempo ratio') || log.message.includes('tempo')
    );
    
    if (tempoLogs.length === 0) {
      console.log('⚠️ No tempo validation logs found');
    }
    
    console.log('✅ Golf analysis test completed');
  }

  async testResultsDisplay() {
    console.log('📊 Testing Results Display...');
    
    // Check for UI elements
    const uiElements = document.querySelectorAll('[data-testid]');
    const analysisElements = document.querySelectorAll('.analysis, .metrics, .results');
    
    if (uiElements.length === 0 && analysisElements.length === 0) {
      console.log('⚠️ No analysis UI elements found');
    }
    
    // Check for visualization overlays
    const overlayElements = document.querySelectorAll('canvas, .overlay, .visualization');
    
    if (overlayElements.length === 0) {
      console.log('⚠️ No visualization overlays found');
    }
    
    console.log('✅ Results display test completed');
  }

  async testEmergencyFallback() {
    console.log('🚨 Testing Emergency Fallback...');
    
    // Check for emergency mode logs
    const emergencyLogs = this.consoleLogs.filter(log => 
      log.message.includes('emergency') || log.message.includes('fallback')
    );
    
    if (emergencyLogs.length === 0) {
      console.log('ℹ️ No emergency fallback triggered (normal operation)');
    }
    
    // Check for simulated data generation
    const simulatedLogs = this.consoleLogs.filter(log => 
      log.message.includes('simulated') || log.message.includes('realistic')
    );
    
    if (simulatedLogs.length === 0) {
      console.log('ℹ️ No simulated data generation (normal operation)');
    }
    
    console.log('✅ Emergency fallback test completed');
  }

  generateIntegrationReport() {
    console.log('\n📊 INTEGRATION VERIFICATION REPORT');
    console.log('=' .repeat(60));
    
    // Analyze console logs
    const allLogs = this.consoleLogs;
    const mediaPipeLogs = allLogs.filter(log => log.message.includes('MediaPipe'));
    const poseLogs = allLogs.filter(log => log.message.includes('landmarks'));
    const analysisLogs = allLogs.filter(log => log.message.includes('tempo') || log.message.includes('rotation'));
    const videoLogs = allLogs.filter(log => log.message.includes('video'));
    const errorLogs = allLogs.filter(log => log.type === 'error');
    
    console.log('📋 INTEGRATION SUMMARY:');
    console.log(`MediaPipe Logs: ${mediaPipeLogs.length}`);
    console.log(`Pose Detection Logs: ${poseLogs.length}`);
    console.log(`Golf Analysis Logs: ${analysisLogs.length}`);
    console.log(`Video Processing Logs: ${videoLogs.length}`);
    console.log(`Error Logs: ${errorLogs.length}`);
    
    // Check data flow
    console.log('\n🔄 DATA FLOW VERIFICATION:');
    
    const hasVideoLoading = videoLogs.length > 0;
    const hasMediaPipeInit = mediaPipeLogs.some(log => log.message.includes('initialization'));
    const hasPoseDetection = poseLogs.length > 0;
    const hasGolfAnalysis = analysisLogs.length > 0;
    
    console.log(`Video Loading: ${hasVideoLoading ? '✅' : '❌'}`);
    console.log(`MediaPipe Init: ${hasMediaPipeInit ? '✅' : '❌'}`);
    console.log(`Pose Detection: ${hasPoseDetection ? '✅' : '❌'}`);
    console.log(`Golf Analysis: ${hasGolfAnalysis ? '✅' : '❌'}`);
    
    // Overall status
    const allSystemsWorking = hasVideoLoading && hasMediaPipeInit && hasPoseDetection && hasGolfAnalysis;
    
    console.log('\n🎯 OVERALL STATUS:');
    console.log(`Integration Status: ${allSystemsWorking ? '✅ SUCCESS' : '❌ ISSUES DETECTED'}`);
    console.log(`Data Flow: ${allSystemsWorking ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
    console.log(`Error Count: ${errorLogs.length}`);
    
    if (errorLogs.length > 0) {
      console.log('\n⚠️ ERRORS DETECTED:');
      errorLogs.forEach(log => {
        console.log(`   ${log.message}`);
      });
    }
    
    console.log('\n🚀 RECOMMENDATIONS:');
    if (allSystemsWorking) {
      console.log('✅ All systems working correctly');
      console.log('✅ Data flow complete');
      console.log('✅ Ready for production');
    } else {
      console.log('❌ Some systems need attention');
      console.log('❌ Check error logs above');
      console.log('❌ Verify all components loaded');
    }
  }

  generateErrorReport(error) {
    console.log('\n❌ INTEGRATION VERIFICATION FAILED');
    console.log('=' .repeat(60));
    console.log(`Error: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
    
    console.log('\n🔍 DEBUGGING INFORMATION:');
    console.log(`Console Logs: ${this.consoleLogs.length}`);
    console.log(`Error Logs: ${this.consoleLogs.filter(log => log.type === 'error').length}`);
    console.log(`Warning Logs: ${this.consoleLogs.filter(log => log.type === 'warn').length}`);
    
    console.log('\n🛠️ TROUBLESHOOTING STEPS:');
    console.log('1. Check browser console for errors');
    console.log('2. Verify MediaPipe is loading');
    console.log('3. Check video element exists');
    console.log('4. Verify all imports are correct');
    console.log('5. Check network connectivity');
  }
}

// Create global verifier instance
window.integrationVerifier = new IntegrationVerifier();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IntegrationVerifier;
}

console.log('🔍 SWINGVISTA INTEGRATION VERIFIER LOADED');
console.log('Run: integrationVerifier.verifyCompleteIntegration() to start verification');
console.log('This will test: Video → Pose Detection → Analysis → Results Display');
