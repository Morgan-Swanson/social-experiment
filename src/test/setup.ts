import { vi } from 'vitest';

// Conditionally setup jsdom only if we're actually in a jsdom environment
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

// Only load React and jsdom-specific code when in jsdom environment
if (isBrowser) {
  // Async setup for jsdom environment
  (async () => {
    const React = await import('react');
    
    // Make React available globally for JSX transform
    (globalThis as any).React = React.default || React;
    
    // Load jest-dom matchers
    await import('@testing-library/jest-dom');
    
    // Mock Next.js Link with React
    vi.mock('next/link', () => ({
      default: ({ children, href, ...props }: any) =>
        (React.default || React).createElement('a', { href, ...props }, children),
    }));
  })();
} else {
  // Simple mock for non-jsdom environment
  vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) => ({
      type: 'a',
      props: { href, ...props, children },
    }),
  }));
}