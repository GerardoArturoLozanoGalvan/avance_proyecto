function setMsg(elementId, text, ok = false) {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.textContent = text;
  element.className = `msg ${ok ? 'ok' : 'error'}`;
}

function isGmail(correo) {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(correo);
}

function evaluarSeguridadPassword(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { label: 'Débil', percent: 30, color: '#d32f2f' };
  if (score === 3 || score === 4) return { label: 'Media', percent: 65, color: '#ef6c00' };
  return { label: 'Fuerte', percent: 100, color: '#2e7d32' };
}

function actualizarMedidorPassword() {
  const passInput = document.getElementById('uPass');
  const bar = document.getElementById('passwordMeterBar');
  const text = document.getElementById('passwordMeterText');
  if (!passInput || !bar || !text) return;

  const password = passInput.value;
  if (!password) {
    bar.style.width = '0%';
    bar.style.background = '#d32f2f';
    text.textContent = 'Seguridad: sin evaluar';
    return;
  }

  const result = evaluarSeguridadPassword(password);
  bar.style.width = `${result.percent}%`;
  bar.style.background = result.color;
  text.textContent = `Seguridad: ${result.label}`;
}

async function crearUsuario() {
  const nombre = document.getElementById('uNombre').value.trim();
  const correo = document.getElementById('uCorreo').value.trim().toLowerCase();
  const password = document.getElementById('uPass').value.trim();

  setMsg('registroMsg', '');

  if (!nombre || !correo || !password) {
    setMsg('registroMsg', 'Por favor, completa todos los campos.');
    return;
  }

  if (!isGmail(correo)) {
    setMsg('registroMsg', 'Solo se permiten correos @gmail.com');
    return;
  }

  const fuerza = evaluarSeguridadPassword(password);
  if (fuerza.label === 'Débil') {
    setMsg('registroMsg', 'La contraseña es débil. Usa mayúsculas, números y símbolos.');
    return;
  }

  const form = new FormData();
  form.append('nombre', nombre);
  form.append('correo', correo);
  form.append('password', password);

  try {
    const res = await fetch('http://localhost/avance_proyecto/backend/guardar.php', {
      method: 'POST',
      body: form
    });
    const texto = await res.text();
    if (texto.includes('guardado')) {
      setMsg('registroMsg', '¡Usuario registrado exitosamente!', true);
      document.getElementById('uNombre').value = '';
      document.getElementById('uCorreo').value = '';
      document.getElementById('uPass').value = '';
      actualizarMedidorPassword();
      setTimeout(() => {
        mostrarLogin();
      }, 700);
    } else {
      setMsg('registroMsg', texto);
    }
  } catch (e) {
    setMsg('registroMsg', 'Error de conexión con el servidor.');
  }
}

async function login() {
  const correo = document.getElementById('lCorreo').value.trim().toLowerCase();
  const password = document.getElementById('lPass').value;

  setMsg('loginMsg', '');

  if (!correo || !password) {
    setMsg('loginMsg', 'Ingresa correo y contraseña.');
    return;
  }

  const form = new FormData();
  form.append('login_correo', correo);
  form.append('login_password', password);

  try {
    const res = await fetch('http://localhost/avance_proyecto/backend/guardar.php', {
      method: 'POST',
      body: form
    });

    const data = await res.json();
    if (data.ok) {
      localStorage.setItem('heb_nombre', data.nombre || '');
      localStorage.setItem('heb_correo', data.correo || '');
      localStorage.setItem('heb_rol', data.rol || 'usuario');
      setMsg('loginMsg', 'Login exitoso', true);
      setTimeout(() => {
        window.location.href = '../frontend/almacen.html';
      }, 300);
    } else {
      setMsg('loginMsg', data.message || 'Login incorrecto');
    }
  } catch (e) {
    setMsg('loginMsg', 'Error de conexión con el servidor.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const passInput = document.getElementById('uPass');
  if (passInput) {
    passInput.addEventListener('input', actualizarMedidorPassword);
  }
});
