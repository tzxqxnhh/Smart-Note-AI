import { ipcMain, BrowserWindow } from 'electron';
import type { IpcMainEvent } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import type { Citation, ToolStep } from '../../shared/types';
import { deepseekClient } from '../services/llm-client';
import { ragPipeline, buildRagPrompt } from '../services/rag-pipeline';
import { embedder } from '../services/embedder';
import { chromaManager } from '../services/chroma-manager';
import { readdir, stat } from 'fs/promises';
import { join, basename, extname } from 'path';

/** 重新导出纯函数供测试直接引用 */
export { deepseekClient } from '../services/llm-client';
export { buildRagPrompt } from '../services/rag-pipeline';

/**
 * 注册 LLM IPC 处理器
 * @param mainWindow 主窗口引用，用于流式推送
 */
export function setupLLMHandlers(mainWindow: BrowserWindow): void {
  // 流式 RAG 问答
  ipcMain.on(
    IPC_CHANNELS.LLM_CHAT,
    async (event: IpcMainEvent, args: { query: string; messageId: string; vectorDbEnabled?: boolean }) => {
      const { query, messageId, vectorDbEnabled = true } = args;

      try {
        // 检查 API Key
        if (!deepseekClient.isConfigured()) {
          event.sender.send(IPC_CHANNELS.LLM_STREAM_END, {
            messageId,
            content: '请设置 DEEPSEEK_API_KEY 环境变量。',
            citations: [],
            toolSteps: [],
            error: 'DEEPSEEK_API_KEY 环境变量未设置',
          });
          return;
        }

        // 根据向量库开关决定是否进行 RAG 检索
        if (!vectorDbEnabled) {
          // 向量库关闭：跳过 RAG，直接使用通用 system prompt
          const messages = [
            { role: 'system' as const, content: '你是一个本地笔记助手。请基于你的知识回答用户问题。回答时使用 Markdown 格式。' },
            { role: 'user' as const, content: query },
          ];

          let fullContent = '';
          for await (const token of deepseekClient.chatStream(messages)) {
            fullContent += token;
            event.sender.send(IPC_CHANNELS.LLM_STREAM_CHUNK, {
              messageId,
              content: token,
            });
          }

          event.sender.send(IPC_CHANNELS.LLM_STREAM_END, {
            messageId,
            content: fullContent,
            citations: [],
          });
          return;
        }

        // 1. 嵌入查询 + 检索 Top-K
        const queryEmbedding = await embedder.embedQuery(query);
        const results = await chromaManager.queryChunks(queryEmbedding, 5);

        // 2. 构建引用和 toolStep
        const citations: Citation[] = results.map((r) => ({
          sourceFile: (r.metadata.sourceFile as string) ?? '',
          headingText: (r.metadata.headingText as string) ?? '',
        }));

        const chunkSources = results.map((r) => ({
          chunkId: r.id,
          sourceFile: (r.metadata.sourceFile as string) ?? '',
          headingText: (r.metadata.headingText as string) ?? '',
          contentPreview: r.content.slice(0, 100),
        }));

        const searchStep: ToolStep = {
          id: `step-search-${messageId}`,
          type: 'search',
          status: 'done',
          chunkCount: results.length,
          chunkSources,
        };

        // 推送 toolStep
        event.sender.send(IPC_CHANNELS.LLM_STREAM_CHUNK, {
          messageId,
          content: '',
          toolSteps: [searchStep],
        });

        // 诊断日志：检查检索结果的 content 是否为非空
        results.forEach((r, i) => {
          console.log(
            `[RAG Debug] chunk[${i}] id=${r.id}, content.length=${r.content?.length ?? 0}, content.slice(0,80)=${(r.content?.slice(0, 80) ?? '(empty)').replace(/\n/g, '\\n')}`,
          );
        });

        // 3. 构建上下文
        const context = results
          .map(
            (r) =>
              `[来源: ${(r.metadata.sourceFile as string) ?? ''} > ${(r.metadata.headingText as string) ?? ''}]\n${r.content}`,
          )
          .join('\n\n---\n\n');

        // 4. 构建 prompt 并流式生成
        const messages = buildRagPrompt(context, query);
        let fullContent = '';
        for await (const token of deepseekClient.chatStream(messages)) {
          fullContent += token;
          event.sender.send(IPC_CHANNELS.LLM_STREAM_CHUNK, {
            messageId,
            content: token,
          });
        }

        // 5. 流结束（toolSteps 已通过 stream-chunk 发送，此处不重复）
        event.sender.send(IPC_CHANNELS.LLM_STREAM_END, {
          messageId,
          content: fullContent,
          citations,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        event.sender.send(IPC_CHANNELS.LLM_STREAM_END, {
          messageId,
          content: '',
          citations: [],
          toolSteps: [],
          error: errorMessage,
        });
      }
    },
  );

  // 文本总结
  ipcMain.handle(IPC_CHANNELS.LLM_SUMMARIZE, async (_event, text: string) => {
    if (!text) throw new Error('请先选中需要总结的文本');

    return deepseekClient.chat([
      {
        role: 'system',
        content: '你是一个文本总结助手。请用中文对用户提供的文本进行简洁总结，保留关键信息。',
      },
      {
        role: 'user',
        content: `请对以下笔记内容进行简洁总结：\n\n${text}`,
      },
    ]);
  });

  // 文本扩写
  ipcMain.handle(IPC_CHANNELS.LLM_EXPAND, async (_event, text: string) => {
    if (!text) throw new Error('请先选中需要扩写的文本');

    return deepseekClient.chat([
      {
        role: 'system',
        content: '你是一个文本扩写助手。请扩写用户提供的文本，补充细节和示例。保持 Markdown 格式。',
      },
      {
        role: 'user',
        content: `请扩写以下笔记内容，补充细节和示例。保持 Markdown 格式：\n\n${text}`,
      },
    ]);
  });

  // 文本格式化
  ipcMain.handle(IPC_CHANNELS.LLM_FORMAT, async (_event, text: string) => {
    if (!text) throw new Error('请先选中需要格式化的文本');

    return deepseekClient.chat([
      {
        role: 'system',
        content:
          '你是一个 Markdown 格式优化助手。请优化以下文本的格式，纠正标题层级、列表缩进、代码块标记等。保持原有内容不变。',
      },
      {
        role: 'user',
        content: `请优化以下 Markdown 文本的格式，纠正标题层级、列表缩进、代码块标记。保持原有内容不变：\n\n${text}`,
      },
    ]);
  });

  // 文件树结构生成
  ipcMain.handle(
    IPC_CHANNELS.LLM_GENERATE_TREE,
    async (_event, folderPath: string) => {
      if (!folderPath) throw new Error('请先选择需要生成结构图的文件夹');

      // 扫描目录结构（仅两层深度）
      const treeStr = await buildTreeString(folderPath, 0, 2);

      const prompt = `请根据以下文件树结构生成 Mermaid mindmap 代码。只输出 Mermaid 代码块，不要包含其他内容：

文件树：
${treeStr}

要求：
1. 使用 mindmap 类型
2. 根节点为文件夹名
3. 合理归类，合并相似子文件夹`;

      const mermaidCode = await deepseekClient.chat([
        {
          role: 'system',
          content: '你是一个 Mermaid 图表生成助手。只输出 Mermaid 代码块。',
        },
        { role: 'user', content: prompt },
      ]);

      // 提取 mermaid 代码块
      const match = mermaidCode.match(/```mermaid?\n([\s\S]*?)```/);
      const code = match ? match[1].trim() : mermaidCode.trim();

      return { mermaid: code, ascii: treeStr };
    },
  );
}

/**
 * 递归构建目录树字符串
 */
async function buildTreeString(
  dirPath: string,
  depth: number,
  maxDepth: number,
): Promise<string> {
  if (depth >= maxDepth) return '';

  const entries = await readdir(dirPath, { withFileTypes: true });
  let result = '';

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    const indent = '  '.repeat(depth);
    if (entry.isDirectory()) {
      result += `${indent}- ${entry.name}/\n`;
      try {
        result += await buildTreeString(
          join(dirPath, entry.name),
          depth + 1,
          maxDepth,
        );
      } catch {
        // 跳过无法访问的目录
      }
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') {
      result += `${indent}- ${entry.name}\n`;
    }
  }

  return result;
}
