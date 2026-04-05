import { useState, useEffect } from 'react'
import api from './services/api'
import './index.css'

function App() {
  const [mensagemApi, setMensagemApi] = useState('Carregando conexão com a API...')

  useEffect(() => {
    // Testa a conexão básica com o backend passando pelo proxy do Vite
    api.get('/ping')
      .then(response => {
        setMensagemApi(response.data.message)
      })
      .catch(error => {
        setMensagemApi('Erro ao conectar com a API: ' + error.message)
      })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f0f4f8' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
        <h1 style={{ color: '#2d3748', marginBottom: '1rem' }}>Dízimos São Vicente</h1>
        <p style={{ color: '#4a5568' }}>Status do Backend: <strong>{mensagemApi}</strong></p>
      </div>
    </div>
  )
}

export default App
