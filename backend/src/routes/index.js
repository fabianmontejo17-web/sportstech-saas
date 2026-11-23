const express = require('express');
const router = express.Router();

const { verifyToken, requireRoles } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const authCtrl = require('../controllers/auth.controller');
const ligaCtrl = require('../controllers/liga.controller');
const equipoCtrl = require('../controllers/equipo.controller');
const calCtrl = require('../controllers/calendario.controller');
const cedulaCtrl = require('../controllers/cedula.controller');
const statsCtrl = require('../controllers/estadisticas.controller');

// Health check
router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    servicio: 'SportsTech SaaS API v1',
    fabrica: 'Chontalpa CodeWorks S.A.P.I. de C.V.',
    timestamp: new Date().toISOString(),
  });
});

// Autenticación y RBAC
router.post('/auth/login', authCtrl.login);
router.post('/auth/register', authCtrl.register);
router.get('/auth/profile', verifyToken, authCtrl.profile);

// Multi-Liga y Torneos
router.get('/ligas', ligaCtrl.getLigas);
router.post('/ligas', verifyToken, ligaCtrl.createLiga);
router.get('/ligas/:idLiga/torneos', ligaCtrl.getTorneosByLiga);
router.post('/torneos', verifyToken, requireRoles('SUPERADMIN', 'ADMIN_LIGA'), ligaCtrl.createTorneo);

// Equipos y Jugadores (con subida de foto e INE)
router.get('/equipos', verifyToken, equipoCtrl.getEquipos);
router.post(
  '/equipos',
  verifyToken,
  requireRoles('SUPERADMIN', 'ADMIN_LIGA'),
  upload.single('escudo'),
  equipoCtrl.createEquipo
);
router.get('/equipos/:idEquipo/jugadores', verifyToken, equipoCtrl.getJugadoresByEquipo);
router.post(
  '/jugadores/inscribir',
  verifyToken,
  requireRoles('SUPERADMIN', 'ADMIN_LIGA', 'DELEGADO'),
  upload.fields([
    { name: 'foto', maxCount: 1 },
    { name: 'ine', maxCount: 1 },
  ]),
  equipoCtrl.registrarJugadorEnPlantilla
);
router.patch(
  '/jugadores/:idJugador/validar-ine',
  verifyToken,
  requireRoles('SUPERADMIN', 'ADMIN_LIGA'),
  equipoCtrl.validarIneJugador
);

// Generador Round-Robin y Calendario sin empalmes
router.get('/torneos/:idTorneo/partidos', calCtrl.getPartidosByTorneo);
router.post(
  '/calendario/round-robin',
  verifyToken,
  requireRoles('SUPERADMIN', 'ADMIN_LIGA'),
  calCtrl.generarRoundRobin
);

// Cédula Arbitral Digital (Transaccional)
router.get('/cedulas/partido/:idPartido', verifyToken, cedulaCtrl.getDetalleCedula);
router.post(
  '/cedulas/partido/:idPartido',
  verifyToken,
  requireRoles('SUPERADMIN', 'ADMIN_LIGA', 'ARBITRO'),
  cedulaCtrl.guardarYCerrarCedula
);

// Portal Público y Estadísticas en Tiempo Real (Acceso público y privado)
router.get('/public/torneos/:idTorneo/estadisticas', statsCtrl.getEstadisticasTorneo);

module.exports = router;
