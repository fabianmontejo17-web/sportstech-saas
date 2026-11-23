import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  Trophy,
} from 'lucide-react';
import axiosClient from './api/axiosClient';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EquiposJugadoresPage from './pages/EquiposJugadoresPage';
import CalendarioRoundRobinPage from './pages/CalendarioRoundRobinPage';
import CedulaArbitralPage from './pages/CedulaArbitralPage';
import PortalPublicoPage from './pages/PortalPublicoPage';

function MainShell() {
  const { usuario, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPartidoId, setSelectedPartidoId] = useState(null);
  const [publicMode, setPublicMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [ligas, setLigas] = useState([]);
  const [torneos, setTorneos] = useState([]);
  const [selectedLigaId, setSelectedLigaId] = useState(1);
  const [selectedTorneoId, setSelectedTorneoId] = useState(1);

  const [showNuevaLiga, setShowNuevaLiga] = useState(false);
  const [nuevaLigaForm, setNuevaLigaForm] = useState({
    nombre: '',
    municipio: 'Jalpa de Méndez',
    estado: 'Tabasco',
    nombre_torneo: 'Torneo Apertura 2026',
    categoria: 'Libre Varonil',
  });
  const [creandoLiga, setCreandoLiga] = useState(false);

  const cargarLigas = async (ligaPreferida = null) => {
    const { data } = await axiosClient.get('/ligas');
    const lista = data.data || [];
    setLigas(lista);
    if (ligaPreferida) {
      setSelectedLigaId(Number(ligaPreferida));
    } else if (lista.length > 0 && !lista.some((l) => l.id_liga === Number(selectedLigaId))) {
      setSelectedLigaId(lista[0].id_liga);
    }
  };

  useEffect(() => {
    if (usuario) {
      cargarLigas(usuario.id_liga || 1);
    }
  }, [usuario]);

  useEffect(() => {
    if (!usuario || !selectedLigaId) return;
    axiosClient.get(`/ligas/${selectedLigaId}/torneos`).then((res) => {
      const listaTorneos = res.data.data || [];
      setTorneos(listaTorneos);
      if (listaTorneos.length > 0) {
        setSelectedTorneoId(listaTorneos[0].id_torneo);
      }
    });
  }, [selectedLigaId, usuario]);

  const handleCrearLiga = async (e) => {
    e.preventDefault();
    setCreandoLiga(true);
    try {
      const { data } = await axiosClient.post('/ligas', nuevaLigaForm);
      await cargarLigas(data.data.id_liga);
      setSelectedTorneoId(data.data.id_torneo);
      setShowNuevaLiga(false);
      setNuevaLigaForm({
        nombre: '',
        municipio: 'Jalpa de Méndez',
        estado: 'Tabasco',
        nombre_torneo: 'Torneo Apertura 2026',
        categoria: 'Libre Varonil',
      });
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al crear la liga.');
    } finally {
      setCreandoLiga(false);
    }
  };

  if (!usuario) {
    if (publicMode) {
      return <PortalPublicoPage onBackToLogin={() => setPublicMode(false)} />;
    }
    return <LoginPage onOpenPublicPortal={() => setPublicMode(true)} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard General', icon: LayoutDashboard },
    { id: 'equipos', label: 'Equipos y Plantillas', icon: Users },
    { id: 'calendario', label: 'Rol Round-Robin', icon: Calendar },
    { id: 'cedula', label: 'Cédula Arbitral', icon: ClipboardCheck },
  ];

  const handleOpenCedula = (idPartido) => {
    setSelectedPartidoId(idPartido);
    setActiveTab('cedula');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="bg-white text-slate-800 border-b md:border-b-0 md:border-r border-slate-200 md:w-72 flex-shrink-0 flex flex-col justify-between shadow-sm">
        <div>
          <div className="p-4 flex items-center justify-between bg-emerald-600 text-white">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-full bg-white text-emerald-600 shadow-xs">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="font-black text-lg tracking-tight">SportsTech</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-xs font-bold bg-emerald-700 px-2.5 py-1.5 rounded-lg"
            >
              {mobileMenuOpen ? 'Cerrar' : 'Menú'}
            </button>
          </div>

          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block p-3.5 space-y-4`}>
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                  Liga Activa
                </span>
                <button
                  type="button"
                  onClick={() => setShowNuevaLiga(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
                >
                  + Nueva Liga
                </button>
              </div>

              <select
                value={selectedLigaId}
                onChange={(e) => setSelectedLigaId(Number(e.target.value))}
                className="w-full bg-white border border-emerald-300 text-slate-900 text-xs font-bold rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {ligas.map((l) => (
                  <option key={l.id_liga} value={l.id_liga}>
                    {l.nombre}
                  </option>
                ))}
              </select>

              {torneos.length > 0 && (
                <select
                  value={selectedTorneoId}
                  onChange={(e) => setSelectedTorneoId(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {torneos.map((t) => (
                    <option key={t.id_torneo} value={t.id_torneo}>
                      {t.nombre} ({t.categoria})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-200">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-xs font-extrabold text-slate-900 truncate">
                  {usuario.nombre_completo}
                </p>
                <p className="text-[11px] text-emerald-700 font-bold">{usuario.rol}</p>
                <button
                  onClick={logout}
                  className="mt-2.5 w-full bg-white border border-slate-300 hover:bg-red-600 hover:border-red-600 text-slate-700 hover:text-white text-xs font-bold py-2 rounded-lg transition"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <DashboardPage idTorneo={selectedTorneoId} />}
        {activeTab === 'equipos' && (
          <EquiposJugadoresPage idLiga={selectedLigaId} idTorneo={selectedTorneoId} />
        )}
        {activeTab === 'calendario' && (
          <CalendarioRoundRobinPage idTorneo={selectedTorneoId} onSelectCedula={handleOpenCedula} />
        )}
        {activeTab === 'cedula' && (
          <CedulaArbitralPage
            idPartido={selectedPartidoId}
            onBack={() => setActiveTab('calendario')}
          />
        )}
      </main>

      {showNuevaLiga && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">Registrar Nueva Liga</h3>
              <button
                onClick={() => setShowNuevaLiga(false)}
                className="text-sm font-bold text-slate-400 hover:text-slate-700 px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearLiga} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Nombre de la Liga
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Liga Regional de Cunduacán"
                  value={nuevaLigaForm.nombre}
                  onChange={(e) => setNuevaLigaForm({ ...nuevaLigaForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Municipio
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevaLigaForm.municipio}
                    onChange={(e) =>
                      setNuevaLigaForm({ ...nuevaLigaForm, municipio: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevaLigaForm.estado}
                    onChange={(e) => setNuevaLigaForm({ ...nuevaLigaForm, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Torneo Inicial
                </label>
                <input
                  type="text"
                  required
                  value={nuevaLigaForm.nombre_torneo}
                  onChange={(e) =>
                    setNuevaLigaForm({ ...nuevaLigaForm, nombre_torneo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  required
                  value={nuevaLigaForm.categoria}
                  onChange={(e) =>
                    setNuevaLigaForm({ ...nuevaLigaForm, categoria: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNuevaLiga(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoLiga}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm shadow-sm"
                >
                  {creandoLiga ? 'Creando...' : 'Crear y Seleccionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainShell />
    </AuthProvider>
  );
}