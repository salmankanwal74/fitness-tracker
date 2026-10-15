import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Har request ke sath automatically token attach karo (agar user login hai)
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// 1) Workout/weight/nutrition add hone par bell ko refresh karo
// 2) Token expire ya galat ho jaye (401) to automatically logout karke login page par bhej do.
//    Login/signup/reset ke apne 401 errors (galat password wagera) is mein shamil nahi.
api.interceptors.response.use(
  (response) => {
    const method = response.config?.method;
    const url = response.config?.url || '';
    if (method === 'post' && /^\/(workouts|weight|nutrition)/.test(url)) {
      window.dispatchEvent(new Event('notifications:refresh'));
    }
    return response;
  },
  (error) => {
    const url = error.config?.url || '';
    const isAuthForm = /\/auth\/(login|signup|forgot-password|reset-password)/.test(url);
    if (error.response?.status === 401 && !isAuthForm && localStorage.getItem('user')) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;