import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard()
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div>
        <div className="alert alert-error">
          {error}. Asegúrese de que el servidor backend esté en ejecución.
        </div>
      </div>
    );
  }

  if (!stats) return <p>Cargando estadísticas...</p>;

  return (
    <div>
      <header className="page-header">
        <h2>Panel principal</h2>
        <p>Resumen del estado de la biblioteca municipal en tiempo real</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Títulos registrados</div>
          <div className="value">{stats.totalLibros}</div>
        </div>
        <div className="stat-card">
          <div className="label">Usuarios registrados</div>
          <div className="value">{stats.totalUsuarios}</div>
        </div>
        <div className="stat-card">
          <div className="label">Ejemplares totales</div>
          <div className="value">{stats.totalEjemplares}</div>
        </div>
        <div className="stat-card">
          <div className="label">Disponibles</div>
          <div className="value">{stats.ejemplaresDisponibles}</div>
        </div>
        <div className="stat-card">
          <div className="label">En préstamo</div>
          <div className="value">{stats.ejemplaresPrestados}</div>
        </div>
        <div className="stat-card warning">
          <div className="label">Préstamos vencidos</div>
          <div className="value">{stats.prestamosVencidos}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Accesos rápidos</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/libros" className="btn btn-primary">
            Gestionar libros
          </Link>
          <Link to="/usuarios" className="btn btn-primary">
            Gestionar usuarios
          </Link>
          <Link to="/prestamos" className="btn btn-primary">
            Registrar préstamo
          </Link>
          <Link to="/buscar" className="btn btn-secondary">
            Buscar
          </Link>
        </div>
      </div>
    </div>
  );
}
