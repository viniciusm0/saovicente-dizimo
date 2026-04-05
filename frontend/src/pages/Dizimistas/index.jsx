import React, { useState, useEffect } from 'react';
import { Search, Plus, DollarSign, FileText } from 'lucide-react';
import api from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import './Dizimistas.css';

const Dizimistas = () => {
  const [dizimistas, setDizimistas] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null); // { tipo: 'sucesso' | 'erro', texto: '' }

  // Estados dos Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalDoacaoAberto, setModalDoacaoAberto] = useState(false);
  const [dizimistaSelecionado, setDizimistaSelecionado] = useState(null);

  // Estados do Form Novo Dizimista
  const [formNovo, setFormNovo] = useState({ numero_carteira: '', nome: '' });
  const [loadingForm, setLoadingForm] = useState(false);

  // Estados do Form Dízimo
  const [formDoacao, setFormDoacao] = useState({ valor: '' });

  // Estados Relatório
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);
  const [formRelatorio, setFormRelatorio] = useState({ mes: '', ano: '' });

  useEffect(() => {
    buscarDizimistas();
  }, []);

  const showMensagem = (tipo, texto) => {
    setMensagem({ tipo, texto });
    setTimeout(() => setMensagem(null), 3000);
  };

  const buscarDizimistas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dizimistas');
      setDizimistas(res.data.dizimistas || []);
    } catch (err) {
      console.error('Erro ao buscar dizimistas', err);
      // Fallback para dev visual se a rota falhar
      if (err.response?.status !== 401) {
         setDizimistas([{ id: 1, numero_carteira: 101, nome: 'João da Silva', status: 'Ativo' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBusca = async (e) => {
    e.preventDefault();
    if (!busca) {
      buscarDizimistas();
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/dizimistas/buscar?q=${busca}`);
      setDizimistas(res.data.resultados || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCadastrarDizimista = async (e) => {
    e.preventDefault();
    if (!formNovo.numero_carteira || !formNovo.nome) return;

    try {
      setLoadingForm(true);
      await api.post('/dizimistas/cadastrar', {
        numero_carteira: parseInt(formNovo.numero_carteira),
        nome: formNovo.nome
      });
      showMensagem('sucesso', 'Dizimista cadastrado com sucesso!');
      setModalNovoAberto(false);
      setFormNovo({ numero_carteira: '', nome: '' });
      buscarDizimistas();
    } catch (err) {
      showMensagem('erro', err.response?.data?.erro || 'Erro ao cadastrar.');
    } finally {
      setLoadingForm(false);
    }
  };

  const abrirModalDoacao = (dizimista) => {
    setDizimistaSelecionado(dizimista);
    setFormDoacao({ valor: '' });
    setModalDoacaoAberto(true);
  };

  const handleRegistrarDoacao = async (e) => {
    e.preventDefault();
    if (!formDoacao.valor) return;

    try {
      setLoadingForm(true);
      const valorNumerico = parseFloat(formDoacao.valor.replace(',', '.'));
      await api.post('/doacoes/adicionar', {
        id_dizimista: dizimistaSelecionado.id,
        valor: valorNumerico,
        data_hora: new Date().toISOString()
      });
      showMensagem('sucesso', 'Doação registrada com sucesso!');
      setModalDoacaoAberto(false);
    } catch (err) {
      showMensagem('erro', err.response?.data?.erro || 'Erro ao registrar doação.');
    } finally {
      setLoadingForm(false);
    }
  };

  const handleBaixarRelatorio = async (e) => {
    e.preventDefault();
    if (!formRelatorio.mes || !formRelatorio.ano) return;

    try {
      setLoadingForm(true);
      const response = await api.get(`/doacoes/relatorio?mes=${formRelatorio.mes}&ano=${formRelatorio.ano}`, {
        responseType: 'blob', // Importante para receber o PDF
      });
      
      // Criar link para download automático
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_dizimos_${formRelatorio.mes}_${formRelatorio.ano}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      showMensagem('sucesso', 'Relatório gerado com sucesso!');
      setModalRelatorioAberto(false);
    } catch (err) {
      showMensagem('erro', 'Erro ao gerar o relatório. Tente novamente.');
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <div className="dizimistas-container">
      <div className="page-header flex-between">
        <div>
          <h2>Gestão de Dizimistas</h2>
          <p className="text-muted">Busque, cadastre e registre as doações.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => {
            const hoje = new Date();
            setFormRelatorio({ mes: String(hoje.getMonth() + 1).padStart(2, '0'), ano: String(hoje.getFullYear()) });
            setModalRelatorioAberto(true);
          }}>
            <FileText size={18} style={{ marginRight: '0.5rem' }} /> Relatório Mensal
          </Button>
          <Button onClick={() => setModalNovoAberto(true)}>
            <Plus size={18} style={{ marginRight: '0.5rem' }} /> Novo Dizimista
          </Button>
        </div>
      </div>

      {mensagem && (
        <div className={`alert alert-${mensagem.tipo}`}>
          {mensagem.texto}
        </div>
      )}

      <div className="card toolbar">
        <form className="search-bar" onSubmit={handleBusca}>
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por carteira ou nome..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="search-input"
            />
          </div>
          <Button type="submit" variant="secondary">Buscar</Button>
        </form>
      </div>

      <div className="card table-container">
        {loading ? (
          <div className="loading-state">Carregando lista...</div>
        ) : dizimistas.length === 0 ? (
          <div className="empty-state">Nenhum dizimista encontrado.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Carteira</th>
                <th>Nome</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {dizimistas.map(diz => (
                <tr key={diz.id}>
                  <td><strong>{diz.numero_carteira}</strong></td>
                  <td>{diz.nome}</td>
                  <td className="text-right actions-cell">
                    <Button 
                      variant="secondary" 
                      onClick={() => abrirModalDoacao(diz)}
                      title="Registrar Doação"
                    >
                      <DollarSign size={16} /> <span className="hide-mobile" style={{marginLeft: '4px'}}>Dízimo</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Cadastro de Dizimista */}
      <Modal 
        isOpen={modalNovoAberto} 
        onClose={() => setModalNovoAberto(false)} 
        title="Novo Dizimista"
      >
        <form onSubmit={handleCadastrarDizimista}>
          <Input 
            label="Número da Carteira" 
            type="number" 
            required 
            value={formNovo.numero_carteira}
            onChange={(e) => setFormNovo({...formNovo, numero_carteira: e.target.value})}
          />
          <Input 
            label="Nome Completo" 
            type="text" 
            required
            value={formNovo.nome}
            onChange={(e) => setFormNovo({...formNovo, nome: e.target.value})}
          />
          <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
             <Button type="button" variant="secondary" onClick={() => setModalNovoAberto(false)}>Cancelar</Button>
             <Button type="submit" loading={loadingForm}>Salvar Dizimista</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Nova Doação */}
      <Modal 
        isOpen={modalDoacaoAberto} 
        onClose={() => setModalDoacaoAberto(false)} 
        title="Registrar Dízimo"
      >
        {dizimistaSelecionado && (
          <form onSubmit={handleRegistrarDoacao}>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)' }}>
              <strong>Dizimista: {dizimistaSelecionado.numero_carteira} - {dizimistaSelecionado.nome}</strong>
            </div>
            <Input 
              label="Valor Depositado (R$)" 
              type="number" 
              step="0.01"
              min="0.10"
              required 
              placeholder="Ex: 50,00"
              value={formDoacao.valor}
              onChange={(e) => setFormDoacao({...formDoacao, valor: e.target.value})}
            />
            <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <Button type="button" variant="secondary" onClick={() => setModalDoacaoAberto(false)}>Cancelar</Button>
              <Button type="submit" loading={loadingForm}>Confirmar Valor</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Relatório PDF */}
      <Modal 
        isOpen={modalRelatorioAberto} 
        onClose={() => setModalRelatorioAberto(false)} 
        title="Gerar Relatório Mensal"
      >
        <form onSubmit={handleBaixarRelatorio}>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>
            Selecione o mês e o ano para gerar o relatório em PDF com todas as contribuições registradas.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <Input 
                label="Mês" 
                type="number" 
                min="1" max="12"
                required 
                placeholder="Ex: 04"
                value={formRelatorio.mes}
                onChange={(e) => setFormRelatorio({...formRelatorio, mes: e.target.value.padStart(2, '0')})}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Input 
                label="Ano" 
                type="number"
                min="2020" max="2100" 
                required 
                placeholder="Ex: 2026"
                value={formRelatorio.ano}
                onChange={(e) => setFormRelatorio({...formRelatorio, ano: e.target.value})}
              />
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Button type="button" variant="secondary" onClick={() => setModalRelatorioAberto(false)}>Cancelar</Button>
            <Button type="submit" loading={loadingForm}>Baixar Relatório</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dizimistas;
