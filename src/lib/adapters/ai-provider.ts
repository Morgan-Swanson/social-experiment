import OpenAI from 'openai';

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  modelVersion?: string;
  temperature?: number;
}

export interface ClassificationResult {
  score: number;
  reasoning?: string;
  rawResponse: string;
}

export interface AIProvider {
  classify(text: string, prompt: string, constraints?: string, temperature?: number): Promise<ClassificationResult>;
  batchClassify(
    text: string,
    prompts: { id: string; prompt: string }[],
    constraints?: string,
    temperature?: number
  ): Promise<{ [id: string]: ClassificationResult }>;
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.model = config.model;
  }

  async classify(text: string, prompt: string, constraints?: string, temperature?: number): Promise<ClassificationResult> {
    const systemMessage = this.buildSystemMessage(constraints);
    const userMessage = this.buildUserMessage(text, prompt);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: temperature ?? 0.0,
    });

    const content = response.choices[0]?.message?.content || '';
    
    return this.parseResponse(content);
  }

  async batchClassify(
    text: string,
    prompts: { id: string; prompt: string }[],
    constraints?: string,
    temperature?: number
  ): Promise<{ [id: string]: ClassificationResult }> {
    const systemMessage = this.buildSystemMessage(constraints, true);
    const userMessage = this.buildBatchUserMessage(text, prompts);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: temperature ?? 0.0,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '';
    
    return this.parseBatchResponse(content, prompts);
  }

  private buildSystemMessage(constraints?: string, isBatch: boolean = false): string {
    let message = 'You are a text classifier for social science research.';
    
    // Add JSON output format requirements for batch classification (coupled with parsing logic)
    if (isBatch) {
      message += '\n\nYou must respond with a JSON object where each key is a task ID and each value is an object with "classification" (string label) and "confidence" (number 0.0-1.0) fields.';
    }
    
    if (constraints) {
      message += `\n\n${constraints}`;
    }
    
    return message;
  }

  private buildUserMessage(text: string, prompt: string): string {
    return `${prompt}\n\nText to classify:\n${text}`;
  }

  private buildBatchUserMessage(text: string, prompts: { id: string; prompt: string }[]): string {
    let message = 'Text to classify:\n' + text + '\n\n';
    message += 'Classification tasks:\n\n';
    
    prompts.forEach((p) => {
      message += `[${p.id}] ${p.prompt}\n\n`;
    });
    
    return message;
  }

  private parseResponse(content: string): ClassificationResult {
    const scoreMatch = content.match(/Score:\s*([\d.]+)/i);
    const reasoningMatch = content.match(/Reasoning:\s*(.+?)(?=\n|$)/is);
    
    return {
      score: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
      reasoning: reasoningMatch ? reasoningMatch[1].trim() : undefined,
      rawResponse: content,
    };
  }

  private parseBatchResponse(
    content: string,
    prompts: { id: string; prompt: string }[]
  ): { [id: string]: ClassificationResult } {
    const results: { [id: string]: ClassificationResult } = {};
    
    try {
      // Parse JSON response
      const jsonResponse = JSON.parse(content);
      
      // Extract results for each classifier
      prompts.forEach(({ id }) => {
        const result = jsonResponse[id];
        if (result && typeof result === 'object') {
          results[id] = {
            score: typeof result.confidence === 'number' ? result.confidence : parseFloat(result.confidence) || 0,
            reasoning: result.classification || 'Missing classification in response',
            rawResponse: JSON.stringify(result),
          };
        } else {
          results[id] = {
            score: 0,
            reasoning: 'Missing classification in response',
            rawResponse: content,
          };
        }
      });
    } catch (error) {
      // Avoid noisy logs during tests where invalid JSON is intentionally provided
      if (process.env.NODE_ENV !== 'test') {
        console.error('Failed to parse batch classification JSON:', error);
        console.error('Raw content:', content);
      }
      
      // Fallback: try to parse even if JSON parsing fails
      prompts.forEach(({ id }) => {
        results[id] = {
          score: 0,
          reasoning: 'Failed to parse classification - Invalid JSON response',
          rawResponse: content,
        };
      });
    }
    
    return results;
  }
}

// Factory function to create AI provider
export function createAIProvider(config: AIProviderConfig): AIProvider {
  // Currently only OpenAI, but designed to easily add more providers
  return new OpenAIProvider(config);
}
