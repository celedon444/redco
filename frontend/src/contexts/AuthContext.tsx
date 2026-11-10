import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Usuario, RolUsuario } from '@/types/modelos';

interface AuthContextType {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (token: string, datosUsuario: any) => void;
  cerrarSesion: () => void;
  estaAutenticado: boolean;
}

function normalizarUsuario(raw: any): Usuario | null {
  if (!raw) return null;
  const roleMap: Record<string, RolUsuario> = {
    ADMINISTRATOR: 'ADMINISTRADOR',
    ADMINISTRADOR: 'ADMINISTRADOR',
    CITIZEN: 'CIUDADANO',
    CIUDADANO: 'CIUDADANO',
    VOLUNTEER: 'VOLUNTARIO',
    VOLUNTARIO: 'VOLUNTARIO',
    RESPONSE_PERSONNEL: 'PERSONAL_RESPUESTA',
    PERSONAL_RESPUESTA: 'PERSONAL_RESPUESTA',
  };

  const rol = roleMap[raw.role || raw.rol] || 'CIUDADANO';
  const nombre = raw.firstName || raw.nombre || '';
  const apellido = raw.lastName || raw.apellido || '';

  return {
    id: raw.id,
    email: raw.email,
    nombre,
    apellido,
    telefono: raw.phone || raw.telefono,
    rol,
    estado: raw.status || raw.estado || 'ACTIVE',
    firstName: nombre,
    lastName: apellido,
    role: raw.role || (rol === 'ADMINISTRADOR' ? 'ADMINISTRATOR' : rol),
  } as unknown as Usuario;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioStr = localStorage.getItem('usuario');
    if (token && usuarioStr) {
      try {
        setUsuario(normalizarUsuario(JSON.parse(usuarioStr)));
      } catch {}
    }
    setCargando(false);
  }, []);

  const iniciarSesion = (token: string, datosUsuario: any) => {
    const normalizado = normalizarUsuario(datosUsuario);
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(normalizado));
    setUsuario(normalizado);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  const estaAutenticado = !!usuario;

  return (
    <AuthContext.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion, estaAutenticado }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
