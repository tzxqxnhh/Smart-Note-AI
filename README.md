# 智能笔记 (Smart Note)

本地优先的 Markdown 笔记桌面应用，内置 AI Agent 辅助写作。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron + electron-vite | 42 / 3.x |
| 前端框架 | React + TypeScript | 19 / 5.7 |
| 构建工具 | Vite | 6 |
| 编辑器 | CodeMirror 6 (`@uiw/react-codemirror`) | 6 |
| Markdown 预览 | react-markdown + remark-gfm | 9 / 4 |
| 状态管理 | Zustand | 5 |
| 布局 | allotment（三栏可拖拽） | 1.20 |
| 拖拽 | @dnd-kit | 6 |
| 文件监控 | chokidar | 4 |
| 测试 | Vitest + Testing Library | 3 / 16 |
| 样式 | Tailwind CSS | 4 |
| 图标 | lucide-react | 0.500 |
| Markdown 分块 | remark (AST 解析) | 15 |
| 嵌入模型 | SiliconFlow API (Qwen/Qwen3-Embedding-8B) | - |
| 向量存储 | ChromaDB | 3.4 |
| LLM | DEEPSEEK / Ollama | - |

## 功能

### 已完成

- **三栏可拖拽布局** — 左侧资源管理器 + 中间编辑器 + 右侧 AI 面板，宽度自由调整
- **文件资源管理器** — 树形展示、新建/重命名/删除、右键菜单（含"文本切分"入口）
- **多 Tab Markdown 编辑器** — CodeMirror 6 语法高亮、GFM 预览（表格/任务列表/代码块）、编辑/预览/双栏模式切换
- **自动保存** — 编辑内容 2 秒防抖自动保存
- **全局搜索** — 文件名 + 内容全文搜索，结果高亮，点击跳转
- **键盘快捷键** — Ctrl+Shift+F 搜索、Ctrl+S 保存、Ctrl+W 关闭 Tab、Ctrl+\ 切换面板
- **文件监控** — 自动检测工作空间文件变更
- **RAG 流水线** — Markdown 分块（remark AST）→ SiliconFlow 嵌入 → ChromaDB 向量索引，支持单文件切分与参数配置

### 开发中

- **Agent 面板** — 预设操作（总结/扩写/格式化/思维导图/问答）
- **LLM 集成** — DEEPSEEK 大模型调用

## 项目结构

```
demo_smart_note/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 应用入口、窗口创建、.env 加载
│   │   ├── ipc/                 # IPC 处理器
│   │   │   ├── index.ts         # 注册所有 Handler
│   │   │   ├── file-system.ts   # 文件系统操作
│   │   │   ├── search.ts        # 搜索
│   │   │   ├── workspace.ts     # 工作空间选择
│   │   │   ├── rag.ts           # RAG 处理器
│   │   │   └── llm.ts           # LLM 处理器（框架）
│   │   └── services/            # 纯函数服务层（可独立测试）
│   │       ├── file-ops.ts      # 文件操作（list/read/write/crud）
│   │       ├── file-watcher.ts  # chokidar 文件监控
│   │       ├── search-ops.ts    # 搜索逻辑
│   │       ├── chunker.ts       # Markdown 分块器（remark AST）
│   │       ├── embedder.ts      # SiliconFlow 嵌入 API 封装
│   │       ├── chroma-manager.ts # ChromaDB 向量存储管理
│   │       ├── rag-pipeline.ts  # RAG 编排（分块→嵌入→索引→检索）
│   │       └── llm-client.ts    # LLM 客户端抽象（框架）
│   ├── preload/
│   │   └── index.ts             # contextBridge API 暴露
│   ├── renderer/                # React 渲染进程
│   │   ├── main.tsx             # React 入口
│   │   ├── App.tsx              # 根组件
│   │   ├── components/
│   │   │   ├── layout/          # 布局组件（MainLayout/三栏面板）
│   │   │   ├── explorer/        # 文件浏览器（FileExplorer/TreeNode/ContextMenu）
│   │   │   ├── editor/          # 编辑器（CodeEditor/MarkdownPreview/Tabs/Toolbar）
│   │   │   ├── search/          # 搜索（SearchBar/SearchResults/HighlightText）
│   │   │   ├── rag/             # RAG（RagSettingsPanel）
│   │   │   ├── agent/           # AI 面板（AgentPanel/ChatMessage/ChatInput/PresetButtons）
│   │   │   └── common/          # 通用组件（ConfirmDialog）
│   │   ├── stores/              # Zustand 状态管理
│   │   │   ├── useLayoutStore.ts
│   │   │   ├── useExplorerStore.ts
│   │   │   ├── useEditorStore.ts
│   │   │   ├── useSearchStore.ts
│   │   │   ├── useRagSettingsStore.ts
│   │   │   └── useAgentStore.ts
│   │   ├── hooks/               # 自定义 Hooks
│   │   │   ├── useAutoSave.ts
│   │   │   ├── useContextMenu.ts
│   │   │   └── useKeyboardShortcuts.ts
│   │   ├── lib/
│   │   │   └── ipc-client.ts    # 类型化 IPC 调用封装
│   │   └── styles/
│   │       ├── index.css        # Tailwind 入口 + 滚动条样式
│   │       └── markdown.css     # GFM 预览样式
│   └── shared/                  # 主进程/渲染进程共享
│       ├── ipc-channels.ts      # IPC 通道名称常量
│       └── types.ts             # 共享类型定义
├── tests/                       # 测试文件（142 个用例，17 个文件）
│   ├── setup.ts                 # jsdom polyfill + jest-dom 扩展
│   ├── mocks/                   # Electron API Mock
│   ├── main/                    # 主进程测试（Node 环境）
│   │   ├── chunker.test.ts
│   │   ├── embedder.test.ts
│   │   ├── chroma-manager.test.ts
│   │   ├── rag-pipeline.test.ts
│   │   ├── file-system.test.ts
│   │   └── smoke.test.ts
│   └── renderer/                # 渲染进程测试（jsdom 环境）
│       ├── stores/
│       │   ├── useLayoutStore.test.ts
│       │   ├── useExplorerStore.test.ts
│       │   ├── useEditorStore.test.ts
│       │   └── useRagSettingsStore.test.ts
│       └── components/
│           ├── explorer/
│           │   ├── FileExplorer.test.tsx
│           │   ├── TreeNode.test.tsx
│           │   └── ContextMenu.test.tsx
│           ├── editor/
│           │   ├── EditorToolbar.test.tsx
│           │   └── MarkdownPreview.test.tsx
│           └── layout/
│               └── MainLayout.test.tsx
├── .env                          # 环境变量配置（SILICONFLOW_API_KEY）
├── electron.vite.config.ts
├── vitest.config.ts
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 22
- npm >= 10
- ChromaDB 服务端（用于 RAG 向量存储）

### 安装

```bash
# 克隆仓库
cd demo_smart_note

# 安装依赖
npm install

# 如果在中国大陆，设置 Electron 镜像加速下载
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
```

### 环境变量配置

复制 `.env` 文件并按需填写：

```bash
# 硅基流动 API Key（用于文本嵌入模型）
# 注册获取: https://siliconflow.cn
SILICONFLOW_API_KEY=sk-xxxxxxxxxxxxx
```

也可以直接在系统环境变量中设置 `SILICONFLOW_API_KEY`，应用会自动读取。

### 启动 ChromaDB（RAG 功能需要）

```bash
# 使用 pip 安装并启动
pip install chromadb
chroma run --path ./chroma_data

# 或使用 Docker
docker run -d -p 8000:8000 -v ./chroma_data:/chroma/chroma chromadb/chroma
```

### 开发

```bash
# 启动开发服务器（Electron 窗口 + Vite HMR）
npm run dev
```

### 运行测试

```bash
# 运行所有测试（142 个用例）
npm test

# 仅运行主进程测试
npm run test:main

# 仅运行渲染进程测试
npm run test:renderer

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### 构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 架构设计

### 进程通信

```
┌─────────────────────────┐    IPC (contextBridge)    ┌──────────────────────┐
│   Renderer Process      │ ◄─────────────────────── ► │   Main Process       │
│   (React + Zustand)     │                            │   (Node.js + Electron)│
│                         │    window.electronAPI      │                      │
│   components/           │                            │   ipc/               │
│   stores/               │                            │   services/          │
└─────────────────────────┘                            └──────────────────────┘
```

### 服务层分离

主进程采用两层架构，将纯逻辑与 Electron API 分离，确保代码可测试：

- **`src/main/services/*.ts`** — 纯函数/类，不依赖 Electron，可被 Vitest 直接测试
- **`src/main/ipc/*.ts`** — IPC Handler 注册，调用 services 层

### RAG 架构

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Chunker    │───►│   Embedder   │───►│ ChromaManager│
│ (remark AST) │    │ (SiliconFlow)│    │ (ChromaDB)   │
└──────────────┘    └──────────────┘    └──────────────┘
       ▲                   ▲                   ▲
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────┴──────┐
                    │ RagPipeline │  (编排层)
                    └─────────────┘
```

### 状态管理

每个功能模块使用独立的 Zustand Store：

- `useLayoutStore` — 面板宽度、可见性
- `useExplorerStore` — 文件树、选中路径
- `useEditorStore` — 多 Tab、编辑内容、视图模式
- `useSearchStore` — 搜索查询、结果、状态
- `useRagSettingsStore` — RAG 切分设置面板状态、索引操作
- `useAgentStore` — 对话消息、处理状态

## 后续计划

- [ ] 接入 DEEPSEEK 模型
- [ ] 实现 Agent 功能（总结、扩写、格式化、思维导图、RAG 问答）
- [ ] 引用跳转与来源标注
- [ ] 窗口状态持久化
- [ ] Electron 二进制下载完成后的桌面应用完整测试
