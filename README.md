# 🏌️ SwingVista

> AI-powered golf swing analysis platform with real-time pose detection and intelligent feedback

[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎥 **Real-time Analysis** - Live camera capture with instant pose detection
- 📹 **Video Upload** - Analyze recorded swing videos with detailed metrics
- 📊 **Advanced Metrics** - Track swing plane, tempo, rotation, and timing
- 🏌️ **Club Support** - Driver, iron, wedge, and putter analysis
- 📈 **Progress Tracking** - Dashboard with swing history and statistics
- 🔄 **Comparison Mode** - Side-by-side swing comparison
- 🤖 **AI Integration** - Ready for LLM-powered coaching
- ⚡ **Web Workers** - Background processing for smooth performance
- 📱 **Responsive Design** - Works on desktop and mobile devices

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
- **Deployment**: Railway/Vercel
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

### Real-time Analysis
1. Navigate to **Camera** page
2. Allow camera permissions
3. Select your club type
4. Click **Start Recording**
5. Perform your golf swing
6. Click **Stop Recording** to analyze
7. View instant feedback and metrics

### Video Upload Analysis
1. Navigate to **Upload** page
2. Click **Select File** and choose a video
3. Select your club type
4. Click **Analyze Video**
5. Wait for processing to complete
6. Review detailed analysis results

### Progress Tracking
1. Visit the **Dashboard** to see:
   - Recent swings
   - Club-specific statistics
   - Overall progress metrics
2. Use **Compare** mode to:
   - Select two swings for comparison
   - Track improvement over time
   - Identify areas for focus

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

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set environment variables** in Vercel dashboard

3. **Deploy**
   ```bash
   vercel --prod
   ```

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

- [ ] Mobile app (React Native)
- [ ] Advanced AI coaching
- [ ] Social features and sharing
- [ ] Professional coach dashboard
- [ ] Integration with golf simulators
- [ ] Advanced video editing tools

---

Made with ❤️ by the SwingVista Team