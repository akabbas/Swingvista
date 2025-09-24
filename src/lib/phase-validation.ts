/**
 * Phase Validation and Debugging Tools
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
}

/**
 * Validate weight distribution calculation
 */
export function validateWeightDistribution(left: number, right: number): { isValid: boolean; error?: string } {
  const total = left + right;
  const isValid = Math.abs(total - 100) < 0.1; // Allow small floating point errors
  const error = isValid ? undefined : `Weight distribution sums to ${total}% instead of 100%`;
  
  return { isValid, error };
}

/**
 * Validate phase sequence
 */
export function validatePhaseSequence(phases: string[]): { isValid: boolean; error?: string } {
  if (phases.length < 2) return { isValid: true };

  const expectedSequence = ['address', 'backswing', 'top', 'downswing', 'impact', 'follow-through'];
  let currentIndex = 0;
  let valid = true;

  for (const phase of phases) {
    if (phase === expectedSequence[currentIndex]) {
      continue;
    } else if (currentIndex > 0 && phase === expectedSequence[currentIndex - 1]) {
      continue;
    } else if (currentIndex < expectedSequence.length - 1 && phase === expectedSequence[currentIndex + 1]) {
      currentIndex++;
    } else {
      valid = false;
      break;
    }
  }

  const error = valid ? undefined : `Invalid phase sequence: ${phases.join(' → ')}`;
  return { isValid: valid, error };
}

/**
 * Display current phase information
 */
export function displayCurrentPhase(phase: string, weightDistribution: { left: number; right: number; total: number }, clubPosition: { x: number; y: number }): string {
  return `
    🏌️‍♂️ Current Phase: ${phase.toUpperCase()}
    ⚖️  Weight: ${weightDistribution.left}% Left / ${weightDistribution.right}% Right
    📍 Club Position: X=${clubPosition.x.toFixed(2)}, Y=${clubPosition.y.toFixed(2)}
    📊 Total: ${weightDistribution.total}% (Should be 100%)
  `;
}

/**
 * Log phase transition
 */
export function logPhaseTransition(from: string, to: string, time: number, weightDistribution: { left: number; right: number }): void {
  console.log('🔄 Phase Transition detected:',
    `From: ${from}`,
    `To: ${to}`,
    `Time: ${time}ms`,
    `Weight Distribution: L:${weightDistribution.left}% R:${weightDistribution.right}%`
  );
}





