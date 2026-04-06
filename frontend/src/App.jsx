import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';
import './index.css';

function App() {
  // Usando a chave Enterprise do .env
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  return (
    <GoogleReCaptchaProvider 
      reCaptchaKey={recaptchaKey}
    >
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </GoogleReCaptchaProvider>
  );
}

export default App;
