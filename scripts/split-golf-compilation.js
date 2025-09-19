#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Golf Swing Video Splitter
 * 
 * This script takes a compilation video of multiple golf swings and splits it
 * into individual swing clips by detecting swing start/end points.
 * 
 * Usage: node scripts/split-golf-compilation.js <input_video> [output_dir]
 */

class GolfSwingSplitter {
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
      console.error('   Windows: Download from https://ffmpeg.org/');
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
   * Detect swing start/end points using motion analysis
   * This is a simplified approach - in practice, you'd want more sophisticated detection
   */
  detectSwingPoints() {
    console.log('🔍 Analyzing video for swing points...');
    
    // For now, we'll use a simple approach:
    // 1. Extract frames at regular intervals
    // 2. Analyze motion between frames
    // 3. Detect when motion exceeds threshold (swing start)
    // 4. Detect when motion drops below threshold (swing end)
    
    const videoInfo = this.getVideoInfo();
    if (!videoInfo) return [];
    
    const { duration, fps } = videoInfo;
    const frameInterval = 0.1; // Analyze every 0.1 seconds
    const motionThreshold = 0.1; // Adjust based on testing
    
    console.log(`📊 Video duration: ${duration}s, FPS: ${fps}`);
    
    // This is a placeholder - in a real implementation, you'd:
    // 1. Extract frames using ffmpeg
    // 2. Compare consecutive frames for motion
    // 3. Detect peaks in motion (swing start/end)
    
    // For now, let's create some example swing points
    // In practice, you'd replace this with actual motion detection
    const swingPoints = this.generateExampleSwingPoints(duration);
    
    console.log(`✅ Found ${swingPoints.length} potential swing clips`);
    return swingPoints;
  }

  /**
   * Generate example swing points (replace with real detection)
   */
  generateExampleSwingPoints(duration) {
    const swings = [];
    const swingDuration = 3; // Assume each swing is ~3 seconds
    const gapBetweenSwings = 1; // 1 second gap between swings
    
    let currentTime = 0;
    let swingIndex = 1;
    
    while (currentTime + swingDuration < duration) {
      swings.push({
        start: currentTime,
        end: currentTime + swingDuration,
        index: swingIndex
      });
      
      currentTime += swingDuration + gapBetweenSwings;
      swingIndex++;
    }
    
    return swings;
  }

  /**
   * Split video into individual swing clips
   */
  async splitVideo() {
    if (!this.checkFFmpeg()) {
      return false;
    }

    console.log(`🎬 Splitting video: ${this.inputVideo}`);
    
    const swingPoints = this.detectSwingPoints();
    if (swingPoints.length === 0) {
      console.log('❌ No swing points detected');
      return false;
    }

    console.log(`📝 Creating ${swingPoints.length} swing clips...`);

    for (const swing of swingPoints) {
      const outputFile = path.join(this.outputDir, `swing_${swing.index}.mp4`);
      
      try {
        const cmd = `ffmpeg -i "${this.inputVideo}" -ss ${swing.start} -t ${swing.end - swing.start} -c copy "${outputFile}" -y`;
        
        console.log(`   Creating swing ${swing.index}: ${swing.start}s - ${swing.end}s`);
        execSync(cmd, { stdio: 'pipe' });
        
        this.swingClips.push({
          file: outputFile,
          start: swing.start,
          end: swing.end,
          index: swing.index
        });
        
        console.log(`   ✅ Created: ${outputFile}`);
      } catch (error) {
        console.error(`   ❌ Error creating swing ${swing.index}:`, error.message);
      }
    }

    return true;
  }

  /**
   * Generate a summary of created clips
   */
  generateSummary() {
    const summary = {
      totalClips: this.swingClips.length,
      clips: this.swingClips.map(clip => ({
        file: path.basename(clip.file),
        duration: clip.end - clip.start,
        startTime: clip.start,
        endTime: clip.end
      }))
    };

    const summaryFile = path.join(this.outputDir, 'swing_clips_summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log(`\n📋 Summary saved to: ${summaryFile}`);
    console.log(`🎯 Created ${summary.totalClips} swing clips:`);
    
    summary.clips.forEach(clip => {
      console.log(`   • ${clip.file} (${clip.duration.toFixed(1)}s) - ${clip.startTime}s to ${clip.endTime}s`);
    });
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/split-golf-compilation.js <input_video> [output_dir]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/split-golf-compilation.js compilation.mp4');
    console.log('  node scripts/split-golf-compilation.js compilation.mp4 custom_output_dir');
    process.exit(1);
  }

  const inputVideo = args[0];
  const outputDir = args[1] || 'public/fixtures/swings';

  if (!fs.existsSync(inputVideo)) {
    console.error(`❌ Input video not found: ${inputVideo}`);
    process.exit(1);
  }

  const splitter = new GolfSwingSplitter(inputVideo, outputDir);
  
  console.log('🏌️ Golf Swing Video Splitter');
  console.log('============================');
  console.log(`Input: ${inputVideo}`);
  console.log(`Output: ${outputDir}`);
  console.log('');

  const success = await splitter.splitVideo();
  
  if (success) {
    splitter.generateSummary();
    console.log('\n🎉 Video splitting completed successfully!');
  } else {
    console.log('\n❌ Video splitting failed');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = GolfSwingSplitter;
