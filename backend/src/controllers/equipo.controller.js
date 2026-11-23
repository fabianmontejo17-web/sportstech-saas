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
    const escudo_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!nombre || !delegado_nombre || !telefono) {
      return res.status(400).json({ ok: false, mensaje: 'Nombre del equipo, delegado y teléfono son obligatorios.' });
    }

    const [result] = await pool.query(
      `INSERT INTO equipos (id_liga, nombre, delegado_nombre, telefono, escudo_url)
       VALUES (?, ?, ?, ?, ?)`,
      [id_liga, nombre.trim(), delegado_nombre.trim(), telefono.trim(), escudo_url]
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

/**
 * Registra al futbolista con validación fotográfica e INE/CURP y lo inscribe en la plantilla del torneo
 * evitando duplicidad de jugador en el mismo torneo (3FN).
 */
async function registrarJugadorEnPlantilla(req, res) {
  try {
    const id_liga = req.body.id_liga || req.user.id_liga || 1;
    const { id_torneo, id_equipo, curp, nombre_completo, fecha_nacimiento, num_camiseta } = req.body;

    if (!id_torneo || !id_equipo || !curp || !nombre_completo || !fecha_nacimiento || !num_camiseta) {
      return res.status(400).json({ ok: false, mensaje: 'Todos los campos del jugador y dorsal son obligatorios.' });
    }

    const fotoFile = req.files?.foto?.[0];
    const ineFile = req.files?.ine?.[0];
    const foto_url = fotoFile ? `/uploads/${fotoFile.filename}` : null;
    const ine_url = ineFile ? `/uploads/${ineFile.filename}` : null;
    const ine_validada = ine_url ? 1 : 0;

    const data = await withTransaction(async (conn) => {
      const curpNorm = curp.trim().toUpperCase();
      const [existing] = await conn.query('SELECT id_jugador FROM jugadores WHERE curp = ? LIMIT 1', [curpNorm]);

      let idJugador;
      if (existing.length > 0) {
        idJugador = existing[0].id_jugador;
        if (foto_url || ine_url) {
          await conn.query(
            `UPDATE jugadores
             SET foto_url = COALESCE(?, foto_url),
                 ine_url = COALESCE(?, ine_url),
                 ine_validada = CASE WHEN ? IS NOT NULL THEN 1 ELSE ine_validada END
             WHERE id_jugador = ?`,
            [foto_url, ine_url, ine_url, idJugador]
          );
        }
      } else {
        const [ins] = await conn.query(
          `INSERT INTO jugadores (id_liga, curp, nombre_completo, fecha_nacimiento, foto_url, ine_url, ine_validada)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id_liga, curpNorm, nombre_completo.trim(), fecha_nacimiento, foto_url, ine_url, ine_validada]
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
      mensaje: 'Jugador validado e inscrito correctamente en la plantilla.',
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

async function validarIneJugador(req, res) {
  try {
    const { idJugador } = req.params;
    const { ine_validada } = req.body;
    await pool.query('UPDATE jugadores SET ine_validada = ? WHERE id_jugador = ?', [ine_validada ? 1 : 0, idJugador]);
    return res.json({ ok: true, mensaje: 'Estatus de validación documental actualizado.' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: error.message });
  }
}

module.exports = {
  getEquipos,
  createEquipo,
  getJugadoresByEquipo,
  registrarJugadorEnPlantilla,
  validarIneJugador,
};
