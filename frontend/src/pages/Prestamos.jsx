import { useEffect, useState } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState([]);
  const [libros, setLibros] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ libroId: '', usuarioId: '', diasPrestamo: 14 });
  const [error, setError] = useState('');

  const cargar = async () => {
    const [p, l, u] = await Promise.all([
      api.prestamos.listar(filtroEstado || undefined),
      api.libros.listar(),
      api.usuarios.listar()
    ]);
    setPrestamos(p);
    setLibros(l);
    setUsuarios(u);
  };

  useEffect(() => {
    cargar().catch((e) => setError(e.message));
  }, [filtroEstado]);

  const librosDisponibles = libros.filter((l) => l.cantidadDisponible > 0);

  const registrarPrestamo = async (e) => {
    e.preventDefault();
    try {
      await api.prestamos.crear(form);
      setModal(false);
      setForm({ libroId: '', usuarioId: '', diasPrestamo: 14 });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const devolver = async (id) => {
    if (!confirm('¿Registrar devolución de este libro?')) return;
    try {
      await api.prestamos.devolver(id);
      cargar();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatearFecha = (iso) =>
    iso ? new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'medium' }) : '—';

  const estaVencido = (p) =>
    p.estado === 'activo' && new Date(p.fechaDevolucionEsperada) < new Date();

  return (
    <div>
      <header className="page-header">
        <h2>Préstamos y devoluciones</h2>
        <p>Control de préstamos activos, devoluciones y fechas de entrega</p>
      </header>

      <div className="toolbar">
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid var(--border)' }}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="devuelto">Devueltos</option>
        </select>
        <button
          className="btn btn-primary"
          onClick={() => {
            setModal(true);
            setError('');
          }}
          disabled={librosDisponibles.length === 0 || usuarios.length === 0}
        >
          + Nuevo préstamo
        </button>
      </div>

      {error && !modal && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {prestamos.length === 0 ? (
          <p className="empty-state">No hay préstamos registrados</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Libro</th>
                <th>Usuario</th>
                <th>Préstamo</th>
                <th>Devolución esperada</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {prestamos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.libroTitulo}</strong>
                    <br />
                    <small style={{ color: 'var(--text-muted)' }}>{p.libroAutor}</small>
                  </td>
                  <td>
                    {p.usuarioNombre}
                    <br />
                    <small style={{ color: 'var(--text-muted)' }}>{p.usuarioDocumento}</small>
                  </td>
                  <td>{formatearFecha(p.fechaPrestamo)}</td>
                  <td>{formatearFecha(p.fechaDevolucionEsperada)}</td>
                  <td>
                    {p.estado === 'devuelto' ? (
                      <span className="badge badge-muted">Devuelto</span>
                    ) : estaVencido(p) ? (
                      <span className="badge badge-danger">Vencido</span>
                    ) : (
                      <span className="badge badge-success">Activo</span>
                    )}
                  </td>
                  <td>
                    {p.estado === 'activo' && (
                      <button className="btn btn-primary btn-sm" onClick={() => devolver(p.id)}>
                        Registrar devolución
                      </button>
                    )}
                    {p.estado === 'devuelto' && (
                      <small>Devuelto: {formatearFecha(p.fechaDevolucionReal)}</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title="Registrar préstamo" onClose={() => setModal(false)}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={registrarPrestamo}>
            <div className="form-group">
              <label>Libro *</label>
              <select
                required
                value={form.libroId}
                onChange={(e) => setForm({ ...form, libroId: e.target.value })}
              >
                <option value="">Seleccione un libro</option>
                {librosDisponibles.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.titulo} ({l.cantidadDisponible} disponibles)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Usuario *</label>
              <select
                required
                value={form.usuarioId}
                onChange={(e) => setForm({ ...form, usuarioId: e.target.value })}
              >
                <option value="">Seleccione un usuario</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} — {u.documento}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Días de préstamo</label>
              <input
                type="number"
                min="1"
                max="60"
                value={form.diasPrestamo}
                onChange={(e) => setForm({ ...form, diasPrestamo: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Registrar préstamo
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
