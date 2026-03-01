# Entrega Final - Aplicación Web Full Stack

## 1) Código fuente completo en repositorio GitHub
- Repositorio (frontend y backend):
  - https://github.com/GerardoArturoLozanoGalvan/avance_proyecto
- Rama principal utilizada para despliegue:
  - main

## 2) Documentación técnica avanzada

### 2.1 Estructura del proyecto
- frontend/
  - react-spa/
    - src/
      - pages/ (vistas principales: login, productos, usuarios)
      - components/ (layout, rutas protegidas)
      - context/ (sesión/autenticación)
      - services/ (cliente API)
- backend/
  - src/
    - routes/ (auth, productos, usuarios, externa)
    - middlewares/ (auth JWT, validaciones, manejo de errores)
    - utils/ (errores y helpers)
  - test/
    - api.test.js (pruebas funcionales y de seguridad)
- render.yaml (configuración de despliegue en Render)

### 2.2 Endpoints de la API
Base URL producción:
- https://heb-backend.onrender.com

Endpoints principales:
- GET /health
  - Verifica estado del backend y modo de BD (mock/mysql).

- POST /auth/login
  - Autenticación con correo y contraseña.
  - Respuesta: token JWT + datos de usuario.

- GET /auth/me
  - Devuelve datos del usuario autenticado.
  - Requiere Bearer token.

- GET /productos
  - Lista productos con paginación y filtros.
  - Query soportada: page, limit, nombre, minPrecio, maxPrecio.
  - Requiere Bearer token.

- POST /productos
  - Crea producto.
  - Requiere rol admin.

- PUT /productos/:id
  - Actualiza producto.
  - Requiere rol admin.

- DELETE /productos/:id
  - Elimina producto.
  - Requiere rol admin.

- GET /usuarios
  - Lista usuarios con paginación y filtro por rol.
  - Query soportada: page, limit, rol.
  - Requiere rol admin.

- POST /usuarios
  - Crea usuario (valida correo y reglas de rol).
  - Requiere rol admin.

- PATCH /usuarios/:id/rol
  - Cambia rol de usuario según reglas de negocio.
  - Requiere rol admin.

- DELETE /usuarios/:id
  - Elimina usuario (protege admin principal).
  - Requiere rol admin.

- GET /externa/convertir
  - Conversión de moneda con API externa.
  - Query: from, to, amount.
  - Requiere Bearer token.

- GET /externa/precio-producto-mxn
  - Convierte precio USD a MXN para caso de negocio.
  - Query: precioUsd.
  - Requiere Bearer token.

### 2.3 Integración de API externa
- API usada: Frankfurter (tipo de cambio).
- Integración implementada en rutas del módulo externa.
- Flujo:
  1. Se valida entrada (query).
  2. Se consulta API externa.
  3. Se transforma respuesta para frontend.
  4. Se controla error externo con respuesta consistente.

### 2.4 Sistema de autenticación
- Mecanismo: JWT (JSON Web Token).
- Flujo:
  1. Login exitoso genera token con id/correo/rol.
  2. Cliente envía token en Authorization: Bearer.
  3. Middleware valida firma y expiración.
  4. Middleware de autorización aplica control por rol.
- Roles implementados:
  - admin
  - usuario

### 2.5 Pruebas de backend (unitarias/funcionales y seguridad)
- Archivo: backend/test/api.test.js
- Ejecución local: npm test
- Resultado: 8/8 PASS
- Cobertura funcional y de seguridad:
  - Login correcto
  - Rechazo sin token (401)
  - Autorización por rol (403)
  - Paginación/filtros
  - Validación de entradas (400)

## 3) Video de la aplicación funcionando
Agregar en esta sección el enlace del video (Drive/YouTube):
- URL del video: [PEGAR AQUÍ]

Checklist sugerido para el contenido del video:
- Login con usuario válido.
- Navegación en frontend.
- Consulta de productos.
- Acceso de admin a gestión de usuarios.
- Prueba de ruta protegida.
- Validación rápida de /health en backend.

## 4) URL del despliegue
- Frontend (Render):
  - https://heb-frontend.onrender.com
- Backend (Render):
  - https://heb-backend.onrender.com
- Health check backend:
  - https://heb-backend.onrender.com/health

## Anexos (opcionales para fortalecer evidencia)
- Documento backend avanzado:
  - backend/RESPUESTA_APARTADOS_BACKEND.txt
- Documento API externa:
  - backend/RESPUESTA_APARTADOS_API_EXTERNA.txt
- Documento pruebas apartado e):
  - backend/RESPUESTA_APARTADO_PRUEBAS.txt
- Casos de prueba formateados:
  - backend/CASOS_DE_PRUEBA_E.txt
