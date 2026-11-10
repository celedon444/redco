// src/pages/PaginaLogin.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { autenticarLogin } from "@/services/api";

export default function PaginaLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  const manejarEnviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setCargando(true);
    setError("");
    try {
      const respuesta = await autenticarLogin({ email, password });
      const { access_token, user } = respuesta.data;
      iniciarSesion(access_token, user);
      navigate("/");
    } catch (e: any) {
      setError(e.response?.data?.message || "Credenciales inválidas");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur p-8 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-center mb-6 text-white">Iniciar sesión — REDCO</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={manejarEnviar} className="space-y-4">
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
            <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {cargando ? "Iniciando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿No tienes cuenta?{" "}
          <a href="/registro" className="text-rose-400 hover:underline">Regístrate aquí</a>
        </p>
      </div>
    </div>
  );
}