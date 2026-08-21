import api from './api';

export const getStores = () => api.get('/stores');
export const createStore = (data) => api.post('/stores', data);
export const deleteStore = (id) => api.delete(`/stores/${id}`);
