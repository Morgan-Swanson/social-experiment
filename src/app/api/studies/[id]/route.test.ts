import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE, GET } from './route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    study: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('DELETE /api/studies/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = new Request('http://localhost/api/studies/123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 if study not found', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: 'user-123' },
    } as any);
    vi.mocked(prisma.study.findUnique).mockResolvedValueOnce(null);

    const request = new Request('http://localhost/api/studies/123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Study not found');
  });

  it('returns 403 if study belongs to different user', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: 'user-123' },
    } as any);
    vi.mocked(prisma.study.findUnique).mockResolvedValueOnce({
      userId: 'different-user-id',
    } as any);

    const request = new Request('http://localhost/api/studies/123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('successfully deletes study', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: 'user-123' },
    } as any);
    vi.mocked(prisma.study.findUnique).mockResolvedValueOnce({
      userId: 'user-123',
    } as any);
    vi.mocked(prisma.study.delete).mockResolvedValueOnce({} as any);

    const request = new Request('http://localhost/api/studies/123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.study.delete).toHaveBeenCalledWith({
      where: { id: '123' },
    });
  });
});

describe('GET /api/studies/[id]', () => {
  it('returns study with related data', async () => {
    const mockStudy = {
      id: 'study-123',
      userId: 'user-123',
      name: 'Test Study',
      dataset: { id: 'dataset-1', name: 'Test Dataset' },
      classifiers: [],
    };

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: 'user-123' },
    } as any);
    vi.mocked(prisma.study.findUnique).mockResolvedValueOnce(mockStudy as any);

    const request = new Request('http://localhost/api/studies/study-123');
    const response = await GET(request, { params: { id: 'study-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('study-123');
    expect(data.name).toBe('Test Study');
  });
});