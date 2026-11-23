import React, { useState } from 'react';
import { Trophy, Lock, Mail, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onOpenPublicPortal }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@sportstech.mx');
  const [password, setPassword] = useState('Admin123*');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-emerald-800 p-6 text-center border-b border-slate-800">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-600 text-white mb-3">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">SportsTech SaaS</h1>
          <p className="text-slate-400 text-xs mt-1">
            Gestión de Ligas Amateur
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 text-red-800 p-3 text-sm rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Verificando credenciales...' : 'Ingresar al Panel Administrativo'}
          </button>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <button
              type="button"
              onClick={onOpenPublicPortal}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
            >
              <Eye className="w-4 h-4" />
              Ver Portal Público de Posiciones y Goleo
            </button>
            
          </div>
        </form>
      </div>
    </div>
  );
}
