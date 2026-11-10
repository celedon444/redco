// src/pages/PaginaPersonasDanadas.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  crearCasoPersona,
  listarCasosPersona,
} from '@/services/api';
import {
  CasoPersona,
  EstadoCasoPersona,
  TipoVictima,
} from '@/types/modelos';

export default function PaginaPersonasDanadas() {
  const { estaAutenticado } = useAuth();
  const [casos, setCasos] = useState<CasoPersona[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (estaAutenticado) {
      cargarCasos();
    }
  }, [estaAutenticado]);

  const cargarCasos = async () => {
    setCargando(true);
    try {
      const respuesta = await listarCasosPersona();
      setCasos(respuesta.data);
    } catch (error: any) {
      setMensaje(error.response?.data?.message || 'Error al cargar damnificados');
    } finally {
      setCargando(false);
    }
  };

  const manejarCrear = async (evento: React.FormEvent) => {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget as HTMLFormElement);
    const datos: any = {
      incidenteId: (formulario.get('incidenteId') as string) || undefined,
      personaId: (formulario.get('personaId') as string) || undefined,
      nombre: (formulario.get('nombre') as string) || undefined,
      apellido: (formulario.get('apellido') as string) || undefined,
      telefono: (formulario.get('telefono') as string) || undefined,
      estado: ((formulario.get('estado') as string) as EstadoCasoPersona) ?? 'MISSING',
      victimType: ((formulario.get('victimType') as string) as TipoVictima) || undefined,
      descripcion: (formulario.get('descripcion') as string) || undefined,
      ultimaUbicacion: (formulario.get('ultimaUbicacion') as string) || undefined,
      trasladadoA: (formulario.get('trasladadoA') as string) || undefined,
      trasladadoEn: (formulario.get('trasladadoEn') as string) || undefined,
    };
    setCargando(true);
    try {
      await crearCasoPersona(datos);
      setMensaje('Reporte de damnificado creado.');
      setAbierto(false);
      cargarCasos();
    } catch (error: any) {
      setMensaje(error.response?.data?.message || 'Error al crear reporte');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="app-bg min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="panel-in flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Operación
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Personas Damnificadas / Reportadas
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
            <span>Inicia sesión para reportar o consultar personas damnificadas.</span>
            <a href="/login" className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-sm text-yellow-100 transition font-medium">
              Iniciar sesión
            </a>
          </div>
        )}

        <button
          onClick={() => setAbierto(true)}
          disabled={!estaAutenticado}
          className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg transition shadow-lg shadow-green-900/40 disabled:opacity-50"
        >
          + Reportar cuerpo o sobreviviente
        </button>

        <div className="glass panel-in mt-6 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 border-b border-white/10">
              <tr>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Persona
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Estado
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tipo víctima
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Última ubicación
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Trasladado a
                </th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Reportado por
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {casos.map((caso) => (
                <tr key={caso.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 text-white">{caso.persona.nombre} {caso.persona.apellido}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        caso.victimType === 'DECEASED'
                          ? 'border-rose-400/30 bg-rose-500/15 text-rose-300'
                          : caso.victimType === 'INJURED'
                          ? 'border-amber-400/30 bg-amber-500/15 text-amber-300'
                          : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {caso.victimType || '—'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{caso.estado}</td>
                  <td className="p-3 text-slate-300">{caso.ultimaUbicacion || '-'}</td>
                  <td className="p-3 text-slate-300">{caso.trasladadoA || '-'}</td>
                  <td className="p-3 text-slate-300">{caso.reportadoPor?.nombre || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {abierto && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 md:p-8">
            <div className="bg-slate-900 p-6 rounded-2xl border border-white/10 max-w-md w-full shadow-2xl shadow-black/50">
              <h2 className="text-lg font-bold text-white mb-4">Nuevo reporte de damnificado</h2>
              <form onSubmit={manejarCrear} className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nombre</label>
                    <input
                      name="nombre"
                      placeholder="Ej. Juan"
                      className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Apellido</label>
                    <input
                      name="apellido"
                      placeholder="Ej. Pérez"
                      className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">ID Incidente (opcional)</label>
                    <input
                      name="incidenteId"
                      placeholder="Autodetectar si se omite"
                      className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono (opcional)</label>
                    <input
                      name="telefono"
                      placeholder="Ej. 3001234567"
                      className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Estado</label>
                    <select
                      name="estado"
                      className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="MISSING">Desaparecido</option>
                      <option value="UNDER_VERIFICATION">En verificación</option>
                      <option value="LOCATED">Localizado</option>
                      <option value="DECEASED_CONFIRMED">Fallecido confirmado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Tipo víctima</label>
                    <select
                      name="victimType"
                      className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="">Tipo víctima (opcional)</option>
                      <option value="DECEASED">Fallecido</option>
                      <option value="INJURED">Herido</option>
                      <option value="SAFE">Sana</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Descripción</label>
                  <input
                    name="descripcion"
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Última ubicación</label>
                  <input
                    name="ultimaUbicacion"
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                    placeholder="GeoJSON Point"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Trasladado a</label>
                  <input
                    name="trasladadoA"
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                    placeholder="Hospital, etc."
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={cargando}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
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
