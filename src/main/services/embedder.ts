/**
 * 文本嵌入模型封装
 * 使用 Transformers.js 加载 all-MiniLM-L6-v2 模型
 * 生成 384 维向量
 */
export class Embedder {
  private initialized = false;

  /**
   * 初始化模型（加载并缓存）
   */
  async initialize(): Promise<void> {
    // TODO: Phase 6 实现
    // 使用 @huggingface/transformers 加载 all-MiniLM-L6-v2
    // 单例模式，避免重复加载
    throw new Error('嵌入模型未初始化');
  }

  /**
   * 批量生成文本嵌入
   * @param texts 文本数组，每批最多 32 条
   * @returns 嵌入向量数组，每个向量长度为 384
   */
  async embed(texts: string[]): Promise<number[][]> {
    // TODO: Phase 6 实现
    throw new Error('嵌入生成尚未实现');
  }

  /**
   * 生成单个查询文本的嵌入
   */
  async embedQuery(text: string): Promise<number[]> {
    // TODO: Phase 6 实现
    throw new Error('查询嵌入尚未实现');
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
