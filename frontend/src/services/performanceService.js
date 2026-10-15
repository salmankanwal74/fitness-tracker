import api from './api';

export const getPerformance = async () => {
  const response = await api.get('/performance');
  return response.data;
};

export const addPerformance = async (data) => {
  const response = await api.post('/performance', data);
  return response.data;
};

export const updatePerformance = async (id, data) => {
  const response = await api.put(`/performance/${id}`, data);
  return response.data;
};

export const deletePerformance = async (id) => {
  const response = await api.delete(`/performance/${id}`);
  return response.data;
};