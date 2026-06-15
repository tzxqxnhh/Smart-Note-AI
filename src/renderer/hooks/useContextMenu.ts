import { useState, useCallback, useEffect, useRef } from 'react';

interface ContextMenuState {
  isVisible: boolean;
  x: number;
  y: number;
  targetPath: string | null;
  targetName: string | null;
  isDirectory: boolean;
}

export function useContextMenu() {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    isVisible: false,
    x: 0,
    y: 0,
    targetPath: null,
    targetName: null,
    isDirectory: false,
  });

  const menuRef = useRef<HTMLDivElement>(null);

  const showMenu = useCallback((e: React.MouseEvent, path: string, name: string, isDir: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuState({
      isVisible: true,
      x: e.clientX,
      y: e.clientY,
      targetPath: path,
      targetName: name,
      isDirectory: isDir,
    });
  }, []);

  const hideMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, isVisible: false }));
  }, []);

  // 点击其他地方关闭菜单
  useEffect(() => {
    if (!menuState.isVisible) return;

    const handleClick = () => hideMenu();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideMenu();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuState.isVisible, hideMenu]);

  return { menuState, menuRef, showMenu, hideMenu };
}
