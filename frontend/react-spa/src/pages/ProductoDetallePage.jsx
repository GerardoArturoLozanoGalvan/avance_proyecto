import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

export default function ProductoDetallePage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [producto, setProducto] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch('/productos?page=1&limit=100', { token });
        const found = (data.data || []).find((item) => String(item.id) === String(id));
        if (!found) throw new Error('Producto no encontrado');
        setProducto(found);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [id, token]);

  if (error) return <p className="error">{error}</p>;
  if (!producto) return <p>Cargando...</p>;

  return (
    <section className="card">
      <h2>Detalle del producto #{producto.id}</h2>
      <p><strong>Nombre:</strong> {producto.nombre}</p>
      <p><strong>Precio:</strong> ${Number(producto.precio).toFixed(2)}</p>
      <p><strong>Cantidad:</strong> {producto.cantidad}</p>
      <Link to="/productos">Volver</Link>
    </section>
  );
}
