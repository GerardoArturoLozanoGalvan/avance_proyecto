const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');

process.env.JWT_SECRET = 'test_secret';

function createFakeDb() {
  return {
    async execute(sql, params = []) {
      if (sql.includes('FROM usuarios WHERE correo = ? AND password = ?')) {
        const [correo, password] = params;
        if (correo === 'admin@gmail.com' && password === 'Admin123!') {
          return [[{ id: 1, nombre: 'Admin', correo: 'admin@gmail.com', rol: 'admin' }]];
        }
        if (correo === 'user@gmail.com' && password === 'User123!') {
          return [[{ id: 2, nombre: 'User', correo: 'user@gmail.com', rol: 'usuario' }]];
        }
        return [[]];
      }

      if (sql.includes('COUNT(*) AS total FROM productos')) {
        return [[{ total: 1 }]];
      }

      if (sql.startsWith('SELECT id, nombre, precio, icono, cantidad FROM productos')) {
        return [[{ id: 10, nombre: 'Banana', precio: 10, icono: 'banana.png', cantidad: 5 }]];
      }

      if (sql.includes('COUNT(*) AS total FROM usuarios')) {
        return [[{ total: 2 }]];
      }

      if (sql.startsWith('SELECT id, nombre, correo, rol FROM usuarios')) {
        return [[
          { id: 1, nombre: 'Admin', correo: 'admin@gmail.com', rol: 'admin' },
          { id: 2, nombre: 'User', correo: 'user@gmail.com', rol: 'usuario' }
        ]];
      }

      if (sql.includes('SELECT id, correo, rol FROM usuarios WHERE id = ? LIMIT 1')) {
        return [[{ id: 2, correo: 'user@gmail.com', rol: 'usuario' }]];
      }

      return [[]];
    },
    async query() {
      return [[{ one: 1 }]];
    }
  };
}

function tokenFor(rol, id = 1, correo = 'admin@gmail.com') {
  return jwt.sign({ id, rol, correo }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function createFetchMockOk(converted = 17.35, to = 'MXN') {
  return async () => ({
    ok: true,
    async json() {
      return {
        amount: 1,
        base: 'USD',
        date: '2026-02-28',
        rates: { [to]: converted }
      };
    }
  });
}

test('POST /auth/login devuelve JWT para credenciales correctas', async () => {
  const app = createApp(createFakeDb());

  const response = await request(app)
    .post('/auth/login')
    .send({ correo: 'admin@gmail.com', password: 'Admin123!' });

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.ok(response.body.token);
  assert.equal(response.body.usuario.rol, 'admin');
});

test('GET /productos requiere token (seguridad)', async () => {
  const app = createApp(createFakeDb());
  const response = await request(app).get('/productos');

  assert.equal(response.status, 401);
  assert.equal(response.body.ok, false);
});

test('GET /productos soporta paginación y filtros', async () => {
  const app = createApp(createFakeDb());
  const token = tokenFor('usuario', 2, 'user@gmail.com');

  const response = await request(app)
    .get('/productos?page=1&limit=5&nombre=Ban')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.pagination.page, 1);
  assert.ok(Array.isArray(response.body.data));
});

test('GET /usuarios solo admin', async () => {
  const app = createApp(createFakeDb());
  const token = tokenFor('usuario', 2, 'user@gmail.com');

  const response = await request(app)
    .get('/usuarios')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.ok, false);
});

test('PATCH /usuarios/:id/rol funciona para admin', async () => {
  const app = createApp(createFakeDb());
  const token = tokenFor('admin', 1, 'admin@gmail.com');

  const response = await request(app)
    .patch('/usuarios/2/rol')
    .set('Authorization', `Bearer ${token}`)
    .send({ rol: 'usuario' });

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
});

test('GET /externa/convertir requiere token', async () => {
  const app = createApp(createFakeDb(), { fetchFn: createFetchMockOk() });
  const response = await request(app).get('/externa/convertir?from=USD&to=MXN&amount=1');

  assert.equal(response.status, 401);
  assert.equal(response.body.ok, false);
});

test('GET /externa/convertir responde conversión', async () => {
  const app = createApp(createFakeDb(), { fetchFn: createFetchMockOk(17.9, 'MXN') });
  const token = tokenFor('usuario', 2, 'user@gmail.com');

  const response = await request(app)
    .get('/externa/convertir?from=USD&to=MXN&amount=10')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.result.convertedAmount, 17.9);
});

test('GET /externa/precio-producto-mxn valida query', async () => {
  const app = createApp(createFakeDb(), { fetchFn: createFetchMockOk(90, 'MXN') });
  const token = tokenFor('usuario', 2, 'user@gmail.com');

  const response = await request(app)
    .get('/externa/precio-producto-mxn?precioUsd=-1')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 400);
  assert.equal(response.body.ok, false);
});
