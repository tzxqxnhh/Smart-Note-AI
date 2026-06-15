import { MainLayout } from './components/layout/MainLayout';
import { SearchBar } from './components/search/SearchBar';
import { RagSettingsPanel } from './components/rag/RagSettingsPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  useKeyboardShortcuts();

  return (
    <>
      <MainLayout />
      <SearchBar />
      <RagSettingsPanel />
    </>
  );
}

export default App;
