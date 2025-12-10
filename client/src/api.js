import axios from 'axios';
const BASE = import.meta.env.VITE_API_URL || '/api';

// Створюємо інстанс і додаємо токен автоматично
const api = axios.create({ baseURL: BASE });
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// Перехоплення 401: скинути токен та перейти на /admin/login
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      try { localStorage.removeItem('admin_token'); } catch {}
      if (typeof window !== 'undefined') {
        window.location.assign('/admin/login');
      }
    }
    return Promise.reject(err);
  }
);

// Авторизація адміна
export async function login({ username, password }){
  const r = await api.post('/auth/login', { username, password });
  const { token } = r.data || {};
  if (token) localStorage.setItem('admin_token', token);
  return token;
}

// Завантаження зображення (form-data: file)
export async function uploadImage(file){
  const fd = new FormData();
  fd.append('file', file);
  const r = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return r.data; // { url, filename }
}

export async function getProducts(params) {
  const res = await api.get('/products', { params });
  return res.data;
}
export async function getProduct(id){ const r = await api.get(`/products/${id}`); return r.data; }
export async function createProduct(payload){ const r = await api.post('/products', payload); return r.data; }
export async function updateProduct(id,payload){ const r = await api.put(`/products/${id}`, payload); return r.data; }
export async function deleteProduct(id){ const r = await api.delete(`/products/${id}`); return r.data; }
export async function bulkCreateProducts(items){ const r = await api.post('/products/bulk', items); return r.data; }
export async function deleteAllProducts(){ const r = await api.delete('/products', { params: { confirm: true } }); return r.data; }

export async function getCategories(){ const r = await api.get('/categories'); return r.data; }
export async function createCategory(payload){ const r = await api.post('/categories', payload); return r.data; }
export async function updateCategory(id, payload){ const r = await api.put(`/categories/${id}`, payload); return r.data; }
export async function deleteCategory(id){ const r = await api.delete(`/categories/${id}`); return r.data; }
export async function reassignCategories(fromId, toId){ const r = await api.post(`/categories/reassign`, { fromId, toId }); return r.data; }

export async function getOrders(){ const r = await api.get('/orders'); return r.data; }
export async function createOrder(payload){ const r = await api.post('/orders', payload); return r.data; }
export async function deleteOrder(id){ const r = await api.delete(`/orders/${id}`); return r.data; }
export async function updateOrder(id, payload){ const r = await api.put(`/orders/${id}`, payload); return r.data; }

// Заявки (доставка)
export async function getLeads(params){ const r = await api.get('/leads', { params }); return r.data; }
export async function createLead(payload){ const r = await api.post('/leads', payload); return r.data; }
export async function updateLead(id, payload){ const r = await api.put(`/leads/${id}`, payload); return r.data; }
// Нова пошта: довідники міст та відділень
export async function getPostCities(params){ const r = await api.get('/post/cities', { params }); return r.data; }
export async function getPostOffices(params){ const r = await api.get('/post/offices', { params }); return r.data; }
