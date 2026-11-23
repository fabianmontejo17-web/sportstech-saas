const { pool, withTransaction } = require('../config/db');

async function getDetalleCedula(req, res) {
  try {
    const { idPartido } = req.params;
    const [partidos] = await pool.query(
      `SELECT p.*, el.nombre AS local_nombre, ev.nombre AS visita_nombre
       FROM partidos p
       JOIN equipos el ON el.id_equipo = p.id_local
       JOIN equipos ev ON ev.id_equipo = p.id_visita
       WHERE p.id_partido = ? LIMIT 1`,
      [idPartido]
    );
    if (partidos.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Partido no encontrado.' });
    }

    const partido = partidos[0];

    // Obtener jugadores habilitados de ambos equipos para el selector de eventos
    const [jugadores] = await pool.query(
      `SELECT pt.id_equipo, pt.num_camiseta, j.id_jugador, j.nombre_completo, j.ine_validada
       FROM plantillas_torneo pt
       JOIN jugadores j ON j.id_jugador = pt.id_jugador
       WHERE pt.id_torneo = ? AND pt.id_equipo IN (?, ?) AND pt.estatus_habilitado = 1
       ORDER BY pt.id_equipo, pt.num_camiseta ASC`,
      [partido.id_torneo, partido.id_local, partido.id_visita]
    );

    const [cedulas] = await pool.query(
      'SELECT * FROM cedulas_arbitrales WHERE id_partido = ? LIMIT 1',
      [idPartido]
    );

    let eventos = [];
    if (cedulas.length > 0) {
      const [evRows] = await pool.query(
        `SELECT ep.*, j.nombre_completo AS jugador_nombre, e.nombre AS equipo_nombre
         FROM eventos_partido ep
         JOIN jugadores j ON j.id_jugador = ep.id_jugador
         JOIN equipos e ON e.id_equipo = ep.id_equipo
         WHERE ep.id_cedula = ?
         ORDER BY ep.minuto ASC`,
        [cedulas[0].id_cedula]
      );
      eventos = evRows;
    }

    return res.json({
      ok: true,
      partido,
      jugadores,
      cedula: cedulas[0] || null,
      eventos,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: error.message });
  }
}

/**
 * Guarda y cierra la Cédula Arbitral Digital dentro de una transacción ACID.
 * Dispara el trigger trg_after_cedula_cerrada y recalcula tabla general y goleo en tiempo real.
 */
async function guardarYCerrarCedula(req, res) {
  try {
    const { idPartido } = req.params;
    const { goles_local, goles_visita, observaciones = '', eventos = [], cerrar = true } = req.body;

    const resultado = await withTransaction(async (conn) => {
      const [pRows] = await conn.query('SELECT * FROM partidos WHERE id_partido = ? LIMIT 1', [idPartido]);
      if (pRows.length === 0) throw new Error('Partido no encontrado.');
      const partido = pRows[0];

      const [existing] = await conn.query(
        'SELECT id_cedula, cerrada FROM cedulas_arbitrales WHERE id_partido = ? LIMIT 1',
        [idPartido]
      );

      let idCedula;
      if (existing.length > 0) {
        if (existing[0].cerrada === 1) {
          throw new Error('Esta cédula arbitral ya fue cerrada oficialmente y no puede alterarse.');
        }
        idCedula = existing[0].id_cedula;
        await conn.query('DELETE FROM eventos_partido WHERE id_cedula = ?', [idCedula]);
        await conn.query(
          `UPDATE cedulas_arbitrales
           SET goles_local = ?, goles_visita = ?, observaciones = ?, cerrada = ?, cerrada_en = ?
           WHERE id_cedula = ?`,
          [
            Number(goles_local),
            Number(goles_visita),
            observaciones,
            cerrar ? 1 : 0,
            cerrar ? new Date() : null,
            idCedula,
          ]
        );
      } else {
        const [ins] = await conn.query(
          `INSERT INTO cedulas_arbitrales (id_partido, goles_local, goles_visita, observaciones, cerrada, cerrada_en)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            idPartido,
            Number(goles_local),
            Number(goles_visita),
            observaciones,
            cerrar ? 1 : 0,
            cerrar ? new Date() : null,
          ]
        );
        idCedula = ins.insertId;
        if (cerrar) {
          await conn.query("UPDATE partidos SET estatus = 'FINALIZADO' WHERE id_partido = ?", [idPartido]);
        }
      }

      for (const ev of eventos) {
        await conn.query(
          `INSERT INTO eventos_partido (id_cedula, id_equipo, id_jugador, tipo, minuto, observacion)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [idCedula, ev.id_equipo, ev.id_jugador, ev.tipo, Number(ev.minuto), ev.observacion || null]
        );
      }

      // Consultar tabla general recalculada en tiempo real
      const [tabla] = await conn.query(
        `SELECT * FROM vw_tabla_posiciones
         WHERE id_torneo = ?
         ORDER BY pts DESC, dg DESC, gf DESC, equipo ASC`,
        [partido.id_torneo]
      );

      return { id_cedula: idCedula, cerrada: Boolean(cerrar), tabla_actualizada: tabla };
    });

    return res.json({
      ok: true,
      mensaje: cerrar
        ? 'Cédula arbitral cerrada y tabla de posiciones recalculada en tiempo real.'
        : 'Borrador de cédula arbitral guardado.',
      data: resultado,
    });
  } catch (error) {
    return res.status(400).json({ ok: false, mensaje: error.message });
  }
}

module.exports = { getDetalleCedula, guardarYCerrarCedula };
