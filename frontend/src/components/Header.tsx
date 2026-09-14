import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Mapa', full: 'Mapa de emergencias', icon: '🗺️', end: true },
  { to: '/resumen', label: 'Resumen', full: 'Resumen operativo', icon: '📊' },
  { to: '/asignaciones', label: 'Asignaciones', full: 'Asignaciones de unidades', icon: '🧭' },
  { to: '/recursos', label: 'Recursos', full: 'Recursos desplegados', icon: '🏥' },
];

function desktopLinkClass(isActive: boolean): string {
  return `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-white/10 text-white ring-1 ring-white/15'
      : 'text-slate-400 hover:bg-white/5 hover:text-white'
  }`;
}

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-[1100] flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-b from-slate-950 to-slate-900/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
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
          <p className="text-xs text-slate-400">
            Red de Emergencias y Desastres de Colombia
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
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
        </nav>

        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300 lg:flex">
          <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          En vivo
        </span>

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
                open ? 'translate-y-1.5 rotate-45' : ''
              }`}
            />
            <span
              className={`h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                open ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                open ? '-translate-y-1.5 -rotate-45' : ''
              }`}
            />
          </span>
        </button>
      </div>

      {open && (
        <nav className="glass panel-in absolute inset-x-3 top-full z-50 mt-2 p-2 md:hidden">
          {NAV_ITEMS.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `panel-in flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-600/90 to-orange-500/80 text-white shadow-lg shadow-rose-900/30'
                    : 'text-slate-300 hover:bg-white/5'
                }`
              }
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span aria-hidden className="text-base">
                {item.icon}
              </span>
              {item.full}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}