import axios from 'axios';

export const API_URL = 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const organizationApi = {
  getAll: () => api.get('/organization'),
  getById: (id: string) => api.get(`/organization/${id}`),
  create: (data: any) => api.post('/organization', data),
  update: (id: string, data: any) => api.put(`/organization/${id}`, data),
  delete: (id: string) => api.delete(`/organization/${id}`),
};

export const branchApi = {
  getAll: () => api.get('/branch'),
  getById: (id: string) => api.get(`/branch/${id}`),
  create: (data: any) => api.post('/branch', data),
  update: (id: string, data: any) => api.put(`/branch/${id}`, data),
  delete: (id: string) => api.delete(`/branch/${id}`),
};

export const productApi = {
  getAll: () => api.get('/product'),
  getById: (id: string) => api.get(`/product/${id}`),
  create: (data: any) => api.post('/product', data),
  update: (id: string, data: any) => api.put(`/product/${id}`, data),
  delete: (id: string) => api.delete(`/product/${id}`),
};

export const supplierApi = {
  getAll: () => api.get('/supplier'),
  getById: (id: string) => api.get(`/supplier/${id}`),
  create: (data: any) => api.post('/supplier', data),
  update: (id: string, data: any) => api.put(`/supplier/${id}`, data),
  delete: (id: string) => api.delete(`/supplier/${id}`),
};

export const purchaseApi = {
  getAll: () => api.get('/purchase'),
  getById: (id: string) => api.get(`/purchase/${id}`),
  create: (data: any) => api.post('/purchase', data),
  update: (id: string, data: any) => api.put(`/purchase/${id}`, data),
  delete: (id: string) => api.delete(`/purchase/${id}`),
};

export const inventoryApi = {
  getAll: () => api.get('/inventory'),
  getById: (id: string) => api.get(`/inventory/${id}`),
};

export const transferApi = {
  getAll: () => api.get('/transfer'),
  getById: (id: string) => api.get(`/transfer/${id}`),
  create: (data: any) => api.post('/transfer', data),
  update: (id: string, data: any) => api.put(`/transfer/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/transfer/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/transfer/${id}`),
};
