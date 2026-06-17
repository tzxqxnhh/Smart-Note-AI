import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock ipc-client
const mockGetChunkDetail = vi.fn().mockResolvedValue(null);
const mockDeleteChunks = vi.fn().mockResolvedValue(undefined);
const mockListFileChunks = vi.fn().mockResolvedValue([]);

vi.mock('@/lib/ipc-client', () => ({
  ragGetChunkDetail: mockGetChunkDetail,
  ragDeleteChunks: mockDeleteChunks,
  ragListFileChunks: mockListFileChunks,
  ragGetChunkCount: vi.fn().mockResolvedValue(0),
}));

describe('ChunkDetailModal', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    // 重置默认值
    mockGetChunkDetail.mockResolvedValue(null);
    mockDeleteChunks.mockResolvedValue(undefined);
    mockListFileChunks.mockResolvedValue([]);
  });

  async function loadComponent() {
    const mod = await import('@/components/rag/ChunkDetailModal');
    return mod.ChunkDetailModal;
  }

  async function getStore() {
    const mod = await import('@/stores/useVectorDbStore');
    return mod.useVectorDbStore;
  }

  it('detailChunkId 为 null 时不渲染', async () => {
    const store = await getStore();
    store.setState({ detailChunkId: null, error: null });

    const ChunkDetailModal = await loadComponent();
    const { container } = render(<ChunkDetailModal />);

    expect(container.innerHTML).toBe('');
  });

  it('detailChunkId 有效时渲染弹窗并显示详情', async () => {
    mockGetChunkDetail.mockResolvedValueOnce({
      id: 'test.md::chunk::0',
      content: '这是切片完整内容',
      sourceFile: 'D:\\notes\\test.md',
      headingText: '第一节',
      storedAt: '2025-01-01T00:00:00.000Z',
    });

    const store = await getStore();
    store.setState({ detailChunkId: 'test.md::chunk::0', error: null });

    const ChunkDetailModal = await loadComponent();
    render(<ChunkDetailModal />);

    await waitFor(() => {
      expect(screen.getByText('切片详情')).toBeInTheDocument();
    });

    expect(screen.getByText('这是切片完整内容')).toBeInTheDocument();
    expect(screen.getByText(/D:\\notes\\test\.md/)).toBeInTheDocument();
    expect(screen.getByText('第一节')).toBeInTheDocument();
    expect(screen.getByText('2025-01-01T00:00:00.000Z')).toBeInTheDocument();
  });

  it('storedAt 为 null 时显示未知', async () => {
    mockGetChunkDetail.mockResolvedValueOnce({
      id: 'test.md::chunk::0',
      content: '内容',
      sourceFile: 'test.md',
      headingText: '标题',
      storedAt: null,
    });

    const store = await getStore();
    store.setState({ detailChunkId: 'test.md::chunk::0', error: null });

    const ChunkDetailModal = await loadComponent();
    render(<ChunkDetailModal />);

    await waitFor(() => {
      expect(screen.getByText('未知')).toBeInTheDocument();
    });
  });

  it('点击 X 调用 closeDetail', async () => {
    mockGetChunkDetail.mockResolvedValueOnce({
      id: 'c1',
      content: '内容',
      sourceFile: 'test.md',
      headingText: 'H1',
      storedAt: null,
    });

    const store = await getStore();
    store.setState({ detailChunkId: 'c1', error: null });

    const ChunkDetailModal = await loadComponent();
    render(<ChunkDetailModal />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('切片详情')).toBeInTheDocument();
    });

    // 点击关闭按钮 (X)
    const closeButton = screen.getByRole('button', { name: '' });
    // 实际上 X 按钮是第一个 button，但我们需要找到正确的。使用更精确的选择器。
    const buttons = screen.getAllByRole('button');
    // 第一个按钮应该是 X 关闭
    fireEvent.click(buttons[0]);

    expect(store.getState().detailChunkId).toBeNull();
  });

  it('点击遮罩层调用 closeDetail', async () => {
    mockGetChunkDetail.mockResolvedValueOnce({
      id: 'c1',
      content: '内容',
      sourceFile: 'test.md',
      headingText: 'H1',
      storedAt: null,
    });

    const store = await getStore();
    store.setState({ detailChunkId: 'c1', error: null });

    const ChunkDetailModal = await loadComponent();
    const { container } = render(<ChunkDetailModal />);

    await waitFor(() => {
      expect(screen.getByText('切片详情')).toBeInTheDocument();
    });

    // 点击遮罩层 (fixed inset-0 的容器)
    const overlay = container.firstElementChild!;
    fireEvent.click(overlay);

    expect(store.getState().detailChunkId).toBeNull();
  });

  it('点击删除按钮弹出确认对话框', async () => {
    mockGetChunkDetail.mockResolvedValueOnce({
      id: 'c1',
      content: '内容',
      sourceFile: 'test.md',
      headingText: 'H1',
      storedAt: null,
    });

    const store = await getStore();
    store.setState({ detailChunkId: 'c1', error: null });

    const ChunkDetailModal = await loadComponent();
    render(<ChunkDetailModal />);

    await waitFor(() => {
      expect(screen.getByText('切片详情')).toBeInTheDocument();
    });

    // 点击删除按钮
    fireEvent.click(screen.getByText('删除此切片'));

    // 确认对话框应显示
    expect(screen.getByText('确认删除')).toBeInTheDocument();
  });

  it('确认删除后调用 deleteSingleChunk', async () => {
    mockGetChunkDetail.mockResolvedValueOnce({
      id: 'c1',
      content: '内容',
      sourceFile: 'test.md',
      headingText: 'H1',
      storedAt: null,
    });
    mockDeleteChunks.mockResolvedValueOnce(undefined);

    const store = await getStore();
    store.setState({ detailChunkId: 'c1', error: null });

    const ChunkDetailModal = await loadComponent();
    render(<ChunkDetailModal />);

    await waitFor(() => {
      expect(screen.getByText('切片详情')).toBeInTheDocument();
    });

    // 点击删除按钮
    fireEvent.click(screen.getByText('删除此切片'));
    // 点击确认
    fireEvent.click(screen.getByText('确定'));

    await waitFor(() => {
      expect(mockDeleteChunks).toHaveBeenCalledWith(['c1']);
      expect(store.getState().detailChunkId).toBeNull();
    });
  });
});
