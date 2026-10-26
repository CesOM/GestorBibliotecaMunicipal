import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import BookIcon from '../components/BookIcon';
const normalize = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export default function Catalogo() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  function load() {
    setLoading(true);
    setError('');
    api
      .catalogo()
      .then(setBooks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);
  const categories = [...new Set(books.map((b) => b.categoria))].sort((a, b) => a.localeCompare(b));
  const filtered = books.filter(
    (b) =>
      (!category || b.categoria === category) &&
      normalize(`${b.titulo} ${b.autor} ${b.categoria}`).includes(normalize(query)),
  );
  return (
    <div className="public-library">
      <header className="public-header">
        <Link className="brand" to="/">
          <span className="brand-icon">
            <BookIcon />
          </span>
          <span>
            Biblioteca <strong>Municipal</strong>
          </span>
        </Link>
        <a className="nav-catalog" href="#catalogo">
          Explorar libros
        </a>
        <Link className="admin-link" to="/admin">
          Administración ↗
        </Link>
      </header>
      <main>
        <section className="library-hero">
          <div className="hero-copy">
            <p className="eyebrow">TU PRÓXIMA HISTORIA EMPIEZA AQUÍ</p>
            <h1>
              Un mundo de libros.
              <br />
              <span>A un clic de ti.</span>
            </h1>
            <p>
              Bienvenido a tu biblioteca virtual. Descubre, aprende y disfruta de la lectura, estés
              donde estés.
            </p>
            <a href="#catalogo" className="btn btn-primary hero-cta">
              Explorar la biblioteca <span aria-hidden="true">↗</span>
            </a>
            <div className="hero-notes">
              <span>✧ Lectura en línea</span>
              <span>◎ PDF y Flipbook</span>
            </div>
          </div>
          <div className="shelf-scene" aria-hidden="true">
            <span className="scene-orbit">✧</span>
            <div className="scene-caption">
              Siempre hay algo
              <br />
              por descubrir.
            </div>
            <div className="display-books">
              <div className="display-book book-one">
                <small>BIBLIOTECA</small>
                <strong>
                  Imagina
                  <br />
                  sin límites
                </strong>
                <div className="book-sun" />
                <span>LECTURAS PARA SOÑAR</span>
              </div>
              <div className="display-book book-two">
                <small>EXPLORA</small>
                <strong>
                  Un nuevo
                  <br />
                  mundo
                </strong>
                <div className="book-waves">⌁</div>
                <span>EL VIAJE ES LEER</span>
              </div>
              <div className="book-spine">HISTORIAS</div>
            </div>
            <div className="scene-shelf" />
            <span className="scene-label">
              <BookIcon /> Tu rincón de lectura, en cualquier lugar
            </span>
          </div>
        </section>
        <section className="catalog-section" id="catalogo">
          <div className="catalog-heading">
            <div>
              <p className="eyebrow">DESCUBRE TU PRÓXIMA LECTURA</p>
              <h2>Explora la biblioteca</h2>
            </div>
            <p>Historias y conocimiento para todos.</p>
          </div>
          <div className="catalog-tools">
            <div className="catalog-search">
              <span aria-hidden="true">⌕</span>
              <label className="sr-only" htmlFor="buscar-libros">
                Buscar libros por título, autor o categoría
              </label>
              <input
                id="buscar-libros"
                type="search"
                placeholder="Busca un título, autor o categoría…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <label className="category-select">
              Categoría
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="category-chips" aria-label="Filtrar por categoría">
            <button
              className={!category ? 'chip active' : 'chip'}
              onClick={() => setCategory('')}
              aria-pressed={!category}
            >
              Todos los libros
            </button>
            {categories.map((c) => (
              <button
                key={c}
                className={category === c ? 'chip active' : 'chip'}
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          {loading ? (
            <p className="empty-state" role="status">
              Cargando tu biblioteca…
            </p>
          ) : error ? (
            <div className="empty-state" role="alert">
              <p>{error}</p>
              <button className="btn btn-primary" onClick={load}>
                Reintentar
              </button>
            </div>
          ) : (
            <>
              <p className="result-count" aria-live="polite">
                {filtered.length}{' '}
                {filtered.length === 1 ? 'libro disponible' : 'libros disponibles'}
              </p>
              {filtered.length ? (
                <div className="book-grid">
                  {filtered.map((book, i) => (
                    <article className="library-book" key={book.id}>
                      <Link
                        to={`/leer/${book.id}`}
                        className="cover-link"
                        aria-label={`Leer ${book.titulo}`}
                      >
                        <div className={`book-cover cover-tone-${i % 4}`}>
                          {book.portadaUrl ? (
                            <img
                              src={book.portadaUrl}
                              alt={`Portada de ${book.titulo}`}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.hidden = true;
                              }}
                            />
                          ) : null}
                          <div className="cover-fallback" aria-hidden="true">
                            <BookIcon />
                            <strong>{book.titulo}</strong>
                            <span>{book.autor}</span>
                          </div>
                          <span className="format-tag">
                            {book.formato === 'ambos'
                              ? 'PDF + FLIPBOOK'
                              : book.formato.toUpperCase()}
                          </span>
                        </div>
                      </Link>
                      <div className="book-info">
                        <span className="book-category">{book.categoria}</span>
                        <h3>
                          <Link to={`/leer/${book.id}`}>{book.titulo}</Link>
                        </h3>
                        <p className="book-author">{book.autor}</p>
                        {book.descripcion && <p className="book-description">{book.descripcion}</p>}
                        <Link className="read-link" to={`/leer/${book.id}`}>
                          <BookIcon /> Abrir libro <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <BookIcon />
                  <h3>
                    {books.length
                      ? 'No encontramos ese libro'
                      : 'Pronto encontrarás nuevas lecturas aquí'}
                  </h3>
                  <p>
                    {books.length
                      ? 'Prueba otro título o categoría.'
                      : 'La biblioteca está preparando su colección digital.'}
                  </p>
                  {books.length > 0 && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setQuery('');
                        setCategory('');
                      }}
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
        <section className="reading-banner">
          <BookIcon />
          <div>
            <h2>Un espacio para tu curiosidad</h2>
            <p>Abre un libro, descubre una idea y sigue explorando.</p>
          </div>
          <a href="#catalogo">Encuentra tu lectura ↑</a>
        </section>
      </main>
      <footer className="public-footer">
        <span>Biblioteca Municipal · Tu biblioteca, siempre contigo.</span>
        <span>Lee. Imagina. Descubre.</span>
      </footer>
    </div>
  );
}
