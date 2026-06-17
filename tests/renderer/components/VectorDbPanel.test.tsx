import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock ipc-client（由 store 使用）
vi.mock('@/lib/ipc-client', () => ({
  ragListFileChunks: vi.fn().mockResolvedValue([]),
  ragDeleteChunks: vi.fn().mockResolvedValue(undefined),
  ragGetChunkDetail: vi.fn().mockResolvedValue(null),
  ragGetChunkCount: vi.fn().mockResolvedValue(0),
}));

describe('VectorDbPanel', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  async function loadComponent() {
    const mod = await import('@/components/rag/VectorDbPanel');
    return mod.VectorDbPanel;
  }

  async function getStore() {
    const mod = await import('@/stores/useVectorDbStore');
    return mod.useVectorDbStore;
  }

  it('加载中显示"加载中..."', async () => {
    const store = await getStore();
    store.setState({ isOpen: true, loading: true, error: null, fileGroups: [] });

    const VectorDbPanel = await loadComponent();
    render(<VectorDbPanel />);

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('空状态显示提示文字', async () => {
    const store = await getStore();
    store.setState({ isOpen: true, loading: false, error: null, fileGroups: [] });

    const VectorDbPanel = await loadComponent();
    render(<VectorDbPanel />);

    expect(screen.getByText('向量库中暂无切片数据')).toBeInTheDocument();
    expect(screen.getByText(/先通过 RAG 设置面板索引/)).toBeInTheDocument();
  });

  it('错误态显示错误信息和重试按钮', async () => {
    const store = await getStore();
    store.setState({ isOpen: true, loading: false, error: 'ChromaDB 连接失败', fileGroups: [] });

    const VectorDbPanel = await loadComponent();
    render(<VectorDbPanel />);

    expect(screen.getByText('ChromaDB 连接失败')).toBeInTheDocument();
    expect(screen.getByText('重试')).toBeInTheDocument();
  });

  it('正常列表渲染文件名和切片数量', async () => {
    const store = await getStore();
    store.setState({
      isOpen: true,
      loading: false,
      error: null,
      fileGroups: [
        {
          filePath: 'D:\\notes\\test.md',
          fileName: 'test.md',
          chunkCount: 3,
          chunks: [
            { id: 'c1', contentPreview: '预览内容一', storedAt: '2025-01-01T00:00:00.000Z' },
            { id: 'c2', contentPreview: '预览内容二', storedAt: '2025-01-01T00:00:01.000Z' },
            { id: 'c3', contentPreview: '预览内容三', storedAt: null },
          ],
        },
      ],
    });

    const VectorDbPanel = await loadComponent();
    render(<VectorDbPanel />);

    // 文件名渲染
    expect(screen.getByText('test.md')).toBeInTheDocument();
    // 切片数量
    expect(screen.getByText(/3条/)).toBeInTheDocument();
  });

  it('点击折叠/展开切换切片可见性', async () => {
    const store = await getStore();
    store.setState({
      isOpen: true,
      loading: false,
      error: null,
      fileGroups: [
        {
          filePath: 'D:\\notes\\test.md',
          fileName: 'test.md',
          chunkCount: 2,
          chunks: [
            { id: 'c1', contentPreview: '第一段内容', storedAt: '2025-01-01T00:00:00.000Z' },
            { id: 'c2', contentPreview: '第二段内容', storedAt: null },
          ],
        },
      ],
    });

    const VectorDbPanel = await loadComponent();
    render(<VectorDbPanel />);

    // 初始：切片不可见（折叠状态）
    expect(screen.queryByText('第一段内容')).not.toBeInTheDocument();

    // 点击展开
    fireEvent.click(screen.getByText('test.md'));
    expect(screen.getByText('第一段内容')).toBeInTheDocument();
    expect(screen.getByText('第二段内容')).toBeInTheDocument();
  });

  it('批量模式下显示勾选框', async () => {
    const store = await getStore();
    store.setState({
      isOpen: true,
      loading: false,
      error: null,
      batchMode: true,
      fileGroups: [
        {
          filePath: 'D:\\notes\\test.md',
          fileName: 'test.md',
          chunkCount: 1,
          chunks: [
            { id: 'c1', contentPreview: '预览', storedAt: null },
          ],
        },
      ],
    });

    const VectorDbPanel = await loadComponent();
    render(<VectorDbPanel />);

    // checkbox 存在（文件级别和切片级别各一个）
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(1);
    // 底部按钮
    expect(screen.getByText('删除选中 (0)')).toBeInTheDocument();
    expect(screen.getByText('退出批量模式')).toBeInTheDocument();
  });

  it('点击切片调用 openDetail', async () => {
    const store = await getStore();
    store.setState({
      isOpen: true,
      loading: false,
      error: null,
      fileGroups: [
        {
          filePath: 'D:\\notes\\test.md',
          fileName: 'test.md',
          chunkCount: 1,
          chunks: [
            { id: 'c1', contentPreview: '预览内容', storedAt: '2025-01-01T00:00:00.000Z' },
          ],
        },
      ],
      expandedFiles: new Set(['D:\\notes\\test.md']),
    });

    const VectorDbPanel = await loadComponent();
    render(<VectorDbPanel />);

    fireEvent.click(screen.getByText('预览内容'));
    expect(store.getState().detailChunkId).toBe('c1');
  });

  it('页脚显示"批量删除"按钮', async () => {
    const store = await getStore();
    store.setState({
      isOpen: true,
      loading: false,
      error: null,
      fileGroups: [],
    });

    const VectorDbPanel = await loadComponent();
    render(<VectorDbPanel />);

    expect(screen.getByText('批量删除')).toBeInTheDocument();
  });
});
