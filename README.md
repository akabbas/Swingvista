# SwingVista - Golf Swing Analysis Platform

A modern, responsive web application for golf swing analysis built with Next.js 15, TypeScript, and Tailwind CSS.

## 📊 Current Status

**🟢 Fully Functional AI-Powered Golf Swing Analyzer**: The app now provides complete golf swing analysis with AI-powered feedback, professional grading, progress tracking, and personalized drill recommendations.

**What Works Now:**
- ✅ AI-powered swing analysis with dynamic feedback
- ✅ Professional grading system (A+ to F) based on PGA Tour benchmarks
- ✅ Video upload and pose detection using MediaPipe
- ✅ Progress tracking with visual charts and session history
- ✅ Personalized drill recommendations with progressive difficulty
- ✅ OpenAI integration for professional golf instructor insights
- ✅ Mobile-optimized interface for recording and analysis
- ✅ Quality assessment and recording angle detection

## 📚 Documentation

- **[Golf Grading System](./docs/GOLF_GRADING_SYSTEM.md)** - Comprehensive guide to how swings are analyzed and graded
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Quick reference for metrics and improvement tips
- **[Grading Flowchart](./docs/GRADING_FLOWCHART.md)** - Visual representation of the analysis process

## 🏌️ Features

### 🤖 AI-Powered Analysis
- **Dynamic Feedback Generation**: No hardcoded criticisms - all feedback generated based on your actual swing metrics
- **Professional Grading System**: Compare your swing against professional benchmarks with A+ to F grading
- **Multi-Dimensional Analysis**: Tempo, rotation, balance, swing plane, power, and consistency
- **Intelligent Scoring**: Overall score (0-100) based on multiple weighted factors
- **OpenAI Integration**: Enhanced analysis using GPT-4o-mini for professional golf instructor insights

### 📊 Progress Tracking
- **Session History**: Track your improvement over time with detailed session records
- **Progress Charts**: Visual charts showing trends for each metric
- **Improvement Analytics**: Calculate improvement rates and average scores
- **Grade Tracking**: Monitor your letter grades (A+ to F) over time
- **Data Export/Import**: Save and share your progress data

### 🎯 Personalized Drills
- **Progressive Difficulty**: Beginner, intermediate, and advanced drill recommendations
- **Skill-Based Matching**: Drills automatically matched to your current skill level
- **Detailed Instructions**: Step-by-step instructions with equipment requirements
- **Duration Guidelines**: Clear time commitments for each drill
- **Interactive Interface**: Click to view detailed drill instructions

### 🏌️‍♂️ Golf Swing Analysis
- **Video Upload**: Upload golf swing videos for analysis
- **Pose Detection**: Real-time pose tracking using MediaPipe with confidence filtering
- **Swing Phase Detection**: Identify address, backswing, transition, downswing, impact, and follow-through
- **Quality Assessment**: Automatic recording angle detection and quality warnings
- **Visual Overlay**: See pose landmarks overlaid on your video
- **Mobile Friendly**: Optimized for mobile devices and recording

### 🛠️ Technical Features
- **Modern Tech Stack**: Built with Next.js 15, React 19, TypeScript, and Tailwind CSS
- **Performance Optimized**: Fast loading with optimized CSS and font loading
- **Web Workers**: Background processing for smooth UI experience
- **Responsive Design**: Clean, modern UI that works on all devices
- **Accessibility**: Built with accessibility best practices

## 🏆 AI Grading System

SwingVista uses a comprehensive grading system that compares your swing against professional benchmarks:

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
- **Shoulder Rotation**: 95° at the top
- **Hip Rotation**: 45° at the top
- **X-Factor**: 25° shoulder-hip separation
- **Balance**: 95% stability score
- **Swing Plane**: 90% consistency

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

### Optional: Tiger Woods iron swing sample video

To enable the "Use Tiger Sample" button on the Upload page, place a file at `public/fixtures/swings/tiger-iron.mp4`.

You can download a YouTube clip locally with `yt-dlp` (ensure you have rights to use the content):

```bash
brew install yt-dlp ffmpeg
mkdir -p public/fixtures/swings
yt-dlp -f "mp4" -S "res:720" -o "public/fixtures/swings/tiger-iron.%(ext)s" "<YOUTUBE_URL_HERE>"
```

Replace `<YOUTUBE_URL_HERE>` with a Tiger Woods iron swing video URL.

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

### Camera Analysis (`/camera`)
- UI prototype for camera interface
- Placeholder buttons for recording and settings
- Ready for camera integration

### Video Upload (`/upload`)
- UI prototype for file upload
- Placeholder buttons for file selection and analysis
- Ready for upload functionality integration

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
# Add your environment variables here
# Currently no environment variables required
```

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

### Phase 2: Core Features (Next)
- [ ] Camera integration and recording
- [ ] Video upload functionality
- [ ] Basic swing analysis integration
- [ ] User feedback system

### Phase 3: Advanced Features (Planned)
- [ ] AI-powered analysis
- [ ] Real-time pose detection
- [ ] Detailed metrics and insights
- [ ] User authentication
- [ ] Swing history and tracking

### Phase 4: Enhancement (Future)
- [ ] Mobile app
- [ ] Social features
- [ ] Advanced analytics
- [ ] Professional tools

## 🏆 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons and emojis for enhanced UX
- Community feedback and contributions

---

**SwingVista** - Improving your golf game, one swing at a time. ⛳

*Last updated: September 2024*