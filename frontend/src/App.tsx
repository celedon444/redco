import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Header from '@/components/Header';
import AssignmentPage from '@/pages/AssignmentPage';
import DashboardPage from '@/pages/DashboardPage';
import MapPage from '@/pages/MapPage';
import ResourcesPage from '@/pages/ResourcesPage';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen flex-col bg-[#070d19]">
        <Header />
        <main className="min-h-0 flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/resumen" element={<DashboardPage />} />
            <Route path="/asignaciones" element={<AssignmentPage />} />
            <Route path="/recursos" element={<ResourcesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;