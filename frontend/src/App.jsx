import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, NavLink, Outlet, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Libros from './pages/Libros';
import Usuarios from './pages/Usuarios';
import Prestamos from './pages/Prestamos';
import Buscar from './pages/Buscar';
import Catalogo from './pages/Catalogo';
const Lector = lazy(() => import('./pages/Lector'));
import { api } from './api';

function Admin() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const logout = () => setAuthorized(false);
    window.addEventListener('biblioteca:logout', logout);
    api
      .sesion()
      .then(() => setAuthorized(true))
      .catch(() => {})
      .finally(() => setChecking(false));
    return () => window.removeEventListener('biblioteca:logout', logout);
  }, []);
  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    sessionStorage.setItem('bibliotecaAdmin', token);
    try {
      await api.sesion();
      setAuthorized(true);
      setToken('');
    } catch (e) {
      sessionStorage.removeItem('bibliotecaAdmin');
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (checking)
    return (
      <p className="empty-state" role="status">
        Comprobando acceso…
      </p>
    );
  if (!authorized)
    return (
      <div className="login-wrap">
        <form className="card login-card" onSubmit={login}>
          <Link to="/">← Volver a la biblioteca</Link>
          <p className="eyebrow">BIBLIOTECA MUNICIPAL</p>
          <h1>Administración</h1>
          <p>Ingresa la clave de administración configurada en el servidor.</p>
          <div className="form-group">
            <label htmlFor="clave">Clave de acceso</label>
            <input
              id="clave"
              type="password"
              autoComplete="current-password"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          {error && (
            <p className="alert alert-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Comprobando…' : 'Entrar'}
          </button>
        </form>
      </div>
    );
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Biblioteca Municipal</h1>
          <p>Administración</p>
        </div>
        <nav>
          <NavLink to="/admin" end>
            Panel principal
          </NavLink>
          <NavLink to="/admin/libros">Libros</NavLink>
          <NavLink to="/admin/usuarios">Usuarios</NavLink>
          <NavLink to="/admin/prestamos">Préstamos</NavLink>
          <NavLink to="/admin/buscar">Búsqueda</NavLink>
          <Link to="/">↗ Ver biblioteca</Link>
        </nav>
        <button
          className="btn btn-secondary"
          onClick={() => {
            sessionStorage.removeItem('bibliotecaAdmin');
            setAuthorized(false);
          }}
        >
          Cerrar sesión
        </button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
export default function App() {
  return (
    <Suspense
      fallback={
        <p className="empty-state" role="status">
          Preparando lectura…
        </p>
      }
    >
      <Routes>
        <Route path="/" element={<Catalogo />} />
        <Route path="/leer/:id" element={<Lector />} />
        <Route path="/admin" element={<Admin />}>
          <Route index element={<Dashboard />} />
          <Route path="libros" element={<Libros />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="prestamos" element={<Prestamos />} />
          <Route path="buscar" element={<Buscar />} />
        </Route>
        <Route
          path="*"
          element={
            <main className="empty-state">
              <h1>Página no encontrada</h1>
              <Link to="/">Volver a la biblioteca</Link>
            </main>
          }
        />
      </Routes>
    </Suspense>
  );
}
