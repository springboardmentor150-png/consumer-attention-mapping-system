import api from '../services/api';

export const getAnalytics = () => api.get('/analytics/attention');
