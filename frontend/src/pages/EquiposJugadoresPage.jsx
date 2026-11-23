import React, { useEffect, useState } from 'react';
import { UserPlus, Shield } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function EquiposJugadoresPage({ idLiga = 1, idTorneo = 1 }) {
  const [equipos, setEquipos] = useState([]);
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [nuevoEquipo, setNuevoEquipo] = useState({ nombre: '', delegado_nombre: '', telefono: '' });
  const [jugadorForm, setJugadorForm] = useState({
    nombre_completo: '',
    curp: '',
    fecha_nacimiento: '2000-01-01',
    num_camiseta: '',
  });

  const loadEquipos = async (resetSelection = false) => {
    const { data } = await axiosClient.get(`/equipos?id_liga=${idLiga}`);
    const lista = data.data || [];
    setEquipos(lista);

    if (lista.length === 0) {
      setSelectedEquipo(null);
      setJugadores([]);
    } else if (
      resetSelection ||
      !selectedEquipo ||
      !lista.some((e) => e.id_equipo === selectedEquipo.id_equipo)
    ) {
      setSelectedEquipo(lista[0]);
    }
  };

  useEffect(() => {
    loadEquipos(true);
  }, [idLiga]);

  useEffect(() => {
    if (selectedEquipo) {
      axiosClient
        .get(`/equipos/${selectedEquipo.id_equipo}/jugadores?id_torneo=${idTorneo}`)
        .then((res) => setJugadores(res.data.data || []));
    } else {
      setJugadores([]);
    }
  }, [selectedEquipo, idTorneo]);

  const handleCrearEquipo = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await axiosClient.post('/equipos', { ...nuevoEquipo, id_liga: idLiga });
      setNuevoEquipo({ nombre: '', delegado_nombre: '', telefono: '' });
      setMsg({ type: 'ok', text: 'Equipo registrado correctamente en la liga activa.' });
      loadEquipos(false);
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.mensaje || 'Error al crear equipo.' });
    }
  };

  const handleInscribirJugador = async (e) => {
    e.preventDefault();
    if (!selectedEquipo) return;
    setMsg({ type: '', text: '' });

    try {
      const fd = new FormData();
      fd.append('id_liga', idLiga);
      fd.append('id_torneo', idTorneo);
      fd.append('id_equipo', selectedEquipo.id_equipo);
      fd.append('nombre_completo', jugadorForm.nombre_completo);
      fd.append('curp', jugadorForm.curp);
      fd.append('fecha_nacimiento', jugadorForm.fecha_nacimiento);
      fd.append('num_camiseta', jugadorForm.num_camiseta);

      const { data } = await axiosClient.post('/jugadores/inscribir', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMsg({ type: 'ok', text: data.mensaje });
      setJugadorForm({
        nombre_completo: '',
        curp: '',
        fecha_nacimiento: '2000-01-01',
        num_camiseta: '',
      });

      const res = await axiosClient.get(
        `/equipos/${selectedEquipo.id_equipo}/jugadores?id_torneo=${idTorneo}`
      );
      setJugadores(res.data.data || []);
      loadEquipos(false);
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.mensaje || 'Error al inscribir jugador.' });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-slate-900">Equipos y Registro de Plantillas</h2>

      {msg.text && (
        <div
          className={`p-3 rounded-lg text-sm font-semibold border-l-4 ${
            msg.type === 'ok'
              ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
              : 'bg-red-50 border-red-600 text-red-900'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <form
            onSubmit={handleCrearEquipo}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3"
          >
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" /> Alta Rápida de Equipo
            </h3>
            <input
              type="text"
              placeholder="Nombre del Club / Equipo"
              value={nuevoEquipo.nombre}
              onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, nombre: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              placeholder="Nombre del Delegado"
              value={nuevoEquipo.delegado_nombre}
              onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, delegado_nombre: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              placeholder="Teléfono WhatsApp (10 dígitos)"
              value={nuevoEquipo.telefono}
              onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, telefono: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-sm shadow-sm transition"
            >
              Registrar Equipo
            </button>
          </form>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-emerald-50/70 border-b border-slate-200 font-bold text-xs uppercase text-emerald-900">
              Equipos Inscritos ({equipos.length})
            </div>
            <div className="divide-y divide-slate-200">
              {equipos.length === 0 ? (
                <p className="p-4 text-xs text-slate-500">
                  Esta liga aún no tiene equipos registrados.
                </p>
              ) : (
                equipos.map((eq) => (
                  <button
                    key={eq.id_equipo}
                    onClick={() => setSelectedEquipo(eq)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between transition ${
                      selectedEquipo?.id_equipo === eq.id_equipo
                        ? 'bg-emerald-50 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-900">{eq.nombre}</p>
                      <p className="text-xs text-slate-500">De: {eq.delegado_nombre}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-800">
                      {eq.total_jugadores} jug.
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedEquipo ? (
            <>
              <form
                onSubmit={handleInscribirJugador}
                className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4"
              >
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  Inscribir Jugador en:{' '}
                  <span className="text-emerald-700">{selectedEquipo.nombre}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre completo del jugador"
                      value={jugadorForm.nombre_completo}
                      onChange={(e) =>
                        setJugadorForm({ ...jugadorForm, nombre_completo: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      CURP (18 caracteres)
                    </label>
                    <input
                      type="text"
                      maxLength={18}
                      placeholder="CURP del jugador"
                      value={jugadorForm.curp}
                      onChange={(e) =>
                        setJugadorForm({ ...jugadorForm, curp: e.target.value.toUpperCase() })
                      }
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={jugadorForm.fecha_nacimiento}
                      onChange={(e) =>
                        setJugadorForm({ ...jugadorForm, fecha_nacimiento: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Número de Dorsal
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      placeholder="Ej. 10"
                      value={jugadorForm.num_camiseta}
                      onChange={(e) =>
                        setJugadorForm({ ...jugadorForm, num_camiseta: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm shadow-sm transition"
                >
                  Inscribir en Plantilla
                </button>
              </form>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 bg-emerald-50/70 border-b border-slate-200 font-bold text-sm text-slate-800">
                  Plantilla Oficial Registrada ({jugadores.length} futbolistas)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-emerald-700 text-white text-xs uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Dorsal</th>
                        <th className="px-3 py-2.5">Jugador</th>
                        <th className="px-3 py-2.5">CURP</th>
                        <th className="px-3 py-2.5">Fecha de Nacimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {jugadores.map((j) => (
                        <tr key={j.id_plantilla} className="hover:bg-emerald-50/30">
                          <td className="px-3 py-2.5 font-black text-emerald-700">
                            #{j.num_camiseta}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-slate-900">
                            {j.nombre_completo}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{j.curp}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-600">
                            {j.fecha_nacimiento ? String(j.fecha_nacimiento).slice(0, 10) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-sm text-slate-600">
              Registra el primer equipo en el formulario de la izquierda para comenzar a inscribir
              jugadores en esta liga.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}