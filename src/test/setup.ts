import { vi } from 'vitest';
import React from 'react';

// Only setup jsdom-related mocks if in browser environment
const isBrowser =
  typeof window !== 'undefined' && typeof document !== 'undefined';

if (isBrowser) {
  // Make React available globally for JSX transform in jsdom
  (globalThis as any).React = React;
  
  // Import jest-dom matchers
  import('@testing-library/jest-dom').catch(() => {
    // Ignore if not available
  });
}

// Mock Next.js navigation (works in both node and jsdom environments)
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({})),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) =>
    React.createElement('a', { href, ...props }, children),
}));