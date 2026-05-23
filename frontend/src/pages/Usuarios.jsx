import { useEffect, useState } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';

const formInicial = { nombre: '', documento: '', email: '', telefono: '' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(formInicial);
  const [error, setError] = useState('');

  const cargar = () => api.usuarios.listar().then(setUsuarios).catch((e) => setError(e.message));

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      u.documento.includes(filtro)
  );

  const abrirCrear = () => {
    setForm(formInicial);
    setModal('crear');
    setError('');
  };

  const abrirEditar = (usuario) => {
    setForm({
      nombre: usuario.nombre,
      documento: usuario.documento,
      email: usuario.email,
      telefono: usuario.telefono
    });
    setModal({ tipo: 'editar', id: usuario.id });
    setError('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'crear') {
        await api.usuarios.crear(form);
      } else {
        await api.usuarios.actualizar(modal.id, form);
      }
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await api.usuarios.eliminar(id);
      cargar();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatearFecha = (iso) =>
    new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'medium' });

  return (
    <div>
      <header className="page-header">
        <h2>Gestión de usuarios</h2>
        <p>Registro y búsqueda de usuarios de la biblioteca municipal</p>
      </header>

      <div className="toolbar">
        <div className="search-box">
          <input
            placeholder="Buscar por nombre o documento..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={abrirCrear}>
          + Nuevo usuario
        </button>
      </div>

      <div className="card">
        {filtrados.length === 0 ? (
          <p className="empty-state">No hay usuarios registrados</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.nombre}</strong></td>
                  <td>{u.documento}</td>
                  <td>{u.email || '—'}</td>
                  <td>{u.telefono || '—'}</td>
                  <td>{formatearFecha(u.createdAt)}</td>
                  <td className="actions-cell">
                    <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(u)}>
                      Editar
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => eliminar(u.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === 'crear' ? 'Registrar usuario' : 'Editar usuario'}
          onClose={() => setModal(null)}
        >
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={guardar}>
            <div className="form-group">
              <label>Nombre completo *</label>
              <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Documento *</label>
              <input required value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
