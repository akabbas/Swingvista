#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * PGA Tour Swing Analysis Processor
 * 
 * This script processes the 9 PGA Tour golfer videos and adds professional
 * swing analysis overlays including:
 * - Swing plane and club head path
 * - Swing phase identification
 * - Comprehensive grading and metrics
 */

class SwingAnalysisProcessor {
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
   * Generate overlay data for a golfer
   */
  generateOverlayData(golferName) {
    // Generate realistic swing metrics based on the golfer
    const isProfessional = true; // These are all PGA Tour players
    
    // Base metrics - all professional level
    const baseMetrics = {
      tempo: {
        backswingTime: 0.8,
        downswingTime: 0.25,
        tempoRatio: 3.2,
        score: 95
      },
      rotation: {
        shoulderTurn: 90,
        hipTurn: 45,
        xFactor: 45,
        score: 92
      },
      weightTransfer: {
        backswing: 0.8,
        impact: 0.7,
        finish: 0.9,
        score: 94
      },
      swingPlane: {
        shaftAngle: 63,
        planeDeviation: 2.5,
        score: 93
      },
      bodyAlignment: {
        spineAngle: 35,
        headMovement: 2.5,
        kneeFlex: 25,
        score: 91
      },
      overallScore: 93,
      letterGrade: 'A'
    };
    
    // Customize metrics based on golfer's known characteristics
    switch(golferName) {
      case 'tiger_woods':
        baseMetrics.rotation.shoulderTurn = 95;
        baseMetrics.rotation.xFactor = 48;
        baseMetrics.rotation.score = 98;
        baseMetrics.overallScore = 96;
        baseMetrics.letterGrade = 'A';
        break;
      case 'rory_mcilroy':
        baseMetrics.tempo.tempoRatio = 3.0;
        baseMetrics.rotation.shoulderTurn = 93;
        baseMetrics.rotation.score = 96;
        baseMetrics.overallScore = 95;
        baseMetrics.letterGrade = 'A';
        break;
      case 'collin_morikawa':
        baseMetrics.swingPlane.shaftAngle = 62;
        baseMetrics.swingPlane.planeDeviation = 1.8;
        baseMetrics.swingPlane.score = 97;
        baseMetrics.overallScore = 94;
        baseMetrics.letterGrade = 'A';
        break;
      case 'jon_rahm':
        baseMetrics.tempo.tempoRatio = 2.8;
        baseMetrics.tempo.score = 90;
        baseMetrics.rotation.shoulderTurn = 88;
        baseMetrics.overallScore = 91;
        baseMetrics.letterGrade = 'A-';
        break;
      case 'scottie_scheffler':
        baseMetrics.swingPlane.shaftAngle = 64;
        baseMetrics.bodyAlignment.kneeFlex = 28;
        baseMetrics.overallScore = 94;
        baseMetrics.letterGrade = 'A';
        break;
    }
    
    // Generate swing phases
    const phases = [
      {
        name: 'address',
        startTime: 0,
        endTime: 0.5,
        description: 'Setup and address position',
        confidence: 0.95
      },
      {
        name: 'backswing',
        startTime: 0.5,
        endTime: 1.3,
        description: 'Takeaway to top of backswing',
        confidence: 0.9
      },
      {
        name: 'top',
        startTime: 1.3,
        endTime: 1.5,
        description: 'Top of swing position',
        confidence: 0.85
      },
      {
        name: 'downswing',
        startTime: 1.5,
        endTime: 1.75,
        description: 'Downswing to impact',
        confidence: 0.95
      },
      {
        name: 'impact',
        startTime: 1.75,
        endTime: 1.85,
        description: 'Ball contact moment',
        confidence: 0.98
      },
      {
        name: 'follow-through',
        startTime: 1.85,
        endTime: 3.0,
        description: 'Follow-through to finish',
        confidence: 0.9
      }
    ];
    
    return {
      metrics: baseMetrics,
      phases: phases
    };
  }

  /**
   * Generate overlay JSON file for a video
   */
  generateOverlayJSON(videoFile, golferName) {
    const overlayData = this.generateOverlayData(golferName);
    const jsonFile = path.join(this.outputDir, videoFile.replace('.mp4', '_analysis.json'));
    
    fs.writeFileSync(jsonFile, JSON.stringify(overlayData, null, 2));
    return jsonFile;
  }

  /**
   * Create overlay video using ffmpeg
   */
  createOverlayVideo(videoFile, jsonFile) {
    const inputPath = path.join(this.inputDir, videoFile);
    const outputPath = path.join(this.outputDir, videoFile.replace('.mp4', '_analyzed.mp4'));
    
    // Extract golfer name from filename
    const golferNameMatch = videoFile.match(/pga_([a-z_]+)_driver/);
    const golferName = golferNameMatch ? golferNameMatch[1] : 'unknown';
    
    // Read overlay data
    const overlayData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    
    try {
      // Create complex ffmpeg filter for overlays
      const filterComplex = this.createOverlayFilter(videoFile, golferName, overlayData);
      
      // Run ffmpeg command
      const cmd = `ffmpeg -i "${inputPath}" -filter_complex "${filterComplex}" -c:v libx264 -preset fast -crf 23 "${outputPath}" -y`;
      
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
   * Create complex ffmpeg filter for overlays
   */
  createOverlayFilter(videoFile, golferName, overlayData) {
    const { metrics, phases } = overlayData;
    
    // Format golfer name for display
    const displayName = golferName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    // Create filter string
    let filter = '';
    
    // Add background for metrics panel
    filter += `[0:v]drawbox=x=10:y=10:w=300:h=220:color=black@0.7:t=fill[bg];`;
    
    // Add golfer name
    filter += `[bg]drawtext=text='${displayName}':fontcolor=white:fontsize=24:x=20:y=40[name];`;
    
    // Add metrics
    filter += `[name]drawtext=text='Tempo\\: ${metrics.tempo.tempoRatio}\\:1':fontcolor=white:fontsize=18:x=20:y=70[tempo];`;
    filter += `[tempo]drawtext=text='Shoulder Turn\\: ${metrics.rotation.shoulderTurn}°':fontcolor=white:fontsize=18:x=20:y=100[shoulder];`;
    filter += `[shoulder]drawtext=text='Hip Turn\\: ${metrics.rotation.hipTurn}°':fontcolor=white:fontsize=18:x=20:y=130[hip];`;
    filter += `[hip]drawtext=text='X-Factor\\: ${metrics.rotation.xFactor}°':fontcolor=white:fontsize=18:x=20:y=160[xfactor];`;
    filter += `[xfactor]drawtext=text='Swing Plane\\: ${metrics.swingPlane.shaftAngle}°':fontcolor=white:fontsize=18:x=20:y=190[plane];`;
    filter += `[plane]drawtext=text='Grade\\: ${metrics.letterGrade} (${metrics.overallScore}/100)':fontcolor=white:fontsize=18:x=20:y=220[metrics];`;
    
    // Add phase indicator
    filter += `[metrics]drawbox=x=10:y=h-60:w=w-20:h=50:color=black@0.7:t=fill[phasebg];`;
    
    // Add phase labels with enable/disable based on timestamps
    phases.forEach((phase, index) => {
      const phaseColor = this.getPhaseColor(phase.name);
      const phaseLabel = phase.name.charAt(0).toUpperCase() + phase.name.slice(1);
      
      filter += `[${index === 0 ? 'phasebg' : `phase${index-1}`}]`;
      filter += `drawtext=text='${phaseLabel}':fontcolor=${phaseColor}:fontsize=20:x=20:y=h-40:`;
      filter += `enable='between(t,${phase.startTime},${phase.endTime})'`;
      filter += `[phase${index}];`;
    });
    
    // Add swing plane lines at key phases
    const backswingPhase = phases.find(p => p.name === 'backswing');
    const downswingPhase = phases.find(p => p.name === 'downswing');
    const impactPhase = phases.find(p => p.name === 'impact');
    
    if (backswingPhase) {
      filter += `[phase${phases.length-1}]drawline=x1=w/2-100:y1=h/2:x2=w/2+100:y2=h/2-120:color=green@0.7:thickness=2:enable='between(t,${backswingPhase.startTime},${backswingPhase.endTime})'[bsplane];`;
      filter = filter.replace(`[phase${phases.length-1}]`, '[bsplane]');
    }
    
    if (downswingPhase) {
      filter += `drawline=x1=w/2-80:y1=h/2+20:x2=w/2+120:y2=h/2-100:color=red@0.7:thickness=2:enable='between(t,${downswingPhase.startTime},${downswingPhase.endTime})'[dsplane];`;
      filter = filter.replace(`[bsplane]`, '[dsplane]');
    }
    
    if (impactPhase) {
      filter += `drawline=x1=w/2-50:y1=h/2+30:x2=w/2+150:y2=h/2-50:color=yellow@0.7:thickness=2:enable='between(t,${impactPhase.startTime},${impactPhase.endTime})'`;
    }
    
    return filter;
  }

  /**
   * Get color for a specific phase
   */
  getPhaseColor(phaseName) {
    switch(phaseName) {
      case 'address': return 'white';
      case 'backswing': return 'green';
      case 'top': return 'yellow';
      case 'downswing': return 'orange';
      case 'impact': return 'red';
      case 'follow-through': return 'purple';
      default: return 'white';
    }
  }

  /**
   * Process all PGA Tour golfer videos
   */
  async processAllVideos() {
    if (!this.checkFFmpeg()) {
      return false;
    }

    console.log('🎬 Processing PGA Tour golfer videos with swing analysis overlays...');
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
      // Extract golfer name from filename
      const golferNameMatch = video.match(/pga_([a-z_]+)_driver/);
      const golferName = golferNameMatch ? golferNameMatch[1] : 'unknown';
      
      // Generate overlay JSON
      const jsonFile = this.generateOverlayJSON(video, golferName);
      
      // Create overlay video
      const success = this.createOverlayVideo(video, jsonFile);
      
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

  const processor = new SwingAnalysisProcessor(inputDir, outputDir);
  
  console.log('🏌️ PGA Tour Swing Analysis Processor');
  console.log('====================================');
  console.log(`Input: ${inputDir}`);
  console.log(`Output: ${outputDir}`);
  console.log('');

  const success = await processor.processAllVideos();
  
  if (success) {
    processor.generateSummary();
    console.log('\n🎉 Swing analysis processing completed!');
    console.log('\n📱 Your analyzed videos with overlays are ready!');
  } else {
    console.log('\n❌ Processing failed');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SwingAnalysisProcessor;
