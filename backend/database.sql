-- SQL Mínimo Necessário para Supabase

-- Tabela de Usuários (Admin)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Dizimistas
CREATE TABLE IF NOT EXISTS dizimistas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero_carteira INTEGER UNIQUE NOT NULL,
    nome VARCHAR(150) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Doações
CREATE TABLE IF NOT EXISTS doacoes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dizimista_id UUID REFERENCES dizimistas(id) ON DELETE CASCADE,
    valor NUMERIC(10, 2) NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
