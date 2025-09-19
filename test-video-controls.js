#!/usr/bin/env node

/**
 * Test script for video controls functionality
 * Tests: Impact button, Reload video, Overlay consistency, Video state management
 */

const puppeteer = require('puppeteer');

async function testVideoControls() {
  console.log('🎬 Starting video controls test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to upload page
    console.log('📍 Navigating to upload page...');
    await page.goto('http://localhost:3000/upload', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Use sample video
    console.log('📹 Loading sample video...');
    const sampleButtonSelector = 'button:has-text("Use Tiger Woods Sample")';
    await page.waitForSelector(sampleButtonSelector);
    await page.click(sampleButtonSelector);
    
    // Wait for video to load
    await page.waitForTimeout(3000);
    
    // Click analyze
    console.log('🔍 Starting analysis...');
    const analyzeButton = await page.waitForSelector('button:has-text("Analyze Video")');
    await analyzeButton.click();
    
    // Wait for analysis to complete
    console.log('⏳ Waiting for analysis to complete...');
    await page.waitForSelector('.processed-video-player, [class*="VideoPlayerWithOverlay"]', { timeout: 120000 });
    
    // Test 1: Check if Impact button exists
    console.log('\n✅ Test 1: Checking Impact button...');
    const impactButton = await page.$('button:has-text("Impact")');
    if (impactButton) {
      console.log('✓ Impact button found');
      
      // Click impact button
      await impactButton.click();
      await page.waitForTimeout(1000);
      
      // Check if video seeked
      const currentTime = await page.evaluate(() => {
        const video = document.querySelector('video');
        return video ? video.currentTime : null;
      });
      
      console.log(`✓ Video seeked to: ${currentTime}s`);
    } else {
      console.log('✗ Impact button not found!');
    }
    
    // Test 2: Check if Reload Video button exists
    console.log('\n✅ Test 2: Checking Reload Video button...');
    const reloadButton = await page.$('button:has-text("Reload Video")');
    if (reloadButton) {
      console.log('✓ Reload Video button found');
      
      // Click reload button
      await reloadButton.click();
      await page.waitForTimeout(1000);
      
      // Check if video reset
      const currentTimeAfterReload = await page.evaluate(() => {
        const video = document.querySelector('video');
        return video ? video.currentTime : null;
      });
      
      console.log(`✓ Video reset to: ${currentTimeAfterReload}s`);
    } else {
      console.log('✗ Reload Video button not found!');
    }
    
    // Test 3: Check overlay rendering
    console.log('\n✅ Test 3: Checking overlay rendering...');
    const canvas = await page.$('canvas');
    if (canvas) {
      console.log('✓ Canvas element found for overlays');
      
      // Check if overlays are being drawn
      const hasContent = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return false;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Check if any pixels are not transparent
        return imageData.data.some((value, index) => index % 4 === 3 && value > 0);
      });
      
      console.log(hasContent ? '✓ Overlays are being rendered' : '✗ No overlay content detected');
    } else {
      console.log('✗ Canvas element not found!');
    }
    
    // Test 4: Check video state management
    console.log('\n✅ Test 4: Checking video state management...');
    const videoState = await page.evaluate(() => {
      const video = document.querySelector('video');
      return video ? {
        paused: video.paused,
        currentTime: video.currentTime,
        duration: video.duration,
        readyState: video.readyState,
        src: video.src ? 'present' : 'missing'
      } : null;
    });
    
    if (videoState) {
      console.log('✓ Video state:', JSON.stringify(videoState, null, 2));
    } else {
      console.log('✗ Could not get video state!');
    }
    
    // Test 5: Play/Pause functionality
    console.log('\n✅ Test 5: Testing play/pause...');
    const playPauseButton = await page.$('button:has-text("Play"), button:has-text("Pause")');
    if (playPauseButton) {
      const initialText = await playPauseButton.evaluate(el => el.textContent);
      console.log(`✓ Found play/pause button: ${initialText}`);
      
      await playPauseButton.click();
      await page.waitForTimeout(500);
      
      const afterClickText = await playPauseButton.evaluate(el => el.textContent);
      console.log(`✓ After click: ${afterClickText}`);
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('\n👀 Browser will remain open for manual inspection. Press Ctrl+C to exit.');
    await new Promise(() => {}); // Keep script running
  }
}

// Run tests
testVideoControls().catch(console.error);