// src/pages/PaginaRegistro.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { autenticarRegistro } from "@/services/api";

export default function PaginaRegistro() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const navigate = useNavigate();

  const manejarEnviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setCargando(true);
    setError("");
    setExito("");
    try {
      await autenticarRegistro({
        firstName,
        lastName,
        email,
        password,
        phone: telefono || undefined,
      });
      setExito("Usuario creado correctamente. Ya puedes iniciar sesión.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (e: any) {
      setError(e.response?.data?.message || "Error al registrarse");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur p-8 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-center mb-6 text-white">Crear cuenta — REDCO</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded text-sm">
            {error}
          </div>
        )}
        {exito && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-sm">
            {exito}
          </div>
        )}

        <form onSubmit={manejarEnviar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nombres</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500"
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Apellidos</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500"
                placeholder="Pérez"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500"
              placeholder="usuario@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Teléfono (opcional)</label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500"
              placeholder="300 000 0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {cargando ? "Registrando..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-rose-400 hover:underline">Inicia sesión</a>
        </p>
      </div>
    </div>
  );
}