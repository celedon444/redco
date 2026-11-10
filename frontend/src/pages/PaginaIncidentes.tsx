// src/pages/PaginaIncidentes.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  crearIncidente,
  listarIncidentes,
  eliminarIncidente,
} from '@/services/api';
import {
  Incidente,
  DtoCrearIncidente,
  TipoIncidente,
  SeveridadIncidente,
  EstadoIncidente,
} from '@/types/modelos';

export default function PaginaIncidentes() {
  const { usuario, estaAutenticado } = useAuth();
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [abierto, setAbierto] = useState(false);
  const esAdministrador = usuario?.rol === 'ADMINISTRADOR' || (usuario as any)?.role === 'ADMINISTRATOR';

  useEffect(() => {
    if (esAdministrador) {
      cargarIncidentes();
    }
  }, [esAdministrador]);

  const cargarIncidentes = async () => {
    setCargando(true);
    try {
      const respuesta = await listarIncidentes();
      setIncidentes(respuesta.data);
    } catch (error: any) {
      setMensaje(error.response?.data?.message || 'Error al cargar incidentes');
    } finally {
      setCargando(false);
    }
  };

  const manejarEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este incidente?')) return;
    try {
      await eliminarIncidente(id);
      setMensaje('Incidente eliminado.');
      cargarIncidentes();
    } catch (error: any) {
      setMensaje(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const manejarCrear = async (evento: React.FormEvent) => {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget as HTMLFormElement);
    const datos: DtoCrearIncidente = {
      titulo: (formulario.get('titulo') as string) ?? '',
      descripcion: (formulario.get('descripcion') as string) ?? '',
      tipo: (formulario.get('tipo') as string) as TipoIncidente,
      severidad: (formulario.get('severidad') as string) as SeveridadIncidente,
      magnitud: formulario.get('magnitud') ? Number(formulario.get('magnitud')) : undefined,
      ubicacion: (formulario.get('ubicacion') as string) ?? '',
      inicioEn: (formulario.get('inicioEn') as string) ?? '',
      estado: ((formulario.get('estado') as string) as EstadoIncidente) || 'ACTIVO',
    };
    setCargando(true);
    try {
      await crearIncidente(datos);
      setMensaje('Sismo/incidente creado.');
      setAbierto(false);
      cargarIncidentes();
    } catch (error: any) {
      setMensaje(error.response?.data?.message || 'Error al crear incidente');
    } finally {
      setCargando(false);
    }
  };

  if (!esAdministrador) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center p-6">
        <div className="glass panel-in p-8 rounded-2xl max-w-md text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white mb-2">Acceso restringido</h2>
          <p className="text-slate-400 text-sm mb-4">
            Solo el administrador puede gestionar incidentes.
          </p>
          {!estaAutenticado ? (
            <a
              href="/login"
              className="inline-block px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition"
            >
              Iniciar sesión como Administrador
            </a>
          ) : (
            <p className="text-xs text-amber-400">
              Estás conectado como {usuario?.rol || (usuario as any)?.role}. Se requiere rol de ADMINISTRADOR.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="panel-in flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Administración
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Gestión de Incidentes / Sismos
            </h1>
          </div>
          <button
            onClick={() => setAbierto(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2.5 px-5 rounded-lg transition shadow-lg shadow-rose-900/40"
          >
            + Generar sismo / incidente
          </button>
        </div>

        {mensaje && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 text-blue-200 rounded-lg text-sm">
            {mensaje}
          </div>
        )}

        <div className="glass panel-in rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 border-b border-white/10">
              <tr>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Título
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tipo
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Severidad
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Magnitud
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Estado
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Inicio
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Creado por
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {incidentes.map((incidente) => (
                <tr key={incidente.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 text-white">{incidente.titulo}</td>
                  <td className="p-3 text-slate-300 capitalize">{incidente.tipo}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        incidente.severidad === 'CRITICAL'
                          ? 'border-rose-400/30 bg-rose-500/15 text-rose-300'
                          : incidente.severidad === 'HIGH'
                          ? 'border-amber-400/30 bg-amber-500/15 text-amber-300'
                          : incidente.severidad === 'MODERATE'
                          ? 'border-yellow-400/30 bg-yellow-500/15 text-yellow-300'
                          : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {incidente.severidad}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{incidente.magnitud ?? '-'}</td>
                  <td className="p-3 text-slate-300 capitalize">{incidente.estado}</td>
                  <td className="p-3 text-slate-300 text-xs">{incidente.inicioEn}</td>
                  <td className="p-3 text-slate-300">
                    {incidente.creadoPor.nombre} {incidente.creadoPor.apellido}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => manejarEliminar(incidente.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 underline transition"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {abierto && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 md:p-8">
            <div className="bg-slate-900 p-6 rounded-2xl border border-white/10 max-w-md w-full shadow-2xl shadow-black/50">
              <h2 className="text-lg font-bold text-white mb-4">Crear sismo</h2>
              <form onSubmit={manejarCrear} className="space-y-3">
                <input
                  name="titulo"
                  placeholder="Título (ej. Sismo Bogotá)"
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                  required
                />
                <input
                  name="descripcion"
                  placeholder="Descripción"
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                />
                <select
                  name="tipo"
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="EARTHQUAKE">Terremoto</option>
                  <option value="FLOOD">Inundación</option>
                  <option value="LANDSLIDE">Derrumbe</option>
                </select>
                <select
                  name="severidad"
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="LOW">Baja</option>
                  <option value="MODERATE">Moderada</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </select>
                <input
                  name="magnitud"
                  type="number"
                  step="0.1"
                  placeholder="Magnitud"
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                />
                <input
                  name="ubicacion"
                  placeholder="Epicentro (GeoJSON Point)"
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                />
                <input
                  name="inicioEn"
                  type="datetime-local"
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                  required
                />
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={cargando}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {cargando ? 'Creando...' : 'Crear sismo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbierto(false)}
                    className="flex-1 text-slate-400 hover:text-white underline transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
