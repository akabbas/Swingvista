#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Complete Enhanced PGA Tour Compilation Processor
 * 
 * Downloads the PGA Tour driver swings compilation and splits it into individual clips
 * with complete swings (approach + swing + follow-through) and player names
 */

class EnhancedPGAProcessor {
  constructor(outputDir = 'public/fixtures/swings') {
    this.outputDir = outputDir;
    this.videoUrl = 'https://www.youtube.com/shorts/UHKApJXBSd0';
    this.compilationFile = path.join(outputDir, 'pga_tour_drivers_compilation.mp4');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Check if required tools are available
   */
  checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    let allGood = true;
    
    // Check yt-dlp
    try {
      execSync('yt-dlp --version', { stdio: 'ignore' });
      console.log('   ✅ yt-dlp is available');
    } catch (error) {
      console.log('   ❌ yt-dlp is not installed');
      console.log('      Install with: pip install yt-dlp');
      allGood = false;
    }
    
    // Check ffmpeg
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' });
      console.log('   ✅ ffmpeg is available');
    } catch (error) {
      console.log('   ❌ ffmpeg is not installed');
      console.log('      Install with: brew install ffmpeg (macOS) or sudo apt install ffmpeg (Ubuntu)');
      allGood = false;
    }
    
    // Check tesseract for OCR
    try {
      execSync('tesseract --version', { stdio: 'ignore' });
      console.log('   ✅ tesseract (OCR) is available');
    } catch (error) {
      console.log('   ❌ tesseract is not installed');
      console.log('      Install with: brew install tesseract (macOS) or sudo apt install tesseract-ocr (Ubuntu)');
      allGood = false;
    }
    
    return allGood;
  }

  /**
   * Download the PGA Tour compilation video
   */
  async downloadVideo() {
    console.log('📥 Downloading PGA Tour driver swings compilation...');
    console.log(`   URL: ${this.videoUrl}`);
    console.log(`   Output: ${this.compilationFile}`);
    
    try {
      const cmd = `yt-dlp -f "best[height<=720]" -o "${this.compilationFile}" "${this.videoUrl}"`;
      execSync(cmd, { stdio: 'pipe' });
      
      if (fs.existsSync(this.compilationFile)) {
        console.log('   ✅ Download completed successfully');
        return true;
      } else {
        console.log('   ❌ Download failed - file not found');
        return false;
      }
    } catch (error) {
      console.error('   ❌ Download failed:', error.message);
      return false;
    }
  }

  /**
   * Split the compilation into individual swing clips with player names
   */
  async splitVideo() {
    console.log('✂️ Splitting compilation into complete swing clips with player names...');
    
    try {
      // Import and use the enhanced splitter
      const EnhancedPGASplitter = require('./enhanced-pga-splitter.js');
      const splitter = new EnhancedPGASplitter(this.compilationFile, this.outputDir);
      
      const success = await splitter.splitVideo();
      
      if (success) {
        splitter.generateSummary();
        return true;
      } else {
        console.log('   ❌ Video splitting failed');
        return false;
      }
    } catch (error) {
      console.error('   ❌ Error during splitting:', error.message);
      return false;
    }
  }

  /**
   * Clean up the original compilation file
   */
  cleanup() {
    try {
      if (fs.existsSync(this.compilationFile)) {
        fs.unlinkSync(this.compilationFile);
        console.log('🧹 Cleaned up original compilation file');
      }
    } catch (error) {
      console.log('⚠️ Could not clean up compilation file:', error.message);
    }
  }

  /**
   * Show final summary
   */
  showSummary() {
    console.log('\n🎉 Enhanced PGA Tour Compilation Processing Complete!');
    console.log('===================================================');
    console.log('');
    console.log('📁 Your new test videos are in:');
    console.log(`   ${this.outputDir}/`);
    console.log('');
    console.log('🎬 Created files:');
    
    const files = fs.readdirSync(this.outputDir)
      .filter(f => f.startsWith('pga_') && f.endsWith('.mp4'))
      .sort();
    
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    
    console.log('');
    console.log('✨ Features:');
    console.log('   • Complete swings (approach + swing + follow-through)');
    console.log('   • Player names extracted from video text');
    console.log('   • No interruptions between players');
    console.log('   • Ready for your swing analysis app');
    console.log('');
    console.log('📱 Next steps:');
    console.log('1. Test the videos in your upload page');
    console.log('2. Verify pose detection works correctly');
    console.log('3. Check that player names are accurate');
  }

  /**
   * Main processing workflow
   */
  async process() {
    console.log('🏌️ Enhanced PGA Tour Driver Swings Processor');
    console.log('============================================');
    console.log(`Source: ${this.videoUrl}`);
    console.log(`Output: ${this.outputDir}`);
    console.log('');

    // Check prerequisites
    if (!this.checkPrerequisites()) {
      console.log('\n❌ Prerequisites not met. Please install required tools and try again.');
      console.log('\n📋 Required tools:');
      console.log('   • yt-dlp: pip install yt-dlp');
      console.log('   • ffmpeg: brew install ffmpeg (macOS) or sudo apt install ffmpeg (Ubuntu)');
      console.log('   • tesseract: brew install tesseract (macOS) or sudo apt install tesseract-ocr (Ubuntu)');
      process.exit(1);
    }

    console.log('');

    // Download video
    const downloadSuccess = await this.downloadVideo();
    if (!downloadSuccess) {
      console.log('\n❌ Download failed. Please check the URL and try again.');
      process.exit(1);
    }

    console.log('');

    // Split video
    const splitSuccess = await this.splitVideo();
    if (!splitSuccess) {
      console.log('\n❌ Video splitting failed.');
      process.exit(1);
    }

    // Clean up
    this.cleanup();

    // Show summary
    this.showSummary();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const outputDir = args[0] || 'public/fixtures/swings';

  const processor = new EnhancedPGAProcessor(outputDir);
  await processor.process();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnhancedPGAProcessor;
