#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Golf Test Video Downloader
 * 
 * This script helps download high-quality golf swing videos for testing.
 * It provides curated links to professional golf swing videos.
 */

class GolfVideoDownloader {
  constructor(outputDir = 'public/fixtures/swings') {
    this.outputDir = outputDir;
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Check if yt-dlp is available
   */
  checkYtDlp() {
    try {
      execSync('yt-dlp --version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      console.error('❌ yt-dlp is not installed. Please install it first:');
      console.error('   macOS: brew install yt-dlp');
      console.error('   Ubuntu: sudo apt install yt-dlp');
      console.error('   Windows: pip install yt-dlp');
      console.error('   Or: pip install yt-dlp');
      return false;
    }
  }

  /**
   * Get curated list of golf swing videos
   */
  getGolfVideoList() {
    return [
      {
        name: 'PGA Tour Driver Swings Compilation',
        url: 'https://www.youtube.com/shorts/UHKApJXBSd0',
        description: 'Compilation of professional PGA Tour driver swings - multiple players',
        filename: 'pga_tour_drivers_compilation.mp4'
      },
      {
        name: 'Rory McIlroy Driver Swing',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video
        description: 'Rory McIlroy driver swing - slow motion',
        filename: 'rory_mcilroy_driver.mp4'
      },
      {
        name: 'Jon Rahm Iron Swing',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video
        description: 'Jon Rahm iron swing - side view',
        filename: 'jon_rahm_iron.mp4'
      },
      {
        name: 'Tiger Woods Driver (Different Angle)',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video
        description: 'Tiger Woods driver swing - front view',
        filename: 'tiger_woods_driver_front.mp4'
      },
      {
        name: 'Scottie Scheffler Wedge',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video
        description: 'Scottie Scheffler wedge shot',
        filename: 'scottie_scheffler_wedge.mp4'
      },
      {
        name: 'Collin Morikawa Iron',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video
        description: 'Collin Morikawa iron swing',
        filename: 'collin_morikawa_iron.mp4'
      }
    ];
  }

  /**
   * Download a single video
   */
  async downloadVideo(video, quality = 'best[height<=720]') {
    const outputPath = path.join(this.outputDir, video.filename);
    
    try {
      console.log(`📥 Downloading: ${video.name}`);
      console.log(`   URL: ${video.url}`);
      console.log(`   Output: ${outputPath}`);
      
      const cmd = `yt-dlp -f "${quality}" -o "${outputPath}" "${video.url}"`;
      execSync(cmd, { stdio: 'pipe' });
      
      console.log(`   ✅ Downloaded: ${video.filename}`);
      return true;
    } catch (error) {
      console.error(`   ❌ Error downloading ${video.name}:`, error.message);
      return false;
    }
  }

  /**
   * Download all videos
   */
  async downloadAllVideos() {
    if (!this.checkYtDlp()) {
      return false;
    }

    console.log('🏌️ Golf Test Video Downloader');
    console.log('==============================');
    console.log(`Output directory: ${this.outputDir}`);
    console.log('');

    const videos = this.getGolfVideoList();
    let successCount = 0;

    for (const video of videos) {
      const success = await this.downloadVideo(video);
      if (success) successCount++;
    }

    console.log(`\n📊 Download Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${videos.length - successCount}`);
    console.log(`   📁 Total: ${videos.length}`);

    return successCount > 0;
  }

  /**
   * Show available videos without downloading
   */
  showAvailableVideos() {
    console.log('🏌️ Available Golf Test Videos');
    console.log('==============================');
    console.log('');

    const videos = this.getGolfVideoList();
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.name}`);
      console.log(`   Description: ${video.description}`);
      console.log(`   Filename: ${video.filename}`);
      console.log(`   URL: ${video.url}`);
      console.log('');
    });

    console.log('To download all videos, run:');
    console.log('  node scripts/download-test-videos.js --download');
    console.log('');
    console.log('To download a specific video, run:');
    console.log('  node scripts/download-test-videos.js --download --index 1');
  }

  /**
   * Download specific video by index
   */
  async downloadSpecificVideo(index) {
    if (!this.checkYtDlp()) {
      return false;
    }

    const videos = this.getGolfVideoList();
    if (index < 1 || index > videos.length) {
      console.error(`❌ Invalid index. Please choose between 1 and ${videos.length}`);
      return false;
    }

    const video = videos[index - 1];
    console.log(`📥 Downloading video ${index}: ${video.name}`);
    
    return await this.downloadVideo(video);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  const downloader = new GolfVideoDownloader();
  
  if (args.includes('--download')) {
    if (args.includes('--index')) {
      const indexArg = args[args.indexOf('--index') + 1];
      const index = parseInt(indexArg);
      await downloader.downloadSpecificVideo(index);
    } else {
      await downloader.downloadAllVideos();
    }
  } else {
    downloader.showAvailableVideos();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = GolfVideoDownloader;
