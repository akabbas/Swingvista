# Golf Video Testing Guide

This guide explains how to get new test videos and split compilation videos into individual swing clips.

## 🎯 Quick Start

### Option 1: Download New Test Videos
```bash
# Show available videos
node scripts/download-test-videos.js

# Download all videos
node scripts/download-test-videos.js --download

# Download specific video
node scripts/download-test-videos.js --download --index 1
```

### Option 2: Split a Compilation Video
```bash
# Simple splitting (equal time intervals)
node scripts/split-golf-compilation.js your_compilation.mp4

# Advanced splitting (motion detection)
node scripts/advanced-swing-detector.js your_compilation.mp4
```

## 📋 Prerequisites

### For Video Downloading
- **yt-dlp**: `pip install yt-dlp` or `brew install yt-dlp`
- Internet connection

### For Video Splitting
- **FFmpeg**: `brew install ffmpeg` (macOS) or `sudo apt install ffmpeg` (Ubuntu)
- Node.js (already installed)

## 🎬 Getting New Test Videos

### Method 1: Use Our Curated List
The `download-test-videos.js` script provides a curated list of professional golf swing videos:

1. **Rory McIlroy Driver** - Slow motion driver swing
2. **Jon Rahm Iron** - Side view iron swing  
3. **Tiger Woods Driver** - Front view driver swing
4. **Scottie Scheffler Wedge** - Wedge shot
5. **Collin Morikawa Iron** - Iron swing

### Method 2: Find Your Own Videos
Look for:
- **High quality** (720p or higher)
- **Clear view** of the golfer
- **Good lighting**
- **Stable camera**
- **Complete swing** (setup to finish)

Good sources:
- YouTube golf channels
- PGA Tour official videos
- Golf instruction videos
- Professional golfer social media

## 🔄 Splitting Compilation Videos

### Simple Splitting
The `split-golf-compilation.js` script splits videos into equal time intervals:

```bash
node scripts/split-golf-compilation.js compilation.mp4
```

**Features:**
- Assumes 3-second swings with 1-second gaps
- Fast processing
- Good for videos with consistent timing

### Advanced Splitting
The `advanced-swing-detector.js` script uses motion detection:

```bash
node scripts/advanced-swing-detector.js compilation.mp4
```

**Features:**
- Analyzes actual motion in the video
- Detects swing start/end points
- More accurate but slower
- Better for irregular timing

## 📁 Output Structure

After running either script, you'll get:

```
public/fixtures/swings/
├── swing_1.mp4
├── swing_2.mp4
├── swing_3.mp4
├── swing_clips_summary.json
└── ... (existing videos)
```

The `swing_clips_summary.json` contains metadata about each clip:
```json
{
  "totalClips": 5,
  "clips": [
    {
      "file": "swing_1.mp4",
      "duration": 3.2,
      "startTime": 0,
      "endTime": 3.2
    }
  ]
}
```

## 🛠️ Customization

### Adjusting Swing Detection
Edit the detection parameters in the scripts:

```javascript
// In split-golf-compilation.js
const swingDuration = 3; // seconds per swing
const gapBetweenSwings = 1; // seconds between swings

// In advanced-swing-detector.js  
const motionThreshold = 0.5; // motion sensitivity
const minSwingDuration = 2; // minimum swing length
```

### Adding New Video Sources
Edit `download-test-videos.js` to add your own video URLs:

```javascript
{
  name: 'Your Video Name',
  url: 'https://youtube.com/watch?v=...',
  description: 'Description of the video',
  filename: 'your_video_name.mp4'
}
```

## 🧪 Testing Your New Videos

1. **Upload a video** using your app's upload page
2. **Check the analysis** works correctly
3. **Verify pose detection** is accurate
4. **Test different swing types** (driver, iron, wedge)

## 🔧 Troubleshooting

### Common Issues

**"FFmpeg not found"**
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt update && sudo apt install ffmpeg
```

**"yt-dlp not found"**
```bash
pip install yt-dlp
# or
brew install yt-dlp
```

**"No swing points detected"**
- Try the simple splitting method instead
- Check if the video has clear golf swings
- Adjust motion threshold in advanced detector

**"Video quality too low"**
- Use higher quality source videos
- Adjust quality settings in download script

### Getting Help

If you encounter issues:
1. Check the console output for error messages
2. Verify all prerequisites are installed
3. Try with a different video file
4. Check file permissions in the output directory

## 📊 Best Practices

### For Test Videos
- **Variety**: Include different golfers, clubs, and angles
- **Quality**: Use high-resolution, well-lit videos
- **Length**: Keep individual swings under 5 seconds
- **Clarity**: Ensure the golfer is clearly visible

### For Compilation Splitting
- **Pre-processing**: Trim compilation to relevant sections
- **Consistency**: Use videos with similar swing timing
- **Testing**: Verify split clips work in your app
- **Backup**: Keep original compilation files

## 🎉 Next Steps

After getting your new test videos:

1. **Test the analysis** with different swing types
2. **Update your test suite** to use new videos
3. **Document any issues** you find
4. **Share feedback** on video quality and analysis accuracy

Happy testing! 🏌️‍♂️
