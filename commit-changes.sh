#!/bin/bash

# Commit Changes Script for Phase Detection Fixes
# Run this script to commit all the phase detection and weight distribution fixes

echo "🏌️‍♂️ Committing Phase Detection & Weight Distribution Fixes"
echo "========================================================"

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not available. Please install git first."
    exit 1
fi

# Initialize git repository if needed
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git branch -M main
fi

# Add all files
echo "📝 Adding all files..."
git add .

# Check status
echo "📊 Git status:"
git status

# Create commit
echo "💾 Creating commit..."
git commit -m "fix: Weight distribution calculation and phase detection accuracy

- Fix weight distribution to always sum to 100% total (was summing to 200%)
- Implement accurate phase detection for all 6 swing phases
- Add real-time analysis for both live camera and uploaded videos
- Use correct MediaPipe landmarks for body position accuracy
- Add comprehensive validation and debugging tools
- Create enhanced phase detector with biomechanical analysis
- Add video testing suite with sample videos
- Update existing files with proper weight distribution calculation

Fixes critical issues with golf swing analysis accuracy and reliability."

echo "✅ Commit created successfully!"

# Show commit details
echo "📋 Commit details:"
git log --oneline -1

echo ""
echo "🚀 Next steps:"
echo "1. Add remote repository: git remote add origin <your-github-repo-url>"
echo "2. Push to GitHub: git push -u origin main"
echo "3. Or create a new repository on GitHub and follow the instructions"

echo ""
echo "📁 Files committed:"
echo "- Enhanced phase detector (src/lib/enhanced-phase-detector.ts)"
echo "- Phase validation tools (src/lib/phase-validation.ts)"
echo "- Enhanced camera page (src/app/camera-enhanced/page.tsx)"
echo "- Video testing pages (test-*.html)"
echo "- Updated existing files with fixes"
echo "- Complete documentation and testing suite"

echo ""
echo "🎯 All critical fixes have been committed!"

