import { useEffect, useId, useRef } from 'react';
export default function Modal({ title, children, onClose }) {
  const ref = useRef(null),
    titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const element = ref.current;
    const focusables = () => [
      ...element.querySelectorAll(
        'input:not([disabled]), textarea, select, button:not([disabled]), a[href]',
      ),
    ];
    (focusables()[0] || element).focus();
    const handle = (e) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab') {
        const items = focusables(),
          first = items[0],
          last = items.at(-1);
        if (!first) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === element)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.addEventListener('keydown', handle);
    return () => {
      element.removeEventListener('keydown', handle);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title">
          <h3 id={titleId}>{title}</h3>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            aria-label="Cerrar ventana"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
