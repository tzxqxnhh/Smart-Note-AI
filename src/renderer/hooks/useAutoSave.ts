import { useEffect, useRef } from 'react';
import { useEditorStore } from '../stores/useEditorStore';

/**
 * 自动保存 Hook
 * 监听编辑器内容变化，在用户停止输入 2 秒后自动保存
 */
export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 订阅 store 变化
    const unsubscribe = useEditorStore.subscribe((state, prevState) => {
      // 当内容变化时（脏标记出现），启动自动保存计时器
      const activeTabId = state.activeTabId;
      if (!activeTabId) return;

      const prevTab = prevState.tabs.find((t) => t.id === prevState.activeTabId);
      const currTab = state.tabs.find((t) => t.id === activeTabId);

      // 只有当前活动 Tab 变成脏状态时才启动计时器
      if (currTab && currTab.isDirty && (!prevTab || !prevTab.isDirty || prevTab.id !== currTab.id)) {
        // 清除之前的计时器
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        // 设置新的计时器（2 秒）
        timerRef.current = setTimeout(() => {
          const store = useEditorStore.getState();
          const tab = store.tabs.find((t) => t.id === activeTabId);
          if (tab && tab.isDirty) {
            store.saveFile(tab.filePath);
          }
        }, 2000);
      }
    });

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
}
