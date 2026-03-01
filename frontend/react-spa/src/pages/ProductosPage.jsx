import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

export default function ProductosPage() {
  const { token } = useAuth();
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [currency, setCurrency] = useState('MXN');
  const [mxnToUsd, setMxnToUsd] = useState(0.058);

  const load = async (targetPage = 1) => {
    try {
      setError('');
      const data = await apiFetch(`/productos?page=${targetPage}&limit=6`, { token });
      setProductos(data.data || []);
      setPagination(data.pagination || { totalPages: 1 });
      setPage(targetPage);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('https://api.frankfurter.app/latest?from=MXN&to=USD');
        if (!response.ok) return;
        const data = await response.json();
        if (data?.rates?.USD) {
          setMxnToUsd(Number(data.rates.USD));
        }
      } catch {
      }
    })();
  }, []);

  const formatPrice = (mxn) => {
    const value = currency === 'USD' ? Number(mxn) * mxnToUsd : Number(mxn);
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const updateCantidad = async (product, nextCantidad) => {
    const cantidad = Number(nextCantidad);
    if (Number.isNaN(cantidad) || cantidad < 0) return;

    try {
      await apiFetch(`/productos/${product.id}`, {
        method: 'PUT',
        token,
        body: {
          nombre: product.nombre,
          precio: Number(product.precio),
          cantidad,
          icono: product.icono || ''
        }
      });
      setProductos((prev) => prev.map((item) => (
        item.id === product.id ? { ...item, cantidad } : item
      )));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <div className="title-row">
        <h2>Productos</h2>
        <button className="currency-toggle" onClick={() => setCurrency(currency === 'MXN' ? 'USD' : 'MXN')}>
          Mostrar en {currency === 'MXN' ? 'USD' : 'MXN'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {productos.map((p) => (
          <article className="card product-card" key={p.id}>
            {!!p.icono && <img className="prod-icon" src={`../assets/icons/${p.icono}`} alt={p.nombre} />}
            <h3>{p.nombre}</h3>
            <p>Precio: {formatPrice(p.precio)}</p>
            <div className="qty-row">
              <button onClick={() => updateCantidad(p, Number(p.cantidad) - 1)}>-</button>
              <input
                type="number"
                min="0"
                value={p.cantidad}
                onChange={(e) => updateCantidad(p, e.target.value)}
              />
              <button onClick={() => updateCantidad(p, Number(p.cantidad) + 1)}>+</button>
            </div>
            <Link to={`/productos/${p.id}`}>Ver detalle</Link>
          </article>
        ))}
      </div>
      <div className="pager">
        <button disabled={page <= 1} onClick={() => load(page - 1)}>Anterior</button>
        <span>Página {page} de {pagination.totalPages || 1}</span>
        <button disabled={page >= (pagination.totalPages || 1)} onClick={() => load(page + 1)}>Siguiente</button>
      </div>
    </section>
  );
}
