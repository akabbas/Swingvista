#!/bin/bash

# Navigate to the project directory
cd /Users/ammrabbasher/swingvista

# Add all changes (including deletions)
git add -A

# Commit the cleanup
git commit -m "🧹 Cleanup: Remove temporary commit script

- Removed commit-fixes.sh after successful commit
- Repository is now clean and up to date"

# Push to GitHub
git push origin main

echo "✅ Cleanup committed and pushed to GitHub successfully!"
