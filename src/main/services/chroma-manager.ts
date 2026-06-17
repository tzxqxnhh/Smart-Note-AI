import type { Chunk, FileChunkGroup, ChunkDetail } from '../../shared/types';
import { ChromaClient } from 'chromadb';
import type { CollectionHandle, EmbeddingFunction } from 'chromadb';

/**
 * 空操作嵌入函数
 * 因为本项目的嵌入向量由 SiliconFlow API 生成并直接传给 ChromaDB，
 * 不需要 ChromaDB 客户端自身做嵌入，所以提供一个空实现来跳过默认嵌入函数加载
 */
const noopEmbeddingFunction: EmbeddingFunction = {
  generate: async () => [],
};

/**
 * ChromaDB 客户端管理
 * 连接 localhost:8000，管理向量集合
 */
export class ChromaManager {
  private collectionName = 'smart_note_demo';
  private connected = false;
  private client: ChromaClient | null = null;
  private collection: CollectionHandle | null = null;

  /**
   * 初始化连接并确保集合存在
   */
  async initialize(): Promise<void> {
    try {
      this.client = new ChromaClient({ host: 'localhost', port: 8000 });
      this.collection = (await this.client.getOrCreateCollection({
        name: this.collectionName,
        embeddingFunction: noopEmbeddingFunction,
      })) as CollectionHandle;
      this.connected = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`无法连接到 ChromaDB: ${message}`);
    }
  }

  /**
   * 批量插入/更新分块向量
   */
  async upsertChunks(chunks: Chunk[], embeddings: number[][]): Promise<void> {
    if (!this.connected) {
      await this.initialize();
    }

    const ids = chunks.map((c) => c.id);
    const documents = chunks.map((c) => c.content);
    const metadatas = chunks.map((c) => ({
      sourceFile: c.metadata.sourceFile,
      headingText: c.metadata.headingText,
      headingLevel: c.metadata.headingLevel,
      parentHeading: c.metadata.parentHeading ?? '',
      chunkIndex: c.metadata.chunkIndex,
      totalChunks: c.metadata.totalChunks,
      storedAt: new Date().toISOString(),
    }));

    await this.collection!.upsert({
      ids,
      embeddings,
      metadatas,
      documents,
    });
  }

  /**
   * 查询最相似的 K 个分块
   */
  async queryChunks(
    queryEmbedding: number[],
    nResults: number,
  ): Promise<Array<{ id: string; content: string; metadata: Record<string, unknown>; distance: number }>> {
    if (!this.connected) {
      await this.initialize();
    }

    const result = await this.collection!.query({
      queryEmbeddings: [queryEmbedding],
      nResults,
    });

    const ids = result.ids?.[0] ?? [];
    const documents = result.documents?.[0] ?? [];
    const metadatas = result.metadatas?.[0] ?? [];
    const distances = result.distances?.[0] ?? [];

    if (ids.length === 0) {
      return [];
    }

    return ids.map((id, i) => ({
      id,
      content: typeof documents[i] === 'string' ? documents[i] : '',
      metadata: metadatas[i] as Record<string, unknown> ?? {},
      distance: typeof distances[i] === 'number' ? distances[i] : 0,
    }));
  }

  /**
   * 删除指定文件的所有分块
   */
  async deleteFileChunks(filePath: string): Promise<void> {
    if (!this.connected) {
      await this.initialize();
    }

    await this.collection!.delete({
      where: { sourceFile: filePath },
    });
  }

  /**
   * 重置集合（删除所有数据并重建）
   */
  async resetCollection(): Promise<void> {
    if (!this.connected) {
      await this.initialize();
    }

    await this.client!.deleteCollection({ name: this.collectionName });
    this.collection = (await this.client!.getOrCreateCollection({
      name: this.collectionName,
      embeddingFunction: noopEmbeddingFunction,
    })) as CollectionHandle;
  }

  /**
   * 连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 列出所有已索引的文件及其切片摘要
   */
  async listFileChunks(): Promise<FileChunkGroup[]> {
    if (!this.connected) {
      await this.initialize();
    }

    const result = await this.collection!.get();

    const ids = result.ids ?? [];
    const documents = result.documents ?? [];
    const metadatas = (result.metadatas as Array<Record<string, unknown>>) ?? [];

    if (ids.length === 0) {
      return [];
    }

    // 按 sourceFile 分组
    const groupMap = new Map<string, FileChunkGroup>();
    for (let i = 0; i < ids.length; i++) {
      const meta = metadatas[i] ?? {};
      const sourceFile = (meta.sourceFile as string) ?? '';
      const fileName = sourceFile.replace(/^.*[\\/]/, '');

      if (!groupMap.has(sourceFile)) {
        groupMap.set(sourceFile, {
          filePath: sourceFile,
          fileName,
          chunkCount: 0,
          chunks: [],
        });
      }

      const group = groupMap.get(sourceFile)!;
      group.chunkCount++;
      group.chunks.push({
        id: ids[i] as string,
        contentPreview: typeof documents[i] === 'string' ? documents[i].slice(0, 10) : '',
        storedAt: (meta.storedAt as string) ?? null,
      });
    }

    // 按文件名排序
    return Array.from(groupMap.values()).sort((a, b) =>
      a.fileName.localeCompare(b.fileName),
    );
  }

  /**
   * 获取单个切片的完整详情
   */
  async getChunkDetail(id: string): Promise<ChunkDetail | null> {
    if (!this.connected) {
      await this.initialize();
    }

    const result = await this.collection!.get({ ids: [id] });

    const ids = result.ids ?? [];
    const documents = result.documents ?? [];
    const metadatas = (result.metadatas as Array<Record<string, unknown>>) ?? [];

    if (ids.length === 0 || !documents[0]) {
      return null;
    }

    const meta = metadatas[0] ?? {};
    return {
      id: ids[0] as string,
      content: documents[0] as string,
      sourceFile: (meta.sourceFile as string) ?? '',
      headingText: (meta.headingText as string) ?? '',
      storedAt: (meta.storedAt as string) ?? null,
    };
  }

  /**
   * 按 ID 列表删除切片
   */
  async deleteChunks(ids: string[]): Promise<void> {
    if (!this.connected) {
      await this.initialize();
    }

    if (ids.length === 0) {
      return;
    }

    await this.collection!.delete({ ids });
  }

  /**
   * 获取向量库中的切片总数
   */
  async getChunkCount(): Promise<number> {
    if (!this.connected) {
      await this.initialize();
    }

    return this.collection!.count();
  }
}

// 单例导出
export const chromaManager = new ChromaManager();
