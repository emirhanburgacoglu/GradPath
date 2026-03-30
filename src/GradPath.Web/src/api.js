import axios from 'axios';

const API_URL = 'http://localhost:5250/api/v1'; // Backend adresini kontrol et (Swagger'daki URL)

const api = axios.create({
    baseURL: API_URL,
});

// Her istekte token'ı otomatik ekle
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
