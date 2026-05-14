import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Titlebar } from './components/layout/Titlebar';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { ToastProvider } from './components/ui/Toast';
import { TooltipProvider } from './components/ui/Tooltip';
import { EncodePage } from './pages/EncodePage';
import { DecodePage } from './pages/DecodePage';
import { AnalyzePage } from './pages/AnalyzePage';
import { SettingsPage } from './pages/SettingsPage';
import { TestBenchPage } from './pages/TestBenchPage';
import { AboutPage } from './pages/AboutPage';
import { useAppStore } from './store/app';
import './styles/globals.css';
import './styles/components.css';
import './styles/layout.css';

export default function App() {
  const { theme } = useAppStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <TooltipProvider>
        <ToastProvider>
          <div className="app-shell">
            <Titlebar />
            <Sidebar />
            <main className="main-content">
              <div className="mesh-bg" />
              <Routes>
                <Route path="/" element={<Navigate to="/encode" replace />} />
                <Route path="/encode" element={<EncodePage />} />
                <Route path="/decode" element={<DecodePage />} />
                <Route path="/analyze" element={<AnalyzePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/testbench" element={<TestBenchPage />} />
                <Route path="/about" element={<AboutPage />} />
              </Routes>
            </main>
            <StatusBar />
          </div>
        </ToastProvider>
      </TooltipProvider>
    </BrowserRouter>
  );
}
