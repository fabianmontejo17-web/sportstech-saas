import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import DashboardPage from './DashboardPage';

export default function PortalPublicoPage({ onBackToLogin }) {
  const [ligas, setLigas] = useState([]);
  const [torneos, setTorneos] = useState([]);
  const [selectedLiga, setSelectedLiga] = useState('');
  const [selectedTorneo, setSelectedTorneo] = useState(1);
  const [partidos, setPartidos] = useState([]);
  const [vistaActiva, setVistaActiva] = useState('posiciones');
  const [jornadaFiltro, setJornadaFiltro] = useState('TODAS');

  useEffect(() => {
    axiosClient.get('/ligas').then((res) => {
      const lista = res.data.data || [];
      setLigas(lista);
      if (lista.length > 0) {
        setSelectedLiga(lista[0].id_liga);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedLiga) return;
    axiosClient.get(`/ligas/${selectedLiga}/torneos`).then((res) => {
      const listaTorneos = res.data.data || [];
      setTorneos(listaTorneos);
      if (listaTorneos.length > 0) {
        setSelectedTorneo(listaTorneos[0].id_torneo);
      }
    });
  }, [selectedLiga]);

  useEffect(() => {
    if (!selectedTorneo) return;
    axiosClient.get(`/torneos/${selectedTorneo}/partidos`).then((res) => {
      setPartidos(res.data.data || []);
      setJornadaFiltro('TODAS');
    });
  }, [selectedTorneo]);

  const jornadasDisponibles = [...new Set(partidos.map((p) => p.jornada))];
  const partidosFiltrados =
    jornadaFiltro === 'TODAS'
      ? partidos
      : partidos.filter((p) => String(p.jornada) === String(jornadaFiltro));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Barra superior */}
      <header className="bg-emerald-600 text-white px-4 sm:px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-white text-emerald-600 shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base leading-tight">
                SportsTech • Portal Público
              </h1>
              <p className="text-[11px] text-emerald-100">
                Resultados, Calendario y Estadísticas Oficiales
              </p>
            </div>
          </div>

          <button
            onClick={onBackToLogin}
            className="inline-flex items-center justify-center bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
          >
            Acceso Administrativo
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Selectores Multi-Liga y Torneo + Pestañas */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase text-emerald-800 mb-1">
                Liga Municipal / Regional
              </label>
              <select
                value={selectedLiga}
                onChange={(e) => setSelectedLiga(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {ligas.map((l) => (
                  <option key={l.id_liga} value={l.id_liga}>
                    {l.nombre} ({l.municipio})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase text-emerald-800 mb-1">
                Torneo / Categoría
              </label>
              <select
                value={selectedTorneo}
                onChange={(e) => setSelectedTorneo(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {torneos.map((t) => (
                  <option key={t.id_torneo} value={t.id_torneo}>
                    {t.nombre} — {t.categoria}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conmutador de Vista */}
          <div className="flex rounded-lg bg-emerald-50 border border-emerald-200 p-1 self-start md:self-end">
            <button
              onClick={() => setVistaActiva('posiciones')}
              className={`px-3.5 py-2 rounded-md text-xs font-bold transition ${
                vistaActiva === 'posiciones'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              Posiciones y Goleo
            </button>
            <button
              onClick={() => setVistaActiva('calendario')}
              className={`px-3.5 py-2 rounded-md text-xs font-bold transition ${
                vistaActiva === 'calendario'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              Rol de Partidos ({partidos.length})
            </button>
          </div>
        </div>

        {/* Contenido dinámico según pestaña */}
        {vistaActiva === 'posiciones' ? (
          <DashboardPage idTorneo={selectedTorneo} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-emerald-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-extrabold text-slate-900 text-base">
                Calendario Oficial
              </h2>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Filtrar:</span>
                <select
                  value={jornadaFiltro}
                  onChange={(e) => setJornadaFiltro(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="TODAS">Todas las jornadas</option>
                  {jornadasDisponibles.map((j) => (
                    <option key={j} value={j}>
                      Jornada {j}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {partidosFiltrados.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">
                Aún no hay partidos programados para este torneo.
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {partidosFiltrados.map((p) => (
                  <div
                    key={p.id_partido}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-50/30 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-700 text-white">
                          Jornada {p.jornada}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            p.estatus === 'FINALIZADO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.estatus}
                        </span>
                      </div>

                      <p className="text-base font-extrabold text-slate-900">
                        {p.local_nombre}{' '}
                        <span className="inline-block px-2.5 py-0.5 mx-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-black">
                          {p.estatus === 'FINALIZADO'
                            ? `${p.goles_local} - ${p.goles_visita}`
                            : 'VS'}
                        </span>{' '}
                        {p.visita_nombre}
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end text-xs text-slate-600 gap-1">
                      <span className="font-semibold">{p.cancha}</span>
                      <span>
                        {new Date(p.fecha_hora).toLocaleString('es-MX', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}