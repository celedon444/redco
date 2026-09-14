import { useMemo, useState } from 'react';

import { useMapOverview } from '@/hooks/useMapOverview';
import {
  RESOURCE_BY_KIND,
  RESOURCE_KEYS,
  pointToLatLng,
} from '@/lib/overview';
import type {
  GeoJsonFeature,
  ResourceFeatureProperties,
} from '@/types/map';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
  AVAILABLE: 'border-sky-400/30 bg-sky-500/15 text-sky-300',
  MAINTENANCE: 'border-amber-400/30 bg-amber-500/15 text-amber-300',
  OFFLINE: 'border-rose-400/30 bg-rose-500/15 text-rose-300',
};

const defaultStatusStyle =
  'border-white/10 bg-white/5 text-slate-300';

export default function ResourcesPage() {
  const { overview, loading, error, reload } = useMapOverview();
  const [query, setQuery] = useState('');
  const [activeKind, setActiveKind] = useState<string | null>(null);

  const features = useMemo(
    () => overview?.resources.features ?? [],
    [overview],
  );

  const countsByKind = useMemo(() => {
    const counts: Record<string, number> = {};
    features.forEach((feature) => {
      counts[feature.properties.kind] =
        (counts[feature.properties.kind] ?? 0) + 1;
    });
    return counts;
  }, [features]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return features.filter((feature) => {
      if (activeKind && feature.properties.kind !== activeKind) return false;
      if (!q) return true;
      const { name, organizationName } = feature.properties;
      return (
        `${name} ${organizationName ?? ''}`.toLowerCase().includes(q)
      );
    });
  }, [features, query, activeKind]);

  if (loading) {
    return (
      <div className="app-bg flex h-full items-center justify-center text-white">
        <div className="panel-in w-64 text-center">
          <div className="animate-soft-float mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 shadow-2xl shadow-rose-900/50">
            <span className="text-3xl">🛰️</span>
          </div>
          <p className="mb-4 mt-4 text-sm text-slate-400">
            Cargando recursos…
          </p>
          <div className="shimmer-bar h-1.5 w-full" />
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="app-bg flex h-full items-center justify-center text-white">
        <div className="glass panel-in max-w-md p-6 text-center">
          <div className="animate-soft-float mb-2 inline-block text-4xl">🛰️</div>
          <h2 className="mb-1 text-lg font-semibold">Recursos no disponibles</h2>
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

  return (
    <div className="app-bg h-full overflow-y-auto text-white">
      <div className="mx-auto max-w-6xl p-4 pb-12 md:p-6">
        <div className="panel-in flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Operación
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Recursos desplegados
            </h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            <span className="font-bold text-white">{features.length}</span>{' '}
            recursos en mapa
          </div>
        </div>

        <div
          className="glass panel-in mt-5 p-3 text-white"
          style={{ animationDelay: '120ms' }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                🔍
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar recurso u organización…"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-rose-400/40 focus:bg-white/10"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip
                label="Todos"
                count={features.length}
                active={activeKind === null}
                onClick={() => setActiveKind(null)}
              />
              {[...RESOURCE_KEYS]
                .sort((a, b) => (countsByKind[b] ?? 0) - (countsByKind[a] ?? 0))
                .map((kind) => (
                  <FilterChip
                    key={kind}
                    label={`${RESOURCE_BY_KIND[kind].emoji} ${RESOURCE_BY_KIND[kind].label}`}
                    count={countsByKind[kind] ?? 0}
                    active={activeKind === kind}
                    onClick={() => setActiveKind(kind)}
                  />
                ))}
            </div>
          </div>
        </div>

        <div
          className="glass panel-in mt-4 overflow-hidden"
          style={{ animationDelay: '220ms' }}
        >
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">
              No se encontraron recursos para los filtros actuales.
            </div>
          ) : (
            <div className="glass-scroll overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 font-semibold">Recurso</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Asignación</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Ubicación
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((feature, index) => (
                    <ResourceRow
                      key={feature.properties.id}
                      feature={feature}
                      index={index}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[10px] text-slate-600">
          © Esri · OpenStreetMap · REDCO — Datos simulados con fines de
          demostración
        </p>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
        active
          ? 'border-rose-400/40 bg-rose-500/15 text-white shadow-lg shadow-rose-900/20'
          : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
      }`}
    >
      {label}
      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] tabular-nums">
        {count}
      </span>
    </button>
  );
}

function ResourceRow({
  feature,
  index,
}: {
  feature: GeoJsonFeature<ResourceFeatureProperties>;
  index: number;
}) {
  const { kind, name, status, organizationName, assignmentStatus } =
    feature.properties;
  const config = RESOURCE_BY_KIND[kind];
  const position = pointToLatLng(feature.geometry);
  const statusStyle = STATUS_STYLES[status] ?? defaultStatusStyle;

  return (
    <tr
      className="panel-in border-b border-white/5 transition-colors last:border-0 hover:bg-white/5"
      style={{ animationDelay: `${180 + index * 45}ms` }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-base"
            style={{
              background: `${config.color}1f`,
              boxShadow: `inset 0 0 0 1px ${config.color}40`,
            }}
          >
            {config.emoji}
          </span>
          <div className="leading-tight">
            <div className="font-semibold text-white">{name}</div>
            {organizationName && (
              <div className="text-xs text-slate-400">{organizationName}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-300">{config.label}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle}`}
        >
          {status.toLowerCase()}
        </span>
      </td>
      <td className="px-4 py-3">
        {assignmentStatus === 'ACTIVE' ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
            🚨 En zona
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
            ✅ En base
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">
        {position
          ? `${position[0].toFixed(3)}°, ${position[1].toFixed(3)}°`
          : '—'}
      </td>
    </tr>
  );
}