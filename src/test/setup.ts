import { vi } from 'vitest';

// Check if we're in jsdom environment
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

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

// Only load React and jsdom dependencies if actually in jsdom
if (isBrowser) {
  // Synchronously import React for jsdom environment
  const React = require('react');
  
  // Make React available globally for JSX transform
  (globalThis as any).React = React;
  
  // Load jest-dom matchers synchronously
  require('@testing-library/jest-dom');
  
  // Mock Next.js Link with React - must be done after React is loaded
  vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) =>
      React.createElement('a', { href, ...props }, children),
  }));
} else {
  // Mock for non-jsdom environment without React dependency
  vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) => ({
      type: 'a',
      props: { href, ...props, children },
    }),
  }));
}