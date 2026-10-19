import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface OdooFilterBarProps {
  onGlobalSearch?: (query: string) => void;
}

export const OdooFilterBar: React.FC<OdooFilterBarProps> = ({
  onGlobalSearch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Obtener parámetros activos de la URL para sincronizar los chips
  const currentTipo = searchParams.get("tipo");
  const currentEstado = searchParams.get("estado");

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Filtros específicos con redirección automática y parámetros
  const filterOptions = [
    {
      id: "HEALTH",
      label: "Hospitales y Salud",
      icon: "🏥",
      path: "/recursos",
      paramKey: "tipo",
    },
    {
      id: "FIRE_DEPARTMENT",
      label: "Estaciones de Bomberos",
      icon: "🚒",
      path: "/recursos",
      paramKey: "tipo",
    },
    {
      id: "RED_CROSS",
      label: "Cruz Roja y Socorro",
      icon: "🚑",
      path: "/recursos",
      paramKey: "tipo",
    },
    {
      id: "POLICE",
      label: "Unidades de Policía",
      icon: "🚓",
      path: "/recursos",
      paramKey: "tipo",
    },
    {
      id: "CRITICAL",
      label: "Zonas Críticas",
      icon: "🚨",
      path: "/asignaciones",
      paramKey: "estado",
    },
    {
      id: "ACTIVE",
      label: "Unidades Activas",
      icon: "⚡",
      path: "/asignaciones",
      paramKey: "estado",
    },
  ];

  // 2. Acceso Rápido a las secciones principales
  const quickAccessOptions = [
    { id: "map", label: "Mapa de Emergencias", path: "/", icon: "🗺️" },
    { id: "summary", label: "Resumen Operativo", path: "/resumen", icon: "📊" },
    {
      id: "assignments",
      label: "Asignaciones de Unidades",
      path: "/asignaciones",
      icon: "🧭",
    },
    {
      id: "resources",
      label: "Recursos Desplegados",
      path: "/recursos",
      icon: "🏥",
    },
  ];

  // Aplicar un filtro: navega a la página indicada con su parámetro
  const handleApplyFilter = (opt: (typeof filterOptions)[0]) => {
    setIsOpen(false);
    navigate(`${opt.path}?${opt.paramKey}=${opt.id}`);
  };

  // Remover filtro activo de la URL
  const handleRemoveParam = (paramKey: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(paramKey);
    setSearchParams(newParams);
  };

  return (
    <div className="relative w-full z-[9999]" ref={dropdownRef}>
      {/* Barra Principal con Chips de Filtros */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-xl min-h-[42px]">
        {/* Botón Filtros / Menú */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0"
        >
          <span>🔍</span>
          <span className="hidden sm:inline">Filtros</span>
          <span className="text-[10px] ml-0.5">▼</span>
        </button>

        {/* Chips de Filtros Activos (leídos de la URL) */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-[120px]">
          {currentTipo && (
            <span className="inline-flex items-center gap-1 bg-rose-950 text-rose-200 border border-rose-600 px-2 py-0.5 rounded-md text-[11px] font-medium">
              <span>
                {filterOptions.find((f) => f.id === currentTipo)?.icon}
              </span>
              <span>
                {filterOptions.find((f) => f.id === currentTipo)?.label ??
                  currentTipo}
              </span>
              <button
                onClick={() => handleRemoveParam("tipo")}
                className="hover:text-rose-400 ml-1 font-bold"
              >
                ✕
              </button>
            </span>
          )}

          {currentEstado && (
            <span className="inline-flex items-center gap-1 bg-amber-950 text-amber-200 border border-amber-600 px-2 py-0.5 rounded-md text-[11px] font-medium">
              <span>⚡</span>
              <span>
                {filterOptions.find((f) => f.id === currentEstado)?.label ??
                  currentEstado}
              </span>
              <button
                onClick={() => handleRemoveParam("estado")}
                className="hover:text-amber-400 ml-1 font-bold"
              >
                ✕
              </button>
            </span>
          )}

          {/* Campo de búsqueda limpia sin placeholder */}
          <input
            type="text"
            placeholder={!currentTipo && !currentEstado ? "" : ""}
            onChange={(e) => onGlobalSearch && onGlobalSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-400 px-1 py-0.5 flex-1 min-w-[80px]"
          />
        </div>
      </div>

      {/* Menú Desplegable en 2 Columnas con fondo completamente sólido */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-full max-w-2xl bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl z-[9999] grid grid-cols-1 md:grid-cols-2 p-4 gap-4 text-white text-xs">
          {/* Columna 1: Filtros Específicos */}
          <div className="md:border-r border-slate-800 md:pr-3">
            <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-2.5 pb-1 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <span>🔻</span> Filtros Específicos
            </div>
            <div className="space-y-1">
              {filterOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleApplyFilter(opt)}
                  className="w-full text-left px-2.5 py-2 rounded-lg transition hover:bg-slate-800/80 text-slate-200 hover:text-white flex items-center justify-between group"
                >
                  <span className="flex items-center gap-2">
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </span>
                  <span className="text-[10px] text-rose-400 group-hover:translate-x-0.5 transition-transform">
                    Ver →
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Columna 2: Acceso Rápido a Secciones */}
          <div>
            <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-2.5 pb-1 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <span>⭐</span> Acceso Rápido
            </div>
            <div className="space-y-1">
              {quickAccessOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    navigate(opt.path);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg transition hover:bg-slate-800/80 text-slate-200 hover:text-white flex items-center justify-between group"
                >
                  <span className="flex items-center gap-2">
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </span>
                  <span className="text-[10px] text-amber-400 group-hover:translate-x-0.5 transition-transform">
                    Ir →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
