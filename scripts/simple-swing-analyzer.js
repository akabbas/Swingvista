#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Simple PGA Tour Swing Analyzer
 * 
 * This script adds basic metrics overlays to the PGA Tour golfer videos
 * using a simpler approach compatible with most ffmpeg installations
 */

class SimpleSwingAnalyzer {
  constructor(inputDir = 'public/fixtures/swings', outputDir = 'public/fixtures/analyzed_swings') {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.processedVideos = [];
    
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
   * Get list of PGA Tour golfer videos
   */
  getPGAVideos() {
    try {
      const files = fs.readdirSync(this.inputDir);
      return files.filter(file => 
        file.startsWith('pga_') && 
        file.includes('_driver_') && 
        file.endsWith('.mp4')
      );
    } catch (error) {
      console.error('❌ Error reading input directory:', error.message);
      return [];
    }
  }

  /**
   * Get golfer name from filename
   */
  getGolferName(filename) {
    const match = filename.match(/pga_([a-z_]+)_driver/);
    if (!match) return 'Unknown';
    
    return match[1].split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Get golfer-specific metrics
   */
  getGolferMetrics(golferName) {
    // Base metrics for professional golfers
    const baseMetrics = {
      tempo: {
        backswingTime: 0.82,
        downswingTime: 0.27,
        tempoRatio: 3.04,
        score: 94
      },
      rotation: {
        shoulderTurn: 92,
        hipTurn: 45,
        xFactor: 47,
        score: 93
      },
      clubSpeed: 115,
      swingPlane: 63,
      overallScore: 93,
      letterGrade: "A"
    };
    
    // Customize metrics based on golfer
    const lowerName = golferName.toLowerCase();
    
    if (lowerName.includes('tiger')) {
      baseMetrics.rotation.shoulderTurn = 95;
      baseMetrics.rotation.xFactor = 48;
      baseMetrics.clubSpeed = 120;
      baseMetrics.overallScore = 96;
      baseMetrics.letterGrade = 'A+';
    } else if (lowerName.includes('rory')) {
      baseMetrics.tempo.tempoRatio = 3.0;
      baseMetrics.clubSpeed = 122;
      baseMetrics.overallScore = 95;
      baseMetrics.letterGrade = 'A';
    } else if (lowerName.includes('rahm')) {
      baseMetrics.tempo.tempoRatio = 2.8;
      baseMetrics.rotation.shoulderTurn = 88;
      baseMetrics.overallScore = 91;
      baseMetrics.letterGrade = 'A-';
    } else if (lowerName.includes('scheffler')) {
      baseMetrics.swingPlane = 64;
      baseMetrics.overallScore = 94;
      baseMetrics.letterGrade = 'A';
    } else if (lowerName.includes('morikawa')) {
      baseMetrics.swingPlane = 62;
      baseMetrics.overallScore = 94;
      baseMetrics.letterGrade = 'A';
    } else if (lowerName.includes('schauffele')) {
      baseMetrics.rotation.shoulderTurn = 90;
      baseMetrics.rotation.hipTurn = 42;
      baseMetrics.rotation.xFactor = 48;
      baseMetrics.overallScore = 92;
      baseMetrics.letterGrade = 'A-';
    } else if (lowerName.includes('matsuyama')) {
      baseMetrics.tempo.backswingTime = 0.9;
      baseMetrics.tempo.tempoRatio = 3.0;
      baseMetrics.rotation.shoulderTurn = 95;
      baseMetrics.overallScore = 93;
      baseMetrics.letterGrade = 'A';
    } else if (lowerName.includes('thomas')) {
      baseMetrics.rotation.shoulderTurn = 97;
      baseMetrics.rotation.hipTurn = 47;
      baseMetrics.rotation.xFactor = 50;
      baseMetrics.clubSpeed = 118;
      baseMetrics.overallScore = 94;
      baseMetrics.letterGrade = 'A';
    } else if (lowerName.includes('scott')) {
      baseMetrics.tempo.tempoRatio = 3.1;
      baseMetrics.overallScore = 95;
      baseMetrics.letterGrade = 'A';
    }
    
    return baseMetrics;
  }

  /**
   * Create overlay video using ffmpeg
   */
  createOverlayVideo(videoFile) {
    const inputPath = path.join(this.inputDir, videoFile);
    const outputPath = path.join(this.outputDir, videoFile.replace('.mp4', '_analyzed.mp4'));
    
    // Get golfer name from filename
    const golferName = this.getGolferName(videoFile);
    
    // Get metrics for this golfer
    const metrics = this.getGolferMetrics(golferName);
    
    try {
      // Create a simpler ffmpeg filter that works with most installations
      const filter = `drawtext=text='${golferName}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.7:boxborderw=5:x=20:y=20,` +
        `drawtext=text='Tempo\\: ${metrics.tempo.tempoRatio}\\:1':fontcolor=white:fontsize=18:box=1:boxcolor=black@0.7:boxborderw=5:x=20:y=50,` +
        `drawtext=text='Shoulder Turn\\: ${metrics.rotation.shoulderTurn}°':fontcolor=white:fontsize=18:box=1:boxcolor=black@0.7:boxborderw=5:x=20:y=80,` +
        `drawtext=text='Hip Turn\\: ${metrics.rotation.hipTurn}°':fontcolor=white:fontsize=18:box=1:boxcolor=black@0.7:boxborderw=5:x=20:y=110,` +
        `drawtext=text='X-Factor\\: ${metrics.rotation.xFactor}°':fontcolor=white:fontsize=18:box=1:boxcolor=black@0.7:boxborderw=5:x=20:y=140,` +
        `drawtext=text='Club Speed\\: ${metrics.clubSpeed} mph':fontcolor=white:fontsize=18:box=1:boxcolor=black@0.7:boxborderw=5:x=20:y=170,` +
        `drawtext=text='Swing Plane\\: ${metrics.swingPlane}°':fontcolor=white:fontsize=18:box=1:boxcolor=black@0.7:boxborderw=5:x=20:y=200,` +
        `drawtext=text='Grade\\: ${metrics.letterGrade} (${metrics.overallScore}/100)':fontcolor=white:fontsize=18:box=1:boxcolor=black@0.7:boxborderw=5:x=20:y=230`;
      
      // Run ffmpeg command
      const cmd = `ffmpeg -i "${inputPath}" -vf "${filter}" -c:v libx264 -preset fast -crf 23 "${outputPath}" -y`;
      
      console.log(`   Processing ${videoFile}...`);
      execSync(cmd, { stdio: 'pipe' });
      
      this.processedVideos.push({
        original: videoFile,
        analyzed: path.basename(outputPath),
        golfer: golferName
      });
      
      console.log(`   ✅ Created: ${path.basename(outputPath)}`);
      return true;
    } catch (error) {
      console.error(`   ❌ Error processing ${videoFile}:`, error.message);
      return false;
    }
  }

  /**
   * Process all PGA Tour golfer videos
   */
  async processAllVideos() {
    if (!this.checkFFmpeg()) {
      return false;
    }

    console.log('🎬 Processing PGA Tour golfer videos with swing metrics...');
    console.log(`Input directory: ${this.inputDir}`);
    console.log(`Output directory: ${this.outputDir}`);
    console.log('');

    // Get all PGA Tour golfer videos
    const videos = this.getPGAVideos();
    if (videos.length === 0) {
      console.log('❌ No PGA Tour golfer videos found');
      return false;
    }

    console.log(`📝 Found ${videos.length} PGA Tour golfer videos`);

    // Process each video
    for (const video of videos) {
      const success = this.createOverlayVideo(video);
      
      if (!success) {
        console.log(`   ⚠️ Failed to process ${video}`);
      }
    }

    return true;
  }

  /**
   * Generate summary of processed videos
   */
  generateSummary() {
    const summary = {
      totalVideos: this.processedVideos.length,
      videos: this.processedVideos
    };

    const summaryFile = path.join(this.outputDir, 'analyzed_videos_summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log(`\n📋 Summary saved to: ${summaryFile}`);
    console.log(`🎯 Processed ${summary.totalVideos} PGA Tour golfer videos:`);
    
    summary.videos.forEach((video, index) => {
      console.log(`   ${index + 1}. ${video.analyzed} (${video.golfer})`);
    });
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const inputDir = args[0] || 'public/fixtures/swings';
  const outputDir = args[1] || 'public/fixtures/analyzed_swings';

  const analyzer = new SimpleSwingAnalyzer(inputDir, outputDir);
  
  console.log('🏌️ Simple PGA Tour Swing Analyzer');
  console.log('=================================');
  console.log(`Input: ${inputDir}`);
  console.log(`Output: ${outputDir}`);
  console.log('');

  const success = await analyzer.processAllVideos();
  
  if (success) {
    analyzer.generateSummary();
    console.log('\n🎉 Swing analysis completed!');
    console.log('\n📱 Your analyzed videos with metrics are ready!');
  } else {
    console.log('\n❌ Processing failed');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SimpleSwingAnalyzer;
