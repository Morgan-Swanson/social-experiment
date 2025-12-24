import { vi } from 'vitest';

const isBrowser =
  typeof window !== 'undefined' && typeof document !== 'undefined';

let React: any = null;

if (isBrowser) {
  const reactModule = await import('react');
  React = reactModule.default ?? reactModule;

  await import('@testing-library/jest-dom');
  (globalThis as any).React = React;
}

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

vi.mock('next/link', () => {
  if (React) {
    return {
      default: ({ children, href, ...props }: any) =>
        React.createElement('a', { href, ...props }, children),
    };
  }

  return {
    default: ({ children, href, ...props }: any) => ({
      type: 'a',
      props: { href, ...props, children },
    }),
  };
});

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