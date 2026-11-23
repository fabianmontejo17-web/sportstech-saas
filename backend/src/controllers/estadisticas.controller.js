const { pool } = require('../config/db');

async function getEstadisticasTorneo(req, res) {
  try {
    const idTorneo = req.params.idTorneo || 1;

    const [torneos] = await pool.query(
      `SELECT t.*, l.nombre AS liga_nombre, l.municipio, l.estado
       FROM torneos t
       JOIN ligas l ON l.id_liga = t.id_liga
       WHERE t.id_torneo = ? LIMIT 1`,
      [idTorneo]
    );

    const [posiciones] = await pool.query(
      `SELECT * FROM vw_tabla_posiciones
       WHERE id_torneo = ?
       ORDER BY pts DESC, dg DESC, gf DESC, equipo ASC`,
      [idTorneo]
    );

    const [goleo] = await pool.query(
      `SELECT * FROM vw_tabla_goleo
       WHERE id_torneo = ?
       LIMIT 15`,
      [idTorneo]
    );

    const [tarjetas] = await pool.query(
      `SELECT j.id_jugador, j.nombre_completo AS jugador, eq.nombre AS equipo,
              SUM(CASE WHEN ev.tipo = 'TARJETA_AMARILLA' THEN 1 ELSE 0 END) AS amarillas,
              SUM(CASE WHEN ev.tipo = 'TARJETA_ROJA' THEN 1 ELSE 0 END) AS rojas
       FROM eventos_partido ev
       JOIN cedulas_arbitrales c ON c.id_cedula = ev.id_cedula AND c.cerrada = 1
       JOIN partidos p ON p.id_partido = c.id_partido
       JOIN jugadores j ON j.id_jugador = ev.id_jugador
       JOIN equipos eq ON eq.id_equipo = ev.id_equipo
       WHERE p.id_torneo = ? AND ev.tipo IN ('TARJETA_AMARILLA', 'TARJETA_ROJA')
       GROUP BY j.id_jugador, j.nombre_completo, eq.nombre
       ORDER BY rojas DESC, amarillas DESC`,
      [idTorneo]
    );

    const [[kpis]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM equipos e JOIN torneos t ON t.id_liga = e.id_liga WHERE t.id_torneo = ? AND e.activo = 1) AS equipos_activos,
        (SELECT COUNT(*) FROM plantillas_torneo WHERE id_torneo = ? AND estatus_habilitado = 1) AS jugadores_validados,
        (SELECT COALESCE(MAX(jornada), 1) FROM partidos WHERE id_torneo = ? AND estatus = 'FINALIZADO') AS jornada_actual,
        (SELECT COUNT(*) FROM partidos WHERE id_torneo = ?) AS total_partidos,
        (SELECT COUNT(*) FROM partidos WHERE id_torneo = ? AND estatus = 'FINALIZADO') AS partidos_finalizados`,
      [idTorneo, idTorneo, idTorneo, idTorneo, idTorneo]
    );

    return res.json({
      ok: true,
      torneo: torneos[0] || null,
      kpis,
      posiciones,
      goleo,
      tarjetas,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: error.message });
  }
}

module.exports = { getEstadisticasTorneo };
