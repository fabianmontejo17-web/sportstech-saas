const { pool, withTransaction } = require('../config/db');

async function getLigas(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM ligas WHERE estatus = 1 ORDER BY id_liga ASC');
    return res.json({ ok: true, data: rows });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: error.message });
  }
}

async function createLiga(req, res) {
  try {
    const {
      nombre,
      municipio = 'Jalpa de Méndez',
      estado = 'Tabasco',
      plan_saas = 'PRO',
      nombre_torneo = 'Torneo Apertura 2026',
      categoria = 'Libre Varonil',
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre de la liga es obligatorio.' });
    }

    const data = await withTransaction(async (conn) => {
      const [ligaRes] = await conn.query(
        `INSERT INTO ligas (nombre, municipio, estado, plan_saas, estatus)
         VALUES (?, ?, ?, ?, 1)`,
        [nombre.trim(), municipio.trim(), estado.trim(), plan_saas]
      );
      const idLiga = ligaRes.insertId;

      const hoy = new Date().toISOString().slice(0, 10);
      const [torneoRes] = await conn.query(
        `INSERT INTO torneos (id_liga, nombre, categoria, temporada, fecha_inicio, estatus)
         VALUES (?, ?, ?, '2026', ?, 'EN_CURSO')`,
        [idLiga, nombre_torneo.trim(), categoria.trim(), hoy]
      );

      return { id_liga: idLiga, id_torneo: torneoRes.insertId };
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Liga y torneo inicial creados correctamente.',
      data,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: error.message });
  }
}

async function getTorneosByLiga(req, res) {
  try {
    const idLiga = req.params.idLiga || req.user?.id_liga || 1;
    const [rows] = await pool.query(
      'SELECT * FROM torneos WHERE id_liga = ? ORDER BY fecha_inicio DESC',
      [idLiga]
    );
    return res.json({ ok: true, data: rows });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: error.message });
  }
}

async function createTorneo(req, res) {
  try {
    const id_liga = req.body.id_liga || req.user.id_liga || 1;
    const { nombre, categoria, temporada, fecha_inicio } = req.body;
    if (!nombre || !fecha_inicio) {
      return res.status(400).json({ ok: false, mensaje: 'Nombre y fecha de inicio son obligatorios.' });
    }
    const [result] = await pool.query(
      `INSERT INTO torneos (id_liga, nombre, categoria, temporada, fecha_inicio, estatus)
       VALUES (?, ?, ?, ?, ?, 'EN_CURSO')`,
      [id_liga, nombre, categoria || 'Libre Varonil', temporada || '2026', fecha_inicio]
    );
    return res.status(201).json({ ok: true, id_torneo: result.insertId, mensaje: 'Torneo creado.' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: error.message });
  }
}

module.exports = { getLigas, createLiga, getTorneosByLiga, createTorneo };