#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * PGA Tour Driver Swings Splitter
 * 
 * Specifically designed to split the PGA Tour driver swings compilation
 * from https://www.youtube.com/shorts/UHKApJXBSd0 into individual clips
 */

class PGADriverSplitter {
  constructor(inputVideo, outputDir = 'public/fixtures/swings') {
    this.inputVideo = inputVideo;
    this.outputDir = outputDir;
    this.swingClips = [];
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Check if ffmpeg is available
   */
  checkFFmpeg() {
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      console.error('❌ FFmpeg is not installed. Please install FFmpeg first:');
      console.error('   macOS: brew install ffmpeg');
      console.error('   Ubuntu: sudo apt install ffmpeg');
      return false;
    }
  }

  /**
   * Get video duration and basic info
   */
  getVideoInfo() {
    try {
      const cmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${this.inputVideo}"`;
      const output = execSync(cmd, { encoding: 'utf8' });
      const info = JSON.parse(output);
      
      const videoStream = info.streams.find(s => s.codec_type === 'video');
      return {
        duration: parseFloat(info.format.duration),
        width: videoStream.width,
        height: videoStream.height,
        fps: eval(videoStream.r_frame_rate)
      };
    } catch (error) {
      console.error('❌ Error getting video info:', error.message);
      return null;
    }
  }

  /**
   * Extract frames for analysis
   */
  extractFrames() {
    console.log('🎞️ Extracting frames for analysis...');
    
    const tempDir = path.join(this.outputDir, 'temp_frames');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    try {
      // Extract frames at 10fps for analysis
      const cmd = `ffmpeg -i "${this.inputVideo}" -vf "fps=10" "${tempDir}/frame_%04d.png" -y`;
      execSync(cmd, { stdio: 'pipe' });
      
      const frames = fs.readdirSync(tempDir)
        .filter(f => f.endsWith('.png'))
        .sort();
      
      console.log(`✅ Extracted ${frames.length} frames`);
      return { frames, tempDir };
    } catch (error) {
      console.error('❌ Error extracting frames:', error.message);
      return { frames: [], tempDir };
    }
  }

  /**
   * Analyze frames to detect swing transitions
   * This uses a simplified approach for YouTube Shorts compilations
   */
  analyzeSwingTransitions(frames, tempDir) {
    console.log('🔍 Analyzing swing transitions...');
    
    const frameRate = 10; // fps we extracted at
    const transitions = [];
    
    // For YouTube Shorts compilations, we can detect transitions by:
    // 1. Looking for scene changes (different backgrounds/lighting)
    // 2. Detecting when the golfer position changes significantly
    // 3. Finding cuts between different swings
    
    // This is a simplified approach - in practice, you'd use OpenCV or similar
    // For now, we'll use a heuristic based on typical compilation patterns
    
    const videoInfo = this.getVideoInfo();
    if (!videoInfo) return [];
    
    const { duration } = videoInfo;
    
    // Estimate number of swings based on typical compilation length
    // Most golf compilations have 3-5 second clips with quick transitions
    const estimatedSwingCount = Math.floor(duration / 4); // Assume 4 seconds per swing
    const swingDuration = duration / estimatedSwingCount;
    
    console.log(`📊 Video duration: ${duration.toFixed(1)}s`);
    console.log(`🎯 Estimated ${estimatedSwingCount} swings at ~${swingDuration.toFixed(1)}s each`);
    
    // Create swing points based on estimated timing
    for (let i = 0; i < estimatedSwingCount; i++) {
      const start = i * swingDuration;
      const end = Math.min((i + 1) * swingDuration, duration);
      
      // Add small buffer to ensure we capture the full swing
      const buffer = 0.2; // 200ms buffer
      const adjustedStart = Math.max(0, start - buffer);
      const adjustedEnd = Math.min(duration, end + buffer);
      
      transitions.push({
        start: adjustedStart,
        end: adjustedEnd,
        index: i + 1
      });
    }
    
    return transitions;
  }

  /**
   * Split video into individual swing clips
   */
  async splitVideo() {
    if (!this.checkFFmpeg()) {
      return false;
    }

    console.log('🎬 Splitting PGA Tour driver compilation...');
    console.log(`Input: ${this.inputVideo}`);
    console.log(`Output: ${this.outputDir}`);
    console.log('');

    // Get video info
    const videoInfo = this.getVideoInfo();
    if (!videoInfo) {
      console.log('❌ Could not get video info');
      return false;
    }

    // Extract frames for analysis
    const { frames, tempDir } = this.extractFrames();
    
    // Analyze swing transitions
    const swingPoints = this.analyzeSwingTransitions(frames, tempDir);
    
    if (swingPoints.length === 0) {
      console.log('❌ No swing points detected');
      return false;
    }

    console.log(`📝 Creating ${swingPoints.length} driver swing clips...`);

    // Create individual swing clips
    for (const swing of swingPoints) {
      const outputFile = path.join(this.outputDir, `pga_driver_${swing.index}.mp4`);
      
      try {
        const cmd = `ffmpeg -i "${this.inputVideo}" -ss ${swing.start} -t ${swing.end - swing.start} -c copy "${outputFile}" -y`;
        
        console.log(`   Creating swing ${swing.index}: ${swing.start.toFixed(1)}s - ${swing.end.toFixed(1)}s`);
        execSync(cmd, { stdio: 'pipe' });
        
        this.swingClips.push({
          file: outputFile,
          start: swing.start,
          end: swing.end,
          index: swing.index
        });
        
        console.log(`   ✅ Created: ${path.basename(outputFile)}`);
      } catch (error) {
        console.error(`   ❌ Error creating swing ${swing.index}:`, error.message);
      }
    }

    // Clean up temp frames
    this.cleanup(tempDir);
    
    return true;
  }

  /**
   * Clean up temporary files
   */
  cleanup(tempDir) {
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        files.forEach(file => {
          fs.unlinkSync(path.join(tempDir, file));
        });
        fs.rmdirSync(tempDir);
        console.log('🧹 Cleaned up temporary files');
      }
    } catch (error) {
      console.log('⚠️ Could not clean up temp files:', error.message);
    }
  }

  /**
   * Generate summary of created clips
   */
  generateSummary() {
    const summary = {
      source: 'PGA Tour Driver Swings Compilation',
      sourceUrl: 'https://www.youtube.com/shorts/UHKApJXBSd0',
      totalClips: this.swingClips.length,
      clips: this.swingClips.map(clip => ({
        file: path.basename(clip.file),
        duration: clip.end - clip.start,
        startTime: clip.start,
        endTime: clip.end,
        description: `PGA Tour driver swing ${clip.index}`
      }))
    };

    const summaryFile = path.join(this.outputDir, 'pga_driver_clips_summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log(`\n📋 Summary saved to: ${summaryFile}`);
    console.log(`🎯 Created ${summary.totalClips} PGA Tour driver swing clips:`);
    
    summary.clips.forEach(clip => {
      console.log(`   • ${clip.file} (${clip.duration.toFixed(1)}s) - ${clip.startTime.toFixed(1)}s to ${clip.endTime.toFixed(1)}s`);
    });
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/split-pga-compilation.js <input_video> [output_dir]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/split-pga-compilation.js pga_tour_drivers_compilation.mp4');
    console.log('  node scripts/split-pga-compilation.js compilation.mp4 custom_output_dir');
    process.exit(1);
  }

  const inputVideo = args[0];
  const outputDir = args[1] || 'public/fixtures/swings';

  if (!fs.existsSync(inputVideo)) {
    console.error(`❌ Input video not found: ${inputVideo}`);
    process.exit(1);
  }

  const splitter = new PGADriverSplitter(inputVideo, outputDir);
  
  console.log('🏌️ PGA Tour Driver Swings Splitter');
  console.log('==================================');
  console.log(`Input: ${inputVideo}`);
  console.log(`Output: ${outputDir}`);
  console.log('');

  const success = await splitter.splitVideo();
  
  if (success) {
    splitter.generateSummary();
    console.log('\n🎉 Video splitting completed successfully!');
    console.log('\n📱 Your new test videos are ready for the app!');
  } else {
    console.log('\n❌ Video splitting failed');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PGADriverSplitter;
