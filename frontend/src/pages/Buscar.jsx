import { useState } from 'react';
import { api } from '../api';

export default function Buscar() {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const buscar = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setCargando(true);
    setError('');
    try {
      const data = await api.buscar(query);
      setResultados(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h2>Búsqueda global</h2>
        <p>Encuentre libros y usuarios rápidamente desde un solo campo</p>
      </header>

      <div className="card">
        <form onSubmit={buscar} className="toolbar">
          <div className="search-box" style={{ maxWidth: '100%' }}>
            <input
              placeholder="Buscar por título, autor, documento, nombre..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={cargando}>
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {resultados && (
        <>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>
              Libros ({resultados.libros.length})
            </h3>
            {resultados.libros.length === 0 ? (
              <p className="empty-state">No se encontraron libros</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Autor</th>
                    <th>Disponibles</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.libros.map((l) => (
                    <tr key={l.id}>
                      <td>{l.titulo}</td>
                      <td>{l.autor}</td>
                      <td>
                        {l.cantidadDisponible} / {l.cantidadTotal}
                        {l.cantidadDisponible > 0 ? (
                          <span className="badge badge-success" style={{ marginLeft: 8 }}>
                            Disponible
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ marginLeft: 8 }}>
                            Agotado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>
              Usuarios ({resultados.usuarios.length})
            </h3>
            {resultados.usuarios.length === 0 ? (
              <p className="empty-state">No se encontraron usuarios</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Documento</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.usuarios.map((u) => (
                    <tr key={u.id}>
                      <td>{u.nombre}</td>
                      <td>{u.documento}</td>
                      <td>{u.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
