import React, { useEffect, useState } from 'react';
import { CalendarPlus, MapPin, Clock, ClipboardEdit } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function CalendarioRoundRobinPage({ idTorneo = 1, onSelectCedula }) {
  const [partidos, setPartidos] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('2026-09-13');
  const [canchasText, setCanchasText] = useState('Campo Deportivo Municipal 1, Campo Deportivo Municipal 2');
  const [limpiarPrevios, setLimpiarPrevios] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const loadPartidos = async () => {
    const { data } = await axiosClient.get(`/torneos/${idTorneo}/partidos`);
    setPartidos(data.data);
  };

  useEffect(() => {
    loadPartidos();
  }, [idTorneo]);

  const handleGenerar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const canchas = canchasText
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const { data } = await axiosClient.post('/calendario/round-robin', {
        id_torneo: idTorneo,
        fecha_inicio: fechaInicio,
        canchas,
        horarios: ['09:00', '11:00', '13:00', '16:00'],
        limpiar_previos: limpiarPrevios,
      });

      setFeedback({ type: 'ok', text: data.mensaje });
      loadPartidos();
    } catch (err) {
      setFeedback({ type: 'err', text: err.response?.data?.mensaje || 'Error al generar calendario.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-slate-900">Generador de Calendarios Round-Robin (Sin Empalmes)</h2>

      <form
        onSubmit={handleGenerar}
        className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
      >
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Fecha de Inicio (Jornada 1)</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Canchas Disponibles (separadas por coma)</label>
          <input
            type="text"
            value={canchasText}
            onChange={(e) => setCanchasText(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm shadow"
          >
            <CalendarPlus className="w-4 h-4" />
            {loading ? 'Calculando...' : 'Generar Rol Automático'}
          </button>
        </div>
        <div className="md:col-span-4 flex items-center gap-2">
          <input
            id="chkLimpiar"
            type="checkbox"
            checked={limpiarPrevios}
            onChange={(e) => setLimpiarPrevios(e.target.checked)}
          />
          <label htmlFor="chkLimpiar" className="text-xs text-slate-600">
            Reemplazar partidos en estado PROGRAMADO antes de generar el nuevo rol (conserva partidos FINALIZADOS).
          </label>
        </div>
      </form>

      {feedback.text && (
        <div
          className={`p-3 rounded-lg text-sm font-semibold border-l-4 ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
              : 'bg-red-50 border-red-600 text-red-900'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b font-bold text-sm text-slate-800">
          Rol de Juegos Oficial ({partidos.length} encuentros)
        </div>
        <div className="divide-y divide-slate-200">
          {partidos.map((p) => (
            <div key={p.id_partido} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
              <div>
                <span className="inline-block text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-700 text-white mr-2">
                  Jornada {p.jornada}
                </span>
                <span
                  className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded ${
                    p.estatus === 'FINALIZADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {p.estatus}
                </span>
                <p className="text-base font-extrabold text-slate-900 mt-1">
                  {p.local_nombre}{' '}
                  <span className="text-emerald-700 mx-1">
                    {p.estatus === 'FINALIZADO' ? `${p.goles_local} - ${p.goles_visita}` : 'vs'}
                  </span>{' '}
                  {p.visita_nombre}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {p.cancha}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {new Date(p.fecha_hora).toLocaleString('es-MX')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectCedula(p.id_partido)}
                className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
              >
                <ClipboardEdit className="w-4 h-4" />
                {p.estatus === 'FINALIZADO' ? 'Ver Cédula Cerrada' : 'Abrir Cédula Arbitral'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
