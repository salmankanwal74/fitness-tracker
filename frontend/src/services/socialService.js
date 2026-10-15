import api from './api';

export const searchUsers = async (q, page = 1) => {
  const response = await api.get('/users/search', { params: { q, page } });
  return response.data;
};

export const followUser = async (id) => (await api.post(`/users/${id}/follow`)).data;
export const unfollowUser = async (id) => (await api.delete(`/users/${id}/follow`)).data;
export const getFollowers = async () => (await api.get('/users/me/followers')).data;
export const getFollowing = async () => (await api.get('/users/me/following')).data;
export const getSuggestions = async () => (await api.get('/users/suggestions')).data;