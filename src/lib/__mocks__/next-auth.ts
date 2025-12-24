import { vi } from 'vitest';

// Default mock session
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Mock getServerSession
export const mockGetServerSession = vi.fn().mockResolvedValue(mockSession);

// Helper to set authenticated state
export function setAuthenticated(authenticated: boolean = true) {
  if (authenticated) {
    mockGetServerSession.mockResolvedValue(mockSession);
  } else {
    mockGetServerSession.mockResolvedValue(null);
  }
}

// Helper to set custom session
export function setSession(session: typeof mockSession | null) {
  mockGetServerSession.mockResolvedValue(session);
}

// Reset mocks
export function resetAuthMocks() {
  mockGetServerSession.mockReset();
  mockGetServerSession.mockResolvedValue(mockSession);
}

// Mock next-auth module
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: mockGetServerSession,
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: mockSession,
    status: 'authenticated',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));