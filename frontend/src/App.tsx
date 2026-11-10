import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';

import Header from '@/components/Header';
import AssignmentPage from '@/pages/AssignmentPage';
import DashboardPage from '@/pages/DashboardPage';
import MapPage from '@/pages/MapPage';
import ResourcesPage from '@/pages/ResourcesPage';
import PaginaVoluntariado from '@/pages/PaginaVoluntariado';
import PaginaPersonasDanadas from '@/pages/PaginaPersonasDanadas';
import PaginaFamiliarPerdido from '@/pages/PaginaFamiliarPerdido';
import PaginaIncidentes from '@/pages/PaginaIncidentes';
import PaginaLogin from '@/pages/PaginaLogin';
import PaginaRegistro from '@/pages/PaginaRegistro';

function AppRouter() {
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
            <Route path="/voluntariado" element={<PaginaVoluntariado />} />
            <Route path="/personas-danadas" element={<PaginaPersonasDanadas />} />
            <Route path="/familiar-perdido" element={<PaginaFamiliarPerdido />} />
            <Route path="/incidentes" element={<PaginaIncidentes />} />
            <Route path="/login" element={<PaginaLogin />} />
            <Route path="/registro" element={<PaginaRegistro />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}