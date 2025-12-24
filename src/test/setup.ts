import { vi } from 'vitest';

if (typeof window !== 'undefined') {
  const React = await import('react');
  await import('@testing-library/jest-dom');

  // Make React available globally for JSX
  (globalThis as any).React = React;

  // Mock next/navigation for client components
  vi.mock('next/navigation', () => ({
    ...React,
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

  // Mock next/link to behave like a standard anchor during tests
  vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) => {
      return React.createElement('a', { href, ...props }, children);
    },
  }));
} else {
  // Lightweight mocks for server-side / Node test environments
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

  vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) => ({
      type: 'a',
      props: { href, ...props, children },
    }),
  }));
}

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});