# Mejoras Backend - Evidencia

## Funcionalidades implementadas

1. **JWT con roles y permisos**
   - Login: `POST /auth/login`
   - Perfil actual: `GET /auth/me`
   - Roles en token: `admin`, `usuario`
   - Middleware de autorización por rol en rutas sensibles.

2. **Middleware de validación**
   - Validación de `body` y `query` en rutas protegidas.
   - Errores estandarizados con detalles.

3. **CRUD ampliado con filtros y paginación**
   - `GET /productos?page=&limit=&nombre=&minPrecio=&maxPrecio=`
   - `GET /usuarios?page=&limit=&rol=`

4. **Pruebas de robustez de API**
   - Archivo: `test/api.test.js`
   - Cobertura: login, seguridad sin token, paginación, restricción por rol, cambio de rol.

5. **Middleware personalizado de errores + debugging Node**
   - Middleware: `src/middlewares/errorHandler.js`
   - Debug: `npm run debug` (usa `node --inspect`).

6. **Integración de API externa (REST)**
   - API elegida: Frankfurter (tipo de cambio de monedas)
   - Rutas: `GET /externa/convertir` y `GET /externa/precio-producto-mxn`
   - Seguridad: protegidas con JWT
   - Validación: query params (`from`, `to`, `amount`, `precioUsd`)

## Cómo ejecutar

```bash
cd backend
npm install
npm start
```

## Cómo probar

```bash
npm test
```

## Rutas clave para capturas

- Código de roles JWT: `src/middlewares/auth.js`
- Validación middleware: `src/middlewares/validate.js`
- Paginación productos: `src/routes/productos.routes.js`
- Paginación usuarios: `src/routes/usuarios.routes.js`
- Errores centralizados: `src/middlewares/errorHandler.js`
- Pruebas de API: `test/api.test.js`
- Evidencia de consulta IA: `IA_PAGINACION.md`
- Integración externa: `src/routes/externa.routes.js`
- Respuesta apartado API externa: `RESPUESTA_APARTADOS_API_EXTERNA.txt`
