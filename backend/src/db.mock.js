function createMockDb() {
  let nextUserId = 3;
  let nextProductId = 7;

  const usuarios = [
    { id: 1, nombre: 'Admin', correo: 'admin@gmail.com', password: 'Admin123!', rol: 'admin' },
    { id: 2, nombre: 'Cliente', correo: 'cliente@gmail.com', password: 'User123!', rol: 'usuario' }
  ];

  const productos = [
    { id: 1, nombre: 'Banana', precio: 12.5, icono: 'banana.png', cantidad: 10 },
    { id: 2, nombre: 'Camarón', precio: 99.99, icono: 'camaron.png', cantidad: 5 },
    { id: 3, nombre: 'Carne', precio: 120, icono: 'carne.png', cantidad: 4 },
    { id: 4, nombre: 'Manzana', precio: 8, icono: 'manzana.png', cantidad: 8 },
    { id: 5, nombre: 'Queso', precio: 45, icono: 'queso.png', cantidad: 6 },
    { id: 6, nombre: 'Sandía', precio: 20, icono: 'sandia.png', cantidad: 3 }
  ];

  const filterProductos = (sql, params) => {
    let index = 0;
    let result = [...productos];

    if (sql.includes('nombre LIKE ?')) {
      const pattern = String(params[index++] || '').replace(/%/g, '').toLowerCase();
      result = result.filter((item) => item.nombre.toLowerCase().includes(pattern));
    }

    if (sql.includes('precio >= ?')) {
      const min = Number(params[index++]);
      result = result.filter((item) => Number(item.precio) >= min);
    }

    if (sql.includes('precio <= ?')) {
      const max = Number(params[index++]);
      result = result.filter((item) => Number(item.precio) <= max);
    }

    return { result, index };
  };

  const db = {
    isMock: true,
    async query(sql, params = []) {
      return this.execute(sql, params);
    },
    async execute(sql, params = []) {
      if (sql.includes('SELECT 1')) {
        return [[{ one: 1 }]];
      }

      if (sql.includes('FROM usuarios WHERE correo = ? AND password = ?')) {
        const [correo, password] = params;
        const user = usuarios.find(
          (item) => item.correo === correo && item.password === password
        );
        if (!user) return [[]];
        const { id, nombre, rol } = user;
        return [[{ id, nombre, correo, rol }]];
      }

      if (sql.includes('SELECT id, nombre, correo, rol FROM usuarios WHERE id = ?')) {
        const id = Number(params[0]);
        const user = usuarios.find((item) => item.id === id);
        if (!user) return [[]];
        const { nombre, correo, rol } = user;
        return [[{ id, nombre, correo, rol }]];
      }

      if (sql.includes('SELECT COUNT(*) AS total FROM productos')) {
        const { result } = filterProductos(sql, params);
        return [[{ total: result.length }]];
      }

      if (sql.startsWith('SELECT id, nombre, precio, icono, cantidad FROM productos')) {
        const { result, index } = filterProductos(sql, params);
        const ordered = result.sort((a, b) => b.id - a.id);
        const limit = Number(params[index] ?? ordered.length);
        const offset = Number(params[index + 1] ?? 0);
        return [ordered.slice(offset, offset + limit)];
      }

      if (sql.startsWith('INSERT INTO productos')) {
        const [nombre, precio, icono, cantidad] = params;
        const newItem = {
          id: nextProductId++,
          nombre,
          precio: Number(precio),
          icono: icono || '',
          cantidad: Number(cantidad) || 0
        };
        productos.push(newItem);
        return [{ insertId: newItem.id }];
      }

      if (sql.startsWith('UPDATE productos SET nombre = ?, precio = ?, cantidad = ?, icono = ? WHERE id = ?')) {
        const [nombre, precio, cantidad, icono, idParam] = params;
        const id = Number(idParam);
        const item = productos.find((p) => p.id === id);
        if (item) {
          item.nombre = nombre;
          item.precio = Number(precio);
          item.cantidad = Number(cantidad);
          item.icono = icono || '';
        }
        return [{ affectedRows: item ? 1 : 0 }];
      }

      if (sql.startsWith('DELETE FROM productos WHERE id = ?')) {
        const id = Number(params[0]);
        const idx = productos.findIndex((p) => p.id === id);
        if (idx >= 0) productos.splice(idx, 1);
        return [{ affectedRows: idx >= 0 ? 1 : 0 }];
      }

      if (sql.includes('SELECT COUNT(*) AS total FROM usuarios')) {
        let result = [...usuarios];
        if (sql.includes('WHERE rol = ?')) {
          result = result.filter((u) => u.rol === params[0]);
        }
        return [[{ total: result.length }]];
      }

      if (sql.startsWith('SELECT id, nombre, correo, rol FROM usuarios')) {
        let result = [...usuarios];
        let idx = 0;
        if (sql.includes('WHERE rol = ?')) {
          result = result.filter((u) => u.rol === params[idx++]);
        }
        const ordered = result.sort((a, b) => b.id - a.id);
        const limit = Number(params[idx] ?? ordered.length);
        const offset = Number(params[idx + 1] ?? 0);
        return [ordered.slice(offset, offset + limit).map(({ password, ...rest }) => rest)];
      }

      if (sql.includes('SELECT id FROM usuarios WHERE correo = ? LIMIT 1')) {
        const correo = String(params[0]).toLowerCase();
        const found = usuarios.find((u) => u.correo.toLowerCase() === correo);
        return [[...(found ? [{ id: found.id }] : [])]];
      }

      if (sql.includes("SELECT id FROM usuarios WHERE rol = 'admin' AND correo = 'admin@gmail.com' LIMIT 1")) {
        const found = usuarios.find((u) => u.rol === 'admin' && u.correo.toLowerCase() === 'admin@gmail.com');
        return [[...(found ? [{ id: found.id }] : [])]];
      }

      if (sql.startsWith('INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)')) {
        const [nombre, correo, password, rol] = params;
        const newUser = { id: nextUserId++, nombre, correo, password, rol };
        usuarios.push(newUser);
        return [{ insertId: newUser.id }];
      }

      if (sql.includes('SELECT id, correo, rol FROM usuarios WHERE id = ? LIMIT 1')) {
        const id = Number(params[0]);
        const found = usuarios.find((u) => u.id === id);
        if (!found) return [[]];
        const { correo, rol } = found;
        return [[{ id, correo, rol }]];
      }

      if (sql.startsWith('UPDATE usuarios SET rol = ? WHERE id = ?')) {
        const [rol, idParam] = params;
        const id = Number(idParam);
        const found = usuarios.find((u) => u.id === id);
        if (found) found.rol = rol;
        return [{ affectedRows: found ? 1 : 0 }];
      }

      if (sql.includes('SELECT correo, rol FROM usuarios WHERE id = ? LIMIT 1')) {
        const id = Number(params[0]);
        const found = usuarios.find((u) => u.id === id);
        if (!found) return [[]];
        return [[{ correo: found.correo, rol: found.rol }]];
      }

      if (sql.startsWith('DELETE FROM usuarios WHERE id = ?')) {
        const id = Number(params[0]);
        const idx = usuarios.findIndex((u) => u.id === id);
        if (idx >= 0) usuarios.splice(idx, 1);
        return [{ affectedRows: idx >= 0 ? 1 : 0 }];
      }

      return [[]];
    }
  };

  return db;
}

module.exports = { createMockDb };
