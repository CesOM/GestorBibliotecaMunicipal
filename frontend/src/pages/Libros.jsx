import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';

const formInicial = {
  titulo: '',
  autor: '',
  isbn: '',
  categoria: 'General',
  cantidadTotal: 1,
  descripcion: '',
  portadaUrl: '',
  pdfUrl: '',
  flipbookUrl: '',
  formato: 'pdf',
  publicado: false,
};

export default function Libros() {
  const [libros, setLibros] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(formInicial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const cerrarModal = useCallback(() => setModal(null), []);
  async function subir(event, field) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const result = await api.subir(file);
      if ((field === 'pdfUrl') !== (result.tipo === 'pdf'))
        throw new Error('El tipo del archivo no corresponde al campo');
      setForm((current) => ({ ...current, [field]: result.url }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  const cargar = () =>
    api.libros
      .listar()
      .then(setLibros)
      .catch((e) => setError(e.message));

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = libros.filter(
    (l) =>
      l.titulo.toLowerCase().includes(filtro.toLowerCase()) ||
      l.autor.toLowerCase().includes(filtro.toLowerCase()) ||
      l.categoria.toLowerCase().includes(filtro.toLowerCase()),
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
      cantidadTotal: libro.cantidadTotal,
      descripcion: libro.descripcion || '',
      portadaUrl: libro.portadaUrl || '',
      pdfUrl: libro.pdfUrl || '',
      flipbookUrl: libro.flipbookUrl || '',
      formato: libro.formato || 'pdf',
      publicado: Boolean(libro.publicado),
    });
    setModal({ tipo: 'editar', id: libro.id });
    setError('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (busy || uploading) return;
    setBusy(true);
    setError('');
    try {
      if (modal === 'crear') {
        await api.libros.crear({
          ...form,
          titulo: form.titulo,
          autor: form.autor,
          isbn: form.isbn,
          categoria: form.categoria,
          cantidad: Number(form.cantidadTotal),
        });
      } else {
        await api.libros.actualizar(modal.id, form);
      }
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
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
        {error && !modal && (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        )}
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
                <th>Estado físico</th>
                <th>Publicación digital</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((libro) => (
                <tr key={libro.id}>
                  <td>
                    <strong>{libro.titulo}</strong>
                  </td>
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
                  <td>
                    <span className="badge badge-muted">
                      {libro.publicado ? `Publicado · ${libro.formato}` : 'Borrador'}
                    </span>
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
        <Modal title={modal === 'crear' ? 'Registrar libro' : 'Editar libro'} onClose={cerrarModal}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={guardar}>
            <div className="form-group">
              <label>Título *</label>
              <input
                required
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Autor *</label>
              <input
                required
                value={form.autor}
                onChange={(e) => setForm({ ...form, autor: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>ISBN</label>
              <input
                value={form.isbn}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <input
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
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
            <fieldset className="digital-fields">
              <legend>Biblioteca virtual</legend>
              <div className="form-group">
                <label htmlFor="descripcion">Descripción corta</label>
                <textarea
                  id="descripcion"
                  rows="3"
                  maxLength="4000"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="portada">Portada (PNG, JPG o WebP)</label>
                <input
                  id="portada"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploading || busy}
                  onChange={(e) => subir(e, 'portadaUrl')}
                />
                <input
                  aria-label="Dirección de portada"
                  placeholder="O enlace HTTPS de la portada"
                  value={form.portadaUrl}
                  onChange={(e) => setForm({ ...form, portadaUrl: e.target.value })}
                />
                {form.portadaUrl && (
                  <img
                    className="cover-preview"
                    alt="Vista previa de portada"
                    src={form.portadaUrl}
                  />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="formato">Modo de lectura</label>
                <select
                  id="formato"
                  value={form.formato}
                  onChange={(e) => setForm({ ...form, formato: e.target.value })}
                >
                  <option value="pdf">PDF</option>
                  <option value="flipbook">Flipbook</option>
                  <option value="ambos">PDF y Flipbook</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="pdf">Archivo PDF (máximo 30 MB)</label>
                <input
                  id="pdf"
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={uploading || busy}
                  onChange={(e) => subir(e, 'pdfUrl')}
                />
                <input
                  aria-label="Dirección del PDF"
                  placeholder="O enlace HTTPS al PDF (requiere CORS)"
                  value={form.pdfUrl}
                  onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
                />
                {form.pdfUrl && <small>PDF seleccionado ✓</small>}
              </div>
              {form.formato !== 'pdf' && (
                <div className="form-group">
                  <label htmlFor="flipbook">Enlace de inserción Flipbook (opcional)</label>
                  <input
                    id="flipbook"
                    placeholder="https://…"
                    value={form.flipbookUrl}
                    onChange={(e) => setForm({ ...form, flipbookUrl: e.target.value })}
                  />
                  <small>
                    Si se deja vacío, el Flipbook se genera con el PDF. Los enlaces externos deben
                    permitir incrustación.
                  </small>
                </div>
              )}
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.publicado}
                  onChange={(e) => setForm({ ...form, publicado: e.target.checked })}
                />{' '}
                Publicar en el catálogo público
              </label>
              {uploading && <p role="status">Subiendo archivo…</p>}
            </fieldset>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy || uploading}>
                {busy ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
