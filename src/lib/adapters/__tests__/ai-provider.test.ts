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

  describe('classify', () => {
    it('should parse valid score and reasoning response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Score: 0.85\nReasoning: This text has a positive sentiment.',
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      const result = await provider.classify('Test text', 'Classify sentiment');

      expect(result.score).toBe(0.85);
      expect(result.reasoning).toBe('This text has a positive sentiment.');
      expect(result.rawResponse).toBe('Score: 0.85\nReasoning: This text has a positive sentiment.');
    });

    it('should handle response without score', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'This is positive text.',
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      const result = await provider.classify('Test text', 'Classify sentiment');

      expect(result.score).toBe(0);
      expect(result.reasoning).toBeUndefined();
    });

    it('should handle response without reasoning', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Score: 0.9',
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      const result = await provider.classify('Test text', 'Classify sentiment');

      expect(result.score).toBe(0.9);
      expect(result.reasoning).toBeUndefined();
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '',
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      const result = await provider.classify('Test text', 'Classify sentiment');

      expect(result.score).toBe(0);
      expect(result.rawResponse).toBe('');
    });

    it('should handle null message content', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: null,
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      const result = await provider.classify('Test text', 'Classify sentiment');

      expect(result.score).toBe(0);
      expect(result.rawResponse).toBe('');
    });

    it('should pass constraints to system message', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Score: 0.5\nReasoning: Neutral.',
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      await provider.classify('Test text', 'Classify sentiment', 'Be conservative in scoring');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Be conservative in scoring'),
            }),
          ]),
        })
      );
    });

    it('should use default temperature of 0.0 when not provided', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Score: 0.5\nReasoning: Test.',
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      await provider.classify('Test text', 'Classify sentiment');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.0,
        })
      );
    });

    it('should use provided temperature value', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Score: 0.5\nReasoning: Test.',
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      await provider.classify('Test text', 'Classify sentiment', undefined, 0.7);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7,
        })
      );
    });
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

    it('should handle string confidence values', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              'classifier-1': { classification: 'positive', confidence: '0.75' },
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      const results = await provider.batchClassify(
        'Test text',
        [{ id: 'classifier-1', prompt: 'Classify sentiment' }]
      );

      expect(results['classifier-1'].score).toBe(0.75);
    });

    it('should handle invalid confidence values', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              'classifier-1': { classification: 'positive', confidence: 'not-a-number' },
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      const results = await provider.batchClassify(
        'Test text',
        [{ id: 'classifier-1', prompt: 'Classify sentiment' }]
      );

      expect(results['classifier-1'].score).toBe(0);
    });

    it('should pass constraints to system message in batch', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              'classifier-1': { classification: 'neutral', confidence: 0.5 },
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      await provider.batchClassify(
        'Test text',
        [{ id: 'classifier-1', prompt: 'Classify sentiment' }],
        'Always be neutral'
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Always be neutral'),
            }),
          ]),
        })
      );
    });

    it('should use default temperature in batch when not provided', async () => {
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
      await provider.batchClassify(
        'Test text',
        [{ id: 'classifier-1', prompt: 'Classify sentiment' }]
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.0,
        })
      );
    });

    it('should use provided temperature in batch', async () => {
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
      await provider.batchClassify(
        'Test text',
        [{ id: 'classifier-1', prompt: 'Classify sentiment' }],
        undefined,
        1.2
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 1.2,
        })
      );
    });

    it('should handle empty choices array', async () => {
      const mockResponse = {
        choices: [],
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

    it('should handle non-object classifier result', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              'classifier-1': 'just a string',
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const provider = createAIProvider(mockConfig);
      const results = await provider.batchClassify(
        'Test text',
        [{ id: 'classifier-1', prompt: 'Classify sentiment' }]
      );

      expect(results['classifier-1'].score).toBe(0);
      expect(results['classifier-1'].reasoning).toBe('Missing classification in response');
    });
  });
});