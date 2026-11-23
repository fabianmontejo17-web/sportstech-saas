const { pool, withTransaction } = require('../config/db');

/**
 * Algoritmo Round-Robin (Método del Círculo) con validación anti-empalmes de cancha y horario.
 */
async function generarRoundRobin(req, res) {
  try {
    const {
      id_torneo = 1,
      fecha_inicio,
      canchas = ['Campo Deportivo Municipal 1', 'Campo Deportivo Municipal 2'],
      horarios = ['09:00', '11:00', '13:00', '16:00'],
      limpiar_previos = false,
    } = req.body;

    if (!fecha_inicio) {
      return res.status(400).json({ ok: false, mensaje: 'La fecha de inicio del rol es obligatoria.' });
    }

    const result = await withTransaction(async (conn) => {
      const [torneoRows] = await conn.query('SELECT id_liga FROM torneos WHERE id_torneo = ? LIMIT 1', [id_torneo]);
      if (torneoRows.length === 0) throw new Error('Torneo no encontrado.');
      const idLiga = torneoRows[0].id_liga;

      const [equipos] = await conn.query(
        'SELECT id_equipo, nombre FROM equipos WHERE id_liga = ? AND activo = 1 ORDER BY id_equipo ASC',
        [idLiga]
      );

      if (equipos.length < 2) {
        throw new Error('Se requieren al menos 2 equipos activos para generar un calendario Round-Robin.');
      }

      if (limpiar_previos) {
        await conn.query("DELETE FROM partidos WHERE id_torneo = ? AND estatus = 'PROGRAMADO'", [id_torneo]);
      }

      // Si el número de equipos es impar, agregamos equipo fantasma (DESCANSO)
      const lista = [...equipos];
      if (lista.length % 2 !== 0) {
        lista.push({ id_equipo: null, nombre: 'DESCANSO' });
      }

      const numEquipos = lista.length;
      const totalJornadas = numEquipos - 1;
      const partidosPorJornada = numEquipos / 2;

      const partidosCreados = [];
      const baseDate = new Date(`${fecha_inicio}T00:00:00`);

      for (let j = 0; j < totalJornadas; j++) {
        // Cada jornada se programa cada 7 días (domingos consecutivos)
        const fechaJornada = new Date(baseDate);
        fechaJornada.setDate(baseDate.getDate() + j * 7);
        const yyyy = fechaJornada.getFullYear();
        const mm = String(fechaJornada.getMonth() + 1).padStart(2, '0');
        const dd = String(fechaJornada.getDate()).padStart(2, '0');
        const fechaStr = `${yyyy}-${mm}-${dd}`;

        let slotIdx = 0;

        for (let m = 0; m < partidosPorJornada; m++) {
          const home = lista[m];
          const away = lista[numEquipos - 1 - m];

          if (!home.id_equipo || !away.id_equipo) continue; // Jornada de descanso

          const local = j % 2 === 0 ? home : away;
          const visita = j % 2 === 0 ? away : home;

          // Asignar cancha y horario evitando empalmes en el mismo bloque
          const cancha = canchas[slotIdx % canchas.length];
          const hora = horarios[Math.floor(slotIdx / canchas.length) % horarios.length];
          const fechaHora = `${fechaStr} ${hora}:00`;
          slotIdx++;

          // Validación explícita anti-empalme en base de datos (±90 min en la misma cancha)
          const [colisiones] = await conn.query(
            `SELECT id_partido FROM partidos
             WHERE cancha = ?
               AND ABS(TIMESTAMPDIFF(MINUTE, fecha_hora, ?)) < 90`,
            [cancha, fechaHora]
          );

          if (colisiones.length > 0) {
            throw new Error(`Empalme detectado en ${cancha} el ${fechaHora}. Ajuste las canchas u horarios.`);
          }

          const [ins] = await conn.query(
            `INSERT INTO partidos (id_torneo, jornada, id_local, id_visita, cancha, fecha_hora, estatus)
             VALUES (?, ?, ?, ?, ?, ?, 'PROGRAMADO')`,
            [id_torneo, j + 1, local.id_equipo, visita.id_equipo, cancha, fechaHora]
          );

          partidosCreados.push({
            id_partido: ins.insertId,
            jornada: j + 1,
            local: local.nombre,
            visita: visita.nombre,
            cancha,
            fecha_hora: fechaHora,
          });
        }

        // Rotación del círculo (fijando índice 0)
        const ultimo = lista.pop();
        lista.splice(1, 0, ultimo);
      }

      return partidosCreados;
    });

    return res.status(201).json({
      ok: true,
      mensaje: `Calendario Round-Robin generado sin empalmes (${result.length} partidos).`,
      total: result.length,
      partidos: result,
    });
  } catch (error) {
    return res.status(400).json({ ok: false, mensaje: error.message });
  }
}

async function getPartidosByTorneo(req, res) {
  try {
    const idTorneo = req.params.idTorneo || 1;
    const [rows] = await pool.query(
      `SELECT p.*,
              el.nombre AS local_nombre,
              ev.nombre AS visita_nombre,
              c.id_cedula,
              c.goles_local,
              c.goles_visita,
              c.cerrada
       FROM partidos p
       JOIN equipos el ON el.id_equipo = p.id_local
       JOIN equipos ev ON ev.id_equipo = p.id_visita
       LEFT JOIN cedulas_arbitrales c ON c.id_partido = p.id_partido
       WHERE p.id_torneo = ?
       ORDER BY p.jornada ASC, p.fecha_hora ASC`,
      [idTorneo]
    );
    return res.json({ ok: true, data: rows });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: error.message });
  }
}

module.exports = { generarRoundRobin, getPartidosByTorneo };
