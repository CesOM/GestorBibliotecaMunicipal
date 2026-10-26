import { forwardRef, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import HTMLFlipBook from 'react-pageflip';
import { api } from '../api';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const Page = forwardRef(function Page({ doc, number, active, width, zoom = 1 }, ref) {
  const canvas = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!active) return;
    let disposed = false,
      renderTask;
    setError('');
    doc
      .getPage(number)
      .then(async (page) => {
        if (disposed || !canvas.current) return;
        const base = page.getViewport({ scale: 1 });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: ((width * zoom) / base.width) * ratio });
        const el = canvas.current;
        el.width = viewport.width;
        el.height = viewport.height;
        el.style.width = `${width * zoom}px`;
        el.style.height = `${viewport.height / ratio}px`;
        renderTask = page.render({ canvasContext: el.getContext('2d'), viewport });
        try {
          await renderTask.promise;
        } catch (e) {
          if (e.name !== 'RenderingCancelledException' && !disposed)
            setError('No se pudo mostrar esta página.');
        }
      })
      .catch(() => {
        if (!disposed) setError('No se pudo cargar esta página.');
      });
    return () => {
      disposed = true;
      renderTask?.cancel();
    };
  }, [doc, number, active, width, zoom]);
  return (
    <div ref={ref} className="reader-page">
      <canvas ref={canvas} role="img" aria-label={`Página ${number}`} hidden={!active} />
      {!active && <span className="page-placeholder">{number}</span>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
});

export default function Lector() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('pdf');
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(320);
  const flip = useRef(null),
    root = useRef(null),
    stage = useRef(null);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    setBook(null);
    setDoc(null);
    setPage(1);
    setZoom(1);
    api
      .libroPublico(id)
      .then((b) => {
        if (alive) {
          setBook(b);
          setMode(b.formato === 'flipbook' ? 'flipbook' : 'pdf');
          setLoading(false);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [id]);
  useEffect(() => {
    if (!book?.pdfUrl) return;
    let alive = true;
    const task = pdfjs.getDocument({ url: book.pdfUrl, isEvalSupported: false });
    task.promise
      .then((d) => {
        if (alive) setDoc(d);
      })
      .catch(() => {
        if (alive)
          setError(
            'No se pudo abrir el PDF. Si es un enlace externo, el servidor debe permitir lectura desde esta página (CORS).',
          );
      });
    return () => {
      alive = false;
      task.destroy();
    };
  }, [book?.pdfUrl]);
  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(180, Math.min(560, entry.contentRect.width - 32))),
    );
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, [book]);
  const external = mode === 'flipbook' && book?.flipbookUrl;
  const internalFlip = mode === 'flipbook' && !external;
  const pageWidth = internalFlip ? Math.min(width, 420) : width;
  function go(value) {
    if (!doc) return;
    const next = Math.max(1, Math.min(doc.numPages, value));
    if (internalFlip) flip.current?.pageFlip()?.flip(next - 1);
    if (!internalFlip) setPage(next);
  }
  async function fullScreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current.requestFullscreen();
    } catch {
      setError('Tu navegador no permite pantalla completa. Puedes ampliar la vista con el zoom.');
    }
  }
  return (
    <main ref={root} className="reader-shell">
      <header className="reader-header">
        <Link to="/" className="btn btn-secondary">
          ← Biblioteca
        </Link>
        <div>
          <h1>{book?.titulo || 'Sala de lectura'}</h1>
          {book && <p>{book.autor}</p>}
        </div>
        {document.fullscreenEnabled && (
          <button className="btn btn-secondary" onClick={fullScreen}>
            Pantalla completa
          </button>
        )}
      </header>
      {loading && (
        <p className="empty-state" role="status">
          Buscando el libro…
        </p>
      )}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {book && (
        <>
          <div className="reader-controls">
            {book.formato === 'ambos' && (
              <div className="mode-switch" aria-label="Modo de lectura">
                <button
                  className={mode === 'pdf' ? 'chip active' : 'chip'}
                  aria-pressed={mode === 'pdf'}
                  onClick={() => {
                    setMode('pdf');
                    setPage(1);
                  }}
                >
                  PDF
                </button>
                <button
                  className={mode === 'flipbook' ? 'chip active' : 'chip'}
                  aria-pressed={mode === 'flipbook'}
                  onClick={() => {
                    setMode('flipbook');
                    setPage(1);
                  }}
                >
                  Flipbook
                </button>
              </div>
            )}
            {!external && doc && (
              <>
                <button
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() =>
                    internalFlip ? flip.current?.pageFlip()?.flipPrev() : go(page - 1)
                  }
                >
                  ← Anterior
                </button>
                <label className="page-number">
                  Página{' '}
                  <input
                    aria-label="Número de página"
                    type="number"
                    min="1"
                    max={doc.numPages}
                    value={page}
                    onChange={(e) => {
                      if (e.target.value) go(Number(e.target.value));
                    }}
                  />{' '}
                  de {doc.numPages}
                </label>
                <button
                  className="btn btn-secondary"
                  disabled={page >= doc.numPages}
                  onClick={() =>
                    internalFlip ? flip.current?.pageFlip()?.flipNext() : go(page + 1)
                  }
                >
                  Siguiente →
                </button>
                {!internalFlip && (
                  <label>
                    Zoom{' '}
                    <select
                      aria-label="Zoom"
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                    >
                      {[0.75, 1, 1.25, 1.5, 2].map((v) => (
                        <option key={v} value={v}>
                          {v * 100}%
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            )}
          </div>
          <div className="reader-stage" ref={stage}>
            {external ? (
              <div className="external-reader">
                <p>
                  El proveedor debe permitir incrustar el libro. Si no aparece,{' '}
                  <a href={book.flipbookUrl} target="_blank" rel="noopener noreferrer">
                    ábrelo en su sitio ↗
                  </a>
                  .
                </p>
                <iframe
                  title={`Flipbook: ${book.titulo}`}
                  src={book.flipbookUrl}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                  allow="fullscreen"
                  allowFullScreen
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : !doc ? (
              !error && (
                <p className="empty-state" role="status">
                  Preparando las páginas…
                </p>
              )
            ) : internalFlip ? (
              <div className="flip-container">
                <HTMLFlipBook
                  key={`${id}-${pageWidth}`}
                  ref={flip}
                  width={pageWidth}
                  height={Math.round(pageWidth * 1.42)}
                  size="fixed"
                  usePortrait
                  startPage={page - 1}
                  showCover
                  mobileScrollSupport={false}
                  maxShadowOpacity={0.2}
                  onFlip={(e) => setPage(e.data + 1)}
                >
                  {Array.from({ length: doc.numPages }, (_, i) => (
                    <Page
                      key={i}
                      doc={doc}
                      number={i + 1}
                      active={Math.abs(i + 1 - page) <= 3}
                      width={pageWidth}
                    />
                  ))}
                </HTMLFlipBook>
                <p className="flip-hint">Toca una esquina o desliza para pasar la página.</p>
              </div>
            ) : (
              <div className="pdf-page-wrap">
                <Page doc={doc} number={page} active width={pageWidth} zoom={zoom} />
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
