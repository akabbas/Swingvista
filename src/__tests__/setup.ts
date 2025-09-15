// Test setup file for Vitest
import { vi } from 'vitest';

// Mock Web Worker environment
Object.defineProperty(global, 'self', {
  value: {
    onmessage: null,
    postMessage: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
});

// Mock DOM methods for export tests
const mockLink = {
  href: '',
  download: '',
  click: vi.fn(),
};

// Ensure document is available globally
if (typeof document === 'undefined') {
  Object.defineProperty(global, 'document', {
    value: {
      createElement: vi.fn((tagName) => {
        if (tagName === 'a') {
          return mockLink;
        }
        return {};
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    },
    writable: true,
  });
}

// Ensure URL is available globally
if (typeof URL === 'undefined') {
  Object.defineProperty(global, 'URL', {
    value: {
      createObjectURL: vi.fn(() => 'mock-url'),
      revokeObjectURL: vi.fn(),
    },
    writable: true,
  });
}

// Make mockLink available globally for tests
(global as any).mockLink = mockLink;
