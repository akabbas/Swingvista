# Video Testing Instructions

## 🎯 Testing Phase Detection Fixes with Real Videos

This guide will help you test the weight distribution and phase detection fixes using actual golf swing videos.

## 📁 Available Test Videos

The following sample videos are available in `public/fixtures/swings/`:

1. **tiger-woods-swing.mp4** - Tiger Woods swing (standard speed)
2. **tiger-woods-swing-slow.mp4** - Tiger Woods swing (slow motion)
3. **tiger-woods-swing-original.mp4** - Tiger Woods swing (original)
4. **ludvig_aberg_driver.mp4** - Ludvig Aberg driver swing
5. **max_homa_iron.mp4** - Max Homa iron swing

## 🚀 How to Test

### Method 1: Comprehensive Video Test (Recommended)

1. **Open the test page:**
   ```
   Open test-video-phase-detection.html in your browser
   ```

2. **Select a video:**
   - Click on any of the video buttons (Tiger Woods, Ludvig Aberg, etc.)
   - Wait for the video to load

3. **Start analysis:**
   - Click the "Play" button to start the video
   - Click "Start Analysis" to begin real-time phase detection
   - Watch the real-time analysis in the right panel

4. **Monitor the results:**
   - **Phase Detection**: Watch the phase change from address → backswing → top → downswing → impact → follow-through
   - **Weight Distribution**: Verify that left + right always equals 100%
   - **Debug Output**: Check the console for detailed validation information

### Method 2: Unit Tests

1. **Open unit test page:**
   ```
   Open test-phase-detection-fix.html in your browser
   ```

2. **Run tests:**
   - Click "Test Weight Distribution" to verify 100% total
   - Click "Test Phase Detection" to verify phase accuracy
   - Click "Test Real-time Analysis" to test video processing
   - Click "Test Body Position Accuracy" to verify landmarks
   - Click "Test Validation & Debugging" to test error detection

### Method 3: Enhanced Camera Page

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to enhanced camera:**
   ```
   http://localhost:3000/camera-enhanced
   ```

3. **Test with live camera:**
   - Click "Start Analysis" to begin live camera analysis
   - Perform a golf swing in front of the camera
   - Watch real-time phase detection and weight distribution

## ✅ What to Look For

### Weight Distribution Validation
- **✅ CORRECT**: Left: 45% + Right: 55% = 100%
- **❌ INCORRECT**: Left: 45% + Right: 55% = 200%

### Phase Detection Validation
- **✅ CORRECT**: address → backswing → top → downswing → impact → follow-through
- **❌ INCORRECT**: address → impact (skipping phases)

### Real-time Analysis Validation
- **✅ CORRECT**: Smooth transitions between phases
- **✅ CORRECT**: Weight distribution updates in real-time
- **✅ CORRECT**: Club position tracking
- **✅ CORRECT**: Frame rate > 15 FPS

## 🔍 Debug Information

### Console Output
Look for these messages in the browser console:

```
✅ GOOD MESSAGES:
- "🔄 Phase transition: address → backswing at frame 5, time 150ms"
- "Weight Distribution: L:45% R:55% Total:100%"
- "Real-time analysis complete"

❌ BAD MESSAGES:
- "⚠️ Weight distribution validation failed: 45% + 55% = 200%"
- "Invalid phase sequence detected"
- "Low landmark quality: 30%"
```

### Debug Panel
The test page includes a debug panel showing:
- Frame-by-frame analysis
- Weight distribution calculations
- Phase detection confidence
- Landmark visibility
- Processing performance

## 🐛 Troubleshooting

### If Weight Distribution is Wrong
1. Check that the calculation always sums to 100%
2. Look for console warnings about validation failures
3. Verify landmark visibility is > 50%

### If Phase Detection is Inaccurate
1. Check that phases follow the correct sequence
2. Verify landmark quality is sufficient
3. Look for phase transition logging

### If Real-time Analysis is Slow
1. Check frame rate (should be > 15 FPS)
2. Monitor processing time (should be < 50ms per frame)
3. Verify landmark detection is working

### If No Analysis Appears
1. Check browser console for errors
2. Verify video is playing
3. Ensure landmarks are being detected
4. Check that analysis is started

## 📊 Expected Results

After testing, you should see:

### Weight Distribution
- ✅ Always sums to exactly 100%
- ✅ Smooth transitions between left/right weight
- ✅ Realistic weight transfer patterns

### Phase Detection
- ✅ Correct phase sequence throughout swing
- ✅ Smooth transitions between phases
- ✅ High confidence scores (> 70%)

### Real-time Analysis
- ✅ Frame rate > 15 FPS
- ✅ Processing time < 50ms per frame
- ✅ Responsive UI updates

### Debug Information
- ✅ Detailed logging of all calculations
- ✅ Validation warnings for errors
- ✅ Performance metrics

## 🎯 Success Criteria

The fixes are working correctly if:

1. **Weight Distribution**: Always sums to 100% total
2. **Phase Detection**: Correctly identifies all 6 phases in sequence
3. **Real-time Analysis**: Works smoothly for both camera and video
4. **Body Position**: Uses correct MediaPipe landmarks
5. **Validation**: Detects and reports errors appropriately

## 📝 Reporting Issues

If you encounter problems:

1. **Note the video being tested**
2. **Copy the debug output from console**
3. **Screenshot the analysis panel**
4. **Describe the expected vs actual behavior**

## 🚀 Next Steps

After successful testing:

1. **Integrate** the enhanced phase detector into the main camera page
2. **Optimize** phase detection thresholds based on real data
3. **Enhance** UI with better visual indicators
4. **Add** more sophisticated validation rules
5. **Implement** user feedback collection

---

**Happy Testing! 🏌️‍♂️**

The phase detection and weight distribution fixes are now ready for real-world testing with actual golf swing videos.








