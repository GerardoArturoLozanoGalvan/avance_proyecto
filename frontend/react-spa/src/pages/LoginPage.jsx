import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [mode, setMode] = useState('login');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/productos" replace />;

  const onLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await login(correo, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: { nombre, correo, password }
      });
      setSuccess('Registro exitoso. Ahora puedes iniciar sesión.');
      setMode('login');
      setNombre('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={mode === 'login' ? onLogin : onRegister}>
        <h1>{mode === 'login' ? 'Iniciar sesión' : 'Registrar usuario'}</h1>

        {mode === 'register' && (
          <>
            <label>Nombre</label>
            <input
              type="text"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </>
        )}

        <label>Correo</label>
        <input type="email" placeholder="Tu correo @gmail.com" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        <label>Contraseña</label>
        <input type="password" placeholder="Tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="error">{error}</p>}
        {success && <p className="ok">{success}</p>}

        <button type="submit" disabled={loading}>
          {loading ? (mode === 'login' ? 'Entrando...' : 'Registrando...') : (mode === 'login' ? 'Entrar' : 'Crear cuenta')}
        </button>

        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
            setSuccess('');
          }}
        >
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </form>
    </div>
  );
}
