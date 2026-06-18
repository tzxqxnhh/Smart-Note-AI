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
| LLM | DeepSeek API (OpenAI 兼容接口) | - |

## 功能

### 笔记功能（完整可用）

- **三栏可拖拽布局** — 左侧资源管理器 + 中间编辑器 + 右侧 AI 面板，宽度自由调整
- **文件资源管理器** — 树形展示、新建/重命名/删除、回收站、剪贴板复制粘贴、右键菜单
- **多 Tab Markdown 编辑器** — CodeMirror 6 语法高亮、选区监听、GFM 预览（表格/任务列表/代码块）、编辑/预览/双栏模式切换
- **自动保存** — 编辑内容 2 秒防抖自动保存
- **全局搜索** — 文件名 + 内容全文搜索，结果高亮，点击跳转，编辑器工具栏搜索入口
- **键盘快捷键** — Ctrl+Shift+F 搜索、Ctrl+S 保存、Ctrl+W 关闭 Tab、Ctrl+\ 切换面板
- **文件监控** — chokidar 自动检测工作空间文件变更

### RAG 模块（完整可用）

- **Markdown 分块** — 基于 remark AST，精确标题级别分割，可配置最大字符数、重叠数、分隔符
- **文本嵌入** — SiliconFlow API 封装，批量嵌入（32条/批），自动重试
- **向量存储** — ChromaDB 管理，支持单文件索引、全量索引、进度推送
- **向量库管理** — 浏览文件-切片两级列表、查看切片详情、批量删除
- **RAG 设置面板** — 可配置分块参数，索引操作入口

### Agent 模块（完整可用）

- **流式对话** — DeepSeek LLM 集成，token 级流式输出，闪烁光标
- **RAG 问答** — 基于笔记内容的智能问答，支持向量库开关控制
- **预设操作** — 编辑器右键菜单：总结、扩写、格式化（选中文本时可用）
- **结构图生成** — 资源管理器右键菜单：生成文件夹结构图
- **工具调用步骤** — 可展开的 toolStep 列表（search/read/write 类型）
- **模型切换** — 三优先级回退链：options.model → DEEPSEEK_MODEL 环境变量 → deepseek-chat

## 项目结构

```
demo_smart_note/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 应用入口、窗口创建、.env 加载
│   │   ├── ipc/                 # IPC 处理器（胶水层）
│   │   │   ├── index.ts         # 注册所有 Handler
│   │   │   ├── file-system.ts   # 文件系统操作
│   │   │   ├── search.ts        # 搜索
│   │   │   ├── workspace.ts     # 工作空间选择
│   │   │   ├── rag.ts           # RAG 处理器（完整实现）
│   │   │   └── llm.ts           # LLM 处理器（完整实现：流式RAG问答/总结/扩写/格式化/结构图 + 向量库开关）
│   │   └── services/            # 纯函数服务层（可独立测试）
│   │       ├── file-ops.ts      # 文件操作（list/read/write/crud/copy）
│   │       ├── file-watcher.ts  # chokidar 文件监控
│   │       ├── search-ops.ts    # 搜索逻辑
│   │       ├── chunker.ts       # Markdown 分块器（remark AST 精确标题级别分割）
│   │       ├── embedder.ts      # SiliconFlow 嵌入 API 封装
│   │       ├── chroma-manager.ts # ChromaDB 向量存储管理
│   │       ├── rag-pipeline.ts  # RAG 编排（分块→嵌入→索引→检索→LLM 生成）
│   │       └── llm-client.ts    # DeepSeek 客户端（chat + chatStream）
│   ├── preload/
│   │   └── index.ts             # contextBridge API 暴露
│   ├── renderer/                # React 渲染进程
│   │   ├── main.tsx             # React 入口
│   │   ├── App.tsx              # 根组件
│   │   ├── components/
│   │   │   ├── layout/          # 布局组件（MainLayout/三栏面板）
│   │   │   ├── explorer/        # 文件浏览器（FileExplorer/TreeNode/ContextMenu）
│   │   │   ├── editor/          # 编辑器（EditorContainer/CodeEditor/MarkdownPreview/Tabs/Toolbar）
│   │   │   ├── search/          # 搜索（SearchBar/SearchResults/HighlightText）
│   │   │   ├── agent/           # AI 面板（AgentPanel/ChatMessage/ChatInput/PresetButtons/StatusIndicator/MermaidDiagram）
│   │   │   └── common/          # 通用组件（ConfirmDialog）
│   │   ├── stores/              # Zustand 状态管理
│   │   │   ├── useLayoutStore.ts
│   │   │   ├── useExplorerStore.ts
│   │   │   ├── useEditorStore.ts
│   │   │   ├── useSearchStore.ts
│   │   │   ├── useRagSettingsStore.ts
│   │   │   ├── useVectorDbStore.ts
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
├── tests/                       # 测试文件（262 个用例，24 个文件）
│   ├── setup.ts                 # jsdom polyfill + jest-dom 扩展
│   ├── mocks/                   # Electron API Mock
│   │   └── electron.ts
│   ├── main/                    # 主进程测试（Node 环境）
│   │   ├── smoke.test.ts
│   │   ├── file-system.test.ts
│   │   ├── chunker.test.ts
│   │   ├── embedder.test.ts
│   │   ├── chroma-manager.test.ts
│   │   ├── rag-pipeline.test.ts
│   │   └── llm-client.test.ts
│   └── renderer/                # 渲染进程测试（jsdom 环境）
│       ├── smoke.test.tsx
│       ├── stores/
│       │   ├── useLayoutStore.test.ts
│       │   ├── useExplorerStore.test.ts
│       │   ├── useEditorStore.test.ts
│       │   ├── useRagSettingsStore.test.ts
│       │   ├── useVectorDbStore.test.ts
│       │   └── useAgentStore.test.ts
│       └── components/
│           ├── explorer/
│           │   ├── FileExplorer.test.tsx
│           │   ├── TreeNode.test.tsx
│           │   └── ContextMenu.test.tsx
│           ├── editor/
│           │   ├── EditorToolbar.test.tsx
│           │   └── MarkdownPreview.test.tsx
│           ├── layout/
│           │   └── MainLayout.test.tsx
│           ├── ChatMessage.test.tsx
│           ├── PresetButtons.test.tsx
│           ├── VectorDbPanel.test.tsx
│           └── ChunkDetailModal.test.tsx
├── docs/                        # 迭代报告文档
│   ├── v1.0.md ~ v1.5.md        # 各迭代详细报告
│   └── v2.0.md                  # 正式版报告
├── .env                          # 环境变量配置（SILICONFLOW_API_KEY, DEEPSEEK_API_KEY）
├── electron.vite.config.ts
├── vitest.config.ts
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 22
- npm >= 10
- Docker Desktop（用于运行 ChromaDB 向量存储）

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

# DeepSeek API Key（用于 LLM 对话）
# 注册获取: https://platform.deepseek.com
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx

# DeepSeek 模型（可选，默认 deepseek-chat）
DEEPSEEK_MODEL=deepseek-chat
```

也可以直接在系统环境变量中设置，应用会自动读取。

### 启动 ChromaDB（RAG 功能需要）

```bash
# 使用 Docker Compose 启动（推荐）
docker compose up -d

# 停止 ChromaDB
docker compose down
```

容器会在 `8000` 端口启动 ChromaDB 服务，向量数据持久化在 `./chroma_data` 目录。

### 一键启动

双击项目根目录的 `start.bat`，即可自动启动 ChromaDB（Docker）和 Electron 应用：

```bash
# 在项目目录下执行
.\start.bat
```

脚本流程：
1. 检测 Docker 是否可用
2. 检测 ChromaDB 是否已在运行（HTTP 心跳检测）
3. 若未运行则通过 `docker compose up -d` 启动，等待服务就绪
4. 启动 Electron 应用
5. 关闭应用后自动执行 `docker compose down` 停止 ChromaDB

### 开发

```bash
# 手动启动开发服务器（Electron 窗口 + Vite HMR）
npm run dev
```

### 运行测试

```bash
# 运行所有测试（262 个用例）
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
                    ┌──────┴──────┐    ┌─────────────┐
                    │ RagPipeline │───►│ LLM Client  │
                    │  (编排层)    │    │ (DeepSeek)  │
                    └─────────────┘    └─────────────┘
```

### 状态管理

每个功能模块使用独立的 Zustand Store：

- `useLayoutStore` — 面板宽度、可见性
- `useExplorerStore` — 文件树、选中路径、剪贴板
- `useEditorStore` — 多 Tab、编辑内容、视图模式
- `useSearchStore` — 搜索查询、结果、状态
- `useRagSettingsStore` — RAG 切分设置面板状态、索引操作
- `useVectorDbStore` — 向量库面板开关、批量删除、切片详情
- `useAgentStore` — 对话消息、流式状态、工具步骤、向量库开关

## 迭代历史

| 迭代 | 文档 | 内容 |
|------|------|------|
| v1.0 | [docs/v1.0.md](docs/v1.0.md) | 3 个 Bug 修复 + 3 个优化项 |
| v1.1 | [docs/v1.1.md](docs/v1.1.md) | 搜索模块发现性、右键区分文件/文件夹、复制粘贴 |
| v1.2 | [docs/v1.2.md](docs/v1.2.md) | RAG 模块完整实现（分块/嵌入/向量存储/编排/前端 UI） |
| v1.3 | [docs/v1.3.md](docs/v1.3.md) | 向量库管理功能（浏览/查看/删除切片、ChunkDetailModal） |
| v1.4 | [docs/v1.4.md](docs/v1.4.md) | 分隔符精确匹配修复、RAG 面板样式优化、向量库面板自动刷新 |
| v1.5 | [docs/v1.5.md](docs/v1.5.md) | DeepSeek LLM 集成、流式对话、RAG 问答、工具调用步骤展示 |
| v2.0 | [docs/v2.0.md](docs/v2.0.md) | 正式版：4 Bug 修复 + Agent 交互重构（选区联动/右键菜单/向量库开关） |