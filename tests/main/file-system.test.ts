import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// 文件系统操作函数（在 src/main/services/file-ops.ts 中实现）
// 这里导入纯函数进行测试，不依赖 Electron
import { listDirectory, readFileContent, writeFileContent, createEmptyFile, createNewDirectory, renameItem, deleteItemFromDisk, copyItem } from '../../src/main/services/file-ops';

describe('文件系统操作', () => {
  let testDir: string;

  beforeEach(async () => {
    // 创建临时测试目录
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smart-note-test-'));
    // 创建测试文件结构
    await fs.writeFile(path.join(testDir, 'test.md'), '# 测试笔记\n\n内容行 1\n内容行 2', 'utf-8');
    await fs.mkdir(path.join(testDir, 'subfolder'));
    await fs.writeFile(path.join(testDir, 'subfolder', 'note1.md'), '## 子笔记\n\n内容', 'utf-8');
    await fs.writeFile(path.join(testDir, 'subfolder', 'note2.md'), '## 另一个笔记', 'utf-8');
  });

  afterEach(async () => {
    // 清理临时目录
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  describe('listDirectory', () => {
    it('应该列出根目录的文件和文件夹', async () => {
      const result = await listDirectory(testDir);
      expect(result).toHaveLength(2);
      expect(result.map((n) => n.name).sort()).toEqual(['subfolder', 'test.md']);
      const folder = result.find((n) => n.isDirectory);
      expect(folder!.children).toHaveLength(2);
    });

    it('空目录应该返回空数组', async () => {
      const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smart-note-empty-'));
      try {
        const result = await listDirectory(emptyDir);
        expect(result).toHaveLength(0);
      } finally {
        await fs.rm(emptyDir, { recursive: true, force: true }).catch(() => {});
      }
    });

    it('不存在的目录应该抛出错误', async () => {
      await expect(listDirectory(path.join(testDir, 'nonexistent'))).rejects.toThrow();
    });
  });

  describe('readFileContent', () => {
    it('应该读取文件内容', async () => {
      const content = await readFileContent(path.join(testDir, 'test.md'));
      expect(content).toContain('# 测试笔记');
      expect(content).toContain('内容行 1');
    });

    it('不存在的文件应该抛出错误', async () => {
      await expect(readFileContent(path.join(testDir, 'nonexistent.md'))).rejects.toThrow();
    });
  });

  describe('writeFileContent', () => {
    it('应该写入文件内容', async () => {
      const filePath = path.join(testDir, 'new.md');
      await writeFileContent(filePath, '# 新文件');
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('# 新文件');
    });

    it('应该覆盖已有文件', async () => {
      const filePath = path.join(testDir, 'test.md');
      await writeFileContent(filePath, '# 覆盖内容');
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('# 覆盖内容');
    });
  });

  describe('createEmptyFile', () => {
    it('应该创建空文件', async () => {
      await createEmptyFile(testDir, 'empty.md');
      const stat = await fs.stat(path.join(testDir, 'empty.md'));
      expect(stat.isFile()).toBe(true);
      const content = await fs.readFile(path.join(testDir, 'empty.md'), 'utf-8');
      expect(content).toBe('');
    });
  });

  describe('createNewDirectory', () => {
    it('应该创建目录', async () => {
      await createNewDirectory(testDir, 'newdir');
      const stat = await fs.stat(path.join(testDir, 'newdir'));
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('renameItem', () => {
    it('应该重命名文件', async () => {
      await renameItem(path.join(testDir, 'test.md'), 'renamed.md');
      const exists = await fs.access(path.join(testDir, 'renamed.md')).then(() => true).catch(() => false);
      const oldExists = await fs.access(path.join(testDir, 'test.md')).then(() => true).catch(() => false);
      expect(exists).toBe(true);
      expect(oldExists).toBe(false);
    });

    it('应该重命名目录', async () => {
      await renameItem(path.join(testDir, 'subfolder'), 'renamed-folder');
      const exists = await fs.access(path.join(testDir, 'renamed-folder')).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('deleteItemFromDisk', () => {
    it('应该删除文件', async () => {
      await deleteItemFromDisk(path.join(testDir, 'test.md'));
      const exists = await fs.access(path.join(testDir, 'test.md')).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    it('应该递归删除目录', async () => {
      await deleteItemFromDisk(path.join(testDir, 'subfolder'));
      const exists = await fs.access(path.join(testDir, 'subfolder')).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });
  });

  describe('copyItem', () => {
    it('应该复制文件到目标目录', async () => {
      const destDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smart-note-copy-'));
      try {
        await copyItem(path.join(testDir, 'test.md'), destDir);
        const destFile = path.join(destDir, 'test.md');
        const exists = await fs.access(destFile).then(() => true).catch(() => false);
        expect(exists).toBe(true);
        // 原文件仍然存在
        const originalExists = await fs.access(path.join(testDir, 'test.md')).then(() => true).catch(() => false);
        expect(originalExists).toBe(true);
        // 内容应一致
        const originalContent = await fs.readFile(path.join(testDir, 'test.md'), 'utf-8');
        const copiedContent = await fs.readFile(destFile, 'utf-8');
        expect(copiedContent).toBe(originalContent);
      } finally {
        await fs.rm(destDir, { recursive: true, force: true }).catch(() => {});
      }
    });

    it('应该递归复制目录', async () => {
      const destDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smart-note-copy-'));
      try {
        await copyItem(path.join(testDir, 'subfolder'), destDir);
        const destFolder = path.join(destDir, 'subfolder');
        const exists = await fs.access(destFolder).then(() => true).catch(() => false);
        expect(exists).toBe(true);
        // 子文件应存在
        const childExists = await fs.access(path.join(destFolder, 'note1.md')).then(() => true).catch(() => false);
        expect(childExists).toBe(true);
      } finally {
        await fs.rm(destDir, { recursive: true, force: true }).catch(() => {});
      }
    });

    it('名称冲突时应追加 副本 后缀', async () => {
      const destDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smart-note-copy-'));
      try {
        // 先在目标目录创建一个同名文件
        await fs.writeFile(path.join(destDir, 'test.md'), '# 已有文件', 'utf-8');
        await copyItem(path.join(testDir, 'test.md'), destDir);
        // 应生成带副本后缀的文件
        const copyExists = await fs.access(path.join(destDir, 'test - 副本.md')).then(() => true).catch(() => false);
        expect(copyExists).toBe(true);
        // 原目标文件仍存在
        const existingExists = await fs.access(path.join(destDir, 'test.md')).then(() => true).catch(() => false);
        expect(existingExists).toBe(true);
      } finally {
        await fs.rm(destDir, { recursive: true, force: true }).catch(() => {});
      }
    });

    it('源路径不存在时应抛出错误', async () => {
      const destDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smart-note-copy-'));
      try {
        await expect(copyItem(path.join(testDir, 'nonexistent.md'), destDir)).rejects.toThrow();
      } finally {
        await fs.rm(destDir, { recursive: true, force: true }).catch(() => {});
      }
    });
  });
});
