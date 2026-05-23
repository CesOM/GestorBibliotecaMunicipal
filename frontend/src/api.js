const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

export const api = {
  dashboard: () => request('/dashboard'),
  buscar: (q) => request(`/buscar?q=${encodeURIComponent(q)}`),

  libros: {
    listar: () => request('/libros'),
    crear: (body) => request('/libros', { method: 'POST', body: JSON.stringify(body) }),
    actualizar: (id, body) =>
      request(`/libros/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    eliminar: (id) => request(`/libros/${id}`, { method: 'DELETE' })
  },

  usuarios: {
    listar: () => request('/usuarios'),
    crear: (body) => request('/usuarios', { method: 'POST', body: JSON.stringify(body) }),
    actualizar: (id, body) =>
      request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    eliminar: (id) => request(`/usuarios/${id}`, { method: 'DELETE' })
  },

  prestamos: {
    listar: (estado) =>
      request(estado ? `/prestamos?estado=${estado}` : '/prestamos'),
    crear: (body) => request('/prestamos', { method: 'POST', body: JSON.stringify(body) }),
    devolver: (id) => request(`/prestamos/${id}/devolver`, { method: 'PUT' })
  }
};
