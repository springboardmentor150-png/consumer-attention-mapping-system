import api from './api';

export const getSummary = () => api.get('/analytics/summary');
export const getShelves = () => api.get('/analytics/shelves');
export const getDashboardAnalytics = () => api.get('/api/analytics/dashboard');
export const getDashboardSummary = () => api.get('/api/analytics/dashboard');
export const getShelfRanking = () => api.get('/api/analytics/ranking');
export const getAttentionHistory = () => api.get('/api/analytics/history');
export const getCustomerPath = (personId) => api.get(`/path/${personId}`);
