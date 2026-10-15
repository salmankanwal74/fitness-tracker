import api from './api';

export const signup = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

// userData = { identifier, password } — identifier email ya username ho sakta hai
export const login = async (userData) => {
  const response = await api.post('/auth/login', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

// Reset kamyab ho to backend naya login token deta hai, usay save kar lete hain
export const resetPassword = async (token, newPassword) => {
  const response = await api.post(`/auth/reset-password/${token}`, { newPassword });
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};
// Apna saara data JSON file ki shakal mein download karo
export const exportMyData = async () => {
  const response = await api.get('/auth/export');
  const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'my-fitness-data.json';
  link.click();
  URL.revokeObjectURL(url);
};

export const logout = () => {
  localStorage.removeItem('user');
};

export const updateProfile = async (profileData) => {
  const response = await api.put('/auth/profile', profileData);
  if (response.data) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const updatedUser = { ...currentUser, ...response.data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/auth/password', { currentPassword, newPassword });
  return response.data;
};

export const deleteAccount = async (password) => {
  // axios mein DELETE ke saath body "data" key mein jaati hai
  const response = await api.delete('/auth/account', { data: { password } });
  localStorage.removeItem('user');
  return response.data;
};