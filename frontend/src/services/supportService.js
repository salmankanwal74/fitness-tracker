import api from './api';

// ---------- User ----------
export const submitSupport = async (data) => {
  const response = await api.post('/support', data);
  return response.data;
};

export const getMySupportTickets = async () => {
  const response = await api.get('/support');
  return response.data;
};

export const replyToTicket = async (id, message) => {
  const response = await api.post(`/support/${id}/reply`, { message });
  return response.data;
};

// ---------- Admin ----------
// params = { status, category, search, page }
export const adminListTickets = async (params) => {
  const response = await api.get('/support/admin/all', { params });
  return response.data;
};

export const adminReplyToTicket = async (id, message, resolve = false) => {
  const response = await api.post(`/support/admin/${id}/reply`, { message, resolve });
  return response.data;
};

export const adminSetTicketStatus = async (id, status) => {
  const response = await api.patch(`/support/admin/${id}/status`, { status });
  return response.data;
};