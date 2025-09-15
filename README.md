# 🏌️ SwingVista

> **Professional-grade golf swing analysis platform** with advanced computer vision, real-time pose detection, trajectory analysis, and AI-powered coaching feedback that rivals professional solutions like GolfPosePro.

[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC)](https://tailwindcss.com/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose-FF6B6B)](https://mediapipe.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Key Features

### 🎯 Advanced Swing Analysis
- **Frame-by-Frame Pose Detection** - Precise landmark tracking with MediaPipe
- **Trajectory Analysis** - Complete swing path visualization and metrics
- **Swing Phase Segmentation** - Automatic detection of Setup → Backswing → Top → Downswing → Impact → Follow-through
- **Velocity & Acceleration Profiles** - Detailed motion analysis with peak detection
- **Swing Plane Analysis** - Detect inside-out, outside-in, and on-plane swings
- **Weight Transfer Tracking** - Monitor proper weight shift throughout the swing

### 🎥 Professional Video Analysis
- **Slow-Motion Playback** - Frame-by-frame analysis with scrubbing controls
- **Interactive Trajectory Plots** - Real-time visualization of swing paths
- **Phase Highlighting** - Color-coded swing phases with progress indicators
- **Landmark Overlay** - Real-time pose skeleton and key point tracking
- **Multi-Speed Playback** - 0.25x to 4x speed controls for detailed analysis

### ⚖️ Pro Comparison System
- **Side-by-Side Comparison** - Compare your swing with PGA Tour professionals
- **Frame Synchronization** - Perfectly synced playback between user and pro swings
- **Pro Swing Library** - Curated collection of professional swings (Tiger Woods, Rory McIlroy, Phil Mickelson, etc.)
- **Multiple Sync Modes** - Frame-based, phase-based, and time-based synchronization
- **Real-time Metrics** - Live comparison of tempo, plane, and technique

### 🎯 VistaSwing AI Coaching System
- **C.R.E.A.T.E Framework** - Professional golf coaching methodology
- **A-F Grading System** - Comprehensive evaluation of swing fundamentals
- **6 Key Components** - Setup, Grip, Alignment, Rotation, Impact, Follow-through
- **Professional Feedback** - Positive-first coaching tips from PGA-level analysis
- **Structured Report Cards** - Beautiful JSON output with actionable insights

### 📊 Comprehensive Metrics Dashboard
- **Progress Tracking** - Historical swing data and improvement trends
- **Club-Specific Analysis** - Driver, iron, wedge, and putter specific metrics
- **Statistical Analysis** - Average scores, tempo ratios, and consistency metrics
- **Export Capabilities** - JSON, CSV, and annotated video export with progress indicators
- **Data Visualization** - Interactive charts and graphs for swing analysis
- **Performance Monitoring** - Real-time FPS, memory usage, and error tracking dashboard
- **Logging System** - Comprehensive error logging and debugging tools

### ⚡ Technical Excellence
- **Web Workers** - Heavy computation offloaded for smooth performance
- **Advanced Smoothing** - Moving average and Kalman filtering for stable tracking
- **Real-time Processing** - 15fps pose detection with performance monitoring
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **TypeScript** - Full type safety and excellent developer experience
- **Semantic HTML5** - Accessible, SEO-friendly markup structure
- **Environment Awareness** - Dynamic configuration for development and production
- **Component Architecture** - Reusable, maintainable UI components
- **Performance Monitoring** - Real-time FPS, memory usage, and error tracking
- **Theme Support** - Dark/light mode toggle with system preference detection
- **Enhanced UX** - Tooltips, loading skeletons, and smooth animations

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - Required for Next.js and modern JavaScript features
- **npm or yarn** - Package manager
- **Modern web browser** - Chrome, Firefox, Safari, or Edge with WebRTC support
- **Webcam** - For real-time analysis (optional, can use video upload)
- **Supabase account** - For data persistence (optional, can run locally)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/swingvista.git
   cd swingvista
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables** (Optional)
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### 🎯 First Analysis

1. **Navigate to Camera** - Click "Start Live Analysis" on the homepage
2. **Allow Camera Access** - Grant permission when prompted
3. **Select Club Type** - Choose Driver, Iron, Wedge, or Putter
4. **Start Recording** - Click "Start Recording" and perform your swing
5. **Stop & Analyze** - Click "Stop Recording" then "Analyze Swing"
6. **Review Results** - View your swing analysis, trajectory plots, and AI feedback

## 🏗️ Project Structure

```
swingvista/
├── 📁 config/                 # Configuration files
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   ├── tailwind.config.js
│   └── vitest.config.ts
├── 📁 docs/                   # Documentation
│   ├── HTML_STRUCTURE.md      # HTML structure and components guide
│   ├── API.md                 # API documentation
│   ├── DEPLOYMENT.md          # Deployment guide
│   └── prompts.md
├── 📁 public/                 # Static assets
│   └── icons/
├── 📁 src/
│   ├── 📁 app/                # Next.js app router
│   │   ├── 📁 api/            # API routes
│   │   │   ├── 📁 infer/      # AI inference endpoints
│   │   │   └── 📁 swings/     # Swing data endpoints
│   │   ├── 📁 camera/         # Real-time analysis
│   │   ├── 📁 compare/        # Swing comparison
│   │   ├── 📁 upload/         # Video upload
│   │   ├── 📁 swing/          # Individual swing details
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout with Header/Footer
│   │   └── page.tsx           # Home page
│   ├── 📁 components/         # Reusable UI components
│   │   ├── 📁 layout/         # Layout components
│   │   │   ├── Header.tsx     # Navigation header
│   │   │   └── Footer.tsx     # Site footer
│   │   └── 📁 ui/             # UI components
│   │       ├── Button.tsx     # Button component
│   │       ├── LoadingSpinner.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── ErrorAlert.tsx
│   │       ├── EnvironmentBanner.tsx
│   │       ├── ExportDialog.tsx
│   │       ├── MonitoringDashboard.tsx
│   │       ├── Skeleton.tsx
│   │       ├── ThemeToggle.tsx
│   │       └── Tooltip.tsx
│   ├── 📁 lib/                # Core libraries
│   │   ├── mediapipe.ts       # Pose detection
│   │   ├── metrics.config.ts  # Analysis configuration
│   │   ├── vista-swing-ai.ts  # VistaSwing AI coaching system
│   │   ├── supabase.ts        # Database client
│   │   ├── environment.ts     # Environment configuration
│   │   ├── logger.ts          # Logging and monitoring system
│   │   └── export-utils.ts    # Export functionality
│   ├── 📁 workers/            # Web Workers
│   │   └── analysis.worker.ts # Swing analysis
│   └── 📁 __tests__/          # Test files
│       ├── html-structure.test.ts
│       ├── export-utils.test.ts
│       ├── metrics.test.ts
│       ├── swing-phases.test.ts
│       └── trajectory-analysis.test.ts
├── 📄 .gitignore
├── 📄 next.config.js
├── 📄 package.json
├── 📄 README.md
├── 📄 CHANGELOG.md
├── 📄 FIXES_SUMMARY.md
└── 📄 tsconfig.json
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Computer Vision**: MediaPipe Pose Landmarker
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Railway
- **Testing**: Vitest
- **AI Ready**: OpenAI/Anthropic integration

## 📊 Database Setup

### Supabase Configuration

1. Create a new Supabase project
2. Run the following SQL to create the swings table:

```sql
CREATE TABLE swings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  club TEXT NOT NULL,
  metrics JSONB NOT NULL,
  feedback TEXT[] NOT NULL,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_swings_user_id ON swings(user_id);
CREATE INDEX idx_swings_created_at ON swings(created_at);
CREATE INDEX idx_swings_club ON swings(club);
```

## 🎯 Usage

### VistaSwing AI Analysis
1. **Upload or Record** your golf swing
2. **Select Club Type** (Driver, Iron, Wedge, Putter)
3. **Analyze Swing** - VistaSwing AI processes your video
4. **Review Report Card** - Get A-F grades for:
   - **Setup**: Posture, balance, stance width
   - **Grip**: Neutral grip, clubface control
   - **Alignment**: Shoulders, hips, feet alignment
   - **Rotation**: Hip and shoulder turn, weight transfer
   - **Impact**: Ball-first contact, shaft lean
   - **Follow-through**: Balanced finish, complete rotation
5. **Get Coaching Tips** - Professional feedback for improvement

### Real-time Analysis
1. Navigate to **Camera** page
2. Allow camera permissions
3. Select your club type
4. Click **Start Recording**
5. Perform your golf swing
6. Click **Stop Recording** to analyze
7. View VistaSwing AI report card and metrics

### Video Upload Analysis
1. Navigate to **Upload** page
2. Click **Select File** and choose a video
3. Select your club type
4. Click **Analyze Video** or **Try Demo Analysis**
5. Wait for VistaSwing AI processing
6. Review detailed report card and technical metrics

### Progress Tracking
1. Visit the **Dashboard** to see:
   - Recent swings with VistaSwing AI grades
   - Club-specific statistics
   - Overall progress metrics
2. Use **Compare** mode to:
   - Select two swings for comparison
   - Track improvement over time
   - Identify areas for focus

## 🎯 VistaSwing AI System

### C.R.E.A.T.E Framework

VistaSwing AI follows the **C.R.E.A.T.E Framework** for professional golf coaching:

- **C** - **Context**: Analyzes golf swing videos frame by frame using computer vision
- **R** - **Result**: Outputs structured swing report card in JSON format with A-F grades
- **E** - **Explain**: Uses golf fundamentals as benchmarks for evaluation
- **A** - **Audience**: Targets amateur golfers (ages 18-50) with clear, actionable feedback
- **T** - **Tone**: Encouraging, concise, and professional like a real PGA coach
- **E** - **Edit**: Valid JSON only, grades A-F, maximum 2 sentences per coaching tip

### Analysis Components

#### 6 Key Swing Components
1. **Setup** - Posture, balance, ball position, stance width
2. **Grip** - Neutral grip, clubface control, pressure
3. **Alignment** - Shoulders, hips, feet aligned with target line
4. **Rotation** - Hip and shoulder turn, weight transfer, sequencing
5. **Impact** - Ball-first contact, square clubface, shaft lean
6. **Follow-through** - Balanced finish, chest facing target, complete rotation

#### 5 Swing Phases
1. **Setup** - Initial position and posture
2. **Backswing** - Takeaway to top of swing
3. **Downswing** - Transition to impact
4. **Impact** - Ball contact moment
5. **Follow-through** - Finish position

### Example Report Card

```json
{
  "setup": {"grade": "B", "tip": "Good athletic posture, but stance is slightly too wide. Narrowing your feet will improve balance."},
  "grip": {"grade": "A", "tip": "Neutral grip with solid clubface control. Maintain this."},
  "alignment": {"grade": "C", "tip": "Shoulders are slightly open to the target. Try squaring them for straighter shots."},
  "rotation": {"grade": "B", "tip": "Shoulder turn is solid, but hip rotation is restricted. Allow your hips to turn more freely."},
  "impact": {"grade": "C", "tip": "You're flipping the wrists at impact. Focus on leading with your hands to compress the ball."},
  "followThrough": {"grade": "B", "tip": "Good balance, but weight isn't fully on front foot. Finish tall and let your chest face the target."},
  "overall": {"score": "B-", "tip": "Solid swing fundamentals. Key improvement: work on squaring your shoulders and leading with your hands at impact."}
}
```

## 🔧 Configuration

### Metrics Configuration

Edit `src/lib/metrics.config.ts` to adjust analysis thresholds:

```typescript
export const defaultMetricsConfig: MetricsConfig = {
  swingPlane: {
    steepThreshold: 15, // degrees
    flatThreshold: -5,  // degrees
  },
  tempo: {
    slowThreshold: 3.0, // ratio
    fastThreshold: 1.5, // ratio
  },
  // ... more settings
};
```

### VistaSwing AI Configuration

The VistaSwing AI system automatically analyzes:
- **Tempo Ratio**: Ideal 3:1 backswing to downswing ratio
- **Swing Plane**: Detects if too steep or flat
- **Weight Transfer**: Monitors proper weight shift
- **Impact Position**: Analyzes ball-first contact and shaft lean
- **Rotation Analysis**: Measures hip and shoulder turn

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check
```

### Test Coverage
- **HTML Structure Tests**: Semantic HTML5, accessibility, responsive design
- **Component Tests**: UI component functionality and behavior
- **Integration Tests**: API endpoints and data flow
- **Unit Tests**: Individual function and utility testing
- **Accessibility Tests**: ARIA compliance and screen reader support

## 📊 Monitoring & Logging

SwingVista includes comprehensive monitoring and logging capabilities for production debugging and performance optimization.

### Real-time Performance Monitoring
- **FPS Tracking**: Real-time frame rate monitoring during pose detection
- **Memory Usage**: JavaScript heap size monitoring
- **Frame Time Analysis**: Per-frame processing time measurement
- **Error Recovery**: Automatic recovery from pose detection failures

### Logging System
- **Structured Logging**: JSON-formatted logs with context and metadata
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL with configurable filtering
- **Session Tracking**: Unique session IDs for debugging user sessions
- **Error Aggregation**: Automatic error collection and analysis
- **Export Capabilities**: Download logs for debugging and analysis

### Monitoring Dashboard
Access the monitoring dashboard by clicking the "Monitor" button on the camera page:
- **Live Log Viewing**: Real-time log display with filtering
- **Performance Metrics**: FPS, memory usage, and processing times
- **Error Analysis**: Detailed error logs with stack traces
- **Log Export**: Download logs in JSON format for analysis

### Usage
```typescript
import { logger, logInfo, logError, logWarn } from '@/lib/logger';

// Log information
logInfo('User started analysis', { userId: '123', club: 'driver' }, 'Analysis');

// Log errors
logError('Analysis failed', { error: errorMessage, context: 'PoseDetection' }, 'Analysis');

// Log warnings
logWarn('Low FPS detected', { fps: 5, threshold: 10 }, 'Performance');
```

## 🏗️ HTML Structure & Components

SwingVista uses a modern, accessible HTML structure with reusable components:

### Component Architecture
- **Layout Components**: Header, Footer with responsive navigation
- **UI Components**: Button, LoadingSpinner, ProgressBar, ErrorAlert
- **Environment Awareness**: Dynamic configuration and connection testing
- **Accessibility**: ARIA support, keyboard navigation, screen reader compatibility

### Key Features
- **Semantic HTML5**: Proper use of `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Environment Detection**: Automatic development/production configuration
- **Component Reusability**: Consistent UI patterns across all pages
- **Performance Optimization**: Lazy loading, code splitting, bundle optimization

For detailed information, see [HTML Structure Guide](docs/HTML_STRUCTURE.md).

## 🚀 Deployment

### Railway Deployment

1. **Connect to Railway**
   - Link your GitHub repository
   - Set environment variables in Railway dashboard

2. **Environment Variables**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Deploy**
   - Railway will automatically deploy on push to main

### Railway Deployment

1. **Connect to Railway**
   - Push your code to GitHub
   - Connect your GitHub repository to Railway
   - Railway will automatically detect Next.js and deploy

2. **Set environment variables** in Railway dashboard

3. **Deploy**
   - Railway automatically deploys on every push to main branch
   - No additional commands needed

## 📚 API Reference

### Swings API

#### `POST /api/swings`
Create a new swing record.

**Request Body:**
```json
{
  "club": "driver",
  "metrics": {
    "swingPlaneAngle": 12.5,
    "tempoRatio": 2.1,
    "hipRotation": 30.0,
    "shoulderRotation": 45.0,
    "impactFrame": 15,
    "backswingTime": 1.2,
    "downswingTime": 0.6
  },
  "feedback": ["Good tempo", "Rotate more"]
}
```

#### `GET /api/swings`
Get swing history.

**Query Parameters:**
- `type=stats` - Get club statistics

#### `GET /api/swings/[id]`
Get specific swing details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## 📋 Recent Updates

### 🎉 Latest Release - December 19, 2024
- **✅ Complete End-to-End Functionality** - Full video upload, live camera recording, swing analysis, and data persistence
- **✅ Real-time Pose Detection** - Live MediaPipe integration for camera-based swing analysis  
- **✅ Comprehensive Export System** - JSON and CSV export functionality with progress indicators
- **✅ Advanced Swing Analysis** - AI-powered report cards with detailed feedback
- **✅ Side-by-Side Comparison** - Multi-swing comparison with progress tracking
- **✅ Production Ready** - All critical issues resolved, comprehensive error handling, and full TypeScript support
- **✅ Performance Monitoring** - Real-time FPS, memory usage, and error tracking dashboard
- **✅ Enhanced UX** - Theme toggle, tooltips, loading skeletons, and smooth animations
- **✅ Comprehensive Logging** - Structured logging system with monitoring dashboard

### 🔧 Major Fixes
- **Fixed**: MediaPipe pose detection initialization and error handling
- **Fixed**: Video processing with proper frame extraction and memory management
- **Fixed**: Data structure alignment between frontend and backend
- **Fixed**: Supabase integration with proper data validation
- **Fixed**: Real-time camera recording and pose detection
- **Added**: Comprehensive error handling and user feedback
- **Added**: Export functionality (JSON/CSV) with download handling

> 📖 **See [CHANGELOG.md](CHANGELOG.md) for complete details of all changes and improvements.**

## 🗺️ Roadmap

### ✅ Completed
- [x] **VistaSwing AI Coaching System** - Professional golf analysis with C.R.E.A.T.E Framework
- [x] **A-F Grading System** - Comprehensive swing evaluation
- [x] **Structured Report Cards** - Beautiful JSON output with coaching tips
- [x] **Real-time Analysis** - Live camera capture and analysis
- [x] **Video Upload Analysis** - Upload and analyze recorded swings
- [x] **Complete End-to-End Functionality** - Full production-ready system
- [x] **Export Functionality** - JSON and CSV data export
- [x] **Swing Comparison** - Side-by-side analysis and progress tracking
- [x] **Comprehensive Error Handling** - User-friendly error messages and recovery

### 🚧 In Progress
- [ ] Enhanced pose detection accuracy
- [ ] More detailed swing metrics
- [ ] Improved UI/UX for report cards

### 📋 Planned
- [ ] Mobile app (React Native)
- [ ] Social features and sharing
- [ ] Professional coach dashboard
- [ ] Integration with golf simulators
- [ ] Advanced video editing tools
- [ ] Multi-language support
- [ ] Advanced AI coaching with video recommendations

---

Made with ❤️ by the SwingVista Team