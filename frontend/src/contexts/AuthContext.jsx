import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se já tem o token salvo
    const loadStorageData = () => {
      const storageUser = localStorage.getItem('@Dizimos:user');
      const storageToken = localStorage.getItem('@Dizimos:token');

      if (storageUser && storageToken) {
        // Se o token for inválido o back vai retornar 401 e o interceptor tira os dados (se configurado)
        api.defaults.headers.common['Authorization'] = `Bearer ${storageToken}`;
        setUser(JSON.parse(storageUser));
      }
      setLoading(false);
    };

    loadStorageData();
  }, []);

  const login = async (email, senha, recaptchaToken) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        senha,
        recaptcha_token: recaptchaToken
      });

      const { token, usuario } = response.data;

      // Salva no localStorage
      localStorage.setItem('@Dizimos:user', JSON.stringify(usuario));
      localStorage.setItem('@Dizimos:token', token);

      // Define o token no cabeçalho padrao do Axios
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(usuario);
      return { success: true };
    } catch (error) {
      console.error('Erro de login:', error);
      return {
        success: false,
        message: error.response?.data?.erro || 'Erro inesperado ao realizar login.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('@Dizimos:user');
    localStorage.removeItem('@Dizimos:token');
    api.defaults.headers.common['Authorization'] = undefined;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
