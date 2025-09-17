#!/bin/bash

# Navigate to the project directory
cd /Users/ammrabbasher/swingvista

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git remote add origin https://github.com/ammrabbasher/swingvista.git
fi

# Add all changes
echo "Adding changes to git..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "feat: implement comprehensive golf swing visualization overlay system

- Add StickFigureOverlay component for pose detection rendering
- Add SwingPlaneVisualization for golf-specific visualizations
- Add PhaseMarkers for swing phase indicators
- Add CameraOverlayContainer for real-time camera analysis
- Add VideoOverlayContainer for video upload analysis
- Update camera page to use new overlay system
- Update upload page to use new overlay system
- Add comprehensive documentation and test components
- Implement responsive design and performance optimization
- Add fallback handling for all pose detection methods"

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main

echo "Changes committed and pushed successfully!"
