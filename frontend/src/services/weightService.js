import api from './api';

export const getWeights = async () => {
  const response = await api.get('/weight');
  return response.data;
};

export const addWeight = async (weightData) => {
  const response = await api.post('/weight', weightData);
  return response.data;
};

export const updateWeight = async (id, weightData) => {
  const response = await api.put(`/weight/${id}`, weightData);
  return response.data;
};

export const deleteWeight = async (id) => {
  const response = await api.delete(`/weight/${id}`);
  return response.data;
};