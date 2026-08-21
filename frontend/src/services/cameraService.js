import api from './api';

export const getCameras = () => api.get('/cameras');
export const createCamera = (data) => api.post('/cameras', data);
export const deleteCamera = (id) => api.delete(`/cameras/${id}`);
