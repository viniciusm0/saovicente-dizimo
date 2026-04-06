import React, { useState, useEffect } from 'react';
import { Search, Plus, DollarSign, FileText, Pencil, Trash2, History, Archive, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
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

  // Filtro
  const [exibirDesativados, setExibirDesativados] = useState(false);

  // Estados dos Modais Principais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalDoacaoAberto, setModalDoacaoAberto] = useState(false);
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);
  const [dizimistaSelecionado, setDizimistaSelecionado] = useState(null);

  // Estados para Edição e Histórico
  const [modalEditarDizimistaAberto, setModalEditarDizimistaAberto] = useState(false);
  const [formEditarDizimista, setFormEditarDizimista] = useState({ numero_carteira: '', nome: '' });
  
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [historicoDoacoes, setHistoricoDoacoes] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const [modalEditarDoacaoAberto, setModalEditarDoacaoAberto] = useState(false);
  const [doacaoSelecionada, setDoacaoSelecionada] = useState(null);
  const [formEditarDoacao, setFormEditarDoacao] = useState({ valor: '', data_hora: '' });

  // Estados dos Forms Auxiliares
  const [formNovo, setFormNovo] = useState({ numero_carteira: '', nome: '' });
  const [loadingForm, setLoadingForm] = useState(false);
  const [formDoacao, setFormDoacao] = useState({ valor: '' });
  const [formRelatorio, setFormRelatorio] = useState({ mes: '', ano: '' });

  useEffect(() => {
    buscarDizimistas();
  }, [exibirDesativados]);

  const showMensagem = (tipo, texto) => {
    setMensagem({ tipo, texto });
    setTimeout(() => setMensagem(null), 3000);
  };

  const getStatusQuery = () => exibirDesativados ? 'status=inativo' : 'status=ativo';

  const buscarDizimistas = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dizimistas/buscar?${getStatusQuery()}`);
      setDizimistas(res.data || []);
    } catch (err) {
      console.error('Erro ao buscar dizimistas', err);
      if (err.response?.status !== 401) {
         showMensagem('erro', 'Não foi possível carregar a lista do servidor.');
         setDizimistas([]);
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
      const res = await api.get(`/dizimistas/buscar?q=${busca}&${getStatusQuery()}`);
      setDizimistas(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD DIZIMISTAS ---
  const handleCadastrarDizimista = async (e) => {
    e.preventDefault();
    if (!formNovo.numero_carteira || !formNovo.nome || loadingForm) return;

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

  const abrirModalEditarDizimista = (diz) => {
    setDizimistaSelecionado(diz);
    setFormEditarDizimista({ numero_carteira: diz.numero_carteira, nome: diz.nome });
    setModalEditarDizimistaAberto(true);
  };

  const handleEditarDizimista = async (e) => {
    e.preventDefault();
    if (loadingForm) return;
    try {
      setLoadingForm(true);
      await api.put(`/dizimistas/editar/${dizimistaSelecionado.id}`, {
        numero_carteira: parseInt(formEditarDizimista.numero_carteira),
        nome: formEditarDizimista.nome
      });
      showMensagem('sucesso', 'Dizimista atualizado com sucesso!');
      setModalEditarDizimistaAberto(false);
      buscarDizimistas();
    } catch (err) {
      showMensagem('erro', err.response?.data?.erro || 'Erro ao atualizar.');
    } finally {
      setLoadingForm(false);
    }
  };

  const alternarDesativacaoDizimista = async (diz) => {
    try {
      const isDesativado = exibirDesativados;
      const acao = isDesativado ? 'restaurar' : 'desativar';
      if(!window.confirm(`Tem certeza que deseja ${acao} o dizimista ${diz.nome}?`)) return;
      
      await api.put(`/dizimistas/${acao}/${diz.id}`);
      showMensagem('sucesso', `Dizimista ${acao}do com sucesso!`);
      buscarDizimistas();
    } catch (err) {
      showMensagem('erro', err.response?.data?.erro || 'Erro na operação.');
    }
  };


  // --- CRUD DOAÇÕES ---
  const abrirModalDoacao = (dizimista) => {
    setDizimistaSelecionado(dizimista);
    setFormDoacao({ valor: '' });
    setModalDoacaoAberto(true);
  };

  const handleRegistrarDoacao = async (e) => {
    e.preventDefault();
    if (!formDoacao.valor || loadingForm) return;

    try {
      setLoadingForm(true);
      const valorNumerico = parseFloat(String(formDoacao.valor).replace(',', '.'));
      await api.post('/doacoes/adicionar', {
        dizimista_id: dizimistaSelecionado.id,
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

  const abrirModalHistorico = async (diz) => {
    setDizimistaSelecionado(diz);
    setModalHistoricoAberto(true);
    await carregarHistorico(diz.id);
  };

  const carregarHistorico = async (dizId) => {
    try {
      setLoadingHistorico(true);
      const res = await api.get(`/dizimistas/${dizId}/doacoes`);
      setHistoricoDoacoes(res.data || []);
    } catch (err) {
      showMensagem('erro', 'Erro ao carregar histórico.');
    } finally {
      setLoadingHistorico(false);
    }
  };

  const renderizarDataHora = (dataHoraOriginal) => {
    if (!dataHoraOriginal) return '';
    return new Date(dataHoraOriginal).toLocaleString('pt-BR');
  };

  const abrirModalEditarDoacao = (doacao) => {
    setDoacaoSelecionada(doacao);
    
    // Preparar dt formatada para datetime-local
    let dtLocal = '';
    if(doacao.data_hora) {
       const dt = new Date(doacao.data_hora);
       // Remove the "Z" and milliseconds to fit the input format easily without timezone issues
       dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
       dtLocal = dt.toISOString().slice(0, 16);
    }

    setFormEditarDoacao({ 
      valor: doacao.valor, 
      data_hora: dtLocal
    });
    setModalEditarDoacaoAberto(true);
  };

  const handleEditarDoacao = async (e) => {
    e.preventDefault();
    if (loadingForm) return;
    try {
      setLoadingForm(true);
      const valorNumerico = parseFloat(String(formEditarDoacao.valor).replace(',', '.'));
      
      let dataHoraIso = undefined;
      if (formEditarDoacao.data_hora) {
          dataHoraIso = new Date(formEditarDoacao.data_hora).toISOString();
      }

      await api.put(`/doacoes/editar/${doacaoSelecionada.id}`, {
        valor: valorNumerico,
        data_hora: dataHoraIso
      });
      showMensagem('sucesso', 'Doação atualizada com sucesso!');
      setModalEditarDoacaoAberto(false);
      carregarHistorico(dizimistaSelecionado.id);
    } catch (err) {
      showMensagem('erro', 'Erro ao editar doação.');
    } finally {
      setLoadingForm(false);
    }
  };

  const handleDeletarDoacao = async (id) => {
    if(!window.confirm('Tem certeza que deseja deletar este registro de doação?')) return;
    try {
      await api.delete(`/doacoes/deletar/${id}`);
      showMensagem('sucesso', 'Doação deletada com sucesso!');
      carregarHistorico(dizimistaSelecionado.id);
    } catch (err) {
      showMensagem('erro', 'Erro ao deletar doação.');
    }
  };

  // --- RELATÓRIO ---
  const handleBaixarRelatorio = async (e) => {
    e.preventDefault();
    if (!formRelatorio.mes || !formRelatorio.ano || loadingForm) return;

    try {
      setLoadingForm(true);
      const response = await api.get(`/doacoes/relatorio?mes=${formRelatorio.mes}&ano=${formRelatorio.ano}`, {
        responseType: 'blob',
      });
      
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
          <p className="text-muted">Busque, cadastre e gerencie as doações.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          
          <Button variant="secondary" onClick={() => setExibirDesativados(!exibirDesativados)}>
            {exibirDesativados ? <ToggleRight size={18} style={{ marginRight: '0.5rem' }} /> : <ToggleLeft size={18} style={{ marginRight: '0.5rem', color: 'var(--color-text-muted)' }}/>}
            {exibirDesativados ? 'Ocultar Desativados' : 'Ver Desativados'}
          </Button>

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
          <div className="empty-state">{exibirDesativados ? 'Nenhum dizimista desativado encontrado.' : 'Nenhum dizimista encontrado.'}</div>
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
                    {!exibirDesativados ? (
                      <>
                        <Button variant="secondary" onClick={() => abrirModalDoacao(diz)} title="Registrar Dízimo">
                          <DollarSign size={16} /> <span className="hide-mobile" style={{marginLeft: '4px'}}>Dízimo</span>
                        </Button>
                        <Button variant="secondary" onClick={() => abrirModalHistorico(diz)} title="Histórico">
                          <History size={16} />
                        </Button>
                        <Button variant="secondary" onClick={() => abrirModalEditarDizimista(diz)} title="Editar Dizimista">
                          <Pencil size={16} />
                        </Button>
                        <Button variant="secondary" onClick={() => alternarDesativacaoDizimista(diz)} title="Desativar">
                          <Archive size={16} color="var(--color-error)" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="secondary" onClick={() => alternarDesativacaoDizimista(diz)} title="Restaurar Dizimista">
                        <RefreshCw size={16} /> Restaurar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODAIS DE DIZIMISTAS --- */}

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

      <Modal 
        isOpen={modalEditarDizimistaAberto} 
        onClose={() => setModalEditarDizimistaAberto(false)} 
        title="Editar Dizimista"
      >
        <form onSubmit={handleEditarDizimista}>
          <Input 
            label="Número da Carteira" 
            type="number" 
            required 
            value={formEditarDizimista.numero_carteira}
            onChange={(e) => setFormEditarDizimista({...formEditarDizimista, numero_carteira: e.target.value})}
          />
          <Input 
            label="Nome Completo" 
            type="text" 
            required
            value={formEditarDizimista.nome}
            onChange={(e) => setFormEditarDizimista({...formEditarDizimista, nome: e.target.value})}
          />
          <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
             <Button type="button" variant="secondary" onClick={() => setModalEditarDizimistaAberto(false)}>Cancelar</Button>
             <Button type="submit" loading={loadingForm}>Atualizar Dizimista</Button>
          </div>
        </form>
      </Modal>


      {/* --- MODAIS DE DOAÇÃO --- */}

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
              placeholder="Ex: 50.00"
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

      <Modal 
        isOpen={modalEditarDoacaoAberto} 
        onClose={() => setModalEditarDoacaoAberto(false)} 
        title="Editar Doação"
      >
        <form onSubmit={handleEditarDoacao}>
          <Input 
            label="Valor Depositado (R$)" 
            type="number" 
            step="0.01"
            min="0.10"
            required 
            value={formEditarDoacao.valor}
            onChange={(e) => setFormEditarDoacao({...formEditarDoacao, valor: e.target.value})}
          />
          <Input 
            label="Data e Hora (Opcional)" 
            type="datetime-local" 
            value={formEditarDoacao.data_hora}
            onChange={(e) => setFormEditarDoacao({...formEditarDoacao, data_hora: e.target.value})}
          />
          <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Button type="button" variant="secondary" onClick={() => setModalEditarDoacaoAberto(false)}>Cancelar</Button>
            <Button type="submit" loading={loadingForm}>Atualizar Doação</Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={modalHistoricoAberto} 
        onClose={() => setModalHistoricoAberto(false)} 
        title="Histórico de Doações"
      >
        {dizimistaSelecionado && (
          <div>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)' }}>
              <strong>Dizimista: {dizimistaSelecionado.numero_carteira} - {dizimistaSelecionado.nome}</strong>
            </div>
            
            {loadingHistorico ? (
              <div className="loading-state" style={{padding: '1rem'}}>Carregando...</div>
            ) : historicoDoacoes.length === 0 ? (
              <div className="empty-state" style={{padding: '1rem'}}>Nenhuma doação registrada.</div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Valor (R$)</th>
                      <th className="text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicoDoacoes.map(doacao => (
                      <tr key={doacao.id}>
                        <td>{renderizarDataHora(doacao.data_hora)}</td>
                        <td>{parseFloat(doacao.valor).toFixed(2).replace('.', ',')}</td>
                        <td className="text-right actions-cell">
                          <Button variant="secondary" onClick={() => abrirModalEditarDoacao(doacao)} title="Editar" style={{padding: '0.25rem 0.5rem'}}>
                            <Pencil size={14} />
                          </Button>
                          <Button variant="secondary" onClick={() => handleDeletarDoacao(doacao.id)} title="Remover" style={{padding: '0.25rem 0.5rem'}}>
                            <Trash2 size={14} color="var(--color-error)" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="button" onClick={() => setModalHistoricoAberto(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>


      {/* --- RELATÓRIO --- */}
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
