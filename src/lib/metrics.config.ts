export interface MetricsConfig {
  swingPlane: {
    steepThreshold: number; // degrees
    flatThreshold: number; // degrees
  };
  tempo: {
    slowThreshold: number; // ratio
    fastThreshold: number; // ratio
  };
  rotation: {
    hipMinRotation: number; // degrees
    shoulderMinRotation: number; // degrees
  };
  impact: {
    accelerationThreshold: number; // arbitrary units
    minDistanceToBall: number; // pixels
  };
}

export const defaultMetricsConfig: MetricsConfig = {
  swingPlane: {
    steepThreshold: 15, // degrees - steeper than this is "over the top"
    flatThreshold: -5, // degrees - flatter than this is "too flat"
  },
  tempo: {
    slowThreshold: 3.0, // ratio - backswing/downswing time
    fastThreshold: 1.5, // ratio - backswing/downswing time
  },
  rotation: {
    hipMinRotation: 30, // degrees - minimum hip rotation
    shoulderMinRotation: 45, // degrees - minimum shoulder rotation
  },
  impact: {
    accelerationThreshold: 0.8, // arbitrary units
    minDistanceToBall: 50, // pixels
  },
};

export const feedbackMessages = {
  swingPlane: {
    steep: "Over the top",
    flat: "Too flat",
    good: "Good plane"
  },
  tempo: {
    slow: "Slow tempo",
    fast: "Rush tempo", 
    good: "Good tempo"
  },
  rotation: {
    hip: "Rotate hips",
    shoulder: "Turn shoulders",
    good: "Good rotation"
  },
  impact: {
    early: "Early release",
    late: "Hold angle",
    good: "Good impact"
  }
};
