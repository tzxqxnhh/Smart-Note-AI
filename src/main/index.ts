import { app, BrowserWindow, shell } from 'electron';
import { join, resolve } from 'path';
import { readFileSync } from 'fs';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { setupIPC } from './ipc/index';

/**
 * 加载 .env 文件中的环境变量
 * 必须在其他模块导入之前加载，确保服务模块能读取到环境变量
 */
function loadEnvFile(): void {
  try {
    const envPath = resolve(__dirname, '../../.env');
    const content = readFileSync(envPath, 'utf-8');
    for (let line of content.split('\n')) {
      line = line.trim();
      // 跳过空行和注释行
      if (!line || line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) continue;
      const key = line.slice(0, eqIndex).trim();
      let value = line.slice(eqIndex + 1).trim();
      // 移除引号包裹
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env 文件不存在时静默跳过
  }
}

// 在模块加载后立即加载 .env，确保后续服务初始化时可用
loadEnvFile();

// 禁用 GPU 硬件加速，消除 Windows 上 GPU 虚拟化报错
// （这是一个笔记应用，不需要 GPU 渲染）
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-direct-composition');

function createWindow(): BrowserWindow {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // 开发环境加载 dev server，生产环境加载构建文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

// 应用准备就绪后创建窗口
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.demo.smart-note');

  // 开发环境默认打开或关闭 F12 开发者工具
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  const mainWindow = createWindow();

  // 注册所有 IPC 处理器（传入主窗口引用，供 LLM 流式推送使用）
  setupIPC(mainWindow);

  app.on('activate', () => {
    // macOS: 点击 dock 图标时如果没有窗口则重新创建
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
