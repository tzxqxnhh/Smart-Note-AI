import { MainLayout } from './components/layout/MainLayout';
import { SearchBar } from './components/search/SearchBar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  useKeyboardShortcuts();

  return (
    <>
      <MainLayout />
      <SearchBar />
    </>
  );
}

export default App;
