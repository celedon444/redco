// src/pages/PaginaFamiliarPerdido.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  crearReporteFamiliar,
  listarReportesFamiliar,
  actualizarReporteFamiliar,
  eliminarReporteFamiliar,
} from '@/services/api';
import { ReporteFamiliarPerdido, DtoCrearReporteFamiliar } from '@/types/modelos';

export default function PaginaFamiliarPerdido() {
  const { estaAutenticado } = useAuth();
  const [reportes, setReportes] = useState<ReporteFamiliarPerdido[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<ReporteFamiliarPerdido | null>(null);

  useEffect(() => {
    if (estaAutenticado) {
      cargarReportes();
    }
  }, [estaAutenticado]);

  const cargarReportes = async () => {
    setCargando(true);
    try {
      const respuesta = await listarReportesFamiliar();
      setReportes(respuesta.data);
    } catch (error: any) {
      setMensaje(error.response?.data?.message || 'Error al cargar reportes');
    } finally {
      setCargando(false);
    }
  };

  const manejarGuardar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget as HTMLFormElement);
    const datos: DtoCrearReporteFamiliar = {
      nombreCompleto: (formulario.get('nombreCompleto') as string) ?? '',
      edad: formulario.get('edad') ? Number(formulario.get('edad')) : undefined,
      genero: (formulario.get('genero') as string) || undefined,
      telefono: (formulario.get('telefono') as string) || undefined,
      ultimaUbicacion: (formulario.get('ultimaUbicacion') as string) || undefined,
      descripcion: (formulario.get('descripcion') as string) || undefined,
    };
    setCargando(true);
    try {
      if (editando) {
        await actualizarReporteFamiliar(editando.id, datos);
        setMensaje('Reporte actualizado.');
      } else {
        await crearReporteFamiliar(datos);
        setMensaje('Familiar reportado.');
      }
      setAbierto(false);
      setEditando(null);
      cargarReportes();
    } catch (error: any) {
      setMensaje(error.response?.data?.message || 'Error al guardar');
    } finally {
      setCargando(false);
    }
  };

  const manejarEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este reporte?')) return;
    try {
      await eliminarReporteFamiliar(id);
      setMensaje('Reporte eliminado.');
      cargarReportes();
    } catch (error: any) {
      setMensaje(error.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="app-bg min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="panel-in flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Operación
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Familiar Perdido
            </h1>
          </div>
          <button
            onClick={() => { setEditando(null); setAbierto(true); }}
            disabled={!estaAutenticado}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-5 rounded-lg transition shadow-lg shadow-blue-900/40 disabled:opacity-50"
          >
            + Publicar familiar perdido
          </button>
        </div>

        {mensaje && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 text-blue-200 rounded-lg text-sm">
            {mensaje}
          </div>
        )}

        {!estaAutenticado && (
          <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 flex items-center justify-between">
            <span>Inicia sesión para reportar o buscar familiares perdidos.</span>
            <a href="/login" className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-sm text-yellow-100 transition font-medium">
              Iniciar sesión
            </a>
          </div>
        )}

        <div className="glass panel-in rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 border-b border-white/10">
              <tr>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nombre
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Edad
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Estado
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Reportado por
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reportes.map((reporte) => (
                <tr key={reporte.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 text-white">{reporte.nombreCompleto}</td>
                  <td className="p-3 text-slate-300">{reporte.edad ?? '-'}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        reporte.estado === 'VALIDADO'
                          ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                          : reporte.estado === 'RECHAZADO'
                          ? 'border-rose-400/30 bg-rose-500/15 text-rose-300'
                          : 'border-blue-400/30 bg-blue-500/15 text-blue-300'
                      }`}
                    >
                      {reporte.estado}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{reporte.reportadoPor?.nombre ?? '-'}</td>
                  <td className="p-3">
                    {editando?.id === reporte.id ? (
                      <button onClick={() => setEditando(null)} className="text-xs text-slate-400 hover:text-white underline">
                        Cancelar
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditando(reporte)}
                          className="text-xs text-blue-400 hover:text-blue-300 underline mr-2"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => manejarEliminar(reporte.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 underline"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(abierto || editando) && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 md:p-8">
            <div className="bg-slate-900 p-6 rounded-2xl border border-white/10 max-w-md w-full shadow-2xl shadow-black/50">
              <h2 className="text-lg font-bold text-white mb-4">
                {editando ? 'Editar' : 'Nuevo'} reporte de familiar
              </h2>
              <form onSubmit={manejarGuardar} className="space-y-3">
                <input
                  name="nombreCompleto"
                  placeholder="Nombre completo"
                  defaultValue={editando?.nombreCompleto}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="edad"
                    type="number"
                    placeholder="Edad"
                    defaultValue={editando?.edad ?? ''}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                  />
                  <input
                    name="genero"
                    placeholder="Género"
                    defaultValue={editando?.genero ?? ''}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <input
                  name="telefono"
                  placeholder="Teléfono"
                  defaultValue={editando?.telefono ?? ''}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                />
                <input
                  name="ultimaUbicacion"
                  placeholder="Última ubicación"
                  defaultValue={editando?.ultimaUbicacion ?? ''}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                />
                <input
                  name="descripcion"
                  placeholder="Descripción"
                  defaultValue={editando?.descripcion ?? ''}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={cargando}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {cargando ? 'Guardando...' : 'Guardar'}
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
