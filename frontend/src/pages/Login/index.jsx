import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login, signed } = useAuth();
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Se já estiver logado, redireciona para a dashboard
  useEffect(() => {
    if (signed) {
      navigate('/dashboard');
    }
  }, [signed, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoadingLocal(true);

    if (!email || !senha) {
      setErrorMsg('Preencha os campos de e-mail e senha.');
      setLoadingLocal(false);
      return;
    }

    if (!executeRecaptcha) {
      setErrorMsg('ReCAPTCHA não foi carregado corretamente.');
      setLoadingLocal(false);
      return;
    }

    try {
      // Obter o token do ReCAPTCHA
      const recaptchaToken = await executeRecaptcha('login');

      // Chamar a função de login no contexto
      const res = await login(email, senha, recaptchaToken);

      if (res.success) {
        navigate('/dashboard');
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg('Erro inesperado no servidor. Tente novamente.');
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <div className="login-container flex-center">
      <div className="login-card card">
        <div className="login-header">
          <h2>Dízimos São Vicente</h2>
          <p>Faça login para acessar o sistema.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errorMsg && <div className="login-error">{errorMsg}</div>}

          <Input
            label="E-mail"
            id="email"
            type="email"
            placeholder="admin@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loadingLocal}
          />

          <Input
            label="Senha"
            id="senha"
            type="password"
            placeholder="Sua senha segura"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={loadingLocal}
          />

          <Button type="submit" loading={loadingLocal} style={{ width: '100%', marginTop: '1rem' }}>
            Entrar
          </Button>
        </form>
        
        <div className="recaptcha-notice">
          Protegido pelo reCAPTCHA. Sujeito à <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Política de Privacidade</a> e <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">Termos de Serviço</a> do Google.
        </div>
      </div>
    </div>
  );
};

export default Login;
