import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock ipc-client
vi.mock('@/lib/ipc-client', () => ({
  ragIndexFile: vi.fn().mockResolvedValue(undefined),
}));

describe('useRagSettingsStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  async function getStore() {
    const mod = await import('@/stores/useRagSettingsStore');
    return mod.useRagSettingsStore;
  }

  it('初始状态正确', async () => {
    const useRagSettingsStore = await getStore();
    const state = useRagSettingsStore.getState();

    expect(state.isOpen).toBe(false);
    expect(state.targetFilePath).toBeNull();
    expect(state.settings).toEqual({
      maxChunkSize: 2000,
      maxOverlap: 0,
      separator: '##',
    });
    expect(state.isIndexing).toBe(false);
  });

  it('openSettings 设置 isOpen 和 targetFilePath', async () => {
    const useRagSettingsStore = await getStore();
    useRagSettingsStore.getState().openSettings('D:\\notes\\test.md');

    const state = useRagSettingsStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.targetFilePath).toBe('D:\\notes\\test.md');
  });

  it('closeSettings 重置状态', async () => {
    const useRagSettingsStore = await getStore();
    useRagSettingsStore.getState().openSettings('D:\\notes\\test.md');
    useRagSettingsStore.getState().closeSettings();

    const state = useRagSettingsStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.targetFilePath).toBeNull();
  });

  it('setMaxChunkSize 更新 maxChunkSize', async () => {
    const useRagSettingsStore = await getStore();
    useRagSettingsStore.getState().setMaxChunkSize(500);

    expect(useRagSettingsStore.getState().settings.maxChunkSize).toBe(500);
  });

  it('setMaxOverlap 更新 maxOverlap', async () => {
    const useRagSettingsStore = await getStore();
    useRagSettingsStore.getState().setMaxOverlap(100);

    expect(useRagSettingsStore.getState().settings.maxOverlap).toBe(100);
  });

  it('setSeparator 更新 separator', async () => {
    const useRagSettingsStore = await getStore();
    useRagSettingsStore.getState().setSeparator('###');

    expect(useRagSettingsStore.getState().settings.separator).toBe('###');
  });

  it('confirmIndex 调用 ragIndexFile 并关闭窗口', async () => {
    const { ragIndexFile } = await import('@/lib/ipc-client');
    const useRagSettingsStore = await getStore();

    useRagSettingsStore.getState().openSettings('D:\\notes\\test.md');
    await useRagSettingsStore.getState().confirmIndex();

    expect(ragIndexFile).toHaveBeenCalledWith('D:\\notes\\test.md', {
      maxChunkSize: 2000,
      maxOverlap: 0,
      separator: '##',
    });

    const state = useRagSettingsStore.getState();
    expect(state.isOpen).toBe(false);
  });

  it('confirmIndex 在无 targetFilePath 时不做任何操作', async () => {
    const { ragIndexFile } = await import('@/lib/ipc-client');
    const useRagSettingsStore = await getStore();

    await useRagSettingsStore.getState().confirmIndex();

    expect(ragIndexFile).not.toHaveBeenCalled();
  });

  it('confirmIndex 错误时重置 isIndexing', async () => {
    const { ragIndexFile } = await import('@/lib/ipc-client');
    (ragIndexFile as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('索引失败'));
    const useRagSettingsStore = await getStore();

    useRagSettingsStore.getState().openSettings('D:\\notes\\test.md');
    await useRagSettingsStore.getState().confirmIndex();

    expect(useRagSettingsStore.getState().isIndexing).toBe(false);
    // 出错时窗口保持打开
    expect(useRagSettingsStore.getState().isOpen).toBe(true);
  });
});
