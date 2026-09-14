import { useMemo } from 'react';

import ElapsedTimer from '@/components/ElapsedTimer';
import { useCountUp } from '@/hooks/useCountUp';
import { useMapOverview } from '@/hooks/useMapOverview';
import {
  RESOURCE_BY_KIND,
  RESOURCE_KEYS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  ZONE_COLORS,
  ZONE_LEVELS,
  formatCoords,
  formatDate,
  pointToLatLng,
  type StatsShape,
} from '@/lib/overview';

const SEVERITY_ORDER = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

function Kpi({
  icon,
  label,
  value,
  delay,
  accent,
  sub,
}: {
  icon: string;
  label: string;
  value: number;
  delay: number;
  accent: string;
  sub?: string;
}) {
  const text = useCountUp(value, 1200 + delay);
  return (
    <div
      className="glass panel-in relative overflow-hidden p-4 text-white"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-30 blur-2xl"
        style={{ background: accent }}
      />
      <div className="relative">
        <span
          className="mb-2 grid h-10 w-10 place-items-center rounded-xl text-lg"
          style={{
            background: `${accent}1f`,
            boxShadow: `inset 0 0 0 1px ${accent}40`,
          }}
        >
          {icon}
        </span>
        <div className="text-2xl font-extrabold tabular-nums">{text}</div>
        <div className="mt-0.5 text-xs text-slate-400">{label}</div>
        {sub && (
          <div className="mt-1 text-[10px] font-medium text-slate-500">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="app-bg flex h-full items-center justify-center text-white">
      <div className="panel-in w-64 text-center">
        <div className="animate-soft-float mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 shadow-2xl shadow-rose-900/50">
          <span className="text-3xl">🛰️</span>
        </div>
        <p className="mb-4 mt-4 text-sm text-slate-400">Cargando resumen…</p>
        <div className="shimmer-bar h-1.5 w-full" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { overview, loading, error, reload } = useMapOverview();

  const stats = useMemo(
    () => (overview?.stats ?? {}) as StatsShape,
    [overview],
  );
  const resourcesByKind = useMemo(() => stats.resourcesByKind ?? {}, [stats]);
  const zonesByLevel = useMemo(() => stats.zonesByLevel ?? {}, [stats]);
  const unitsByStatus = stats.unitsByStatus ?? {};

  const populationAffected =
    overview?.zones.features.reduce(
      (acc, feature) => acc + (feature.properties.estimatedAffected ?? 0),
      0,
    ) ?? 0;

  const totalUnits = overview?.resources.features.filter(
    (feature) => feature.properties.category === 'unit',
  ).length;

  if (loading) return <LoadingState />;

  if (error || !overview || !overview.incident) {
    return (
      <div className="app-bg flex h-full items-center justify-center text-white">
        <div className="glass panel-in max-w-md p-6 text-center">
          <div className="animate-soft-float mb-2 inline-block text-4xl">🛰️</div>
          <h2 className="mb-1 text-lg font-semibold">Resumen no disponible</h2>
          <p className="text-sm text-slate-400">
            {error ?? 'No hay datos cargados. Ejecuta el seed del backend.'}
          </p>
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-4 rounded-lg bg-gradient-to-r from-rose-600 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-900/40 transition hover:from-rose-500 hover:to-orange-400"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { incident } = overview;
  const epicenter = incident.epicenter
    ? pointToLatLng(incident.epicenter.geometry)
    : null;
  const maxZones = Math.max(
    1,
    ...ZONE_LEVELS.map((lvl) => zonesByLevel[lvl] ?? 0),
  );

  const mini = [
    {
      icon: '🚑',
      label: 'Ambulancias',
      value: resourcesByKind.ambulance ?? 0,
      accent: '#22d3ee',
      last: false,
    },
    {
      icon: '✅',
      label: 'Disponibles',
      value: unitsByStatus.AVAILABLE ?? 0,
      accent: '#10b981',
      last: false,
    },
    {
      icon: '⚠️',
      label: 'Asignadas',
      value: unitsByStatus.ASSIGNED ?? 0,
      accent: '#fb923c',
      last: false,
    },
    {
      icon: '🏥',
      label: 'Hospitales',
      value: resourcesByKind.hospital ?? 0,
      accent: '#fb7185',
      last: true,
    },
  ];

  return (
    <div className="app-bg h-full overflow-y-auto text-white">
      <div className="mx-auto max-w-6xl p-4 pb-12 md:p-6">
        <div className="panel-in flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Panel de control
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Resumen operativo
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-semibold uppercase tracking-wide text-emerald-300">
              <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              En vivo
            </span>
            <span>
              {new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(
                new Date(),
              )}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="hero-border panel-in lg:col-span-2">
            <div
              className="glass relative h-full overflow-hidden p-5 text-white"
              style={{ borderRadius: 'calc(1rem - 1px)' }}
            >
              <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-rose-500/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-orange-500/15 blur-3xl" />

              <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                    <span className="live-dot relative inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    {STATUS_LABELS[incident.status] ?? incident.status} · en vivo
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
                    {incident.type}
                  </span>
                </div>

                <h2 className="mt-2 text-xl font-bold leading-snug text-white">
                  {incident.title}
                </h2>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {incident.magnitude != null && (
                    <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 px-4 py-2 text-center shadow-lg shadow-rose-500/30">
                      <div className="text-3xl font-extrabold leading-none text-white drop-shadow">
                        {incident.magnitude.toFixed(1)}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-rose-100">
                        Magnitud Mw
                      </div>
                    </div>
                  )}
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
                      </span>
                      Severidad{' '}
                      {SEVERITY_LABELS[incident.severity] ?? incident.severity}
                    </div>
                    <div className="mt-1.5 flex gap-1">
                      {SEVERITY_ORDER.map((lvl, i) => {
                        const index = SEVERITY_ORDER.indexOf(incident.severity);
                        const active = i <= Math.max(0, index);
                        return (
                          <span
                            key={lvl}
                            className="h-1.5 w-8 rounded-full transition-all duration-500"
                            style={{
                              background: active
                                ? ZONE_COLORS[
                                    lvl as keyof typeof ZONE_COLORS
                                  ].fill
                                : 'rgba(255,255,255,0.12)',
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <dl className="mt-5 grid gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-xs sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-slate-400">
                      <span>⏱️</span> Transcurrido
                    </dt>
                    <dd className="font-medium text-emerald-300">
                      <ElapsedTimer startedAt={incident.startedAt} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-slate-400">
                      <span>📅</span> Inicio del evento
                    </dt>
                    <dd className="font-medium text-slate-200">
                      {formatDate(incident.startedAt)}
                    </dd>
                  </div>
                  {epicenter && (
                    <div className="flex items-center justify-between gap-2 sm:col-span-2">
                      <dt className="flex items-center gap-1.5 text-slate-400">
                        <span>📍</span> Epicentro
                      </dt>
                      <dd className="font-mono font-medium text-slate-200">
                        {formatCoords(epicenter)}
                      </dd>
                    </div>
                  )}
                </dl>

                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  {incident.description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Kpi
              icon="🗺️"
              label="Zonas afectadas"
              value={stats.totalZones ?? 0}
              delay={120}
              accent="#f43f5e"
            />
            <Kpi
              icon="👥"
              label="Población afectada"
              value={populationAffected}
              delay={200}
              accent="#fb923c"
            />
            <Kpi
              icon="🚨"
              label="Unidades desplegadas"
              value={totalUnits ?? 0}
              delay={280}
              accent="#a78bfa"
            />
            <Kpi
              icon="🏛️"
              label="Recursos en mapa"
              value={stats.totalResources ?? 0}
              delay={360}
              accent="#22d3ee"
            />
            <div
              className="glass panel-in col-span-2 mt-0 p-3"
              style={{ animationDelay: '420ms' }}
            >
              <div className="grid grid-cols-4 gap-2">
                {mini.map((chip) => (
                  <MiniChip key={chip.label} {...chip} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div
            className="glass panel-in p-5 text-white"
            style={{ animationDelay: '480ms' }}
          >
            <h3 className="text-sm font-semibold text-white">
              Distribución de zonas
            </h3>
            <div className="mt-4 space-y-3">
              {ZONE_LEVELS.map((level) => {
                const count = zonesByLevel[level] ?? 0;
                const width = Math.round((count / maxZones) * 100);
                return (
                  <div key={level}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            background: ZONE_COLORS[level].fill,
                            boxShadow: `0 0 8px ${ZONE_COLORS[level].fill}`,
                          }}
                        />
                        {ZONE_COLORS[level].label}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-200">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${width}%`,
                          background: ZONE_COLORS[level].fill,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="glass panel-in p-5 text-white"
            style={{ animationDelay: '560ms' }}
          >
            <h3 className="text-sm font-semibold text-white">
              Recursos por tipo
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {RESOURCE_KEYS.map((kind) => {
                const config = RESOURCE_BY_KIND[kind];
                const count = resourcesByKind[kind] ?? 0;
                return (
                  <div
                    key={kind}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2"
                  >
                    <span
                      className="grid h-8 w-8 place-items-center rounded-lg text-base"
                      style={{
                        background: `${config.color}1f`,
                        boxShadow: `inset 0 0 0 1px ${config.color}40`,
                      }}
                    >
                      {config.emoji}
                    </span>
                    <div className="leading-tight">
                      <div className="text-sm font-bold tabular-nums">
                        {count}
                      </div>
                      <div className="max-w-[6rem] truncate text-[10px] text-slate-400">
                        {config.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] text-slate-600">
          © Esri · OpenStreetMap · REDCO — Datos simulados con fines de
          demostración
        </p>
      </div>
    </div>
  );
}

function MiniChip({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: number;
  accent: string;
}) {
  const text = useCountUp(value, 1500);
  return (
    <div className="text-center">
      <div
        className="mx-auto mb-1 grid h-8 w-8 place-items-center rounded-lg text-sm"
        style={{
          background: `${accent}1f`,
          boxShadow: `inset 0 0 0 1px ${accent}40`,
        }}
      >
        {icon}
      </div>
      <div className="text-sm font-bold tabular-nums">{text}</div>
      <div className="text-[10px] text-slate-400">{label}</div>
    </div>
  );
}