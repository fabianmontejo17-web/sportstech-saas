const { pool, withTransaction } = require('../config/db');

async function getEquipos(req, res) {
  try {
    const idLiga = req.query.id_liga || req.user?.id_liga || 1;
    const [rows] = await pool.query(
      `SELECT e.*,
              (SELECT COUNT(*) FROM plantillas_torneo pt WHERE pt.id_equipo = e.id_equipo AND pt.estatus_habilitado = 1) AS total_jugadores
       FROM equipos e
       WHERE e.id_liga = ? AND e.activo = 1
       ORDER BY e.nombre ASC`,
      [idLiga]
    );
    return res.json({ ok: true, data: rows });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: error.message });
  }
}

async function createEquipo(req, res) {
  try {
    const id_liga = req.body.id_liga || req.user.id_liga || 1;
    const { nombre, delegado_nombre, telefono } = req.body;

    if (!nombre || !delegado_nombre || !telefono) {
      return res.status(400).json({ ok: false, mensaje: 'Nombre del equipo, delegado y teléfono son obligatorios.' });
    }

    const [result] = await pool.query(
      `INSERT INTO equipos (id_liga, nombre, delegado_nombre, telefono)
       VALUES (?, ?, ?, ?)`,
      [id_liga, nombre.trim(), delegado_nombre.trim(), telefono.trim()]
    );
    return res.status(201).json({ ok: true, id_equipo: result.insertId, mensaje: 'Equipo registrado exitosamente.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ ok: false, mensaje: 'Ya existe un equipo con ese nombre en esta liga.' });
    }
    return res.status(500).json({ ok: false, mensaje: error.message });
  }
}

async function getJugadoresByEquipo(req, res) {
  try {
    const { idEquipo } = req.params;
    const idTorneo = req.query.id_torneo || 1;
    const [rows] = await pool.query(
      `SELECT j.*, pt.id_plantilla, pt.num_camiseta, pt.estatus_habilitado, e.nombre AS equipo_nombre
       FROM plantillas_torneo pt
       JOIN jugadores j ON j.id_jugador = pt.id_jugador
       JOIN equipos e ON e.id_equipo = pt.id_equipo
       WHERE pt.id_equipo = ? AND pt.id_torneo = ?
       ORDER BY pt.num_camiseta ASC`,
      [idEquipo, idTorneo]
    );
    return res.json({ ok: true, data: rows });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: error.message });
  }
}

async function registrarJugadorEnPlantilla(req, res) {
  try {
    const id_liga = req.body.id_liga || req.user.id_liga || 1;
    const { id_torneo, id_equipo, curp, nombre_completo, fecha_nacimiento, num_camiseta } = req.body;

    if (!id_torneo || !id_equipo || !curp || !nombre_completo || !fecha_nacimiento || !num_camiseta) {
      return res.status(400).json({ ok: false, mensaje: 'Todos los campos del jugador y dorsal son obligatorios.' });
    }

    const data = await withTransaction(async (conn) => {
      const curpNorm = curp.trim().toUpperCase();
      const [existing] = await conn.query('SELECT id_jugador FROM jugadores WHERE curp = ? LIMIT 1', [curpNorm]);

      let idJugador;
      if (existing.length > 0) {
        idJugador = existing[0].id_jugador;
      } else {
        const [ins] = await conn.query(
          `INSERT INTO jugadores (id_liga, curp, nombre_completo, fecha_nacimiento)
           VALUES (?, ?, ?, ?)`,
          [id_liga, curpNorm, nombre_completo.trim(), fecha_nacimiento]
        );
        idJugador = ins.insertId;
      }

      const [plantillaRes] = await conn.query(
        `INSERT INTO plantillas_torneo (id_torneo, id_equipo, id_jugador, num_camiseta, estatus_habilitado)
         VALUES (?, ?, ?, ?, 1)`,
        [id_torneo, id_equipo, idJugador, Number(num_camiseta)]
      );

      return { id_jugador: idJugador, id_plantilla: plantillaRes.insertId };
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Jugador inscrito correctamente en la plantilla.',
      data,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        ok: false,
        mensaje: 'Conflicto de registro: el jugador ya está inscrito en otro equipo de este torneo o el dorsal ya está ocupado.',
      });
    }
    return res.status(500).json({ ok: false, mensaje: error.message });
  }
}

module.exports = {
  getEquipos,
  createEquipo,
  getJugadoresByEquipo,
  registrarJugadorEnPlantilla,
};