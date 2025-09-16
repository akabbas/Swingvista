'use client';

export interface DrillRecommendation {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  equipment: string[];
  steps: string[];
  visualDemo?: string;
  targetMetric: string;
}

export class DrillRecommendationEngine {
  private static drills: Record<string, Record<string, DrillRecommendation[]>> = {
    tempo: {
      beginner: [
        {
          name: 'Count Your Swing',
          description: 'Practice counting to establish proper tempo rhythm',
          difficulty: 'beginner',
          duration: '5 minutes',
          equipment: ['Golf club'],
          steps: [
            'Take your normal stance',
            'Count "1-2-3" during backswing',
            'Count "1" during downswing',
            'Repeat 10 times without a ball'
          ],
          targetMetric: 'tempo'
        },
        {
          name: 'Metronome Practice',
          description: 'Use a metronome to develop consistent timing',
          difficulty: 'beginner',
          duration: '10 minutes',
          equipment: ['Golf club', 'Metronome app'],
          steps: [
            'Set metronome to 60 BPM',
            'Backswing takes 3 beats',
            'Downswing takes 1 beat',
            'Practice without ball first'
          ],
          targetMetric: 'tempo'
        }
      ],
      intermediate: [
        {
          name: 'Variable Tempo Training',
          description: 'Practice different tempos to find your optimal rhythm',
          difficulty: 'intermediate',
          duration: '15 minutes',
          equipment: ['Golf club', 'Multiple balls'],
          steps: [
            'Hit 5 balls with slow tempo (4:1 ratio)',
            'Hit 5 balls with fast tempo (2:1 ratio)',
            'Hit 5 balls with ideal tempo (3:1 ratio)',
            'Note which feels most natural'
          ],
          targetMetric: 'tempo'
        }
      ],
      advanced: [
        {
          name: 'Club-Specific Tempo',
          description: 'Develop different tempos for different clubs',
          difficulty: 'advanced',
          duration: '20 minutes',
          equipment: ['Driver', '7-iron', 'Wedge'],
          steps: [
            'Driver: 3:1 ratio (slower)',
            '7-iron: 2.5:1 ratio (medium)',
            'Wedge: 2:1 ratio (faster)',
            'Practice transitions between clubs'
          ],
          targetMetric: 'tempo'
        }
      ]
    },
    rotation: {
      beginner: [
        {
          name: 'Shoulder Turn Without Arms',
          description: 'Focus on shoulder rotation without moving your arms',
          difficulty: 'beginner',
          duration: '8 minutes',
          equipment: ['Golf club'],
          steps: [
            'Cross arms over chest',
            'Turn shoulders only (no arm movement)',
            'Feel your back turn to target',
            'Hold for 2 seconds at top'
          ],
          targetMetric: 'rotation'
        },
        {
          name: 'Wall Drill',
          description: 'Use a wall to feel proper shoulder turn',
          difficulty: 'beginner',
          duration: '10 minutes',
          equipment: ['Wall'],
          steps: [
            'Stand with back to wall',
            'Turn shoulders until right shoulder touches wall',
            'Keep hips facing forward',
            'Hold position for 5 seconds'
          ],
          targetMetric: 'rotation'
        }
      ],
      intermediate: [
        {
          name: 'X-Factor Separation',
          description: 'Develop proper shoulder-hip separation',
          difficulty: 'intermediate',
          duration: '12 minutes',
          equipment: ['Golf club'],
          steps: [
            'Start with normal stance',
            'Turn shoulders 90° while keeping hips stable',
            'Feel the stretch between shoulders and hips',
            'Slowly return to address'
          ],
          targetMetric: 'rotation'
        }
      ],
      advanced: [
        {
          name: 'Max Rotation with Stability',
          description: 'Achieve maximum rotation while maintaining balance',
          difficulty: 'advanced',
          duration: '15 minutes',
          equipment: ['Golf club', 'Balance board (optional)'],
          steps: [
            'Take normal stance',
            'Turn shoulders as far as possible',
            'Maintain balance throughout',
            'Hold for 3 seconds at maximum turn'
          ],
          targetMetric: 'rotation'
        }
      ]
    },
    balance: {
      beginner: [
        {
          name: 'Feet Together Drill',
          description: 'Practice balance with feet close together',
          difficulty: 'beginner',
          duration: '6 minutes',
          equipment: ['Golf club'],
          steps: [
            'Stand with feet 6 inches apart',
            'Make slow, controlled swings',
            'Focus on staying balanced',
            'Gradually increase swing speed'
          ],
          targetMetric: 'balance'
        }
      ],
      intermediate: [
        {
          name: 'One-Foot Balance',
          description: 'Improve balance by practicing on one foot',
          difficulty: 'intermediate',
          duration: '10 minutes',
          equipment: ['Golf club'],
          steps: [
            'Lift back foot off ground',
            'Make slow swings on front foot only',
            'Focus on staying centered',
            'Switch feet and repeat'
          ],
          targetMetric: 'balance'
        }
      ],
      advanced: [
        {
          name: 'Balance Board Training',
          description: 'Advanced balance training with unstable surface',
          difficulty: 'advanced',
          duration: '15 minutes',
          equipment: ['Balance board', 'Golf club'],
          steps: [
            'Stand on balance board',
            'Make controlled swings',
            'Maintain balance throughout',
            'Increase difficulty gradually'
          ],
          targetMetric: 'balance'
        }
      ]
    },
    plane: {
      beginner: [
        {
          name: 'Swing Inside a Barrel',
          description: 'Visualize swinging inside a barrel to maintain plane',
          difficulty: 'beginner',
          duration: '8 minutes',
          equipment: ['Golf club', 'Imaginary barrel'],
          steps: [
            'Imagine a barrel around your swing',
            'Keep club inside barrel throughout swing',
            'Focus on smooth, on-plane motion',
            'Practice without ball first'
          ],
          targetMetric: 'plane'
        }
      ],
      intermediate: [
        {
          name: 'Alignment Stick Drill',
          description: 'Use alignment sticks to check swing plane',
          difficulty: 'intermediate',
          duration: '12 minutes',
          equipment: ['Golf club', 'Alignment sticks'],
          steps: [
            'Place alignment stick on ground',
            'Swing club along stick path',
            'Check plane at different points',
            'Adjust as needed'
          ],
          targetMetric: 'plane'
        }
      ],
      advanced: [
        {
          name: 'Plane Board Training',
          description: 'Use a plane board for precise plane training',
          difficulty: 'advanced',
          duration: '15 minutes',
          equipment: ['Plane board', 'Golf club'],
          steps: [
            'Set up plane board at proper angle',
            'Swing club along board surface',
            'Feel correct plane throughout swing',
            'Practice with different clubs'
          ],
          targetMetric: 'plane'
        }
      ]
    },
    power: {
      beginner: [
        {
          name: 'Wrist Hinge Drill',
          description: 'Develop proper wrist hinge for power',
          difficulty: 'beginner',
          duration: '10 minutes',
          equipment: ['Golf club'],
          steps: [
            'Take backswing with straight left arm',
            'Hinge wrists at top of swing',
            'Feel the power stored in wrists',
            'Release through impact'
          ],
          targetMetric: 'power'
        }
      ],
      intermediate: [
        {
          name: 'Weight Transfer Power',
          description: 'Use weight transfer to generate power',
          difficulty: 'intermediate',
          duration: '12 minutes',
          equipment: ['Golf club'],
          steps: [
            'Start with weight on back foot',
            'Transfer weight to front foot during downswing',
            'Feel the power from weight shift',
            'Practice with different clubs'
          ],
          targetMetric: 'power'
        }
      ],
      advanced: [
        {
          name: 'Explosive Release',
          description: 'Develop explosive power through impact',
          difficulty: 'advanced',
          duration: '15 minutes',
          equipment: ['Golf club', 'Resistance bands'],
          steps: [
            'Use resistance bands for added resistance',
            'Practice explosive release through impact',
            'Focus on maximum acceleration',
            'Gradually increase resistance'
          ],
          targetMetric: 'power'
        }
      ]
    },
    consistency: {
      beginner: [
        {
          name: 'Same Swing, Different Clubs',
          description: 'Practice the same swing with different clubs',
          difficulty: 'beginner',
          duration: '15 minutes',
          equipment: ['Driver', '7-iron', 'Wedge'],
          steps: [
            'Use same swing with each club',
            'Focus on consistent motion',
            'Note differences in feel',
            'Work on making them similar'
          ],
          targetMetric: 'consistency'
        }
      ],
      intermediate: [
        {
          name: 'Target Practice',
          description: 'Practice hitting specific targets for consistency',
          difficulty: 'intermediate',
          duration: '20 minutes',
          equipment: ['Golf club', 'Targets', 'Balls'],
          steps: [
            'Set up targets at different distances',
            'Hit 10 balls to each target',
            'Focus on consistent swing',
            'Track accuracy and repeatability'
          ],
          targetMetric: 'consistency'
        }
      ],
      advanced: [
        {
          name: 'Pressure Practice',
          description: 'Practice under pressure to improve consistency',
          difficulty: 'advanced',
          duration: '25 minutes',
          equipment: ['Golf club', 'Balls', 'Timer'],
          steps: [
            'Set time limits for each shot',
            'Practice with consequences for misses',
            'Simulate tournament pressure',
            'Focus on maintaining consistency'
          ],
          targetMetric: 'consistency'
        }
      ]
    }
  };

  public static getDrillsForMetric(metric: string, score: number): DrillRecommendation[] {
    const difficulty = this.getDifficultyLevel(score);
    return this.drills[metric]?.[difficulty] || [];
  }

  public static getAllDrillsForScore(score: number): Record<string, DrillRecommendation[]> {
    const difficulty = this.getDifficultyLevel(score);
    const result: Record<string, DrillRecommendation[]> = {};
    
    Object.keys(this.drills).forEach(metric => {
      result[metric] = this.drills[metric][difficulty] || [];
    });
    
    return result;
  }

  public static getDifficultyLevel(score: number): 'beginner' | 'intermediate' | 'advanced' {
    if (score < 50) return 'beginner';
    if (score < 80) return 'intermediate';
    return 'advanced';
  }

  public static getRandomDrill(metric: string, score: number): DrillRecommendation | null {
    const drills = this.getDrillsForMetric(metric, score);
    if (drills.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * drills.length);
    return drills[randomIndex];
  }

  public static getProgressiveDrills(metric: string): DrillRecommendation[] {
    const allDrills: DrillRecommendation[] = [];
    
    ['beginner', 'intermediate', 'advanced'].forEach(difficulty => {
      const drills = this.drills[metric]?.[difficulty] || [];
      allDrills.push(...drills);
    });
    
    return allDrills;
  }
}
