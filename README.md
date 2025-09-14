# 🏌️ SwingVista

> AI-powered golf swing analysis platform with VistaSwing AI coaching system, real-time pose detection, and intelligent feedback

[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🎯 VistaSwing AI Coaching System
- **C.R.E.A.T.E Framework** - Professional golf coaching methodology
- **A-F Grading System** - Comprehensive evaluation of swing fundamentals
- **6 Key Components** - Setup, Grip, Alignment, Rotation, Impact, Follow-through
- **5 Swing Phases** - Complete analysis from setup to finish
- **Professional Feedback** - Positive-first coaching tips from PGA-level analysis
- **Structured Report Cards** - Beautiful JSON output with actionable insights

### 🎥 Analysis & Detection
- **Real-time Analysis** - Live camera capture with instant pose detection
- **Video Upload** - Analyze recorded swing videos with detailed metrics
- **Advanced Metrics** - Track swing plane, tempo, rotation, and timing
- **Tempo Analysis** - Detect ideal 3:1 backswing to downswing ratio
- **Swing Plane Detection** - Identify if swing is too steep or flat

### 🏌️ Golf Features
- **Club Support** - Driver, iron, wedge, and putter analysis
- **Progress Tracking** - Dashboard with swing history and statistics
- **Comparison Mode** - Side-by-side swing comparison
- **Weight Transfer Analysis** - Monitor proper weight shift through swing
- **Impact Position** - Analyze ball-first contact and shaft lean

### ⚡ Technical Features
- **Web Workers** - Background processing for smooth performance
- **MediaPipe Integration** - Advanced pose landmark detection
- **Responsive Design** - Works on desktop and mobile devices
- **TypeScript** - Full type safety and developer experience

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for full functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/swingvista.git
   cd swingvista
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
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
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
swingvista/
├── 📁 config/                 # Configuration files
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   ├── tailwind.config.js
│   └── vitest.config.ts
├── 📁 docs/                   # Documentation
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
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── 📁 lib/                # Core libraries
│   │   ├── mediapipe.ts       # Pose detection
│   │   ├── metrics.config.ts  # Analysis configuration
│   │   ├── vista-swing-ai.ts  # VistaSwing AI coaching system
│   │   └── supabase.ts        # Database client
│   ├── 📁 workers/            # Web Workers
│   │   └── analysis.worker.ts # Swing analysis
│   └── 📁 __tests__/          # Test files
├── 📄 .gitignore
├── 📄 next.config.js
├── 📄 package.json
├── 📄 README.md
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

## 🗺️ Roadmap

### ✅ Completed
- [x] **VistaSwing AI Coaching System** - Professional golf analysis with C.R.E.A.T.E Framework
- [x] **A-F Grading System** - Comprehensive swing evaluation
- [x] **Structured Report Cards** - Beautiful JSON output with coaching tips
- [x] **Real-time Analysis** - Live camera capture and analysis
- [x] **Video Upload Analysis** - Upload and analyze recorded swings

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