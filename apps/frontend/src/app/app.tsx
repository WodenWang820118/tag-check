import { ThemeProvider } from '@/components/theme-provider';
import { Route, Routes } from 'react-router-dom';
import Home from './home/home';
import Project from './project';
import TestDetail from './test-detail';

export function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:id/test" element={<TestDetail />} />
        <Route path="/project/:id" element={<Project />} />
      </Routes>
      {/* <NxWelcome title="frontend" /> */}
    </ThemeProvider>
  );
}

export default App;
