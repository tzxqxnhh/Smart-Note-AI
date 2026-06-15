// 共享类型定义

// 文件树节点
export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

// 搜索结果
export interface SearchMatch {
  line: number;
  text: string;
  startIndex: number;
  endIndex: number;
}

export interface SearchResult {
  filePath: string;
  fileName: string;
  matches: SearchMatch[];
}

// 编辑器 Tab
export interface Tab {
  id: string;
  filePath: string;
  title: string;
  isDirty: boolean;
}

// 视图模式
export type ViewMode = 'edit' | 'preview' | 'split';

// 知识块（RAG 分块）
export interface Chunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  sourceFile: string;
  headingText: string;
  headingLevel: number;
  parentHeading: string | null;
  chunkIndex: number;
  totalChunks: number;
}

// RAG 文本切分配置
export interface ChunkerSettings {
  maxChunkSize: number;   // 最大切分字符数
  maxOverlap: number;     // 最大重叠字符数
  separator: string;      // 分隔符，默认 "##"
}

// 索引状态
export interface IndexStats {
  fileCount: number;
  chunkCount: number;
  lastIndexed: string | null;
}

// RAG 查询响应
export interface RagResponse {
  content: string;
  citations: Citation[];
}

export interface Citation {
  sourceFile: string;
  headingText: string;
  lineNumber?: number;
}

// Agent 消息
export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  citations?: Citation[];
  timestamp: string;
}

// Agent 状态
export type AgentStatus = 'idle' | 'indexing' | 'thinking' | 'generating' | 'done' | 'error';

// Agent 预设动作
export type AgentAction = 'summarize' | 'expand' | 'format' | 'visualize' | 'ask';

// LLM 生成选项
export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// 布局状态
export interface LayoutState {
  leftPanelWidth: number;
  rightPanelWidth: number;
  showLeftPanel: boolean;
  showRightPanel: boolean;
}
