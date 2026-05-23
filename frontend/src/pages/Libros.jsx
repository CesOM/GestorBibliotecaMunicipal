import { useEffect, useState } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';

const formInicial = { titulo: '', autor: '', isbn: '', categoria: 'General', cantidadTotal: 1 };

export default function Libros() {
  const [libros, setLibros] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(formInicial);
  const [error, setError] = useState('');

  const cargar = () => api.libros.listar().then(setLibros).catch((e) => setError(e.message));

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = libros.filter(
    (l) =>
      l.titulo.toLowerCase().includes(filtro.toLowerCase()) ||
      l.autor.toLowerCase().includes(filtro.toLowerCase()) ||
      l.categoria.toLowerCase().includes(filtro.toLowerCase())
  );

  const abrirCrear = () => {
    setForm(formInicial);
    setModal('crear');
    setError('');
  };

  const abrirEditar = (libro) => {
    setForm({
      titulo: libro.titulo,
      autor: libro.autor,
      isbn: libro.isbn,
      categoria: libro.categoria,
      cantidadTotal: libro.cantidadTotal
    });
    setModal({ tipo: 'editar', id: libro.id });
    setError('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'crear') {
        await api.libros.crear({
          titulo: form.titulo,
          autor: form.autor,
          isbn: form.isbn,
          categoria: form.categoria,
          cantidad: Number(form.cantidadTotal)
        });
      } else {
        await api.libros.actualizar(modal.id, form);
      }
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este libro?')) return;
    try {
      await api.libros.eliminar(id);
      cargar();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h2>Gestión de libros</h2>
        <p>Registro, consulta y control de disponibilidad del inventario bibliográfico</p>
      </header>

      <div className="toolbar">
        <div className="search-box">
          <input
            placeholder="Buscar por título, autor o categoría..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={abrirCrear}>
          + Nuevo libro
        </button>
      </div>

      <div className="card">
        {filtrados.length === 0 ? (
          <p className="empty-state">No hay libros registrados</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Autor</th>
                <th>Categoría</th>
                <th>Disponibles</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((libro) => (
                <tr key={libro.id}>
                  <td><strong>{libro.titulo}</strong></td>
                  <td>{libro.autor}</td>
                  <td>{libro.categoria}</td>
                  <td>
                    {libro.cantidadDisponible} / {libro.cantidadTotal}
                  </td>
                  <td>
                    {libro.cantidadDisponible > 0 ? (
                      <span className="badge badge-success">Disponible</span>
                    ) : (
                      <span className="badge badge-danger">Agotado</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(libro)}>
                      Editar
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => eliminar(libro.id)}>
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
          title={modal === 'crear' ? 'Registrar libro' : 'Editar libro'}
          onClose={() => setModal(null)}
        >
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={guardar}>
            <div className="form-group">
              <label>Título *</label>
              <input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Autor *</label>
              <input required value={form.autor} onChange={(e) => setForm({ ...form, autor: e.target.value })} />
            </div>
            <div className="form-group">
              <label>ISBN</label>
              <input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Cantidad de ejemplares</label>
              <input
                type="number"
                min="1"
                required
                value={form.cantidadTotal}
                onChange={(e) => setForm({ ...form, cantidadTotal: e.target.value })}
              />
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
