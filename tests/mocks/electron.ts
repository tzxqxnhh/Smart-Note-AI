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
    searchFiles: vi.fn().mockResolvedValue([]),
    ragIndexAll: vi.fn().mockResolvedValue({ fileCount: 0, chunkCount: 0 }),
    ragQuery: vi.fn().mockResolvedValue({ content: '', citations: [] }),
    ragGetStatus: vi.fn().mockResolvedValue(null),
    ragResetIndex: vi.fn().mockResolvedValue(undefined),
    llmChat: vi.fn().mockResolvedValue(''),
    llmSummarize: vi.fn().mockResolvedValue(''),
    llmExpand: vi.fn().mockResolvedValue(''),
    llmFormat: vi.fn().mockResolvedValue(''),
    llmGenerateTree: vi.fn().mockResolvedValue({ ascii: '', mermaid: '' }),
    onFileChanged: vi.fn().mockReturnValue(vi.fn()),
    onIndexProgress: vi.fn().mockReturnValue(vi.fn()),
  };
}
