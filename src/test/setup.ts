import { vi } from 'vitest';

// Mock Next.js navigation for all test environments
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

// Simple Next.js Link mock for non-component tests
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => ({
    type: 'a',
    props: { href, ...props, children },
  }),
}));