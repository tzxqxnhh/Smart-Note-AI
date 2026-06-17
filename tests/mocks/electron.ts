import { vi } from 'vitest';

// Mock window.electronAPI 用于渲染进程测试
export function createMockElectronAPI() {
  return {
    selectDirectory: vi.fn().mockResolvedValue(null),
    getWorkspacePath: vi.fn().mockResolvedValue(null),
    readFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined),
    listDirectory: vi.fn().mockResolvedValue([]),
    createFile: vi.fn().mockResolvedValue(undefined),
    createDirectory: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn().mockResolvedValue(undefined),
    deleteItem: vi.fn().mockResolvedValue(undefined),
    trashItem: vi.fn().mockResolvedValue(undefined),
    copyItem: vi.fn().mockResolvedValue(undefined),
    searchFiles: vi.fn().mockResolvedValue([]),
    ragIndexAll: vi.fn().mockResolvedValue({ fileCount: 0, chunkCount: 0 }),
    ragIndexFile: vi.fn().mockResolvedValue(undefined),
    ragQuery: vi.fn().mockResolvedValue({ content: '', citations: [] }),
    ragGetStatus: vi.fn().mockResolvedValue(null),
    ragResetIndex: vi.fn().mockResolvedValue(undefined),
    ragListFileChunks: vi.fn().mockResolvedValue([]),
    ragGetChunkDetail: vi.fn().mockResolvedValue(null),
    ragDeleteChunks: vi.fn().mockResolvedValue(undefined),
    ragGetChunkCount: vi.fn().mockResolvedValue(0),
    llmChat: vi.fn().mockResolvedValue(''),
    llmChatStream: vi.fn(),
    llmSummarize: vi.fn().mockResolvedValue(''),
    llmExpand: vi.fn().mockResolvedValue(''),
    llmFormat: vi.fn().mockResolvedValue(''),
    llmGenerateTree: vi.fn().mockResolvedValue({ ascii: '', mermaid: '' }),
    onFileChanged: vi.fn().mockReturnValue(vi.fn()),
    onIndexProgress: vi.fn().mockReturnValue(vi.fn()),
    onLlmStreamChunk: vi.fn().mockReturnValue(vi.fn()),
    onLlmStreamEnd: vi.fn().mockReturnValue(vi.fn()),
  };
}
