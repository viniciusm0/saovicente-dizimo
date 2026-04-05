import axios from 'axios';

// Utilizando o proxy configurado no Vite
const api = axios.create({
  baseURL: '/api'
});

export default api;
