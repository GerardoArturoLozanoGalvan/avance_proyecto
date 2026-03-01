async function agregarProducto() {
  const nombre = document.getElementById('pNombre').value;
  const precio = document.getElementById('pPrecio').value;

  await fetch('http://localhost:3000/productos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify({ nombre, precio })
  });

  alert('Producto agregado');
}
