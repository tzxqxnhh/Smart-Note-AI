import * as fs from 'fs/promises';
import * as path from 'path';
import type { SearchResult, SearchMatch } from '../../shared/types';

/**
 * 递归搜索目录中的 .md 文件，匹配文件名和内容
 */
export async function searchFiles(
  query: string,
  rootPath: string,
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  async function walk(dirPath: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch {
      return; // 跳过无法读取的目录
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // 跳过隐藏、node_modules、.git
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.md')) {
        const matches: SearchMatch[] = [];

        // 文件名匹配
        if (entry.name.toLowerCase().includes(lowerQuery)) {
          matches.push({
            line: 0,
            text: entry.name,
            startIndex: entry.name.toLowerCase().indexOf(lowerQuery),
            endIndex: entry.name.toLowerCase().indexOf(lowerQuery) + query.length,
          });
        }

        // 内容匹配
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const lowerLine = lines[i].toLowerCase();
            const idx = lowerLine.indexOf(lowerQuery);
            if (idx !== -1) {
              matches.push({
                line: i + 1,
                text: lines[i].trim(),
                startIndex: idx,
                endIndex: idx + query.length,
              });
            }
          }
        } catch {
          // 跳过无法读取的文件
          continue;
        }

        if (matches.length > 0) {
          results.push({
            filePath: fullPath,
            fileName: entry.name,
            matches,
          });
        }
      }
    }
  }

  await walk(rootPath);
  return results;
}
