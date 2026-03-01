async function crearUsuario() {
  const nombre = document.getElementById('uNombre').value;
  const correo = document.getElementById('uCorreo').value;
  const password = document.getElementById('uPass').value;

  const form = new FormData();
  form.append('nombre', nombre);
  form.append('correo', correo);
  form.append('password', password);

  const res = await fetch('http://localhost/avance_proyecto/backend/guardar.php', {
    method: 'POST',
    body: form
  });

  const texto = await res.text();
  alert(texto);
}
