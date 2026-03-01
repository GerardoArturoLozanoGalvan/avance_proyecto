import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

export default function UsuariosPage() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({ nombre: '', correo: '', password: '' });

  const load = async () => {
    try {
      const data = await apiFetch('/usuarios?page=1&limit=20', { token });
      setUsuarios(data.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const onAgregar = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await apiFetch('/usuarios', { method: 'POST', token, body: form });
      setOk('Usuario agregado correctamente');
      setForm({ nombre: '', correo: '', password: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const onChangeRol = async (id, rol) => {
    setError('');
    setOk('');
    try {
      await apiFetch(`/usuarios/${id}/rol`, { method: 'PATCH', token, body: { rol } });
      setOk('Rol actualizado');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const onDelete = async (id) => {
    setError('');
    setOk('');
    try {
      await apiFetch(`/usuarios/${id}`, { method: 'DELETE', token });
      setOk('Usuario eliminado');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <h2>Gestión de usuarios (solo admin)</h2>
      {error && <p className="error">{error}</p>}
      {ok && <p className="ok">{ok}</p>}

      <form className="card add-user" onSubmit={onAgregar}>
        <h3>Agregar usuario</h3>
        <div className="form-grid">
          <input
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
            required
          />
          <input
            placeholder="Correo @gmail.com"
            type="email"
            value={form.correo}
            onChange={(e) => setForm((prev) => ({ ...prev, correo: e.target.value }))}
            required
          />
          <input
            placeholder="Contraseña"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
          <button type="submit">Agregar</button>
        </div>
      </form>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.correo}</td>
                <td>
                  <select
                    value={u.rol}
                    disabled={String(u.correo).toLowerCase() === 'admin@gmail.com'}
                    onChange={(e) => onChangeRol(u.id, e.target.value)}
                  >
                    <option value="usuario">usuario</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <button
                    disabled={String(u.correo).toLowerCase() === 'admin@gmail.com'}
                    onClick={() => onDelete(u.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
