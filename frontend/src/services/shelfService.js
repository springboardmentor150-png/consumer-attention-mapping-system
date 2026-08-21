import api from './api';

export const getShelves = () => api.get('/shelves');
export const createShelf = (data) => api.post('/shelves', data);
export const deleteShelf = (id) => api.delete(`/shelves/${id}`);
