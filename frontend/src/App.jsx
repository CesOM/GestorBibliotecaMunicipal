import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Libros from './pages/Libros';
import Usuarios from './pages/Usuarios';
import Prestamos from './pages/Prestamos';
import Buscar from './pages/Buscar';

export default function App() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Biblioteca Municipal</h1>
          <p>Sistema de gestión bibliográfica</p>
        </div>
        <nav>
          <NavLink to="/" end>
            Panel principal
          </NavLink>
          <NavLink to="/libros">Libros</NavLink>
          <NavLink to="/usuarios">Usuarios</NavLink>
          <NavLink to="/prestamos">Préstamos</NavLink>
          <NavLink to="/buscar">Búsqueda</NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/libros" element={<Libros />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/prestamos" element={<Prestamos />} />
          <Route path="/buscar" element={<Buscar />} />
        </Routes>
      </main>
    </div>
  );
}
