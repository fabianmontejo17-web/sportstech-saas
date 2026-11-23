const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, mensaje: 'Token de autenticación no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado.' });
  }
}

function requireRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        ok: false,
        mensaje: `Acceso denegado. Se requiere uno de los roles: ${rolesPermitidos.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = { verifyToken, requireRoles };
