const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const apiRoutes = require('./routes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://sportstech-saas.vercel.app',
];

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir fotografías e identificaciones cargadas
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas versionadas v1
app.use('/api/v1', apiRoutes);

// Manejador global de errores
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ ok: false, mensaje: err.message || 'Error en la solicitud.' });
});

module.exports = app;