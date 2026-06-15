/**
 * IPC 客户端封装
 * 对 window.electronAPI 做类型化包装，统一错误处理
 */

import type { FileNode, SearchResult, RagResponse, IndexStats, ChatMessage } from '@shared/types';

function getAPI() {
  if (!window.electronAPI) {
    throw new Error('electronAPI 不可用，请确保在 Electron 环境中运行');
  }
  return window.electronAPI;
}

function wrap<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((err: Error) => {
    console.error('[IPC Error]', err.message);
    throw err;
  });
}

// 工作空间
export async function selectDirectory(): Promise<string | null> {
  return wrap(getAPI().selectDirectory());
}

export async function getWorkspacePath(): Promise<string | null> {
  return wrap(getAPI().getWorkspacePath());
}

// 文件操作
export async function readFile(filePath: string): Promise<string> {
  return wrap(getAPI().readFile(filePath));
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  return wrap(getAPI().writeFile(filePath, content));
}

export async function listDirectory(dirPath: string) {
  return wrap(getAPI().listDirectory(dirPath));
}

export async function createFile(parentDir: string, name: string): Promise<void> {
  return wrap(getAPI().createFile(parentDir, name));
}

export async function createDirectory(parentDir: string, name: string): Promise<void> {
  return wrap(getAPI().createDirectory(parentDir, name));
}

export async function rename(oldPath: string, newName: string): Promise<void> {
  return wrap(getAPI().rename(oldPath, newName));
}

export async function deleteItem(itemPath: string): Promise<void> {
  return wrap(getAPI().deleteItem(itemPath));
}

export async function trashItem(itemPath: string): Promise<void> {
  return wrap(getAPI().trashItem(itemPath));
}

export async function copyItem(sourcePath: string, destDir: string): Promise<void> {
  return wrap(getAPI().copyItem(sourcePath, destDir));
}

// 搜索
export async function searchFiles(query: string, rootPath: string) {
  return wrap(getAPI().searchFiles(query, rootPath));
}

// RAG
export async function ragIndexAll(workspacePath: string) {
  return wrap(getAPI().ragIndexAll(workspacePath));
}

export async function ragQuery(query: string) {
  return wrap(getAPI().ragQuery(query));
}

export async function ragGetStatus() {
  return wrap(getAPI().ragGetStatus());
}

export async function ragResetIndex() {
  return wrap(getAPI().ragResetIndex());
}

// LLM
export async function llmChat(messages: unknown[]) {
  return wrap(getAPI().llmChat(messages));
}

export async function llmSummarize(text: string) {
  return wrap(getAPI().llmSummarize(text));
}

export async function llmExpand(text: string) {
  return wrap(getAPI().llmExpand(text));
}

export async function llmFormat(text: string) {
  return wrap(getAPI().llmFormat(text));
}

export async function llmGenerateTree(folderPath: string) {
  return wrap(getAPI().llmGenerateTree(folderPath));
}

// 事件监听
export function onFileChanged(callback: (event: unknown) => void): () => void {
  return getAPI().onFileChanged(callback);
}

export function onIndexProgress(callback: (data: unknown) => void): () => void {
  return getAPI().onIndexProgress(callback);
}
