import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, Calendar, CheckCircle2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function DashboardPage({ idTorneo = 1 }) {
  const [posiciones, setPosiciones] = useState([]);
  const [goleo, setGoleo] = useState([]);
  const [kpis, setKpis] = useState({
    equipos_activos: 0,
    jugadores_validados: 0,
    jornada_actual: 1,
    partidos_cerrados: 0,
    total_partidos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idTorneo) return;
    setLoading(true);

    axiosClient
      .get(`/public/torneos/${idTorneo}/estadisticas`)
      .then((res) => {
        const raw = res.data || {};
        const payload = raw.data && !Array.isArray(raw.data) ? raw.data : raw;

        const listaPosiciones =
          payload.posiciones || payload.tabla_posiciones || payload.tabla || [];
        const listaGoleo =
          payload.goleo || payload.tabla_goleo || payload.goleadores || [];
        const resumen = payload.kpis || payload.resumen || {};

        setPosiciones(Array.isArray(listaPosiciones) ? listaPosiciones : []);
        setGoleo(Array.isArray(listaGoleo) ? listaGoleo : []);

        setKpis({
          equipos_activos: resumen.equipos_activos ?? resumen.total_equipos ?? listaPosiciones.length ?? 0,
          jugadores_validados: resumen.jugadores_validados ?? resumen.total_jugadores ?? 0,
          jornada_actual: resumen.jornada_actual ?? 1,
          partidos_cerrados: resumen.partidos_cerrados ?? resumen.partidos_jugados ?? 0,
          total_partidos: resumen.total_partidos ?? 0,
        });
      })
      .finally(() => setLoading(false));
  }, [idTorneo]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 text-center text-sm font-semibold text-slate-500 border border-slate-200">
        Cargando estadísticas del torneo...
      </div>
    );
  }

  const cards = [
    {
      label: 'Equipos Activos',
      value: kpis.equipos_activos,
      icon: ShieldCheck,
      color: 'border-emerald-600 text-emerald-700',
    },
    {
      label: 'Jugadores Validados',
      value: kpis.jugadores_validados,
      icon: Users,
      color: 'border-emerald-500 text-emerald-600',
    },
    {
      label: 'Jornada Actual',
      value: `J-${kpis.jornada_actual}`,
      icon: Calendar,
      color: 'border-amber-500 text-amber-600',
    },
    {
      label: 'Partidos Cerrados',
      value: `${kpis.partidos_cerrados} / ${kpis.total_partidos}`,
      icon: CheckCircle2,
      color: 'border-purple-600 text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${c.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500">{c.label}</span>
                <Icon className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabla General y Líderes de Goleo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla General */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 bg-emerald-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base">Tabla General</h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              En vivo
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-emerald-700 text-white text-xs uppercase">
                <tr>
                  <th className="px-3 py-2.5 text-center">#</th>
                  <th className="px-3 py-2.5">Equipo</th>
                  <th className="px-2.5 py-2.5 text-center">PJ</th>
                  <th className="px-2.5 py-2.5 text-center">PG</th>
                  <th className="px-2.5 py-2.5 text-center">PE</th>
                  <th className="px-2.5 py-2.5 text-center">PP</th>
                  <th className="px-2.5 py-2.5 text-center">GF</th>
                  <th className="px-2.5 py-2.5 text-center">GC</th>
                  <th className="px-2.5 py-2.5 text-center">DG</th>
                  <th className="px-3 py-2.5 text-center font-black">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {posiciones.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-6 text-center text-slate-500">
                      Sin registros en la tabla general.
                    </td>
                  </tr>
                ) : (
                  posiciones.map((row, idx) => (
                    <tr key={row.id_equipo || idx} className="hover:bg-emerald-50/30">
                      <td className="px-3 py-2.5 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        {row.equipo || row.nombre_equipo || row.nombre}
                      </td>
                      <td className="px-2.5 py-2.5 text-center">{row.pj ?? 0}</td>
                      <td className="px-2.5 py-2.5 text-center">{row.pg ?? 0}</td>
                      <td className="px-2.5 py-2.5 text-center">{row.pe ?? 0}</td>
                      <td className="px-2.5 py-2.5 text-center">{row.pp ?? 0}</td>
                      <td className="px-2.5 py-2.5 text-center">{row.gf ?? 0}</td>
                      <td className="px-2.5 py-2.5 text-center">{row.gc ?? 0}</td>
                      <td className="px-2.5 py-2.5 text-center font-semibold">
                        {row.dg ?? row.dif ?? 0}
                      </td>
                      <td className="px-3 py-2.5 text-center font-black text-emerald-700 bg-emerald-50/60">
                        {row.pts ?? row.puntos ?? 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Líderes de Goleo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 bg-emerald-50/70 border-b border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">Líderes de Goleo</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-emerald-700 text-white text-xs uppercase">
                <tr>
                  <th className="px-3 py-2.5 text-center">#</th>
                  <th className="px-3 py-2.5">Jugador</th>
                  <th className="px-3 py-2.5">Equipo</th>
                  <th className="px-3 py-2.5 text-center">Goles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {goleo.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-6 text-center text-slate-500">
                      Sin goles registrados todavía.
                    </td>
                  </tr>
                ) : (
                  goleo.map((g, idx) => (
                    <tr key={g.id_jugador || idx} className="hover:bg-emerald-50/30">
                      <td className="px-3 py-2.5 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        {g.nombre_completo || g.jugador}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">
                        {g.equipo || g.nombre_equipo}
                      </td>
                      <td className="px-3 py-2.5 text-center font-black text-emerald-700 bg-emerald-50/60">
                        {g.goles ?? g.total_goles ?? 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}