-- ============================================================================
-- SPORTSTECH SAAS - BASE DE DATOS RELACIONAL NORMALIZADA (3FN)
-- Motor: MariaDB 10.6+ / MySQL 8.0+ (Compatible con WampServer Puerto 3307)
-- Fábrica de Software: Chontalpa CodeWorks S.A.P.I. de C.V.
-- ============================================================================

DROP DATABASE IF EXISTS sportstech_db;
CREATE DATABASE sportstech_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sportstech_db;

-- 1. LIGAS (Aislamiento Multi-Tenant)
CREATE TABLE ligas (
    id_liga INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    municipio VARCHAR(80) NOT NULL DEFAULT 'Jalpa de Méndez',
    estado VARCHAR(60) NOT NULL DEFAULT 'Tabasco',
    plan_saas ENUM('BASICO', 'PRO', 'ENTERPRISE') NOT NULL DEFAULT 'PRO',
    estatus TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. USUARIOS (Control de Acceso Basado en Roles - RBAC)
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_liga INT NULL,
    nombre_completo VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('SUPERADMIN', 'ADMIN_LIGA', 'DELEGADO', 'ARBITRO') NOT NULL DEFAULT 'ADMIN_LIGA',
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_liga FOREIGN KEY (id_liga) REFERENCES ligas(id_liga) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. TORNEOS
CREATE TABLE torneos (
    id_torneo INT AUTO_INCREMENT PRIMARY KEY,
    id_liga INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL DEFAULT 'Libre Varonil',
    temporada VARCHAR(40) NOT NULL DEFAULT 'Apertura 2026',
    fecha_inicio DATE NOT NULL,
    estatus ENUM('INSCRIPCIONES', 'EN_CURSO', 'FINALIZADO') NOT NULL DEFAULT 'EN_CURSO',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_torneos_liga FOREIGN KEY (id_liga) REFERENCES ligas(id_liga) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. EQUIPOS
CREATE TABLE equipos (
    id_equipo INT AUTO_INCREMENT PRIMARY KEY,
    id_liga INT NOT NULL,
    id_delegado INT NULL,
    nombre VARCHAR(100) NOT NULL,
    delegado_nombre VARCHAR(120) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    escudo_url VARCHAR(255) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipos_liga FOREIGN KEY (id_liga) REFERENCES ligas(id_liga) ON DELETE CASCADE,
    CONSTRAINT fk_equipos_delegado FOREIGN KEY (id_delegado) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    UNIQUE KEY uq_equipo_liga (id_liga, nombre)
) ENGINE=InnoDB;

-- 5. JUGADORES (Validación de Identidad INE/CURP y Fotografía)
CREATE TABLE jugadores (
    id_jugador INT AUTO_INCREMENT PRIMARY KEY,
    id_liga INT NOT NULL,
    curp VARCHAR(18) NOT NULL UNIQUE,
    nombre_completo VARCHAR(120) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    foto_url VARCHAR(255) NULL,
    ine_url VARCHAR(255) NULL,
    ine_validada TINYINT(1) NOT NULL DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jugadores_liga FOREIGN KEY (id_liga) REFERENCES ligas(id_liga) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. PLANTILLAS_TORNEO (Entidad Asociativa 3FN - Evita doble registro en mismo torneo)
CREATE TABLE plantillas_torneo (
    id_plantilla INT AUTO_INCREMENT PRIMARY KEY,
    id_torneo INT NOT NULL,
    id_equipo INT NOT NULL,
    id_jugador INT NOT NULL,
    num_camiseta INT NOT NULL,
    estatus_habilitado TINYINT(1) NOT NULL DEFAULT 1,
    registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_plantilla_torneo FOREIGN KEY (id_torneo) REFERENCES torneos(id_torneo) ON DELETE CASCADE,
    CONSTRAINT fk_plantilla_equipo FOREIGN KEY (id_equipo) REFERENCES equipos(id_equipo) ON DELETE CASCADE,
    CONSTRAINT fk_plantilla_jugador FOREIGN KEY (id_jugador) REFERENCES jugadores(id_jugador) ON DELETE CASCADE,
    UNIQUE KEY uq_jugador_torneo (id_torneo, id_jugador),
    UNIQUE KEY uq_dorsal_equipo_torneo (id_torneo, id_equipo, num_camiseta)
) ENGINE=InnoDB;

-- 7. PARTIDOS (Calendario Round-Robin con control de cancha y horario)
CREATE TABLE partidos (
    id_partido INT AUTO_INCREMENT PRIMARY KEY,
    id_torneo INT NOT NULL,
    jornada INT NOT NULL,
    id_local INT NOT NULL,
    id_visita INT NOT NULL,
    cancha VARCHAR(80) NOT NULL,
    fecha_hora DATETIME NOT NULL,
    id_arbitro INT NULL,
    estatus ENUM('PROGRAMADO', 'EN_JUEGO', 'FINALIZADO') NOT NULL DEFAULT 'PROGRAMADO',
    CONSTRAINT fk_partidos_torneo FOREIGN KEY (id_torneo) REFERENCES torneos(id_torneo) ON DELETE CASCADE,
    CONSTRAINT fk_partidos_local FOREIGN KEY (id_local) REFERENCES equipos(id_equipo),
    CONSTRAINT fk_partidos_visita FOREIGN KEY (id_visita) REFERENCES equipos(id_equipo),
    CONSTRAINT fk_partidos_arbitro FOREIGN KEY (id_arbitro) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    INDEX idx_cancha_fecha (cancha, fecha_hora)
) ENGINE=InnoDB;

-- 8. CEDULAS_ARBITRALES (Acta Oficial Digital)
CREATE TABLE cedulas_arbitrales (
    id_cedula INT AUTO_INCREMENT PRIMARY KEY,
    id_partido INT NOT NULL UNIQUE,
    goles_local INT NOT NULL DEFAULT 0,
    goles_visita INT NOT NULL DEFAULT 0,
    observaciones TEXT NULL,
    cerrada TINYINT(1) NOT NULL DEFAULT 0,
    cerrada_en DATETIME NULL,
    CONSTRAINT fk_cedula_partido FOREIGN KEY (id_partido) REFERENCES partidos(id_partido) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. EVENTOS_PARTIDO (Goles, Tarjetas Amarillas y Rojas)
CREATE TABLE eventos_partido (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    id_cedula INT NOT NULL,
    id_equipo INT NOT NULL,
    id_jugador INT NOT NULL,
    tipo ENUM('GOL', 'TARJETA_AMARILLA', 'TARJETA_ROJA') NOT NULL,
    minuto INT NOT NULL,
    observacion VARCHAR(200) NULL,
    CONSTRAINT fk_evento_cedula FOREIGN KEY (id_cedula) REFERENCES cedulas_arbitrales(id_cedula) ON DELETE CASCADE,
    CONSTRAINT fk_evento_equipo FOREIGN KEY (id_equipo) REFERENCES equipos(id_equipo),
    CONSTRAINT fk_evento_jugador FOREIGN KEY (id_jugador) REFERENCES jugadores(id_jugador)
) ENGINE=InnoDB;

-- ============================================================================
-- TRIGGER: Al cerrar la cédula arbitral, marcar automáticamente el partido FINALIZADO
-- ============================================================================
DELIMITER //
CREATE TRIGGER trg_after_cedula_cerrada
AFTER UPDATE ON cedulas_arbitrales
FOR EACH ROW
BEGIN
    IF NEW.cerrada = 1 AND OLD.cerrada = 0 THEN
        UPDATE partidos
        SET estatus = 'FINALIZADO'
        WHERE id_partido = NEW.id_partido;
    END IF;
END//
DELIMITER ;

-- ============================================================================
-- VISTA EN TIEMPO REAL: TABLA GENERAL DE POSICIONES (3FN CALCULADA)
-- ============================================================================
CREATE OR REPLACE VIEW vw_tabla_posiciones AS
SELECT
    t.id_torneo,
    e.id_equipo,
    e.nombre AS equipo,
    e.escudo_url,
    COUNT(c.id_cedula) AS jj,
    SUM(CASE
        WHEN (p.id_local = e.id_equipo AND c.goles_local > c.goles_visita)
          OR (p.id_visita = e.id_equipo AND c.goles_visita > c.goles_local) THEN 1
        ELSE 0
    END) AS jg,
    SUM(CASE
        WHEN c.goles_local = c.goles_visita THEN 1
        ELSE 0
    END) AS je,
    SUM(CASE
        WHEN (p.id_local = e.id_equipo AND c.goles_local < c.goles_visita)
          OR (p.id_visita = e.id_equipo AND c.goles_visita < c.goles_local) THEN 1
        ELSE 0
    END) AS jp,
    COALESCE(SUM(CASE WHEN p.id_local = e.id_equipo THEN c.goles_local ELSE c.goles_visita END), 0) AS gf,
    COALESCE(SUM(CASE WHEN p.id_local = e.id_equipo THEN c.goles_visita ELSE c.goles_local END), 0) AS gc,
    COALESCE(SUM(CASE WHEN p.id_local = e.id_equipo THEN (c.goles_local - c.goles_visita) ELSE (c.goles_visita - c.goles_local) END), 0) AS dg,
    COALESCE(SUM(CASE
        WHEN (p.id_local = e.id_equipo AND c.goles_local > c.goles_visita)
          OR (p.id_visita = e.id_equipo AND c.goles_visita > c.goles_local) THEN 3
        WHEN c.goles_local = c.goles_visita THEN 1
        ELSE 0
    END), 0) AS pts
FROM torneos t
JOIN equipos e ON e.id_liga = t.id_liga AND e.activo = 1
LEFT JOIN partidos p ON p.id_torneo = t.id_torneo
    AND (p.id_local = e.id_equipo OR p.id_visita = e.id_equipo)
    AND p.estatus = 'FINALIZADO'
LEFT JOIN cedulas_arbitrales c ON c.id_partido = p.id_partido AND c.cerrada = 1
GROUP BY t.id_torneo, e.id_equipo, e.nombre, e.escudo_url;

-- ============================================================================
-- VISTA EN TIEMPO REAL: TABLA DE GOLEO INDIVIDUAL
-- ============================================================================
CREATE OR REPLACE VIEW vw_tabla_goleo AS
SELECT
    p.id_torneo,
    j.id_jugador,
    j.nombre_completo AS jugador,
    j.foto_url,
    eq.nombre AS equipo,
    COUNT(ev.id_evento) AS goles
FROM eventos_partido ev
JOIN cedulas_arbitrales c ON c.id_cedula = ev.id_cedula AND c.cerrada = 1
JOIN partidos p ON p.id_partido = c.id_partido
JOIN jugadores j ON j.id_jugador = ev.id_jugador
JOIN equipos eq ON eq.id_equipo = ev.id_equipo
WHERE ev.tipo = 'GOL'
GROUP BY p.id_torneo, j.id_jugador, j.nombre_completo, j.foto_url, eq.nombre
ORDER BY goles DESC, jugador ASC;

-- ============================================================================
-- DATOS SEMILLA (JALPA DE MÉNDEZ, TABASCO - APERTURA 2026)
-- ============================================================================
INSERT INTO ligas (nombre, municipio, estado, plan_saas)
VALUES ('Liga Municipal Jalpa de Méndez', 'Jalpa de Méndez', 'Tabasco', 'PRO');

-- Contraseña hasheada con bcrypt (10 rounds):
-- Admin123*   -> $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi (reemplazable vía /auth/register)
INSERT INTO usuarios (id_liga, nombre_completo, email, password_hash, rol) VALUES
(1, 'Ing. Fabian Montejo Almeida', 'admin@sportstech.mx', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN_LIGA'),
(1, 'Carlos Rodríguez (Árbitro Central)', 'arbitro@sportstech.mx', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ARBITRO'),
(1, 'Luis Fernando Montejo', 'delegado@sportstech.mx', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'DELEGADO');

INSERT INTO torneos (id_liga, nombre, categoria, temporada, fecha_inicio, estatus)
VALUES (1, 'Torneo Apertura 2026', 'Libre Varonil', '2026-A', '2026-09-01', 'EN_CURSO');

INSERT INTO equipos (id_liga, id_delegado, nombre, delegado_nombre, telefono) VALUES
(1, 3, 'Deportivo Jalpa FC', 'Luis Fernando Montejo', '9141001122'),
(1, NULL, 'Atlético Chontalpa', 'Roberto Hernández', '9141003344'),
(1, NULL, 'Real Cunduacán', 'José Pérez Gómez', '9141005566'),
(1, NULL, 'Guerreros DACYTI', 'Isac Ramírez', '9141007788'),
(1, NULL, 'Leones de Soyataco', 'Óscar Jiménez', '9141009900'),
(1, NULL, 'Inter La Esmeralda', 'Francisco López', '9141002211');

INSERT INTO jugadores (id_liga, curp, nombre_completo, fecha_nacimiento, ine_validada) VALUES
(1, 'MECA980512HTBRR01', 'Cristian Méndez Castro', '1998-05-12', 1),
(1, 'PEGL990820HTBRR02', 'Luis Ángel Pérez Gómez', '1999-08-20', 1),
(1, 'GOMA000115HTBRR03', 'Alejandro Gómez Morales', '2000-01-15', 1),
(1, 'RASI010310HTBRR04', 'Isac Ramírez Sánchez', '2001-03-10', 1),
(1, 'JIOO020722HTBRR05', 'Óscar Jiménez Ortiz', '2002-07-22', 1),
(1, 'LOFR011105HTBRR06', 'Francisco López Ruiz', '2001-11-05', 1);

INSERT INTO plantillas_torneo (id_torneo, id_equipo, id_jugador, num_camiseta, estatus_habilitado) VALUES
(1, 1, 1, 9, 1),
(1, 2, 2, 10, 1),
(1, 3, 3, 7, 1),
(1, 4, 4, 11, 1),
(1, 5, 5, 8, 1),
(1, 6, 6, 5, 1);

-- Partido 1 ya finalizado de muestra para que el Dashboard muestre tabla inicial
INSERT INTO partidos (id_torneo, jornada, id_local, id_visita, cancha, fecha_hora, id_arbitro, estatus) VALUES
(1, 1, 1, 3, 'Campo Deportivo Municipal 1', '2026-09-06 10:00:00', 2, 'FINALIZADO'),
(1, 1, 2, 4, 'Campo Deportivo Municipal 2', '2026-09-06 12:00:00', 2, 'PROGRAMADO'),
(1, 1, 5, 6, 'Cancha Unidad Deportiva', '2026-09-06 16:00:00', 2, 'PROGRAMADO');

INSERT INTO cedulas_arbitrales (id_partido, goles_local, goles_visita, observaciones, cerrada, cerrada_en)
VALUES (1, 2, 1, 'Partido disputado sin incidentes graves.', 1, '2026-09-06 11:55:00');

INSERT INTO eventos_partido (id_cedula, id_equipo, id_jugador, tipo, minuto, observacion) VALUES
(1, 1, 1, 'GOL', 18, 'Remate dentro del área'),
(1, 3, 3, 'GOL', 41, 'Tiro libre directo'),
(1, 1, 1, 'GOL', 76, 'Contragolpe');
