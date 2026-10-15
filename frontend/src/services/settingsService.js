import api from './api';

export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

// partial = sirf wahi fields jo badalni hain, e.g. { theme: 'dark' }
export const updateSettings = async (partial) => {
  const response = await api.put('/settings', partial);
  return response.data;
};