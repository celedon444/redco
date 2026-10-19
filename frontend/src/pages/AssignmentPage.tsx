import { useMemo, useEffect } from "react";
import * as L from "leaflet";
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  ZoomControl,
} from "react-leaflet";
import { useSearchParams } from "react-router-dom";

import { useCountUp } from "@/hooks/useCountUp";
import { useMapOverview } from "@/hooks/useMapOverview";
import {
  RESOURCE_BY_KIND,
  ZONE_COLORS,
  formatDate,
  pointToLatLng,
  polygonToLatLngs,
  zoneCentroid,
  type Coords,
} from "@/lib/overview";

const SHORT_STATUS: Record<string, string> = {
  ASSIGNED: "Asignada",
  ACTIVE: "En zona",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const STATUS_STYLES: Record<string, string> = {
  ASSIGNED: "border-sky-400/30 bg-sky-500/15 text-sky-300",
  ACTIVE: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  COMPLETED: "border-lime-400/30 bg-lime-500/15 text-lime-300",
  CANCELLED: "border-rose-400/30 bg-rose-500/15 text-rose-300",
};

const defaultStatusStyle = "border-white/10 bg-white/5 text-slate-300";

function assignmentIcon(kind: string, index: number): L.DivIcon {
  const config = RESOURCE_BY_KIND[kind as keyof typeof RESOURCE_BY_KIND];
  const color = config?.color ?? "#94a3b8";
  const emoji = config?.emoji ?? "🚙";
  return L.divIcon({
    className: "",
    html: `<div class="resource-marker" style="width:26px;height:26px;font-size:13px;border-color:${color};color:${color};animation-delay:${(
      0.15 +
      index * 0.06
    ).toFixed(2)}s">${emoji}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function SummaryChip({
  icon,
  label,
  value,
  accent,
  delay,
}: {
  icon: string;
  label: string;
  value: number;
  accent: string;
  delay: number;
}) {
  const text = useCountUp(value, 1200 + delay);
  return (
    <div
      className="glass panel-in flex items-center gap-3 p-4 text-white"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className="grid h-11 w-11 place-items-center rounded-xl text-xl"
        style={{
          background: `${accent}1f`,
          boxShadow: `inset 0 0 0 1px ${accent}40`,
        }}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-2xl font-extrabold tabular-nums">{text}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </div>
  );
}

export default function AssignmentPage() {
  const { overview, loading, error, reload } = useMapOverview();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sincroniza el filtro local con el parámetro 'estado' de la URL (ej: ?estado=ACTIVE)
  const estadoParam = searchParams.get("estado");
  const [statusFilter, setStatusFilter] = useState<string | null>(estadoParam);

  useEffect(() => {
    setStatusFilter(estadoParam);
  }, [estadoParam]);

  const assignments = useMemo(() => overview?.assignments ?? [], [overview]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    assignments.forEach((assignment) => {
      counts[assignment.status] = (counts[assignment.status] ?? 0) + 1;
    });
    return counts;
  }, [assignments]);

  const statuses = useMemo(
    () => Object.keys(statusCounts).sort(),
    [statusCounts],
  );

  const filtered = useMemo(() => {
    return assignments.filter((assignment) => {
      if (statusFilter && assignment.status !== statusFilter) return false;
      return true;
    });
  }, [assignments, statusFilter]);

  const zones = useMemo(() => overview?.zones.features ?? [], [overview]);

  const mapPoints = useMemo(() => {
    const points: Coords[] = [];
    assignments.forEach((assignment) => {
      const p = assignment.location
        ? pointToLatLng(assignment.location.geometry)
        : null;
      if (p) points.push(p);
      if (assignment.zoneId) {
        const zone = zones.find((z) => z.properties.id === assignment.zoneId);
        const centroid = zone ? zoneCentroid(zone.geometry) : null;
        if (centroid) points.push(centroid);
      }
    });
    return points;
  }, [assignments, zones]);

  const bounds = useMemo(() => {
    if (mapPoints.length === 0) return undefined;
    const b = L.latLngBounds(mapPoints);
    if (!b.isValid()) return undefined;
    b.pad(0.1);
    return b;
  }, [mapPoints]);

  const counts = {
    total: assignments.length,
    active: assignments.filter((a) => a.status === "ACTIVE").length,
    withZone: assignments.filter((a) => a.zoneId != null).length,
    completed: assignments.filter((a) => a.status === "COMPLETED").length,
  };

  const handleFilterClick = (status: string | null) => {
    setStatusFilter(status);
    const newParams = new URLSearchParams(searchParams);
    if (status) {
      newParams.set("estado", status);
    } else {
      newParams.delete("estado");
    }
    setSearchParams(newParams);
  };

  if (loading) {
    return (
      <div className="app-bg flex h-full items-center justify-center text-white">
        <div className="panel-in w-64 text-center">
          <div className="animate-soft-float mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 shadow-2xl shadow-rose-900/50">
            <span className="text-3xl">🛰️</span>
          </div>
          <p className="mb-4 mt-4 text-sm text-slate-400">
            Cargando asignaciones…
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
          <div className="animate-soft-float mb-2 inline-block text-4xl">
            🛰️
          </div>
          <h2 className="mb-1 text-lg font-semibold">
            Asignaciones no disponibles
          </h2>
          <p className="text-sm text-slate-400">
            {error ?? "No hay datos cargados. Ejecuta el seed del backend."}
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
              Asignaciones de unidades
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-semibold uppercase tracking-wide text-emerald-300">
              <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Seguimiento en vivo
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryChip
            icon="🧑‍🚒"
            label="Asignaciones totales"
            value={counts.total}
            accent="#a78bfa"
            delay={100}
          />
          <SummaryChip
            icon="🚨"
            label="En zona (ACTIVE)"
            value={counts.active}
            accent="#f43f5e"
            delay={180}
          />
          <SummaryChip
            icon="📍"
            label="Unidades con zona"
            value={counts.withZone}
            accent="#22d3ee"
            delay={260}
          />
          <SummaryChip
            icon="✅"
            label="Completadas"
            value={counts.completed}
            accent="#10b981"
            delay={340}
          />
        </div>

        <div
          className="glass panel-in mt-4 overflow-hidden"
          style={{ animationDelay: "420ms" }}
        >
          {bounds ? (
            <MapContainer
              bounds={bounds}
              className="h-72 w-full md:h-80"
              scrollWheelZoom
              attributionControl={false}
              maxBounds={[
                [-4.5, -79.5],
                [13.5, -66.5],
              ]}
              maxBoundsViscosity={1}
            >
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" />
              {zones.map((zone) => {
                const positions = polygonToLatLngs(zone.geometry);
                if (!positions.length) return null;
                const color = ZONE_COLORS[zone.properties.level];
                return (
                  <Polygon
                    key={zone.properties.id}
                    positions={positions}
                    pathOptions={{
                      color: color.stroke,
                      weight: 1.5,
                      fillColor: color.fill,
                      fillOpacity: 0.25,
                    }}
                    interactive={false}
                  />
                );
              })}
              {assignments.map((assignment) => {
                const unitPoint = assignment.location
                  ? pointToLatLng(assignment.location.geometry)
                  : null;
                if (!unitPoint || !assignment.zoneId) return null;
                const zone = zones.find(
                  (z) => z.properties.id === assignment.zoneId,
                );
                const centroid = zone ? zoneCentroid(zone.geometry) : null;
                if (!centroid) return null;
                const color =
                  ZONE_COLORS[assignment.zoneLevel ?? "MODERATE"]?.fill ??
                  "#60a5fa";
                return (
                  <Polyline
                    key={`line-${assignment.id}`}
                    positions={[unitPoint, centroid]}
                    pathOptions={{
                      color,
                      weight: 2,
                      opacity: 0.6,
                      dashArray: "4 8",
                    }}
                    interactive={false}
                  />
                );
              })}
              {filtered.map((assignment, index) => {
                const position =
                  assignment.location &&
                  pointToLatLng(assignment.location.geometry);
                if (!position) return null;
                return (
                  <Marker
                    key={assignment.id}
                    position={position}
                    icon={assignmentIcon(assignment.kind, index)}
                  />
                );
              })}
              <ZoomControl position="bottomright" />
            </MapContainer>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              No hay asignaciones para graficar.
            </div>
          )}
        </div>

        <div
          className="glass panel-in mt-4 p-3 text-white"
          style={{ animationDelay: "500ms" }}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip
              label="Todas"
              count={assignments.length}
              active={statusFilter === null}
              onClick={() => handleFilterClick(null)}
            />
            {statuses.map((status) => (
              <FilterChip
                key={status}
                label={SHORT_STATUS[status] ?? status}
                count={statusCounts[status] ?? 0}
                active={statusFilter === status}
                onClick={() =>
                  handleFilterClick(statusFilter === status ? null : status)
                }
              />
            ))}
          </div>
        </div>

        <div
          className="glass panel-in mt-4 overflow-hidden"
          style={{ animationDelay: "580ms" }}
        >
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">
              No hay asignaciones para los filtros seleccionados.
            </div>
          ) : (
            <div className="glass-scroll overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 font-semibold">Unidad</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Zona asignada</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Asignada
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((assignment, index) => {
                    const config =
                      RESOURCE_BY_KIND[
                        assignment.kind as keyof typeof RESOURCE_BY_KIND
                      ];
                    const statusStyle =
                      STATUS_STYLES[assignment.status] ?? defaultStatusStyle;
                    return (
                      <tr
                        key={assignment.id}
                        className="panel-in border-b border-white/5 transition-colors last:border-0 hover:bg-white/5"
                        style={{ animationDelay: `${620 + index * 40}ms` }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-base"
                              style={{
                                background: `${config?.color ?? "#94a3b8"}1f`,
                                boxShadow: `inset 0 0 0 1px ${
                                  config?.color ?? "#94a3b8"
                                }40`,
                              }}
                            >
                              {config?.emoji ?? "🚙"}
                            </span>
                            <div className="leading-tight">
                              <div className="font-semibold text-white">
                                {assignment.unitName}
                              </div>
                              <div className="text-xs text-slate-400">
                                {assignment.organizationName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {config?.label ?? assignment.unitType}
                        </td>
                        <td className="px-4 py-3">
                          {assignment.zoneName ? (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                              style={{
                                borderColor: `${ZONE_COLORS[assignment.zoneLevel ?? "MODERATE"]?.fill}55`,
                                background: `${ZONE_COLORS[assignment.zoneLevel ?? "MODERATE"]?.fill}1f`,
                                color:
                                  ZONE_COLORS[
                                    assignment.zoneLevel ?? "MODERATE"
                                  ]?.fill,
                              }}
                            >
                              {assignment.zoneName}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">
                              En tránsito
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle}`}
                          >
                            {SHORT_STATUS[assignment.status] ??
                              assignment.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-slate-400">
                          {formatDate(assignment.assignedAt)}
                        </td>
                      </tr>
                    );
                  })}
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
          ? "border-rose-400/40 bg-rose-500/15 text-white shadow-lg shadow-rose-900/20"
          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
      }`}
    >
      {label}
      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] tabular-nums">
        {count}
      </span>
    </button>
  );
}
