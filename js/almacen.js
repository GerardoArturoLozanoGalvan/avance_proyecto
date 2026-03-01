function showToast(msg, color = '#b80000') {
  let toast = document.getElementById('toastMsg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastMsg';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = color;
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '1em';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 2000);
}

let rolActual = 'usuario';
let monedaVista = 'MXN';
let tasaMxnUsd = 0.058;

async function cargarTipoCambio() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=MXN&to=USD');
    if (!res.ok) return;
    const data = await res.json();
    if (data?.rates?.USD) {
      tasaMxnUsd = Number(data.rates.USD);
    }
  } catch (error) {
  }
}

function obtenerPrecioConvertido(precioMxn) {
  const precio = Number(precioMxn) || 0;
  if (monedaVista === 'USD') {
    return precio * tasaMxnUsd;
  }
  return precio;
}

function formatearPrecio(valor, moneda) {
  const codigo = moneda === 'USD' ? 'USD' : 'MXN';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: codigo,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
}

function toggleMoneda() {
  monedaVista = monedaVista === 'MXN' ? 'USD' : 'MXN';
  cargarProductos();
}

async function cargarSesion() {
  try {
    const res = await fetch('../backend/guardar.php?sesion=1');
    const data = await res.json();
    if (!data.ok) {
      window.location.href = '../frontend/index.html';
      return false;
    }

    rolActual = data.rol || localStorage.getItem('heb_rol') || 'usuario';
    const userName = document.getElementById('userName');
    if (userName) {
      userName.textContent = data.nombre || localStorage.getItem('heb_nombre') || '';
    }

    if (rolActual !== 'admin') {
      const btnUsuarios = document.getElementById('btnUsuarios');
      const panelUsuarios = document.getElementById('panelUsuarios');
      if (btnUsuarios) btnUsuarios.style.display = 'none';
      if (panelUsuarios) panelUsuarios.style.display = 'none';
    }

    return true;
  } catch (error) {
    window.location.href = '../frontend/index.html';
    return false;
  }
}

async function cargarProductos() {
  const res = await fetch('../backend/guardar.php?productos=1');
  const productos = await res.json();
  const grid = document.getElementById('productosGrid');
  grid.innerHTML = '';

  productos.sort((a, b) => a.nombre.localeCompare(b.nombre));

  productos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const precioConvertido = obtenerPrecioConvertido(p.precio);
    const siguienteMoneda = monedaVista === 'MXN' ? 'USD' : 'MXN';
    card.innerHTML = `
      <img src="../assets/icons/${p.icono}" alt="${p.nombre}">
      <div class="nombre">${p.nombre}</div>
      <div class="precio">${formatearPrecio(precioConvertido, monedaVista)}</div>
      <button class="moneda-toggle" onclick="toggleMoneda()">Cambiar a ${siguienteMoneda}</button>
      <div class="acciones">
        <button onclick="actualizarCantidad(${p.id}, ${Number(p.cantidad) - 1})">-</button>
        <input type="number" min="0" value="${p.cantidad}" onchange="actualizarCantidad(${p.id}, this.value)">
        <button onclick="actualizarCantidad(${p.id}, ${Number(p.cantidad) + 1})">+</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function actualizarCantidad(id, nuevaCantidad) {
  const cantidad = parseInt(nuevaCantidad, 10);
  if (Number.isNaN(cantidad) || cantidad < 0) {
    showToast('Cantidad inválida', '#b80000');
    return;
  }

  const form = new FormData();
  form.append('actualizar_cantidad_id', id);
  form.append('nueva_cantidad', cantidad);
  const res = await fetch('../backend/guardar.php', { method: 'POST', body: form });
  const msg = await res.text();
  if (!msg.toLowerCase().includes('actualizada')) {
    showToast(msg, '#b80000');
  }
  cargarProductos();
}

async function cargarUsuarios() {
  if (rolActual !== 'admin') {
    return;
  }
  const res = await fetch('../backend/guardar.php?usuarios=1');
  const texto = await res.text();
  if (texto === 'Acceso denegado') {
    showToast('No tienes permisos para gestionar usuarios');
    return;
  }
  const usuarios = JSON.parse(texto);
  const usuariosTable = document.getElementById('usuariosTable');

  let html = `
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Rol</th>
          <th>Actualizar rol</th>
          <th>Eliminar</th>
        </tr>
      </thead>
      <tbody>
  `;

  usuarios.forEach(u => {
    const esAdminPrincipal = (u.correo || '').toLowerCase() === 'admin@gmail.com';
    html += `
      <tr>
        <td>${u.nombre}</td>
        <td>${u.correo}</td>
        <td>${u.rol === 'admin' ? 'Admin' : 'Usuario'}</td>
        <td>
          <select id="rol_${u.id}" ${esAdminPrincipal ? 'disabled' : ''}>
            <option value="usuario" ${u.rol === 'usuario' ? 'selected' : ''}>Usuario</option>
            <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
          <button class="btn-secondary" onclick="actualizarRolUsuario(${u.id})" ${esAdminPrincipal ? 'disabled' : ''}>Guardar</button>
        </td>
        <td>
          ${esAdminPrincipal ? '<span style="color:#aaa">No permitido</span>' : `<button onclick="eliminarUsuario(${u.id})">Eliminar</button>`}
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  usuariosTable.innerHTML = html;
}

async function actualizarRolUsuario(id) {
  if (rolActual !== 'admin') {
    showToast('No autorizado');
    return;
  }
  const select = document.getElementById(`rol_${id}`);
  if (!select) return;

  const form = new FormData();
  form.append('actualizar_rol_id', id);
  form.append('nuevo_rol', select.value);

  const res = await fetch('../backend/guardar.php', { method: 'POST', body: form });
  showToast(await res.text());
  cargarUsuarios();
}

async function agregarUsuario() {
  if (rolActual !== 'admin') {
    showToast('No autorizado');
    return;
  }
  const nombre = document.getElementById('nuevoUNombre').value.trim();
  const correo = document.getElementById('nuevoUCorreo').value.trim().toLowerCase();
  const password = document.getElementById('nuevoUPass').value.trim();

  if (!nombre || !correo || !password) {
    showToast('Completa todos los campos');
    return;
  }

  if (!correo.endsWith('@gmail.com')) {
    showToast('Solo se permiten correos @gmail.com');
    return;
  }

  const form = new FormData();
  form.append('nombre', nombre);
  form.append('correo', correo);
  form.append('password', password);

  const res = await fetch('../backend/guardar.php', { method: 'POST', body: form });
  showToast(await res.text());

  document.getElementById('nuevoUNombre').value = '';
  document.getElementById('nuevoUCorreo').value = '';
  document.getElementById('nuevoUPass').value = '';

  cargarUsuarios();
}

async function eliminarUsuario(id) {
  if (rolActual !== 'admin') {
    showToast('No autorizado');
    return;
  }
  const form = new FormData();
  form.append('eliminar_usuario', id);
  const res = await fetch('../backend/guardar.php', { method: 'POST', body: form });
  showToast(await res.text());
  cargarUsuarios();
}

function mostrarPanel(panel) {
  const panelProductos = document.getElementById('panelProductos');
  const panelUsuarios = document.getElementById('panelUsuarios');
  const btnProductos = document.getElementById('btnProductos');
  const btnUsuarios = document.getElementById('btnUsuarios');

  if (panel === 'productos') {
    panelProductos.style.display = 'flex';
    panelUsuarios.style.display = 'none';
    btnProductos.classList.add('active');
    btnUsuarios.classList.remove('active');
  } else {
    if (rolActual !== 'admin') {
      showToast('Solo administradores pueden acceder a este panel');
      return;
    }
    panelProductos.style.display = 'none';
    panelUsuarios.style.display = 'flex';
    btnUsuarios.classList.add('active');
    btnProductos.classList.remove('active');
  }
}

async function logout() {
  try {
    await fetch('../backend/guardar.php?logout=1');
  } catch (e) {
  }
  localStorage.removeItem('heb_nombre');
  localStorage.removeItem('heb_correo');
  localStorage.removeItem('heb_rol');
  window.location.href = '../frontend/index.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  const sesionOk = await cargarSesion();
  if (!sesionOk) return;
  await cargarTipoCambio();
  cargarProductos();
  if (rolActual === 'admin') {
    cargarUsuarios();
  }
});
