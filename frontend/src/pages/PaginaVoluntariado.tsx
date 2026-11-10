// src/pages/PaginaVoluntariado.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  solicitarVoluntariado,
  obtenerMiSolicitud,
  listarTodasLasSolicitudes,
  revisarSolicitud,
} from '@/services/api';
import { SolicitudVoluntariado, DtoSolicitarVoluntariado } from '@/types/modelos';

export default function PaginaVoluntariado() {
  const { usuario, estaAutenticado } = useAuth();
  const [miSolicitud, setMiSolicitud] = useState<SolicitudVoluntariado | null>(null);
  const [todasSolicitudes, setTodasSolicitudes] = useState<SolicitudVoluntariado[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const esAdmin = usuario?.rol === 'ADMINISTRADOR' || (usuario as any)?.role === 'ADMINISTRATOR';

  useEffect(() => {
    if (estaAutenticado) {
      cargarMiSolicitud();
      if (esAdmin) {
        cargarTodas();
      }
    }
  }, [estaAutenticado, esAdmin]);

  const cargarMiSolicitud = async () => {
    if (!estaAutenticado) return;
    setCargando(true);
    try {
      const respuesta = await obtenerMiSolicitud();
      setMiSolicitud(respuesta.data);
    } catch (error: any) {
      setMensaje(error.response?.data?.message || 'Error al cargar solicitud');
    } finally {
      setCargando(false);
    }
  };

  const manejarSolicitar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget as HTMLFormElement);
    const datos: DtoSolicitarVoluntariado = {
      organizacionId: (formulario.get('organizacionId') as string) || undefined,
      notas: (formulario.get('notas') as string) || undefined,
    };
    setCargando(true);
    try {
      await solicitarVoluntariado(datos);
      setMensaje('Solicitud enviada. Espera la aprobación del administrador.');
      cargarMiSolicitud();
    } catch (error: any) {
      setMensaje(error.response?.data?.message || 'Error al solicitar');
    } finally {
      setCargando(false);
    }
  };

  const manejarRevisar = async (id: string, estado: 'APROBADA' | 'RECHAZADA') => {
    setCargando(true);
    try {
      await revisarSolicitud(id, { estado });
      setMensaje(`Solicitud ${estado.toLowerCase()}.`);
      const respuesta = await listarTodasLasSolicitudes();
      setTodasSolicitudes(respuesta.data);
    } catch (error: any) {
      setMensaje(error.response?.data?.message || 'Error al revisar');
    } finally {
      setCargando(false);
    }
  };

  const cargarTodas = async () => {
    setCargando(true);
    try {
      const respuesta = await listarTodasLasSolicitudes();
      setTodasSolicitudes(respuesta.data);
    } catch (error: any) {
      setMensaje(error.response?.data?.message || 'Error al cargar solicitudes');
    } finally {
      setCargando(false);
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
              Voluntariado / Organismos de Ayuda
            </h1>
          </div>
        </div>

        {mensaje && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 text-blue-200 rounded-lg text-sm">
            {mensaje}
          </div>
        )}

        {!estaAutenticado && (
          <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 flex items-center justify-between">
            <span>Inicia sesión para postularte como voluntario o gestionar solicitudes.</span>
            <a href="/login" className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-sm text-yellow-100 transition font-medium">
              Iniciar sesión
            </a>
          </div>
        )}

        {!esAdmin && estaAutenticado && (
          <>
            {!miSolicitud && (
              <section className="glass panel-in p-6 mb-6 rounded-2xl">
                <h2 className="text-lg font-bold text-white mb-4">Solicitar ser voluntario</h2>
                <form onSubmit={manejarSolicitar} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Organización (opcional)
                      </label>
                      <input
                        name="organizacionId"
                        className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                        placeholder="ID de organización"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Notas</label>
                      <textarea
                        name="notas"
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                        placeholder="¿Por qué quieres ayudar?"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={cargando} className="w-full bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-semibold py-3 rounded-lg transition shadow-lg shadow-rose-900/40 disabled:opacity-50">
                    {cargando ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </form>
              </section>
            )}

            {miSolicitud && (
              <section className="glass panel-in p-6 mb-6 rounded-2xl">
                <h2 className="text-lg font-bold text-white mb-4">Tu solicitud</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-slate-400 uppercase">Estado</p>
                    <p className="text-lg font-bold text-white">{miSolicitud.estado}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-slate-400 uppercase">Organización</p>
                    <p className="text-lg font-bold text-white">
                      {miSolicitud.organizacionId || 'Ninguna (voluntario individual)'}
                    </p>
                  </div>
                </div>
                {miSolicitud.notas && (
                  <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-slate-400 uppercase">Notas</p>
                    <p className="text-white">{miSolicitud.notas}</p>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {esAdmin && (
          <section className="glass panel-in p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Todas las solicitudes (Administrador)</h2>
              <button
                onClick={cargarTodas}
                className="text-sm text-rose-300 hover:text-white underline"
              >
                Refrescar lista
              </button>
            </div>
            <ul className="divide-y divide-white/10">
              {todasSolicitudes.length === 0 && (
                <li className="p-4 text-center text-slate-400">
                  No hay solicitudes pendientes.
                </li>
              )}
              {todasSolicitudes.map((solicitud) => (
                <li key={solicitud.id} className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">
                        Usuario ID: {solicitud.usuarioId}
                      </p>
                      <p className="text-sm text-slate-400">
                        {solicitud.estado}
                      </p>
                    </div>
                    {solicitud.estado === 'PENDIENTE' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => manejarRevisar(solicitud.id, 'APROBADA')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-4 rounded-lg text-sm font-semibold transition"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => manejarRevisar(solicitud.id, 'RECHAZADA')}
                          className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 px-4 rounded-lg text-sm font-semibold transition"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
