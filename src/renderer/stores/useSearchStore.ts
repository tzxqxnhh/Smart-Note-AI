import { create } from 'zustand';
import type { SearchResult } from '@shared/types';
import * as ipcClient from '../lib/ipc-client';

interface SearchState {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  isOpen: boolean;

  setQuery: (query: string) => void;
  performSearch: (query: string, rootPath: string) => Promise<void>;
  clearResults: () => void;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  results: [],
  isSearching: false,
  isOpen: false,

  setQuery: (query) => set({ query }),

  performSearch: async (query: string, rootPath: string) => {
    set({ isSearching: true, query });
    try {
      const results = await ipcClient.searchFiles(query, rootPath);
      set({ results });
    } catch (err) {
      console.error('搜索失败:', err);
      set({ results: [] });
    } finally {
      set({ isSearching: false });
    }
  },

  clearResults: () => set({ results: [], query: '' }),

  openSearch: () => set({ isOpen: true }),

  closeSearch: () => set({ isOpen: false, results: [], query: '' }),
}));
