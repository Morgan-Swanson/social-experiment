import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAIProvider } from '../ai-provider';
import OpenAI from 'openai';

// Mock the entire OpenAI module
vi.mock('openai', () => {
  const mockCreate = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

describe('AI Provider', () => {
  const mockConfig = {
    apiKey: 'test-key',
    model: 'gpt-4o',
  };

  let mockCreate: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Get the mock create function
    const MockedOpenAI = vi.mocked(OpenAI);
    const instance = new MockedOpenAI({ apiKey: 'test' });
    mockCreate = instance.chat.completions.create;
  });

  describe('batchClassify', () => {
    it('should parse valid JSON responses correctly', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              'classifier-1': { classification: 'positive', confidence: 0.9 },
              'classifier-2': { classification: 'economy', confidence: 0.85 },
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      const results = await provider.batchClassify(
        'Test text',
        [
          { id: 'classifier-1', prompt: 'Classify sentiment' },
          { id: 'classifier-2', prompt: 'Classify topic' },
        ]
      );

      expect(results['classifier-1'].score).toBe(0.9);
      expect(results['classifier-1'].reasoning).toBe('positive');
      expect(results['classifier-2'].score).toBe(0.85);
      expect(results['classifier-2'].reasoning).toBe('economy');
    });

    it('should handle missing classifiers in response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              'classifier-1': { classification: 'positive', confidence: 0.9 },
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      const results = await provider.batchClassify(
        'Test text',
        [
          { id: 'classifier-1', prompt: 'Classify sentiment' },
          { id: 'classifier-2', prompt: 'Classify topic' },
        ]
      );

      expect(results['classifier-1'].score).toBe(0.9);
      expect(results['classifier-2'].score).toBe(0);
      expect(results['classifier-2'].reasoning).toBe('Missing classification in response');
    });

    it('should handle invalid JSON gracefully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'invalid json',
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      const results = await provider.batchClassify(
        'Test text',
        [{ id: 'classifier-1', prompt: 'Test' }]
      );

      expect(results['classifier-1'].score).toBe(0);
      expect(results['classifier-1'].reasoning).toContain('Failed to parse');
    });
  });
});