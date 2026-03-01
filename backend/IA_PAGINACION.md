# Evidencia IA: Paginación GET con Express + MySQL

## Consulta realizada a IA
Se consultó cómo implementar paginación en Express.js con MySQL usando `page`, `limit` y filtros opcionales.

Ejemplo base recomendado por IA:

- Calcular `offset = (page - 1) * limit`.
- Construir cláusula `WHERE` dinámica para filtros.
- Hacer dos consultas: `COUNT(*)` para total y `SELECT ... LIMIT ? OFFSET ?` para datos.
- Responder con objeto `pagination` y arreglo `data`.

## Adaptación al proyecto
Se adaptó en:

- `GET /productos` con filtros `nombre`, `minPrecio`, `maxPrecio` y paginación `page`, `limit`.
- `GET /usuarios` con filtro por `rol` y paginación.

Archivos donde quedó integrado:

- `src/routes/productos.routes.js`
- `src/routes/usuarios.routes.js`
- `src/middlewares/validate.js`

## Ejemplos de uso

- `GET /productos?page=1&limit=5&nombre=ban&minPrecio=10&maxPrecio=50`
- `GET /usuarios?page=1&limit=10&rol=usuario`

## Resultado
Se obtuvo una implementación reutilizable, con validación de query params y respuesta estandarizada:

```json
{
  "ok": true,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 57,
    "totalPages": 6
  },
  "data": []
}
```
