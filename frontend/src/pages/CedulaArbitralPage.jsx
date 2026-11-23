import React, { useEffect, useState } from 'react';
import { CheckCircle, PlusCircle, Trash2, ShieldAlert } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function CedulaArbitralPage({ idPartido, onBack }) {
  const [detalle, setDetalle] = useState(null);
  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisita, setGolesVisita] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [eventos, setEventos] = useState([]);

  // Selector de nuevo evento
  const [nuevoEvento, setNuevoEvento] = useState({
    id_jugador: '',
    tipo: 'GOL',
    minuto: 15,
    observacion: '',
  });
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!idPartido) return;
    axiosClient.get(`/cedulas/partido/${idPartido}`).then((res) => {
      setDetalle(res.data);
      if (res.data.cedula) {
        setGolesLocal(res.data.cedula.goles_local);
        setGolesVisita(res.data.cedula.goles_visita);
        setObservaciones(res.data.cedula.observaciones || '');
      }
      if (res.data.eventos) {
        setEventos(res.data.eventos);
      }
      if (res.data.jugadores?.length > 0) {
        setNuevoEvento((prev) => ({ ...prev, id_jugador: res.data.jugadores[0].id_jugador }));
      }
    });
  }, [idPartido]);

  if (!idPartido) {
    return (
      <div className="bg-white p-6 rounded-xl border text-center space-y-3">
        <p className="text-slate-600 font-medium">Selecciona un partido desde el Calendario Round-Robin para llenar su cédula arbitral.</p>
      </div>
    );
  }

  if (!detalle) return <div className="p-6">Cargando cédula arbitral...</div>;

  const { partido, jugadores, cedula } = detalle;
  const estaCerrada = cedula?.cerrada === 1;

  const handleAgregarEvento = () => {
    const jug = jugadores.find((j) => Number(j.id_jugador) === Number(nuevoEvento.id_jugador));
    if (!jug) return;

    const item = {
      id_equipo: jug.id_equipo,
      id_jugador: jug.id_jugador,
      jugador_nombre: jug.nombre_completo,
      equipo_nombre: jug.id_equipo === partido.id_local ? partido.local_nombre : partido.visita_nombre,
      tipo: nuevoEvento.tipo,
      minuto: Number(nuevoEvento.minuto),
      observacion: nuevoEvento.observacion,
    };

    const nextEventos = [...eventos, item];
    setEventos(nextEventos);

    // Recalcular marcador automáticamente si el evento es GOL
    if (item.tipo === 'GOL') {
      if (item.id_equipo === partido.id_local) setGolesLocal((g) => g + 1);
      else setGolesVisita((g) => g + 1);
    }
  };

  const handleEliminarEvento = (idx) => {
    const target = eventos[idx];
    const next = eventos.filter((_, i) => i !== idx);
    setEventos(next);
    if (target.tipo === 'GOL') {
      if (target.id_equipo === partido.id_local) setGolesLocal((g) => Math.max(0, g - 1));
      else setGolesVisita((g) => Math.max(0, g - 1));
    }
  };

  const handleGuardarCedula = async (cerrarOficialmente) => {
    setStatusMsg({ type: '', text: '' });
    try {
      const { data } = await axiosClient.post(`/cedulas/partido/${idPartido}`, {
        goles_local: golesLocal,
        goles_visita: golesVisita,
        observaciones,
        eventos,
        cerrar: cerrarOficialmente,
      });
      setStatusMsg({ type: 'ok', text: data.mensaje });
      if (cerrarOficialmente) {
        setDetalle((prev) => ({ ...prev, cedula: { ...prev.cedula, cerrada: 1 } }));
      }
    } catch (err) {
      setStatusMsg({ type: 'err', text: err.response?.data?.mensaje || 'Error al procesar cédula.' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900">Cédula Arbitral Digital (Mobile-First)</h2>
        {onBack && (
          <button onClick={onBack} className="text-xs font-bold text-emerald-700 hover:underline">
            ← Volver al Rol
          </button>
        )}
      </div>

      {/* Marcador Principal Alto Contraste */}
      <div className="bg-emerald-800 text-white rounded-2xl p-6 shadow-lg">
        <p className="text-center text-xs uppercase tracking-wider text-emerald-400 font-bold mb-3">
          Jornada {partido.jornada} • {partido.cancha}
        </p>
        <div className="grid grid-cols-3 items-center text-center gap-2">
          <div>
            <p className="font-extrabold text-base sm:text-lg">{partido.local_nombre}</p>
            <span className="text-[11px] text-slate-400">LOCAL</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <input
              type="number"
              min="0"
              disabled={estaCerrada}
              value={golesLocal}
              onChange={(e) => setGolesLocal(Number(e.target.value))}
              className="w-16 h-14 text-center text-3xl font-black bg-slate-800 border border-slate-700 rounded-xl text-white"
            />
            <span className="text-2xl font-bold text-slate-500">-</span>
            <input
              type="number"
              min="0"
              disabled={estaCerrada}
              value={golesVisita}
              onChange={(e) => setGolesVisita(Number(e.target.value))}
              className="w-16 h-14 text-center text-3xl font-black bg-slate-800 border border-slate-700 rounded-xl text-white"
            />
          </div>
          <div>
            <p className="font-extrabold text-base sm:text-lg">{partido.visita_nombre}</p>
            <span className="text-[11px] text-slate-400">VISITA</span>
          </div>
        </div>
      </div>

      {statusMsg.text && (
        <div
          className={`p-3 rounded-lg text-sm font-bold border-l-4 ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
              : 'bg-red-50 border-red-600 text-red-900'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Registro de Goles y Tarjetas */}
      {!estaCerrada && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Registrar Incidencia (Gol / Amonestación)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <select
              value={nuevoEvento.id_jugador}
              onChange={(e) => setNuevoEvento({ ...nuevoEvento, id_jugador: e.target.value })}
              className="sm:col-span-2 px-3 py-2 border rounded-lg text-sm"
            >
              {jugadores.map((j) => (
                <option key={j.id_jugador} value={j.id_jugador}>
                  #{j.num_camiseta} {j.nombre_completo} ({j.id_equipo === partido.id_local ? 'Local' : 'Visita'})
                </option>
              ))}
            </select>

            <select
              value={nuevoEvento.tipo}
              onChange={(e) => setNuevoEvento({ ...nuevoEvento, tipo: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm font-semibold"
            >
              <option value="GOL">⚽ Gol</option>
              <option value="TARJETA_AMARILLA">🟨 T. Amarilla</option>
              <option value="TARJETA_ROJA">🟥 T. Roja</option>
            </select>

            <input
              type="number"
              min="1"
              max="120"
              placeholder="Minuto"
              value={nuevoEvento.minuto}
              onChange={(e) => setNuevoEvento({ ...nuevoEvento, minuto: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleAgregarEvento}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
          >
            <PlusCircle className="w-4 h-4" /> Añadir Evento al Acta
          </button>
        </div>
      )}

      {/* Cronología del Partido */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b font-bold text-xs uppercase text-slate-600">
          Eventos Registrados en Cédula ({eventos.length})
        </div>
        <div className="divide-y">
          {eventos.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Sin goles ni tarjetas registradas.</p>
          ) : (
            eventos.map((ev, idx) => (
              <div key={idx} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <div>
                  <span className="font-black text-slate-900 mr-2">{ev.minuto}&apos;</span>
                  <span className="font-bold">{ev.tipo.replace('_', ' ')}</span> — {ev.jugador_nombre}{' '}
                  <span className="text-xs text-slate-500">({ev.equipo_nombre})</span>
                </div>
                {!estaCerrada && (
                  <button onClick={() => handleEliminarEvento(idx)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
        <label className="block text-xs font-bold uppercase text-slate-700">Observaciones Arbitrales</label>
        <textarea
          rows={2}
          disabled={estaCerrada}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Reporte disciplinario, estado de la cancha o incidentes..."
          className="w-full p-2.5 border rounded-lg text-sm"
        />

        {estaCerrada ? (
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <ShieldAlert className="w-5 h-5" /> Acta oficial cerrada. La tabla de posiciones ya fue actualizada.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => handleGuardarCedula(false)}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-3 rounded-xl text-sm"
            >
              Guardar Borrador
            </button>
            <button
              type="button"
              onClick={() => handleGuardarCedula(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-sm shadow-md"
            >
              <CheckCircle className="w-5 h-5" />
              Cerrar Cédula y Actualizar Tabla
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
