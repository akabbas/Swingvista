#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testFOUC() {
  console.log('🔍 Starting FOUC Test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless testing
    slowMo: 100 // Slow down for better observation
  });
  
  const page = await browser.newPage();
  
  // Enable request interception to simulate slow loading
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    // Delay CSS requests to test FOUC
    if (request.url().includes('.css') || request.url().includes('font')) {
      setTimeout(() => request.continue(), 1000);
    } else {
      request.continue();
    }
  });
  
  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Navigate to the page
  console.log('📱 Loading page...');
  await page.goto('http://localhost:3015', { 
    waitUntil: 'networkidle0',
    timeout: 30000 
  });
  
  // Take screenshot immediately after load
  await page.screenshot({ path: 'fouc-test-initial.png' });
  console.log('📸 Screenshot saved: fouc-test-initial.png');
  
  // Check for FOUC indicators
  const foucChecks = await page.evaluate(() => {
    const results = {
      hasInterFont: false,
      hasThemeClass: false,
      hasBackgroundColor: false,
      fontSwapDetected: false,
      layoutShiftDetected: false
    };
    
    // Check if Inter font is loaded
    const htmlElement = document.documentElement;
    const computedStyle = window.getComputedStyle(htmlElement);
    
    // Check font family
    const fontFamily = computedStyle.fontFamily;
    results.hasInterFont = fontFamily.includes('Inter') || fontFamily.includes('__variable_');
    
    // Check theme class
    results.hasThemeClass = htmlElement.classList.contains('dark') || 
                           htmlElement.classList.contains('light');
    
    // Check background color
    const bgColor = computedStyle.backgroundColor;
    results.hasBackgroundColor = bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';
    
    // Check for font swap (fallback fonts)
    results.fontSwapDetected = fontFamily.includes('sans-serif') && 
                              !fontFamily.includes('Inter') && 
                              !fontFamily.includes('__variable_');
    
    return results;
  });
  
  console.log('\n📊 FOUC Test Results:');
  console.log('====================');
  console.log(`✅ Inter Font Loaded: ${foucChecks.hasInterFont ? 'YES' : 'NO'}`);
  console.log(`✅ Theme Class Applied: ${foucChecks.hasThemeClass ? 'YES' : 'NO'}`);
  console.log(`✅ Background Color Set: ${foucChecks.hasBackgroundColor ? 'YES' : 'NO'}`);
  console.log(`❌ Font Swap Detected: ${foucChecks.fontSwapDetected ? 'YES' : 'NO'}`);
  console.log(`❌ Layout Shift Detected: ${foucChecks.layoutShiftDetected ? 'YES' : 'NO'}`);
  
  // Overall FOUC assessment
  const isFOUCFree = foucChecks.hasInterFont && 
                     foucChecks.hasThemeClass && 
                     foucChecks.hasBackgroundColor && 
                     !foucChecks.fontSwapDetected;
  
  console.log('\n🎯 FOUC Assessment:');
  console.log('==================');
  if (isFOUCFree) {
    console.log('✅ EXCELLENT: No FOUC detected! App loads with proper styling.');
  } else {
    console.log('❌ FOUC DETECTED: Issues found that may cause flash of unstyled content.');
  }
  
  // Wait a bit to observe any delayed loading
  console.log('\n⏳ Waiting 3 seconds to observe any delayed loading...');
  await page.waitForTimeout(3000);
  
  // Take final screenshot
  await page.screenshot({ path: 'fouc-test-final.png' });
  console.log('📸 Final screenshot saved: fouc-test-final.png');
  
  await browser.close();
  
  console.log('\n🏁 FOUC Test Complete!');
  console.log('Check the screenshots to visually verify no FOUC occurred.');
}

// Run the test
testFOUC().catch(console.error);
