/**
 * DeepSeek LLM 客户端
 * 通过 OpenAI 兼容接口调用 DeepSeek API（deepseek-chat / deepseek-reasoner）
 * API Key 通过环境变量 DEEPSEEK_API_KEY 获取
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  /** 非流式对话 */
  chat(messages: ChatMessage[], options?: GenerateOptions): Promise<string>;
  /** 流式对话，逐 token yield */
  chatStream(messages: ChatMessage[], options?: GenerateOptions): AsyncIterable<string>;
}

/**
 * DeepSeek 客户端
 * API 地址 https://api.deepseek.com/v1/chat/completions（OpenAI 兼容接口）
 */
export class DeepSeekClient implements LLMProvider {
  private baseUrl = 'https://api.deepseek.com';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
  }

  /** 检查 API Key 是否已配置 */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /** 非流式对话 */
  async chat(
    messages: ChatMessage[],
    options?: GenerateOptions,
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model ?? process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
        messages,
        stream: false,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 4096,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`DeepSeek API 返回错误 ${response.status}: ${errorText}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0].message.content;
  }

  /** 流式对话，逐 token yield */
  async *chatStream(
    messages: ChatMessage[],
    options?: GenerateOptions,
  ): AsyncIterable<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model ?? process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
        messages,
        stream: true,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 4096,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`DeepSeek API 返回错误 ${response.status}: ${errorText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) yield content;
            } catch {
              // 跳过无法解析的行（如空行）
            }
          }
        }
      }
    } finally {
      // 确保 reader 被释放
      reader.releaseLock();
    }
  }
}

// 单例导出
export const deepseekClient = new DeepSeekClient();
