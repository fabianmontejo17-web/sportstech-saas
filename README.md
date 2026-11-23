# SportsTech SaaS — Fábrica de Software Chontalpa CodeWorks
Plataforma web **Software como Servicio (SaaS)** multi-inquilino para la gestión integral de ligas y torneos de fútbol amateur, desarrollada bajo los estándares de **Chontalpa CodeWorks S.A.P.I. de C.V.** (MoProSoft NMX-I-059-NYCE / Scrum).

## Arquitectura y Stack Tecnológico
- **Base de Datos:** MariaDB 10.6 / MySQL 8.0 (WampServer puerto `3307`), esquema normalizado en **Tercera Forma Normal (3FN)** con vistas en tiempo real y disparadores (triggers).
- **Backend:** Node.js v26 LTS + Express (Arquitectura MVC, `mysql2/promise` con transacciones ACID, `jsonwebtoken` JWT, `bcryptjs`, `multer`).
- **Frontend:** React.js + Vite + Axios + Tailwind CSS (Diseño Mobile-First de alto contraste).

## Instalación y Ejecución Rápida (Windows / WampServer / VS Code)

### 1. Base de Datos (MariaDB en puerto 3307)
1. Inicia **WampServer** y verifica que `wampmariadb64` esté activo en el puerto `3307`.
2. Abre **phpMyAdmin** (`http://localhost/phpmyadmin`) o consola MySQL e importa el archivo:
   `database/sportstech_3fn.sql`

### 2. Backend (API REST)
```bash
cd backend
npm install
npm run dev
```
- Servidor disponible en: `http://localhost:4000`
- Health check: `GET http://localhost:4000/api/v1/health`

### 3. Frontend (React + Tailwind)
```bash
cd frontend
npm install
npm run dev
```
- Aplicación disponible en: `http://localhost:5173`

## Credenciales de Prueba (Precargadas en SQL)
- **Admin de Liga:** `admin@sportstech.mx` / `Admin123*`
- **Árbitro Central:** `arbitro@sportstech.mx` / `Arbitro123*`
- **Delegado de Equipo:** `delegado@sportstech.mx` / `Delegado123*`
