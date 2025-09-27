// MediaPipe Integration Test Script
// Run this in the browser console to test MediaPipe loading

console.log('🧪 Starting MediaPipe Integration Test...');

async function testMediaPipeIntegration() {
    console.log('📋 Test Plan:');
    console.log('1. Test file accessibility');
    console.log('2. Test MediaPipe module import');
    console.log('3. Test MediaPipe initialization');
    console.log('4. Test pose detection');
    console.log('5. Test analysis quality');
    
    // Test 1: File Accessibility
    console.log('\n🔍 Test 1: File Accessibility');
    try {
        const response = await fetch('/mediapipe/pose.js');
        if (response.ok) {
            console.log('✅ Local MediaPipe files accessible');
        } else {
            console.log('❌ Local files not accessible:', response.status);
        }
    } catch (error) {
        console.log('❌ File accessibility test failed:', error.message);
    }
    
    // Test 2: Module Import
    console.log('\n📦 Test 2: Module Import');
    try {
        const mediaPipeModule = await import('@mediapipe/pose');
        console.log('✅ MediaPipe module imported');
        console.log('📦 Module exports:', Object.keys(mediaPipeModule));
        
        const Pose = mediaPipeModule.Pose || mediaPipeModule.default?.Pose || mediaPipeModule.default;
        if (Pose && typeof Pose === 'function') {
            console.log('✅ Pose constructor found');
        } else {
            console.log('❌ Pose constructor not found');
        }
    } catch (error) {
        console.log('❌ Module import failed:', error.message);
    }
    
    // Test 3: MediaPipe Initialization
    console.log('\n🚀 Test 3: MediaPipe Initialization');
    try {
        const { MediaPipePoseDetector } = await import('/src/lib/mediapipe.ts');
        const detector = MediaPipePoseDetector.getInstance();
        
        console.log('📡 Initializing MediaPipe detector...');
        await detector.initialize();
        
        if (detector.isInEmergencyMode()) {
            console.log('⚠️ MediaPipe failed to load, using emergency mode');
        } else {
            console.log('✅ MediaPipe loaded successfully!');
        }
        
        console.log('🔍 Detector state:', {
            isInitialized: detector.isInitialized,
            isEmergencyMode: detector.isInEmergencyMode(),
            hasPose: !!detector.pose
        });
        
    } catch (error) {
        console.log('❌ MediaPipe initialization failed:', error.message);
    }
    
    console.log('\n🎯 Test Complete!');
    console.log('Check the results above to see if MediaPipe is working correctly.');
}

// Run the test
testMediaPipeIntegration();
