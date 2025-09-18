#!/usr/bin/env node

// Quick Development Test for Club Path Visualization
const { execSync } = require('child_process');
const path = require('path');

console.log('🎯 Quick Club Path Development Test\n');

// Test 1: Start development server
function startDevServer() {
    console.log('📋 Starting Next.js development server...');
    
    try {
        // Check if server is already running
        try {
            execSync('curl -s http://localhost:3000 > /dev/null', { stdio: 'pipe' });
            console.log('✅ Development server already running on http://localhost:3000');
            return true;
        } catch (error) {
            // Server not running, start it
            console.log('🚀 Starting development server...');
            const serverProcess = execSync('npm run dev', { 
                cwd: __dirname,
                stdio: 'pipe',
                timeout: 10000 // 10 second timeout
            });
            console.log('✅ Development server started');
            return true;
        }
    } catch (error) {
        console.error('❌ Failed to start development server:', error.message);
        return false;
    }
}

// Test 2: Check if the overlay system is accessible
function checkOverlaySystem() {
    console.log('\n📋 Checking OverlaySystem component...');
    
    const overlaySystemPath = path.join(__dirname, 'src/components/analysis/OverlaySystem.tsx');
    const fs = require('fs');
    
    if (!fs.existsSync(overlaySystemPath)) {
        console.error('❌ OverlaySystem.tsx not found');
        return false;
    }
    
    const content = fs.readFileSync(overlaySystemPath, 'utf8');
    
    // Check for key functions
    const keyFunctions = [
        'drawCompleteClubPath',
        'drawPositionMarkers',
        'drawSwingPlaneFromTrajectory',
        'drawRealtimeClubHeadMarker'
    ];
    
    const foundFunctions = keyFunctions.filter(func => content.includes(func));
    
    if (foundFunctions.length === keyFunctions.length) {
        console.log('✅ All key functions found in OverlaySystem.tsx');
        console.log(`   Found: ${foundFunctions.join(', ')}`);
        return true;
    } else {
        console.error('❌ Missing functions:', keyFunctions.filter(f => !foundFunctions.includes(f)).join(', '));
        return false;
    }
}

// Test 3: Check test video availability
function checkTestVideos() {
    console.log('\n📋 Checking test videos...');
    
    const fixturesPath = path.join(__dirname, 'public/fixtures/swings');
    const fs = require('fs');
    
    if (!fs.existsSync(fixturesPath)) {
        console.error('❌ Test videos directory not found');
        return false;
    }
    
    const videos = fs.readdirSync(fixturesPath).filter(file => file.endsWith('.mp4'));
    
    if (videos.length === 0) {
        console.error('❌ No test videos found');
        return false;
    }
    
    console.log('✅ Test videos found:');
    videos.forEach(video => {
        const videoPath = path.join(fixturesPath, video);
        const stats = fs.statSync(videoPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`   - ${video} (${sizeMB} MB)`);
    });
    
    return true;
}

// Test 4: Generate test instructions
function generateTestInstructions() {
    console.log('\n📋 Test Instructions Generated:');
    console.log('='.repeat(50));
    
    console.log('\n🎯 MANUAL TESTING STEPS:');
    console.log('\n1. Open your browser and go to: http://localhost:3000');
    console.log('\n2. Navigate to the upload page or camera page');
    console.log('\n3. Upload one of these test videos:');
    console.log('   - tiger-woods-swing.mp4');
    console.log('   - ludvig_aberg_driver.mp4');
    console.log('   - max_homa_iron.mp4');
    
    console.log('\n4. After analysis, look for these visual elements:');
    console.log('   ✅ Complete club path with phase colors:');
    console.log('      - Green: Address phase');
    console.log('      - Yellow: Backswing phase');
    console.log('      - Red: Downswing phase');
    console.log('      - Magenta: Impact phase');
    console.log('      - Blue: Follow-through phase');
    
    console.log('\n   ✅ Key position markers:');
    console.log('      - ADDRESS: Green circle');
    console.log('      - TOP: Yellow circle');
    console.log('      - IMPACT: Magenta circle');
    console.log('      - FINISH: Blue circle');
    
    console.log('\n   ✅ Swing plane visualization:');
    console.log('      - Orange dashed line from address → top → impact');
    
    console.log('\n   ✅ Real-time club head marker:');
    console.log('      - White circle that follows the club during playback');
    
    console.log('\n5. Test different overlay modes:');
    console.log('   - Clean: No overlays');
    console.log('   - Analysis: Club path + markers + plane');
    console.log('   - Technical: All above + pose skeleton');
    
    console.log('\n6. Test playback controls:');
    console.log('   - Play/pause the video');
    console.log('   - Seek to different time positions');
    console.log('   - Verify markers update in real-time');
    
    console.log('\n7. Check browser console for debug logs:');
    console.log('   - Look for "🎯 CLUB PATH DEBUG:" messages');
    console.log('   - Verify trajectory points and phase frames');
    console.log('   - Check for any validation errors');
    
    console.log('\n8. Test with different camera angles:');
    console.log('   - Try videos from different perspectives');
    console.log('   - Verify camera angle detection in console');
    
    console.log('\n' + '='.repeat(50));
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('\nIf you don\'t see the club path visualization:');
    console.log('1. Check browser console for errors');
    console.log('2. Verify the video has been analyzed (poses generated)');
    console.log('3. Make sure overlay mode is set to "Analysis" or "Technical"');
    console.log('4. Check that the video is playing (not paused)');
    console.log('5. Try refreshing the page and re-analyzing');
    
    console.log('\nIf the visualization looks incorrect:');
    console.log('1. Check the debug logs for trajectory validation errors');
    console.log('2. Verify phase detection is working correctly');
    console.log('3. Check that poses have valid landmark data');
    console.log('4. Try with a different test video');
    
    console.log('\n📊 EXPECTED RESULTS:');
    console.log('- Smooth, continuous club path across all phases');
    console.log('- Clear phase color transitions');
    console.log('- Accurate key position markers');
    console.log('- Real-time marker following playback');
    console.log('- No console errors or warnings');
    console.log('- Responsive overlay updates during playback');
}

// Run all tests
async function runQuickTest() {
    console.log('🚀 Running Quick Club Path Test...\n');
    
    const tests = [
        { name: 'Overlay System', test: checkOverlaySystem },
        { name: 'Test Videos', test: checkTestVideos }
    ];
    
    let passed = 0;
    
    for (const test of tests) {
        try {
            const result = test.test();
            if (result) {
                passed++;
                console.log(`✅ ${test.name} test passed`);
            } else {
                console.log(`❌ ${test.name} test failed`);
            }
        } catch (error) {
            console.error(`❌ ${test.name} test error:`, error.message);
        }
    }
    
    console.log(`\n📊 Quick Test Results: ${passed}/${tests.length} passed`);
    
    if (passed === tests.length) {
        console.log('\n🎉 All quick tests passed! Ready for manual testing.');
        generateTestInstructions();
    } else {
        console.log('\n⚠️  Some tests failed. Please fix the issues before testing.');
    }
    
    return passed === tests.length;
}

// Run the quick test
runQuickTest().then(success => {
    if (success) {
        console.log('\n🚀 You can now test the club path visualization!');
        console.log('Open http://localhost:3000 in your browser to get started.');
    }
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Quick test failed:', error);
    process.exit(1);
});

