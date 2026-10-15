import api from './api';

export const getNutrition = async () => {
  const response = await api.get('/nutrition');
  return response.data;
};

export const addNutrition = async (nutritionData) => {
  const response = await api.post('/nutrition', nutritionData);
  return response.data;
};

export const updateNutrition = async (id, nutritionData) => {
  const response = await api.put(`/nutrition/${id}`, nutritionData);
  return response.data;
};

export const deleteNutrition = async (id) => {
  const response = await api.delete(`/nutrition/${id}`);
  return response.data;
};