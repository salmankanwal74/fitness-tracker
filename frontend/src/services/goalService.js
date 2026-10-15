import api from './api';

export const getGoal = async () => {
  const response = await api.get('/goals');
  return response.data;
};

export const updateGoal = async (partial) => {
  const response = await api.put('/goals', partial);
  return response.data;
};