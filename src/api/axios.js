import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            localStorage.removeItem('user_id');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;
export { API_URL };