import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted to create mocks that can be referenced in vi.mock
const { mockPrisma, mockGetServerSession } = vi.hoisted(() => ({
  mockPrisma: {
    modelConstraint: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
  mockGetServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock('../../auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

// Import after mocks are set up
import { GET, POST } from '../route';

describe('Constraints API', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(mockSession);
  });

  describe('GET /api/constraints', () => {
    it('should return constraints for authenticated user', async () => {
      const mockConstraints = [
        { id: '1', name: 'Conservative', rules: 'Be conservative', userId: 'test-user-id' },
        { id: '2', name: 'Strict', rules: 'Be strict', userId: 'test-user-id' },
      ];
      mockPrisma.modelConstraint.findMany.mockResolvedValue(mockConstraints);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockConstraints);
      expect(mockPrisma.modelConstraint.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/constraints', () => {
    it('should create a constraint for authenticated user', async () => {
      const newConstraint = {
        id: '1',
        name: 'New Constraint',
        description: 'Test description',
        rules: 'Test rules',
        userId: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.modelConstraint.create.mockResolvedValue(newConstraint);

      const request = new NextRequest('http://localhost/api/constraints', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Constraint',
          description: 'Test description',
          rules: 'Test rules',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(expect.objectContaining({
        id: '1',
        name: 'New Constraint',
      }));
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/constraints', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', rules: 'Test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when name is missing', async () => {
      const request = new NextRequest('http://localhost/api/constraints', {
        method: 'POST',
        body: JSON.stringify({ rules: 'Test rules' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name and rules are required');
    });

    it('should return 400 when rules is missing', async () => {
      const request = new NextRequest('http://localhost/api/constraints', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test name' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name and rules are required');
    });

    it('should return 500 when database error occurs', async () => {
      mockPrisma.modelConstraint.create.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/constraints', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', rules: 'Test rules' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Creation failed');
    });
  });
});