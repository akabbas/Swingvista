/**
 * Defensive Programming Utilities
 * 
 * Provides safe accessors and fallbacks to prevent crashes from undefined/null values
 */

/**
 * Safe array access with fallback
 */
export function safeArrayAccess<T>(array: T[] | undefined | null, fallback: T[] = []): T[] {
  return Array.isArray(array) ? array : fallback;
}

/**
 * Safe property access with fallback
 */
export function safePropertyAccess<T>(obj: any, path: string, fallback: T): T {
  try {
    if (!obj || typeof obj !== 'object') return fallback;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current == null || typeof current !== 'object' || !(key in current)) {
        return fallback;
      }
      current = current[key];
    }
    
    return current ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safe number access with fallback
 */
export function safeNumber(value: any, fallback: number = 0): number {
  const num = Number(value);
  return !isNaN(num) && isFinite(num) ? num : fallback;
}

/**
 * Safe string access with fallback
 */
export function safeString(value: any, fallback: string = ''): string {
  return (typeof value === 'string') ? value : String(value || fallback);
}

/**
 * Safe object access with fallback
 */
export function safeObject<T extends object>(value: any, fallback: T): T {
  return (value && typeof value === 'object' && !Array.isArray(value)) ? value : fallback;
}

/**
 * Safe function execution with error handling
 */
export function safeFunctionCall<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (error) {
    console.warn('Safe function call failed:', error);
    return fallback;
  }
}

/**
 * Safe async function execution with error handling
 */
export async function safeAsyncFunctionCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.warn('Safe async function call failed:', error);
    return fallback;
  }
}

/**
 * Clean class names to remove browser extension interference
 */
export function cleanClassName(className: string | undefined): string {
  if (!className) return '';
  
  // Remove browser extension generated classes (js-parse-*, extension-*, etc.)
  return className
    .replace(/js-parse-[a-zA-Z0-9-_]+/g, '')
    .replace(/extension-[a-zA-Z0-9-_]+/g, '')
    .replace(/chrome-[a-zA-Z0-9-_]+/g, '')
    .replace(/firefox-[a-zA-Z0-9-_]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate stable component key to prevent hydration mismatches
 */
export function generateStableKey(prefix: string, ...identifiers: (string | number)[]): string {
  return `${prefix}-${identifiers.join('-')}`;
}

/**
 * Validate and sanitize video element attributes
 */
export function sanitizeVideoAttributes(attrs: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  const allowedAttributes = [
    'src', 'controls', 'autoplay', 'loop', 'muted', 'preload',
    'width', 'height', 'className', 'style', 'onLoadedMetadata',
    'onError', 'onCanPlay', 'onTimeUpdate'
  ];
  
  for (const [key, value] of Object.entries(attrs)) {
    if (allowedAttributes.includes(key)) {
      if (key === 'className') {
        sanitized[key] = cleanClassName(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

/**
 * Create timeout wrapper for async operations
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string = 'Operation timed out'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    })
  ]);
}

/**
 * Retry wrapper for unreliable operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
    }
  }
  
  throw lastError!;
}

/**
 * Create abort controller with timeout
 */
export function createTimeoutController(timeoutMs: number): { controller: AbortController; timeoutId: NodeJS.Timeout } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  return { controller, timeoutId };
}

/**
 * Safe DOM element access
 */
export function safeGetElement<T extends HTMLElement>(selector: string): T | null {
  try {
    return document.querySelector<T>(selector);
  } catch {
    return null;
  }
}

/**
 * Safe local storage access
 */
export function safeLocalStorage(key: string, fallback: string = ''): string {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safe JSON parsing
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Validate pose data structure
 */
export function validatePoseData(poses: any[]): boolean {
  if (!Array.isArray(poses)) return false;
  
  // Check if poses have the expected structure
  return poses.every(pose => 
    pose &&
    typeof pose === 'object' &&
    Array.isArray(pose.landmarks) &&
    pose.landmarks.length >= 33 &&
    pose.landmarks.every((landmark: any) => 
      landmark &&
      typeof landmark.x === 'number' &&
      typeof landmark.y === 'number'
    )
  );
}

/**
 * Validate club path data structure
 */
export function validateClubPathData(clubPath: any[]): boolean {
  if (!Array.isArray(clubPath)) return false;
  
  return clubPath.every(point =>
    point &&
    typeof point === 'object' &&
    typeof point.x === 'number' &&
    typeof point.y === 'number' &&
    typeof point.frame === 'number'
  );
}

/**
 * Create error boundary wrapper
 */
export function createErrorBoundary<T>(
  operation: () => T,
  errorHandler: (error: Error) => T,
  context: string = 'Unknown operation'
): T {
  try {
    return operation();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`Error in ${context}:`, err);
    return errorHandler(err);
  }
}

/**
 * Safe promise execution with fallback
 */
export async function safePromise<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs: number = 10000
): Promise<T> {
  try {
    return await withTimeout(promise, timeoutMs);
  } catch (error) {
    console.warn('Promise failed, using fallback:', error);
    return fallback;
  }
}
