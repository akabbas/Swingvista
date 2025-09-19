# SwingVista - Advanced Golf Swing Analysis Platform

A comprehensive, AI-powered golf swing analysis platform built with Next.js 15, TypeScript, and Tailwind CSS. Features video upload analysis with pose detection, comprehensive swing phase analysis, and professional-grade feedback.

## 📊 Current Status

**🟢 Production-Ready Video Analysis Platform**: Complete golf swing analysis platform with robust pose detection, comprehensive swing phase identification, AI-powered feedback, and professional grading system.

**Core Capabilities:**
- ✅ **Video Upload Analysis** - Upload and analyze golf swing videos with TensorFlow.js pose detection
- ✅ **Comprehensive Swing Phase Detection** - 6 specific phases: address, backswing, top, downswing, impact, follow-through
- ✅ **AI-Powered Analysis** - OpenAI GPT-4o-mini integration for professional golf instructor insights
- ✅ **Professional Grading System** - A+ to F grading based on PGA Tour benchmarks with emergency overrides
- ✅ **Robust Pose Detection** - TensorFlow.js MoveNet with server-side API fallback
- ✅ **Comprehensive Metrics** - Tempo, rotation, weight transfer, swing plane, body alignment
- ✅ **Visual Overlays** - Stick figure animation, swing plane visualization, phase markers
- ✅ **Mobile-Optimized** - Responsive design for analysis on any device
- ✅ **Error Recovery** - Multiple fallback systems ensure analysis always works

## 📚 Documentation

- **[Features Overview](./docs/FEATURES_OVERVIEW.md)** - Comprehensive guide to all SwingVista capabilities
- **[Golf Grading System](./docs/GOLF_GRADING_SYSTEM.md)** - Detailed guide to how swings are analyzed and graded
- **[Technical Fixes](./docs/TECHNICAL_FIXES.md)** - Critical fixes and improvements implemented
- **[API Documentation](./docs/API.md)** - Complete API reference and endpoints
- **[Components Guide](./docs/COMPONENTS_GUIDE.md)** - Component usage and development guide
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Quick reference for metrics and improvement tips
- **[Grading Flowchart](./docs/GRADING_FLOWCHART.md)** - Visual representation of the analysis process

## 🏌️ Features

### 📹 Video Upload Analysis
- **High-Quality Pose Detection**: Extract poses from uploaded videos using TensorFlow.js MoveNet
- **Comprehensive Analysis**: Full swing analysis with detailed metrics and AI feedback
- **Visual Overlays**: Stick figure animation, swing plane visualization, and phase markers
- **Swing Phase Timeline**: See all 6 phases marked on video timeline with grades
- **Quality Assessment**: Automatic detection of recording angle and quality
- **Multiple Video Formats**: Support for MP4 and other common video formats
- **Interactive Controls**: Play, pause, seek, speed control, and overlay toggles

### 🤖 AI-Powered Analysis
- **OpenAI GPT-4o-mini Integration**: Professional golf instructor insights via API
- **Dynamic Feedback Generation**: Personalized feedback based on actual swing metrics
- **Professional Grading System**: A+ to F grading based on PGA Tour benchmarks
- **Multi-Dimensional Analysis**: Tempo, rotation, balance, swing plane, power, and consistency
- **Intelligent Scoring**: Overall score (0-100) based on weighted factors
- **Fallback Analysis**: Heuristic analysis when AI is unavailable

### 📊 Comprehensive Swing Metrics
- **Tempo Analysis**: Backswing to downswing ratio with professional benchmarks
- **Rotation Tracking**: Shoulder turn, hip turn, and X-factor measurements
- **Weight Transfer**: Analysis of weight distribution throughout swing
- **Swing Plane**: Club path consistency and plane deviation
- **Body Alignment**: Spine angle, head movement, and knee flex analysis
- **Power Metrics**: Clubhead speed and acceleration measurements

### 🎯 Swing Phase Detection
- **Address**: Initial setup and address position analysis
- **Backswing**: Takeaway to top of backswing tracking
- **Top**: Top of swing position identification
- **Downswing**: Downswing to impact analysis
- **Impact**: Ball contact moment detection
- **Follow-through**: Follow-through to finish tracking

### 🛠️ Technical Features
- **Modern Tech Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Pose Detection**: TensorFlow.js MoveNet with server-side API fallback
- **Web Workers**: Background processing for smooth UI experience
- **Performance Optimized**: Fast loading and efficient processing
- **Responsive Design**: Works on all devices and screen sizes
- **Error Recovery**: Comprehensive fallback systems ensure analysis always works
- **Professional Grade Override**: Prevents professional swings from getting F grades
- **Sample Videos**: Pre-loaded Tiger Woods, Ludvig Åberg, and Max Homa swing videos

## 🏆 AI Grading System

SwingVista uses a comprehensive grading system that compares your swing against professional benchmarks with intelligent overrides to ensure fair grading:

### Grading Scale
- **A+ (97-100)**: Exceptional - Professional level
- **A (93-96)**: Excellent - Above professional average  
- **A- (90-92)**: Very Good - Professional level
- **B+ (87-89)**: Good - Above amateur average
- **B (83-86)**: Above Average - Solid amateur
- **B- (80-82)**: Average - Typical amateur
- **C+ (77-79)**: Below Average - Needs work
- **C (73-76)**: Poor - Significant improvement needed
- **C- (70-72)**: Very Poor - Major issues
- **D+ (67-69)**: Failing - Fundamental problems
- **D (63-66)**: Failing - Multiple major issues
- **F (0-62)**: Failing - Complete rebuild needed

### Grading Categories
1. **Tempo** (15% weight) - Backswing to downswing timing ratio
2. **Rotation** (20% weight) - Shoulder, hip, and body separation
3. **Balance** (15% weight) - Stability throughout the swing
4. **Swing Plane** (15% weight) - Club path consistency
5. **Power** (20% weight) - Clubhead speed and acceleration
6. **Consistency** (15% weight) - Swing-to-swing repeatability

### Professional Benchmarks
- **Tempo**: 3:1 backswing to downswing ratio
- **Shoulder Rotation**: 90° at the top (corrected from 95°)
- **Hip Rotation**: 45° at the top
- **X-Factor**: 40° shoulder-hip separation (corrected from 25°)
- **Balance**: 90% stability score (more realistic)
- **Swing Plane**: 85% consistency (more realistic)

### Emergency Grade Overrides
- **Professional Swing Detection**: Automatically detects professional characteristics
- **Minimum A- Grade**: Professional swings get at least A- grade
- **High-Quality Data Override**: 100+ poses and 3+ phases get minimum B grade
- **Lenient Detection**: More realistic thresholds for professional swing identification

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key (for enhanced AI analysis)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/akabbas/Swingvista.git
   cd swingvista
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Sample Videos Included

The application includes several professional swing videos for testing:

- **Tiger Woods Swing** (`tiger-woods-swing.mp4`) - Professional driver swing
- **Ludvig Åberg Driver** (`ludvig_aberg_driver.mp4`) - Modern professional swing
- **Max Homa Iron** (`max_homa_iron.mp4`) - Professional iron swing

These videos are automatically available through the sample video selector on the upload page.

## 🏗️ Project Structure

```
swingvista/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── camera/            # Camera analysis page
│   │   ├── upload/            # Video upload page
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── layout/           # Layout components (Header, Footer)
│   │   └── ui/               # Reusable UI components
│   └── lib/                  # Utility libraries and configurations
├── docs/                     # Documentation
│   ├── API.md               # API documentation
│   ├── COMPONENTS_GUIDE.md  # Component usage guide
│   ├── DEPLOYMENT.md        # Deployment instructions
│   └── TESTING_STRATEGY.md  # Testing approach
├── public/                   # Static assets
├── config/                   # Configuration files
└── scripts/                  # Utility scripts
```

## 🎨 Design System

### Color Palette
- **Primary**: Green (#10B981) - Represents growth and improvement
- **Secondary**: Blue (#3B82F6) - Trust and reliability
- **Neutral**: Gray scale for text and backgrounds
- **Background**: Clean white (#FAFAFA) for optimal readability

### Typography
- **Font**: Inter (Google Fonts) with system font fallbacks
- **Display**: 5xl (48px) for main headings
- **Body**: Base (16px) with proper line height
- **Responsive**: Scales appropriately across devices

### Components
- **Buttons**: Rounded corners, hover effects, consistent spacing
- **Cards**: Subtle shadows, rounded corners, clean layouts
- **Navigation**: Clear hierarchy, hover states, mobile-friendly

## 🔧 Technical Details

### Performance Optimizations
- **CSS Optimization**: Critical CSS inlined to prevent FOUC
- **Font Loading**: Optimized with `display: "swap"` and preloading
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Splitting**: Automatic code splitting for optimal loading
- **Turbopack**: Fast development builds with Next.js 15

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement

## 📱 Pages

### Home Page (`/`)
- Welcome message and app description
- Navigation to camera and upload features
- Clean, professional design with proper button spacing
- Feature overview and getting started guide

### Camera Analysis (`/camera`)
- **Camera interface** for future real-time analysis (currently in development)
- **Mobile-optimized interface** for recording
- **Live metrics display** showing tempo, rotation, and more

### Video Upload (`/upload`)
- **File upload interface** with sample video options
- **High-quality pose extraction** using TensorFlow.js MoveNet
- **Comprehensive swing analysis** with detailed metrics
- **Visual overlays** with stick figure animation and swing plane visualization
- **Swing phase timeline** showing all 6 phases with grades
- **AI-powered feedback** with professional insights
- **Interactive video player** with overlay controls and playback options
- **Sample videos** including Tiger Woods, Ludvig Åberg, and Max Homa swings

## 🛠️ Development

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Component-based architecture

### State Management
- React hooks for local state
- Context API for global state (when needed)
- No external state management library (keeping it simple)

### Styling
- Tailwind CSS for utility-first styling
- Custom CSS for specific needs
- Responsive design patterns
- Light mode only (simplified design)

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables
Create a `.env.local` file with:
```bash
# OpenAI API Key (for AI-powered analysis)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (for data storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key_here
```

**Note**: The app works without these environment variables but with limited functionality:
- Without OpenAI API key: Uses heuristic analysis instead of AI
- Without Supabase: Uses local storage only

### Deployment Platforms
- **Vercel** (recommended) - Automatic deployments from GitHub
- **Railway** - Easy deployment with automatic builds
- **Netlify** - Static site hosting
- **Any Node.js hosting platform**

### Quick Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Deploy!

## 📈 Performance

### Core Web Vitals
- **LCP**: Optimized with critical CSS and font loading
- **FID**: Minimal JavaScript, efficient event handling
- **CLS**: Stable layouts, no layout shifts
- **TTFB**: Optimized server response times

### Loading Performance
- Critical CSS inlined
- Font preloading
- Optimized bundle size
- Efficient caching strategies

## 🧪 Testing

### Current Testing
- Manual testing across browsers and devices
- Performance testing with Core Web Vitals
- Accessibility testing with screen readers

### Planned Testing
- Unit tests with Jest and React Testing Library
- Integration tests for component interactions
- End-to-end tests with Playwright
- Visual regression testing

See [TESTING_STRATEGY.md](./docs/TESTING_STRATEGY.md) for detailed testing approach.

## 📚 Documentation

- **[API Documentation](./docs/API.md)** - API endpoints and data flow
- **[Component Guide](./docs/COMPONENTS_GUIDE.md)** - Component usage and styling
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Platform-specific deployment instructions
- **[Testing Strategy](./docs/TESTING_STRATEGY.md)** - Testing approach and infrastructure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `docs/` directory
- Review the component guide for UI questions

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Basic UI/UX design
- [x] Responsive layout
- [x] FOUC prevention
- [x] Performance optimization
- [x] UI prototypes for camera and upload

### Phase 2: Core Features ✅
- [x] Video upload functionality
- [x] Basic swing analysis integration
- [x] User feedback system

### Phase 3: Advanced Features ✅
- [x] AI-powered analysis
- [x] Video pose detection with TensorFlow.js
- [x] Detailed metrics and insights
- [x] Comprehensive swing phase detection
- [x] Professional grading system

### Phase 4: Enhancement (Current)
- [x] Advanced pose detection with TensorFlow.js MoveNet
- [x] Comprehensive swing phase identification
- [x] AI-powered feedback system
- [x] Professional grading system
- [x] Multi-layered pose detection with fallbacks
- [x] Emergency grade overrides for professional swings
- [x] Robust error recovery systems
- [x] Phase duration calculation fixes
- [x] Visual overlays and interactive video player
- [x] Sample video integration
- [ ] Real-time camera analysis
- [ ] User authentication
- [ ] Swing history and tracking
- [ ] Advanced analytics dashboard

### Phase 5: Future Enhancements
- [ ] Mobile app
- [ ] Social features
- [ ] Advanced analytics
- [ ] Professional tools
- [ ] Multi-angle analysis
- [ ] Swing comparison tools

## 🏆 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons and emojis for enhanced UX
- Community feedback and contributions

---

**SwingVista** - Improving your golf game, one swing at a time. ⛳

*Last updated: December 2024*