/**
 * 文本嵌入模型封装
 * 通过 SiliconFlow API 调用 Qwen/Qwen3-Embedding-8B 模型
 * API Key 通过环境变量 SILICONFLOW_API_KEY 获取
 */
export class Embedder {
  private initialized = false;
  private apiKey = '';
  private baseUrl = 'https://api.siliconflow.cn';

  /**
   * 构建通用请求头
   */
  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /**
   * 初始化：验证 API Key 和连接可用
   */
  async initialize(): Promise<void> {
    // 在 initialize 时读取环境变量（而非构造函数），确保 .env 文件已加载
    this.apiKey = process.env.SILICONFLOW_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('SILICONFLOW_API_KEY 环境变量未设置');
    }

    // 用一次轻量嵌入调用来验证 API Key 和连接
    try {
      const testResponse = await fetch(`${this.baseUrl}/v1/embeddings`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          input: ['test'],
          model: 'Qwen/Qwen3-Embedding-8B',
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!testResponse.ok) {
        const errorText = await testResponse.text().catch(() => '');
        throw new Error(`无法连接到硅基流动 API: ${testResponse.status} ${errorText}`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('硅基流动')) {
        throw err;
      }
      throw new Error('无法连接到硅基流动 API');
    }

    this.initialized = true;
  }

  /**
   * 批量生成文本嵌入
   * @param texts 文本数组，每批最多 32 条
   * @returns 嵌入向量数组
   */
  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    if (!this.initialized) {
      await this.initialize();
    }

    const batchSize = 32;
    const allEmbeddings: number[][] = new Array(texts.length);

    for (let batchStart = 0; batchStart < texts.length; batchStart += batchSize) {
      const batch = texts.slice(batchStart, batchStart + batchSize);

      let lastError: Error | null = null;
      // 最多重试 2 次
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
              input: batch,
              model: 'Qwen/Qwen3-Embedding-8B',
            }),
            signal: AbortSignal.timeout(60000),
          });

          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`嵌入 API 返回错误 ${response.status}: ${errorText}`);
          }

          const result = await response.json() as {
            data: Array<{ embedding: number[]; index: number }>;
          };

          // 按 index 排序后放入结果数组
          for (const item of result.data) {
            allEmbeddings[batchStart + item.index] = item.embedding;
          }

          lastError = null;
          break;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (attempt === 1) {
            throw lastError;
          }
          // 第一次失败后等待一下再重试
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (lastError) {
        throw lastError;
      }
    }

    return allEmbeddings;
  }

  /**
   * 生成单个查询文本的嵌入
   */
  async embedQuery(text: string): Promise<number[]> {
    const results = await this.embed([text]);
    return results[0];
  }

  /**
   * 是否已初始化
   */
  isReady(): boolean {
    return this.initialized;
  }
}

// 单例导出
export const embedder = new Embedder();
