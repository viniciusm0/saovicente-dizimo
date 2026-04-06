import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api' 
});

// Interceptor para tratamento de erros genéricos e token expirado
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Se for erro 401 (Não Autorizado), limpamos o storage para forçar o login
      // Apenas fazemos isso se não for a própria rota de login que retornou 401
      if (!error.config.url.endsWith('/login')) {
        localStorage.removeItem('@Dizimos:user');
        localStorage.removeItem('@Dizimos:token');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
