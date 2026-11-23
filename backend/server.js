require('dotenv').config();
const app = require('./src/app');
const { pool } = require('./src/config/db');

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    const conn = await pool.getConnection();
    console.log(`[DB] Conectado exitosamente a MariaDB/MySQL en puerto ${process.env.DB_PORT || 3307}`);
    conn.release();

    app.listen(PORT, () => {
      console.log(`[API] SportsTech Backend corriendo en http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('[ERROR] No se pudo conectar a la base de datos:', error.message);
    process.exit(1);
  }
}

startServer();
