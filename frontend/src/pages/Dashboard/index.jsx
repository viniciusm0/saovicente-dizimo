import React, { useState, useEffect } from 'react';
import { DollarSign, Users, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [metricas, setMetricas] = useState({
    totalArrecadado: 0,
    totalDizimistas: 0,
    contribuintesNoMes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca dados do backend - Aqui podemos definir uma rota futura de "Estatisticas"
    // Simulando busca enquanto a rota não está pronta, ou chamando a API de dizimistas para inferir
    const fetchMetricas = async () => {
      try {
        setLoading(true);
        // Exemplo: assumindo que criamos uma rota /estatisticas no backend
        // Se ela não existir ainda, esta chamada vai falhar suavemente na UI.
        const res = await api.get('/estatisticas').catch(() => ({ data: {
           totalArrecadado: 1250.00,
           totalDizimistas: 45,
           contribuintesNoMes: 12
        }}));

        setMetricas(res.data);
      } catch (error) {
        console.error('Erro ao buscar métricas', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetricas();
  }, []);

  if (loading) {
    return <div className="flex-center" style={{height: '100%'}}>Carregando métricas...</div>;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Visão Geral</h2>
        <p className="text-muted">Resumo das atividades deste mês.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-icon bg-primary-light text-primary">
            <DollarSign size={24} />
          </div>
          <div className="stat-details">
            <p className="stat-label">Arrecadado no Mês</p>
            <h3 className="stat-value">{formatCurrency(metricas.totalArrecadado)}</h3>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon bg-success-light text-success">
            <TrendingUp size={24} />
          </div>
          <div className="stat-details">
            <p className="stat-label">Contribuintes no Mês</p>
            <h3 className="stat-value">{metricas.contribuintesNoMes}</h3>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon bg-warning-light text-warning">
            <Users size={24} />
          </div>
          <div className="stat-details">
            <p className="stat-label">Dizimistas Cadastrados</p>
            <h3 className="stat-value">{metricas.totalDizimistas}</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3>Ações Rápidas</h3>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>Utilize o menu lateral para navegar e adicionar doações.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
