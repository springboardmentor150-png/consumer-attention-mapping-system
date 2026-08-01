import api from './api';

export const getSummary = () => api.get('/analytics/summary');
export const getShelves = () => api.get('/analytics/shelves');
