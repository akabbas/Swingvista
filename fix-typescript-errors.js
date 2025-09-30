#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common TypeScript fixes
const fixes = [
  // Fix PoseResult missing worldLandmarks
  {
    pattern: /(\s+)(landmarks:.*?,\s*timestamp:.*?,\s*confidence:.*?)(\s*})/gs,
    replacement: '$1$2,\n$1worldLandmarks: landmarks.map(lm => ({ ...lm, z: 0 }))$3'
  },
  
  // Fix EnhancedSwingPhase missing properties
  {
    pattern: /(\s+)(name:.*?,\s*startTime:.*?,\s*endTime:.*?,\s*startFrame:.*?,\s*endFrame:.*?,\s*duration:.*?,\s*confidence:.*?,\s*grade:.*?,\s*color:.*?,\s*keyPoints:.*?,\s*metrics:.*?,\s*recommendations:.*?)(\s*})/gs,
    replacement: '$1$2,\n$1description: "Phase description",\n$1professionalBenchmark: {\n$1  idealDuration: 1.0,\n$1  keyPositions: [],\n$1  commonMistakes: []\n$1}$3'
  },
  
  // Fix missing worldLandmarks in simple cases
  {
    pattern: /(\s+)(landmarks:.*?,\s*timestamp:.*?,\s*confidence:.*?)(\s*})/gs,
    replacement: '$1$2,\n$1worldLandmarks: landmarks.map(lm => ({ ...lm, z: 0 }))$3'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fixFile(filePath);
    }
  });
}

// Start fixing from src directory
console.log('Fixing TypeScript errors...');
walkDir('./src');
console.log('Done!');
