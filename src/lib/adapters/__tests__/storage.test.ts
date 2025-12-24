import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3StorageAdapter, createStorageAdapter } from '../storage';

// Mock the AWS SDK modules
vi.mock('@aws-sdk/client-s3', () => {
  const mockSend = vi.fn();
  return {
    S3Client: vi.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    PutObjectCommand: vi.fn().mockImplementation((params) => ({ ...params, _type: 'PutObject' })),
    GetObjectCommand: vi.fn().mockImplementation((params) => ({ ...params, _type: 'GetObject' })),
    DeleteObjectCommand: vi.fn().mockImplementation((params) => ({ ...params, _type: 'DeleteObject' })),
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://signed-url.example.com/file'),
}));

describe('S3StorageAdapter', () => {
  const mockConfig = {
    endpoint: 'http://localhost:9000',
    region: 'us-east-1',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
    bucket: 'test-bucket',
    forcePathStyle: true,
  };

  let adapter: S3StorageAdapter;
  let mockSend: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked S3Client and its send method
    const { S3Client } = await import('@aws-sdk/client-s3');
    adapter = new S3StorageAdapter(mockConfig);
    
    // Access the mock send function from the created instance
    const MockedS3Client = vi.mocked(S3Client);
    const instance = new MockedS3Client({});
    mockSend = instance.send;
  });

  describe('uploadFile', () => {
    it('should upload a file and return the key', async () => {
      mockSend.mockResolvedValueOnce({});

      const key = 'test-file.csv';
      const file = Buffer.from('test content');
      const contentType = 'text/csv';

      const result = await adapter.uploadFile(key, file, contentType);

      expect(result).toBe(key);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw error when upload fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('Upload failed'));

      const key = 'test-file.csv';
      const file = Buffer.from('test content');

      await expect(adapter.uploadFile(key, file, 'text/csv')).rejects.toThrow('Upload failed');
    });
  });

  describe('getFile', () => {
    it('should retrieve a file as Buffer', async () => {
      const testContent = 'file content here';
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from(testContent);
        },
      };

      mockSend.mockResolvedValueOnce({ Body: mockStream });

      const result = await adapter.getFile('test-file.csv');

      expect(result.toString()).toBe(testContent);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple chunks', async () => {
      const chunk1 = 'first chunk';
      const chunk2 = 'second chunk';
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from(chunk1);
          yield Buffer.from(chunk2);
        },
      };

      mockSend.mockResolvedValueOnce({ Body: mockStream });

      const result = await adapter.getFile('test-file.csv');

      expect(result.toString()).toBe(chunk1 + chunk2);
    });

    it('should throw error when file not found', async () => {
      mockSend.mockRejectedValueOnce(new Error('NoSuchKey'));

      await expect(adapter.getFile('nonexistent.csv')).rejects.toThrow('NoSuchKey');
    });
  });

  describe('getSignedUrl', () => {
    it('should return a signed URL with default expiration', async () => {
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      
      const result = await adapter.getSignedUrl('test-file.csv');

      expect(result).toBe('https://signed-url.example.com/file');
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 3600 }
      );
    });

    it('should accept custom expiration time', async () => {
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      
      await adapter.getSignedUrl('test-file.csv', 7200);

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 7200 }
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete a file successfully', async () => {
      mockSend.mockResolvedValueOnce({});

      await expect(adapter.deleteFile('test-file.csv')).resolves.toBeUndefined();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw error when delete fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(adapter.deleteFile('test-file.csv')).rejects.toThrow('Delete failed');
    });
  });
});

describe('createStorageAdapter', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create an S3StorageAdapter with minio config', () => {
    process.env.STORAGE_PROVIDER = 'minio';
    process.env.STORAGE_ENDPOINT = 'http://localhost:9000';
    process.env.STORAGE_ACCESS_KEY = 'minioadmin';
    process.env.STORAGE_SECRET_KEY = 'minioadmin';
    process.env.STORAGE_BUCKET = 'test-bucket';

    const adapter = createStorageAdapter();

    expect(adapter).toBeInstanceOf(S3StorageAdapter);
  });

  it('should create an S3StorageAdapter with default values', () => {
    process.env.STORAGE_PROVIDER = undefined;
    process.env.STORAGE_ENDPOINT = undefined;
    process.env.STORAGE_ACCESS_KEY = undefined;
    process.env.STORAGE_SECRET_KEY = undefined;
    process.env.STORAGE_BUCKET = undefined;

    const adapter = createStorageAdapter();

    expect(adapter).toBeInstanceOf(S3StorageAdapter);
  });
});