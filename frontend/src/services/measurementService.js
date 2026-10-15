import api from './api';

export const getMeasurements = async () => {
  const response = await api.get('/measurements');
  return response.data;
};

export const addMeasurement = async (measurementData) => {
  const response = await api.post('/measurements', measurementData);
  return response.data;
};

export const updateMeasurement = async (id, measurementData) => {
  const response = await api.put(`/measurements/${id}`, measurementData);
  return response.data;
};

export const deleteMeasurement = async (id) => {
  const response = await api.delete(`/measurements/${id}`);
  return response.data;
};