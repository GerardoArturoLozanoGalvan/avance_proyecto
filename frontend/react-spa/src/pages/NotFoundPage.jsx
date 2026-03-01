import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="card">
      <h2>Página no encontrada</h2>
      <p>La ruta que abriste no existe.</p>
      <Link to="/productos">Ir a productos</Link>
    </section>
  );
}
