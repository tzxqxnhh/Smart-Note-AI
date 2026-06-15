// IPC 通道名称常量

// 文件系统操作
export const IPC_CHANNELS = {
  // 工作空间
  SELECT_DIRECTORY: 'workspace:select-directory',
  GET_WORKSPACE_PATH: 'workspace:get-path',

  // 文件操作
  READ_FILE: 'fs:read-file',
  WRITE_FILE: 'fs:write-file',
  LIST_DIRECTORY: 'fs:list-directory',
  CREATE_FILE: 'fs:create-file',
  CREATE_DIRECTORY: 'fs:create-directory',
  RENAME: 'fs:rename',
  DELETE: 'fs:delete',
  TRASH_ITEM: 'fs:trash',

  // 文件复制
  FS_COPY: 'fs:copy',

  // 搜索
  SEARCH: 'search:query',

  // 文件监控
  FILE_CHANGED: 'watcher:file-changed',

  // RAG 操作
  RAG_INDEX_ALL: 'rag:index-all',
  RAG_QUERY: 'rag:query',
  RAG_GET_STATUS: 'rag:get-status',
  RAG_RESET_INDEX: 'rag:reset-index',
  RAG_INDEX_PROGRESS: 'rag:index-progress',

  // LLM 操作
  LLM_CHAT: 'llm:chat',
  LLM_SUMMARIZE: 'llm:summarize',
  LLM_EXPAND: 'llm:expand',
  LLM_FORMAT: 'llm:format',
  LLM_GENERATE_TREE: 'llm:generate-tree',
} as const;
