import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted to create mocks that can be referenced in vi.mock
const { mockPrisma, mockGetServerSession } = vi.hoisted(() => ({
  mockPrisma: {
    classifier: {
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

describe('Classifiers API', () => {
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

  describe('GET /api/classifiers', () => {
    it('should return classifiers for authenticated user', async () => {
      const mockClassifiers = [
        { id: '1', name: 'Sentiment', prompt: 'Classify sentiment', userId: 'test-user-id' },
        { id: '2', name: 'Topic', prompt: 'Classify topic', userId: 'test-user-id' },
      ];
      mockPrisma.classifier.findMany.mockResolvedValue(mockClassifiers);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockClassifiers);
      expect(mockPrisma.classifier.findMany).toHaveBeenCalledWith({
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

    it('should return 401 when session has no user id', async () => {
      mockGetServerSession.mockResolvedValue({ user: { email: 'test@example.com' } });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/classifiers', () => {
    it('should create a classifier for authenticated user', async () => {
      const newClassifier = {
        id: '1',
        name: 'New Classifier',
        description: 'Test description',
        prompt: 'Test prompt',
        userId: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.classifier.create.mockResolvedValue(newClassifier);

      const request = new NextRequest('http://localhost/api/classifiers', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Classifier',
          description: 'Test description',
          prompt: 'Test prompt',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(expect.objectContaining({
        id: '1',
        name: 'New Classifier',
      }));
      expect(mockPrisma.classifier.create).toHaveBeenCalledWith({
        data: {
          userId: 'test-user-id',
          name: 'New Classifier',
          description: 'Test description',
          prompt: 'Test prompt',
        },
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/classifiers', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', prompt: 'Test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when name is missing', async () => {
      const request = new NextRequest('http://localhost/api/classifiers', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'Test prompt' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name and prompt are required');
    });

    it('should return 400 when prompt is missing', async () => {
      const request = new NextRequest('http://localhost/api/classifiers', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test name' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name and prompt are required');
    });

    it('should return 500 when database error occurs', async () => {
      mockPrisma.classifier.create.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/classifiers', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', prompt: 'Test prompt' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Creation failed');
    });
  });
});