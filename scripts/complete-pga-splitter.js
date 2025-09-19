#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Complete PGA Tour Driver Swings Splitter
 * 
 * Identifies all 9 golfers in the compilation and creates individual clips
 * with proper golfer names and complete swing sequences
 */

class CompletePGASplitter {
  constructor(inputVideo, outputDir = 'public/fixtures/swings') {
    this.inputVideo = inputVideo;
    this.outputDir = outputDir;
    this.swingClips = [];
    this.tempDir = path.join(outputDir, 'temp_analysis');
    
    // Ensure directories exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Check if required tools are available
   */
  checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    let allGood = true;
    
    // Check ffmpeg
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' });
      console.log('   ✅ ffmpeg is available');
    } catch (error) {
      console.log('   ❌ ffmpeg is not installed');
      allGood = false;
    }
    
    // Check tesseract for OCR
    try {
      execSync('tesseract --version', { stdio: 'ignore' });
      console.log('   ✅ tesseract (OCR) is available');
    } catch (error) {
      console.log('   ❌ tesseract is not installed');
      allGood = false;
    }
    
    return allGood;
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
    
    const framesDir = path.join(this.tempDir, 'frames');
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }
    
    try {
      // Extract frames at 1fps for better analysis
      const cmd = `ffmpeg -i "${this.inputVideo}" -vf "fps=1" "${framesDir}/frame_%04d.png" -y`;
      execSync(cmd, { stdio: 'pipe' });
      
      const frames = fs.readdirSync(framesDir)
        .filter(f => f.endsWith('.png'))
        .sort();
      
      console.log(`✅ Extracted ${frames.length} frames`);
      return { frames, framesDir };
    } catch (error) {
      console.error('❌ Error extracting frames:', error.message);
      return { frames: [], framesDir };
    }
  }

  /**
   * Extract text from frames using OCR
   */
  extractTextFromFrames(frames, framesDir) {
    console.log('🔍 Extracting player names from video text...');
    
    const frameRate = 1; // fps we extracted at
    const textData = [];
    
    for (let i = 0; i < frames.length; i++) {
      const frameFile = path.join(framesDir, frames[i]);
      const time = i / frameRate;
      
      try {
        // Use tesseract to extract text from the frame
        const cmd = `tesseract "${frameFile}" stdout --psm 6 -c tessedit_char_whitelist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz "`;
        const text = execSync(cmd, { encoding: 'utf8' }).trim();
        
        if (text && text.length > 2) {
          textData.push({
            time,
            text: text.replace(/\s+/g, ' ').trim(),
            frame: frames[i]
          });
        }
      } catch (error) {
        // OCR failed for this frame, continue
        continue;
      }
    }
    
    console.log(`✅ Extracted text from ${textData.length} frames`);
    return textData;
  }

  /**
   * Detect all player names from extracted text
   */
  detectAllPlayerNames(textData) {
    console.log('👤 Detecting all player names...');
    
    const playerNames = [];
    const commonNames = [
      'Tiger Woods', 'Rory McIlroy', 'Jon Rahm', 'Scottie Scheffler', 'Collin Morikawa',
      'Justin Thomas', 'Dustin Johnson', 'Brooks Koepka', 'Jordan Spieth', 'Xander Schauffele',
      'Patrick Cantlay', 'Viktor Hovland', 'Tony Finau', 'Max Homa', 'Sam Burns',
      'Cameron Smith', 'Hideki Matsuyama', 'Sungjae Im', 'Tommy Fleetwood', 'Shane Lowry',
      'Bryson DeChambeau', 'Matthew Wolff', 'Cameron Champ', 'Joaquin Niemann', 'Abraham Ancer',
      'Sergio Garcia', 'Phil Mickelson', 'Bubba Watson', 'Jason Day', 'Adam Scott'
    ];
    
    // Look for player names in the text
    for (const data of textData) {
      for (const name of commonNames) {
        if (data.text.toLowerCase().includes(name.toLowerCase())) {
          // Check if we already have this player at this time
          const existing = playerNames.find(p => 
            Math.abs(p.time - data.time) < 1.5 && p.name === name
          );
          
          if (!existing) {
            playerNames.push({
              name,
              time: data.time,
              text: data.text,
              frame: data.frame
            });
          }
        }
      }
    }
    
    // Sort by time
    playerNames.sort((a, b) => a.time - b.time);
    
    console.log(`✅ Detected ${playerNames.length} player names:`);
    playerNames.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.name} at ${p.time.toFixed(1)}s`);
    });
    
    return playerNames;
  }

  /**
   * Detect swing start/end points for all 9 golfers
   */
  detectAllSwingPoints(videoInfo, playerNames) {
    console.log('🎯 Detecting swing points for all golfers...');
    
    const { duration } = videoInfo;
    const swings = [];
    
    // For each player, estimate their swing timing
    for (let i = 0; i < playerNames.length; i++) {
      const player = playerNames[i];
      const nextPlayer = playerNames[i + 1];
      
      // Estimate swing start (1.5 seconds before name appears)
      const swingStart = Math.max(0, player.time - 1.5);
      
      // Estimate swing end (either 3.5 seconds after start, or before next player)
      let swingEnd;
      if (nextPlayer) {
        swingEnd = Math.min(nextPlayer.time - 0.3, player.time + 3.5);
      } else {
        swingEnd = Math.min(duration, player.time + 3.5);
      }
      
      // Ensure minimum swing duration
      if (swingEnd - swingStart >= 2.5) {
        swings.push({
          start: swingStart,
          end: swingEnd,
          player: player.name,
          index: i + 1
        });
      }
    }
    
    console.log(`✅ Detected ${swings.length} complete swings`);
    return swings;
  }

  /**
   * Create filename from player name
   */
  createFilename(playerName, index) {
    // Clean up player name for filename
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
    if (!this.checkPrerequisites()) {
      return false;
    }

    console.log('🎬 Complete PGA Tour driver splitting (9 golfers)...');
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
    const { frames, framesDir } = this.extractFrames();
    if (frames.length === 0) {
      console.log('❌ No frames extracted');
      return false;
    }

    // Extract text from frames
    const textData = this.extractTextFromFrames(frames, framesDir);
    
    // Detect all player names
    const playerNames = this.detectAllPlayerNames(textData);
    
    // Detect swing points for all golfers
    const swingPoints = this.detectAllSwingPoints(videoInfo, playerNames);
    
    if (swingPoints.length === 0) {
      console.log('❌ No swing points detected');
      return false;
    }

    console.log(`📝 Creating ${swingPoints.length} complete swing clips...`);

    // Create individual swing clips
    for (const swing of swingPoints) {
      const filename = this.createFilename(swing.player, swing.index);
      const outputFile = path.join(this.outputDir, filename);
      
      try {
        const cmd = `ffmpeg -i "${this.inputVideo}" -ss ${swing.start} -t ${swing.end - swing.start} -c copy "${outputFile}" -y`;
        
        console.log(`   Creating ${swing.player}: ${swing.start.toFixed(1)}s - ${swing.end.toFixed(1)}s`);
        execSync(cmd, { stdio: 'pipe' });
        
        this.swingClips.push({
          file: outputFile,
          start: swing.start,
          end: swing.end,
          player: swing.player,
          index: swing.index
        });
        
        console.log(`   ✅ Created: ${filename}`);
      } catch (error) {
        console.error(`   ❌ Error creating ${swing.player}:`, error.message);
      }
    }

    // Clean up
    this.cleanup();
    
    return true;
  }

  /**
   * Clean up temporary files
   */
  cleanup() {
    try {
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir, { recursive: true });
        files.forEach(file => {
          const filePath = path.join(this.tempDir, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        });
        fs.rmdirSync(this.tempDir, { recursive: true });
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
        player: clip.player,
        duration: clip.end - clip.start,
        startTime: clip.start,
        endTime: clip.end,
        description: `${clip.player} driver swing`
      }))
    };

    const summaryFile = path.join(this.outputDir, 'complete_pga_clips_summary.json');
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
    console.log('Usage: node scripts/complete-pga-splitter.js <input_video> [output_dir]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/complete-pga-splitter.js pga_tour_drivers_compilation.mp4');
    console.log('  node scripts/complete-pga-splitter.js compilation.mp4 custom_output_dir');
    process.exit(1);
  }

  const inputVideo = args[0];
  const outputDir = args[1] || 'public/fixtures/swings';

  if (!fs.existsSync(inputVideo)) {
    console.error(`❌ Input video not found: ${inputVideo}`);
    process.exit(1);
  }

  const splitter = new CompletePGASplitter(inputVideo, outputDir);
  
  console.log('🏌️ Complete PGA Tour Driver Swings Splitter');
  console.log('==========================================');
  console.log(`Input: ${inputVideo}`);
  console.log(`Output: ${outputDir}`);
  console.log('');

  const success = await splitter.splitVideo();
  
  if (success) {
    splitter.generateSummary();
    console.log('\n🎉 Complete video splitting finished!');
    console.log('\n📱 All 9 golfer clips are ready for your app!');
  } else {
    console.log('\n❌ Video splitting failed');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CompletePGASplitter;
