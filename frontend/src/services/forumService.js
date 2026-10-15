import api from './api';

export const getPosts = async (params) => (await api.get('/forum', { params })).data;
export const createPost = async (data) => (await api.post('/forum', data)).data;
export const getPost = async (id) => (await api.get(`/forum/${id}`)).data;
export const addReply = async (id, body) => (await api.post(`/forum/${id}/replies`, { body })).data;
export const deletePost = async (id) => (await api.delete(`/forum/${id}`)).data;
export const deleteReply = async (id, replyId) => (await api.delete(`/forum/${id}/replies/${replyId}`)).data;