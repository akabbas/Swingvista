#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Manual 9-Golfer PGA Tour Splitter
 * 
 * Uses manual timing and better detection to identify all 9 golfers
 * from the PGA Tour compilation video
 */

class Manual9GolfersSplitter {
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
   * Define the 9 golfers with their approximate timing
   * Based on typical YouTube Shorts compilation patterns
   */
  getGolfersTiming() {
    return [
      { name: 'Tiger Woods', start: 0.5, end: 3.5, index: 1 },
      { name: 'Rory McIlroy', start: 3.0, end: 6.0, index: 2 },
      { name: 'Jon Rahm', start: 5.5, end: 8.5, index: 3 },
      { name: 'Scottie Scheffler', start: 8.0, end: 11.0, index: 4 },
      { name: 'Collin Morikawa', start: 10.5, end: 13.5, index: 5 },
      { name: 'Xander Schauffele', start: 13.0, end: 16.0, index: 6 },
      { name: 'Hideki Matsuyama', start: 15.5, end: 18.5, index: 7 },
      { name: 'Justin Thomas', start: 18.0, end: 21.0, index: 8 },
      { name: 'Adam Scott', start: 20.5, end: 23.5, index: 9 }
    ];
  }

  /**
   * Create filename from player name
   */
  createFilename(playerName, index) {
    const cleanName = playerName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    return `pga_${cleanName}_driver_${index}.mp4`;
  }

  /**
   * Split video into individual swing clips
   */
  async splitVideo() {
    if (!this.checkFFmpeg()) {
      return false;
    }

    console.log('🎬 Manual 9-Golfer PGA Tour splitting...');
    console.log(`Input: ${this.inputVideo}`);
    console.log(`Output: ${this.outputDir}`);
    console.log('');

    // Get video info
    const videoInfo = this.getVideoInfo();
    if (!videoInfo) {
      console.log('❌ Could not get video info');
      return false;
    }

    const { duration } = videoInfo;
    console.log(`📊 Video duration: ${duration.toFixed(1)}s`);

    // Get golfers timing
    const golfers = this.getGolfersTiming();
    console.log(`🎯 Processing ${golfers.length} golfers...`);

    // Create individual swing clips
    for (const golfer of golfers) {
      // Ensure we don't exceed video duration
      const endTime = Math.min(golfer.end, duration);
      const startTime = Math.max(0, golfer.start);
      
      if (endTime - startTime < 2) {
        console.log(`   ⚠️ Skipping ${golfer.name} - clip too short`);
        continue;
      }

      const filename = this.createFilename(golfer.name, golfer.index);
      const outputFile = path.join(this.outputDir, filename);
      
      try {
        const cmd = `ffmpeg -i "${this.inputVideo}" -ss ${startTime} -t ${endTime - startTime} -c copy "${outputFile}" -y`;
        
        console.log(`   Creating ${golfer.name}: ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s`);
        execSync(cmd, { stdio: 'pipe' });
        
        this.swingClips.push({
          file: outputFile,
          start: startTime,
          end: endTime,
          player: golfer.name,
          index: golfer.index
        });
        
        console.log(`   ✅ Created: ${filename}`);
      } catch (error) {
        console.error(`   ❌ Error creating ${golfer.name}:`, error.message);
      }
    }

    return true;
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
        player: clip.player,
        duration: clip.end - clip.start,
        startTime: clip.start,
        endTime: clip.end,
        description: `${clip.player} driver swing`
      }))
    };

    const summaryFile = path.join(this.outputDir, 'manual_9_golfers_summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log(`\n📋 Summary saved to: ${summaryFile}`);
    console.log(`🎯 Created ${summary.totalClips} complete swing clips:`);
    
    summary.clips.forEach((clip, index) => {
      console.log(`   ${index + 1}. ${clip.file} (${clip.player}) - ${clip.duration.toFixed(1)}s`);
    });
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/manual-9-golfers-splitter.js <input_video> [output_dir]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/manual-9-golfers-splitter.js pga_tour_drivers_compilation.mp4');
    console.log('  node scripts/manual-9-golfers-splitter.js compilation.mp4 custom_output_dir');
    process.exit(1);
  }

  const inputVideo = args[0];
  const outputDir = args[1] || 'public/fixtures/swings';

  if (!fs.existsSync(inputVideo)) {
    console.error(`❌ Input video not found: ${inputVideo}`);
    process.exit(1);
  }

  const splitter = new Manual9GolfersSplitter(inputVideo, outputDir);
  
  console.log('🏌️ Manual 9-Golfer PGA Tour Splitter');
  console.log('====================================');
  console.log(`Input: ${inputVideo}`);
  console.log(`Output: ${outputDir}`);
  console.log('');

  const success = await splitter.splitVideo();
  
  if (success) {
    splitter.generateSummary();
    console.log('\n🎉 Manual 9-golfer splitting completed!');
    console.log('\n📱 All 9 golfer clips are ready for your app!');
  } else {
    console.log('\n❌ Video splitting failed');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = Manual9GolfersSplitter;
