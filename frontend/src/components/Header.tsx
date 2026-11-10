import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { OdooFilterBar } from "./OdooFilterBar";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Mapa",
    full: "Mapa de emergencias",
    icon: "🗺️",
    end: true,
  },
  { to: "/resumen", label: "Resumen", full: "Resumen operativo", icon: "📊" },
  {
    to: "/asignaciones",
    label: "Asignaciones",
    full: "Asignaciones de unidades",
    icon: "🧭",
  },
  {
    to: "/recursos",
    label: "Recursos",
    full: "Recursos desplegados",
    icon: "🏥",
  },
  { to: "/voluntariado", label: "Voluntariado", full: "Solicitar voluntariado", icon: "🤝" },
  {
    to: "/personas-danadas",
    label: "Daños",
    full: "Personas damnificadas",
    icon: "🆘",
  },
  {
    to: "/familiar-perdido",
    label: "Familiares",
    full: "Familiar perdido",
    icon: "🔍",
  },
];

function desktopLinkClass(isActive: boolean): string {
  return `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-white/10 text-white ring-1 ring-white/15"
      : "text-slate-400 hover:bg-white/5 hover:text-white"
  }`;
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const { usuario, cerrarSesion, estaAutenticado } = useAuth();
  const navigate = useNavigate();
  const esAdmin = usuario?.rol === "ADMINISTRADOR" || (usuario as any)?.role === "ADMINISTRATOR";
  const nombreUsuario = (usuario?.nombre ? `${usuario.nombre} ${usuario.apellido ?? ''}`.trim() : (usuario?.email || 'Usuario'));

  const manejarCerrarSesion = () => {
    cerrarSesion();
    navigate("/");
  };

  return (
    <header className="relative z-[1100] flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-b from-slate-950 to-slate-900/90 px-4 py-3 backdrop-blur md:px-6">
      {/* Logo REDCO */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="animate-soft-float grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-600 to-orange-500 shadow-lg shadow-rose-900/50">
          <span className="text-lg">🛰️</span>
        </div>
        <div>
          <h1 className="text-lg font-extrabold leading-tight tracking-tight text-white">
            <span className="animate-gradient-text bg-gradient-to-r from-rose-400 via-orange-300 to-amber-300 bg-clip-text text-transparent">
              REDCO
            </span>
            <span className="ml-2 rounded-md bg-gradient-to-r from-rose-500 to-orange-500 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-widest text-white">
              Live
            </span>
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            Red de Emergencias y Desastres de Colombia
          </p>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTRADO GLOBAL ESTILO ODOO */}
      <div className="hidden lg:block flex-1 max-w-md mx-4">
        <OdooFilterBar
          onGlobalSearch={(query) => {
            console.log("Búsqueda global:", query);
          }}
        />
      </div>

      {/* Navegación Derecha */}
      <div className="flex items-center gap-3 shrink-0">
        <nav className="hidden items-center gap-1.5 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => desktopLinkClass(isActive)}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {esAdmin && (
            <NavLink
              to="/incidentes"
              className={({ isActive }) => desktopLinkClass(isActive)}
            >
              <span aria-hidden>⚠️</span>
              Incidentes
            </NavLink>
          )}
        </nav>

        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300 xl:flex">
          <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          En vivo
        </span>

        {/* Barra de usuario */}
        {estaAutenticado ? (
          <div className="hidden md:flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-slate-200">
            <span className="font-medium">{nombreUsuario}</span>
            <button
              onClick={manejarCerrarSesion}
              className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 px-2 py-1 rounded transition"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <>
            <NavLink
              to="/login"
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition"
            >
              Iniciar sesión
            </NavLink>
            <NavLink
              to="/registro"
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
            >
              Regístrate
            </NavLink>
          </>
        )}

        {/* Botón para menú móvil */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Abrir menú"
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 md:hidden"
        >
          <span className="flex w-5 flex-col items-center gap-1">
            <span
              className={`h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                open ? "translate-y-1.5 rotate-45" : ""
              }`}
            />
            <span
              className={`h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                open ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {/* Menú móvil */}
      {open && (
        <nav className="glass panel-in absolute inset-x-3 top-full z-50 mt-2 p-2 md:hidden">
          <div className="mb-2">
            <OdooFilterBar
              onGlobalSearch={(query) => {
                console.log("Búsqueda móvil:", query);
              }}
            />
          </div>
          {NAV_ITEMS.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `panel-in flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-rose-600/90 to-orange-500/80 text-white shadow-lg shadow-rose-900/30"
                    : "text-slate-300 hover:bg-white/5"
                }`
              }
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span aria-hidden className="text-base">{item.icon}</span>
              {item.full}
            </NavLink>
          ))}
          {esAdmin && (
            <NavLink
              to="/incidentes"
              onClick={() => setOpen(false)}
              className="panel-in flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition text-red-300 hover:bg-white/5"
            >
              <span aria-hidden className="text-base">⚠️</span>
              Incidentes (Admin)
            </NavLink>
          )}
          {estaAutenticado && (
            <button
              onClick={manejarCerrarSesion}
              className="panel-in flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition text-red-300 hover:bg-white/5"
            >
              <span aria-hidden className="text-base">🚪</span>
              Cerrar sesión
            </button>
          )}
        </nav>
      )}
    </header>
  );
}