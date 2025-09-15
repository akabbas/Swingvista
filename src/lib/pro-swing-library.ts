import { TrajectoryPoint, SwingTrajectory } from './mediapipe';
import { SwingPhase } from './swing-phases';

export interface ProSwing {
  id: string;
  name: string;
  club: string;
  description: string;
  videoUrl: string;
  trajectory: SwingTrajectory;
  phases: SwingPhase[];
  metrics: {
    tempoRatio: number;
    swingPlane: number;
    maxVelocity: number;
    smoothness: number;
  };
  characteristics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Generate sample trajectory data for pro swings
const generateProTrajectory = (name: string, club: string): SwingTrajectory => {
  const frameCount = 60; // 2 seconds at 30fps
  const points: TrajectoryPoint[] = [];
  
  // Generate realistic swing trajectory based on pro characteristics
  for (let i = 0; i < frameCount; i++) {
    const t = i / (frameCount - 1);
    const timestamp = i * 33.33; // 30fps
    
    // Different trajectories for different pros
    let x, y, z;
    
    if (name === 'Tiger Woods') {
      // Tiger's signature inside-out swing
      x = 0.3 + 0.4 * Math.sin(t * Math.PI) + 0.1 * Math.sin(t * Math.PI * 2);
      y = 0.7 - 0.6 * t + 0.1 * Math.sin(t * Math.PI * 3);
      z = 0.1 * Math.sin(t * Math.PI * 4);
    } else if (name === 'Rory McIlroy') {
      // Rory's powerful, athletic swing
      x = 0.3 + 0.5 * Math.sin(t * Math.PI) + 0.05 * Math.sin(t * Math.PI * 2);
      y = 0.7 - 0.7 * t + 0.05 * Math.sin(t * Math.PI * 3);
      z = 0.05 * Math.sin(t * Math.PI * 4);
    } else if (name === 'Phil Mickelson') {
      // Phil's creative, flop shot style
      x = 0.3 + 0.3 * Math.sin(t * Math.PI) + 0.15 * Math.sin(t * Math.PI * 2);
      y = 0.7 - 0.5 * t + 0.15 * Math.sin(t * Math.PI * 3);
      z = 0.15 * Math.sin(t * Math.PI * 4);
    } else {
      // Generic pro swing
      x = 0.3 + 0.4 * Math.sin(t * Math.PI) + 0.1 * Math.sin(t * Math.PI * 2);
      y = 0.7 - 0.6 * t + 0.1 * Math.sin(t * Math.PI * 3);
      z = 0.1 * Math.sin(t * Math.PI * 4);
    }
    
    points.push({ x, y, z, timestamp, frame: i });
  }
  
  // Generate other body part trajectories
  const leftWrist = points.map(p => ({ ...p, x: p.x - 0.1, y: p.y + 0.05 }));
  const rightShoulder = points.map(p => ({ ...p, x: p.x - 0.2, y: p.y + 0.1 }));
  const leftShoulder = points.map(p => ({ ...p, x: p.x - 0.3, y: p.y + 0.1 }));
  const rightHip = points.map(p => ({ ...p, x: p.x - 0.15, y: p.y + 0.2 }));
  const leftHip = points.map(p => ({ ...p, x: p.x - 0.25, y: p.y + 0.2 }));
  const clubhead = points.map(p => ({ ...p, x: p.x + 0.1, y: p.y - 0.05 }));
  
  return {
    rightWrist: points,
    leftWrist,
    rightShoulder,
    leftShoulder,
    rightHip,
    leftHip,
    clubhead
  };
};

// Generate sample phases for pro swings
const generateProPhases = (name: string, club: string): SwingPhase[] => {
  const phases: SwingPhase[] = [
    {
      name: 'Setup',
      startFrame: 0,
      endFrame: 5,
      startTime: 0,
      endTime: 166.65,
      duration: 166.65,
      keyLandmarks: [],
      color: '#3B82F6',
      description: 'Initial position and posture'
    },
    {
      name: 'Backswing',
      startFrame: 5,
      endFrame: 35,
      startTime: 166.65,
      endTime: 1166.55,
      duration: 999.9,
      keyLandmarks: [],
      color: '#10B981',
      description: 'Takeaway to top of swing'
    },
    {
      name: 'Transition',
      startFrame: 35,
      endFrame: 45,
      startTime: 1166.55,
      endTime: 1499.85,
      duration: 333.3,
      keyLandmarks: [],
      color: '#F59E0B',
      description: 'Downswing to impact'
    },
    {
      name: 'Impact',
      startFrame: 45,
      endFrame: 47,
      startTime: 1499.85,
      endTime: 1566.51,
      duration: 66.66,
      keyLandmarks: [],
      color: '#EF4444',
      description: 'Ball contact moment'
    },
    {
      name: 'Follow-through',
      startFrame: 47,
      endFrame: 59,
      startTime: 1566.51,
      endTime: 1966.47,
      duration: 399.96,
      keyLandmarks: [],
      color: '#8B5CF6',
      description: 'Finish position'
    }
  ];
  
  return phases;
};

// Pro swing library
export const proSwingLibrary: ProSwing[] = [
  {
    id: 'tiger-woods-driver',
    name: 'Tiger Woods',
    club: 'driver',
    description: 'Tiger Woods\' signature driver swing with his famous inside-out path and powerful rotation.',
    videoUrl: '/videos/pro-swings/tiger-woods-driver.mp4',
    trajectory: generateProTrajectory('Tiger Woods', 'driver'),
    phases: generateProPhases('Tiger Woods', 'driver'),
    metrics: {
      tempoRatio: 3.2,
      swingPlane: 12.5,
      maxVelocity: 2.8,
      smoothness: 0.92
    },
    characteristics: [
      'Inside-out swing path',
      'Powerful hip rotation',
      'Late release',
      'Balanced finish'
    ],
    difficulty: 'advanced'
  },
  {
    id: 'rory-mcilroy-driver',
    name: 'Rory McIlroy',
    club: 'driver',
    description: 'Rory McIlroy\'s explosive driver swing with incredible clubhead speed and athleticism.',
    videoUrl: '/videos/pro-swings/rory-mcilroy-driver.mp4',
    trajectory: generateProTrajectory('Rory McIlroy', 'driver'),
    phases: generateProPhases('Rory McIlroy', 'driver'),
    metrics: {
      tempoRatio: 2.8,
      swingPlane: 8.3,
      maxVelocity: 3.2,
      smoothness: 0.88
    },
    characteristics: [
      'Explosive power',
      'Athletic movement',
      'Consistent tempo',
      'High clubhead speed'
    ],
    difficulty: 'advanced'
  },
  {
    id: 'phil-mickelson-wedge',
    name: 'Phil Mickelson',
    club: 'wedge',
    description: 'Phil Mickelson\'s creative wedge play with his signature flop shots and touch around the green.',
    videoUrl: '/videos/pro-swings/phil-mickelson-wedge.mp4',
    trajectory: generateProTrajectory('Phil Mickelson', 'wedge'),
    phases: generateProPhases('Phil Mickelson', 'wedge'),
    metrics: {
      tempoRatio: 2.5,
      swingPlane: 15.2,
      maxVelocity: 1.8,
      smoothness: 0.95
    },
    characteristics: [
      'Creative shot-making',
      'Soft hands',
      'Precise control',
      'Imagination'
    ],
    difficulty: 'intermediate'
  },
  {
    id: 'jordan-spieth-iron',
    name: 'Jordan Spieth',
    club: 'iron',
    description: 'Jordan Spieth\'s consistent iron play with his methodical approach and accuracy.',
    videoUrl: '/videos/pro-swings/jordan-spieth-iron.mp4',
    trajectory: generateProTrajectory('Jordan Spieth', 'iron'),
    phases: generateProPhases('Jordan Spieth', 'iron'),
    metrics: {
      tempoRatio: 3.0,
      swingPlane: 10.1,
      maxVelocity: 2.2,
      smoothness: 0.94
    },
    characteristics: [
      'Consistent tempo',
      'Accurate ball-striking',
      'Methodical approach',
      'Reliable technique'
    ],
    difficulty: 'intermediate'
  },
  {
    id: 'annika-sorenstam-driver',
    name: 'Annika Sorenstam',
    club: 'driver',
    description: 'Annika Sorenstam\'s powerful and technically sound driver swing that dominated women\'s golf.',
    videoUrl: '/videos/pro-swings/annika-sorenstam-driver.mp4',
    trajectory: generateProTrajectory('Annika Sorenstam', 'driver'),
    phases: generateProPhases('Annika Sorenstam', 'driver'),
    metrics: {
      tempoRatio: 2.9,
      swingPlane: 9.8,
      maxVelocity: 2.6,
      smoothness: 0.96
    },
    characteristics: [
      'Technically sound',
      'Consistent tempo',
      'Powerful rotation',
      'Precise timing'
    ],
    difficulty: 'intermediate'
  },
  {
    id: 'bubba-watson-driver',
    name: 'Bubba Watson',
    club: 'driver',
    description: 'Bubba Watson\'s unique self-taught swing with incredible power and creativity.',
    videoUrl: '/videos/pro-swings/bubba-watson-driver.mp4',
    trajectory: generateProTrajectory('Bubba Watson', 'driver'),
    phases: generateProPhases('Bubba Watson', 'driver'),
    metrics: {
      tempoRatio: 2.6,
      swingPlane: 18.5,
      maxVelocity: 3.1,
      smoothness: 0.85
    },
    characteristics: [
      'Self-taught technique',
      'Incredible power',
      'Creative shot-making',
      'Unique style'
    ],
    difficulty: 'advanced'
  },
  {
    id: 'lexi-thompson-iron',
    name: 'Lexi Thompson',
    club: 'iron',
    description: 'Lexi Thompson\'s powerful and athletic iron play with modern swing mechanics.',
    videoUrl: '/videos/pro-swings/lexi-thompson-iron.mp4',
    trajectory: generateProTrajectory('Lexi Thompson', 'iron'),
    phases: generateProPhases('Lexi Thompson', 'iron'),
    metrics: {
      tempoRatio: 2.7,
      swingPlane: 11.2,
      maxVelocity: 2.4,
      smoothness: 0.91
    },
    characteristics: [
      'Modern mechanics',
      'Athletic power',
      'Consistent ball-striking',
      'Strong finish'
    ],
    difficulty: 'intermediate'
  },
  {
    id: 'jason-day-putter',
    name: 'Jason Day',
    club: 'putter',
    description: 'Jason Day\'s smooth and consistent putting stroke with excellent tempo and feel.',
    videoUrl: '/videos/pro-swings/jason-day-putter.mp4',
    trajectory: generateProTrajectory('Jason Day', 'putter'),
    phases: generateProPhases('Jason Day', 'putter'),
    metrics: {
      tempoRatio: 2.0,
      swingPlane: 5.8,
      maxVelocity: 0.8,
      smoothness: 0.98
    },
    characteristics: [
      'Smooth tempo',
      'Consistent stroke',
      'Excellent feel',
      'Reliable putting'
    ],
    difficulty: 'beginner'
  }
];

// Helper functions
export const getProSwingsByClub = (club: string): ProSwing[] => {
  return proSwingLibrary.filter(swing => swing.club === club);
};

export const getProSwingsByDifficulty = (difficulty: 'beginner' | 'intermediate' | 'advanced'): ProSwing[] => {
  return proSwingLibrary.filter(swing => swing.difficulty === difficulty);
};

export const getProSwingById = (id: string): ProSwing | undefined => {
  return proSwingLibrary.find(swing => swing.id === id);
};

export const getRandomProSwing = (club?: string): ProSwing => {
  const filtered = club ? getProSwingsByClub(club) : proSwingLibrary;
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
};

export const searchProSwings = (query: string): ProSwing[] => {
  const lowercaseQuery = query.toLowerCase();
  return proSwingLibrary.filter(swing => 
    swing.name.toLowerCase().includes(lowercaseQuery) ||
    swing.club.toLowerCase().includes(lowercaseQuery) ||
    swing.description.toLowerCase().includes(lowercaseQuery) ||
    swing.characteristics.some(char => char.toLowerCase().includes(lowercaseQuery))
  );
};
