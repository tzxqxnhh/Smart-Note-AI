import * as fs from 'fs/promises';
import * as path from 'path';
import type { FileNode } from '../../shared/types';

/**
 * 递归列出目录内容
 * 纯函数，不依赖 Electron
 */
export async function listDirectory(dirPath: string): Promise<FileNode[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const result: FileNode[] = [];

  for (const entry of entries) {
    // 跳过隐藏文件（以 . 开头）
    if (entry.name.startsWith('.')) continue;
    // 跳过 node_modules
    if (entry.name === 'node_modules') continue;

    const fullPath = path.join(dirPath, entry.name);
    const node: FileNode = {
      name: entry.name,
      path: fullPath,
      isDirectory: entry.isDirectory(),
    };

    if (entry.isDirectory()) {
      node.children = await listDirectory(fullPath);
    }

    result.push(node);
  }

  // 排序：目录优先，然后按名称排序（不区分大小写）
  result.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return result;
}

/**
 * 读取文件内容（UTF-8）
 */
export async function readFileContent(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * 写入文件内容
 */
export async function writeFileContent(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * 创建空文件
 */
export async function createEmptyFile(parentDir: string, name: string): Promise<void> {
  const filePath = path.join(parentDir, name);
  await fs.writeFile(filePath, '', 'utf-8');
}

/**
 * 创建目录
 */
export async function createNewDirectory(parentDir: string, name: string): Promise<void> {
  await fs.mkdir(path.join(parentDir, name));
}

/**
 * 重命名文件或目录
 */
export async function renameItem(oldPath: string, newName: string): Promise<void> {
  const parentDir = path.dirname(oldPath);
  const newPath = path.join(parentDir, newName);
  await fs.rename(oldPath, newPath);
}

/**
 * 删除文件或目录（递归删除目录）
 */
export async function deleteItemFromDisk(itemPath: string): Promise<void> {
  await fs.rm(itemPath, { recursive: true, force: true });
}

/**
 * 检查路径是否存在
 */
async function pathExists(checkPath: string): Promise<boolean> {
  try {
    await fs.access(checkPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 复制文件或目录到目标目录
 * 如果目标已存在同名文件，自动追加 " - 副本" 后缀
 * 纯函数，不依赖 Electron
 */
export async function copyItem(sourcePath: string, destDir: string): Promise<void> {
  const name = path.basename(sourcePath);
  let destPath = path.join(destDir, name);

  // 处理名称冲突：追加 " - 副本" 后缀
  if (await pathExists(destPath)) {
    const ext = path.extname(name);
    const baseName = ext ? name.slice(0, -ext.length) : name;
    destPath = path.join(destDir, `${baseName} - 副本${ext}`);
  }

  await fs.cp(sourcePath, destPath, { recursive: true });
}
