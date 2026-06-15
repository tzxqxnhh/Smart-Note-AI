/**
 * LLM 客户端抽象层
 * 支持 Ollama（本地）和 Anthropic（可选）两个 provider
 */

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  generate(prompt: string, options?: GenerateOptions): AsyncIterable<string>;
}

/**
 * Ollama 客户端
 * 连接 localhost:11434
 */
export class OllamaClient implements LLMProvider {
  async *generate(prompt: string, options?: GenerateOptions): AsyncIterable<string> {
    // TODO: Phase 8 实现
    // 使用 fetch POST http://localhost:11434/api/generate
    // 流式读取 NDJSON 响应
    throw new Error('Ollama 客户端未初始化');
  }
}

/**
 * Anthropic 客户端（可选）
 * 使用 Anthropic API SDK
 */
export class AnthropicClient implements LLMProvider {
  async *generate(prompt: string, options?: GenerateOptions): AsyncIterable<string> {
    // TODO: Phase 8 实现（可选）
    // 使用 @anthropic-ai/sdk 流式生成
    throw new Error('Anthropic 客户端未配置');
  }
}

// 默认使用 Ollama
export const llmClient: LLMProvider = new OllamaClient();
