import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { usuario, isAdmin, logout } = useAuth();
  const location = useLocation();

  const active = (path) => (location.pathname.startsWith(path) ? 'active' : '');

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-area">
          <span className="brand">HEB</span>
          <span className="user-chip">{usuario?.nombre || 'Usuario'}</span>
        </div>
        <nav className="menu">
          <Link className={active('/productos')} to="/productos">Productos</Link>
          {isAdmin && <Link className={active('/usuarios')} to="/usuarios">Gestionar Usuarios</Link>}
          <button className="link-btn" onClick={logout}>Cerrar sesión</button>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
