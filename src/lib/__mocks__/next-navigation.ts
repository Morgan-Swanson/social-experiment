import { vi } from 'vitest';

// Mock pathname
let mockPathname = '/dashboard';

export const usePathname = vi.fn(() => mockPathname);
export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
}));
export const useSearchParams = vi.fn(() => new URLSearchParams());
export const useParams = vi.fn(() => ({}));

// Helper to set pathname
export function setPathname(pathname: string) {
  mockPathname = pathname;
  usePathname.mockReturnValue(pathname);
}

// Reset mocks
export function resetNavigationMocks() {
  mockPathname = '/dashboard';
  usePathname.mockReset();
  usePathname.mockReturnValue(mockPathname);
  useRouter.mockReset();
  useRouter.mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  });
}

// Mock next/navigation module
vi.mock('next/navigation', () => ({
  usePathname,
  useRouter,
  useSearchParams,
  useParams,
  redirect: vi.fn(),
  notFound: vi.fn(),
}));