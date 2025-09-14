# SwingVista - Golf Swing Analysis Platform

A Next.js web application that provides real-time and recorded golf swing analysis using computer vision and AI-powered feedback.

## Features

- 🎥 **Real-time Analysis**: Live camera capture with pose detection and instant feedback
- 📹 **Video Upload**: Analyze recorded swing videos with detailed metrics
- 📊 **Swing Metrics**: Track swing plane, tempo, rotation, and timing
- 🏌️ **Club Categorization**: Support for driver, iron, wedge, and putter analysis
- 📈 **Progress Tracking**: Dashboard with swing history and club statistics
- 🔄 **Comparison Mode**: Side-by-side swing comparison for progress tracking
- 🤖 **AI Integration**: Ready for LLM-powered coaching and analysis
- ⚡ **Web Workers**: Background processing for smooth performance

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Computer Vision**: MediaPipe Pose Landmarker
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Testing**: Vitest
- **AI Ready**: OpenAI/Anthropic integration templates

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (optional for full functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
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
   
   Edit `.env.local` with your Supabase credentials:
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

## Database Setup

### Supabase Setup

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

## Usage

### Real-time Analysis

1. Navigate to the **Camera** page
2. Allow camera permissions when prompted
3. Select your club type
4. Click **Start Recording** to begin analysis
5. Perform your golf swing
6. Click **Stop Recording** to analyze
7. View instant feedback and metrics

### Video Upload Analysis

1. Navigate to the **Upload** page
2. Click **Select File** and choose a video
3. Select your club type
4. Click **Analyze Video**
5. Wait for processing to complete
6. Review detailed analysis results

### View Progress

1. Visit the **Dashboard** to see:
   - Recent swings
   - Club-specific statistics
   - Overall progress metrics

2. Use **Compare** mode to:
   - Select two swings for comparison
   - Track improvement over time
   - Identify areas for focus

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   MediaPipe      │    │   Web Workers   │
│   (Next.js)     │◄──►│   Pose Detection │◄──►│   Analysis      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Supabase      │    │   API Routes     │    │   AI Integration│
│   Database      │◄──►│   (Next.js API)  │◄──►│   (Optional)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components

- **MediaPipe Integration** (`src/lib/mediapipe.ts`): Handles pose detection
- **Analysis Worker** (`src/workers/analysis.worker.ts`): Computes swing metrics
- **Metrics Config** (`src/lib/metrics.config.ts`): Configurable thresholds
- **Supabase Client** (`src/lib/supabase.ts`): Database operations
- **API Routes** (`src/app/api/`): Backend endpoints

## Configuration

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

### AI Integration

1. Add your API keys to `.env.local`:
   ```env
   OPENAI_API_KEY=your_key_here
   ANTHROPIC_API_KEY=your_key_here
   ```

2. Use the prompt templates in `ai/prompts.md`

3. Implement AI endpoints in `src/app/api/ai/`

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set environment variables** in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## API Reference

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

### Ball Detection API

#### `POST /api/infer/ball`
Mock ball detection endpoint (ready for YOLOv8 integration).

## Development

### Project Structure

```
swingvista/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes
│   │   ├── camera/         # Real-time analysis page
│   │   ├── upload/         # Video upload page
│   │   ├── compare/        # Comparison page
│   │   └── swing/[id]/     # Swing detail page
│   ├── lib/                # Utility libraries
│   │   ├── mediapipe.ts    # MediaPipe integration
│   │   ├── metrics.config.ts # Configuration
│   │   └── supabase.ts     # Database client
│   ├── workers/            # Web Workers
│   │   └── analysis.worker.ts # Swing analysis
│   └── __tests__/          # Test files
├── ai/                     # AI integration templates
├── public/                 # Static assets
└── docs/                   # Documentation
```

### Adding New Metrics

1. **Update the metrics interface** in `src/workers/analysis.worker.ts`
2. **Add calculation logic** in the analysis function
3. **Update configuration** in `src/lib/metrics.config.ts`
4. **Add tests** in `src/__tests__/metrics.test.ts`

### Adding New Feedback Rules

1. **Edit feedback messages** in `src/lib/metrics.config.ts`
2. **Update generation logic** in `src/workers/analysis.worker.ts`
3. **Test with various swing patterns**

## Troubleshooting

### Common Issues

1. **Camera not working**
   - Check browser permissions
   - Ensure HTTPS in production
   - Try different browsers

2. **MediaPipe not loading**
   - Check internet connection
   - Verify CDN access
   - Check browser console for errors

3. **Analysis not working**
   - Ensure sufficient landmarks detected
   - Check Web Worker support
   - Verify video quality

4. **Database errors**
   - Check Supabase credentials
   - Verify table schema
   - Check network connectivity

### Performance Optimization

1. **Reduce analysis frequency** for real-time mode
2. **Implement video compression** for uploads
3. **Add caching** for repeated analyses
4. **Optimize MediaPipe settings** for your use case

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced AI coaching
- [ ] Social features and sharing
- [ ] Professional coach dashboard
- [ ] Integration with golf simulators
- [ ] Advanced video editing tools