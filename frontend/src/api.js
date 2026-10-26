const API_BASE = '/api';

async function request(url, options = {}) {
  const token = sessionStorage.getItem('bibliotecaAdmin');
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    sessionStorage.removeItem('bibliotecaAdmin');
    window.dispatchEvent(new Event('biblioteca:logout'));
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

export const api = {
  catalogo: () => request('/catalogo'),
  libroPublico: (id) => request(`/catalogo/${encodeURIComponent(id)}`),
  sesion: () => request('/admin/session'),
  subir: (file) => {
    const body = new FormData();
    body.append('archivo', file);
    return request('/uploads', { method: 'POST', body });
  },
  dashboard: () => request('/dashboard'),
  buscar: (q) => request(`/buscar?q=${encodeURIComponent(q)}`),

  libros: {
    listar: () => request('/libros'),
    crear: (body) => request('/libros', { method: 'POST', body: JSON.stringify(body) }),
    actualizar: (id, body) =>
      request(`/libros/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    eliminar: (id) => request(`/libros/${id}`, { method: 'DELETE' }),
  },

  usuarios: {
    listar: () => request('/usuarios'),
    crear: (body) => request('/usuarios', { method: 'POST', body: JSON.stringify(body) }),
    actualizar: (id, body) =>
      request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    eliminar: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),
  },

  prestamos: {
    listar: (estado) => request(estado ? `/prestamos?estado=${estado}` : '/prestamos'),
    crear: (body) => request('/prestamos', { method: 'POST', body: JSON.stringify(body) }),
    devolver: (id) => request(`/prestamos/${id}/devolver`, { method: 'PUT' }),
  },
};
