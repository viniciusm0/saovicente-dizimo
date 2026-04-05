import os
import requests
from dotenv import load_dotenv

load_dotenv()
BASE_URL = "http://127.0.0.1:5000/api"

print("1. Testando Ping...")
r = requests.get(f"{BASE_URL}/ping")
print(r.status_code, r.json())

print("2. Criando Primeiro Usuário (inserção direta no banco para teste inicial)...")
# Inserimos via Supabase client ignorando a rota protegida
from app.models.supabase_client import supabase
from app.utils.security import hash_senha

try:
    novo_admin = {
        "nome": "Admin Teste",
        "email": "admin@teste.com",
        "senha_hash": hash_senha("senha12345")
    }
    # ignore se já existir
    supabase.table('usuarios').insert(novo_admin).execute()
except Exception as e:
    pass # Ja deve existir

print("\n3. Testando Login...")
payload_login = {
    "email": "admin@teste.com",
    "senha": "senha12345"
}
r = requests.post(f"{BASE_URL}/auth/login", json=payload_login)
print(r.status_code, r.json())

if r.status_code == 200:
    token = r.json()['token']
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n4. Testando Criação de Novo Usuário Pela Rota Protegida...")
    payload_novo = {
        "nome": "Usuario Dois",
        "email": "usuario2@teste.com",
        "senha": "senhasecreta99"
    }
    r2 = requests.post(f"{BASE_URL}/auth/criar", json=payload_novo, headers=headers)
    print(r2.status_code, r2.json())
    
    print("\n5. Testando Cadastro de Dizimista...")
    dizimista = {
        "numero_carteira": 100,
        "nome": "Dizimista Teste Final"
    }
    r3 = requests.post(f"{BASE_URL}/dizimistas/cadastrar", json=dizimista, headers=headers)
    print(r3.status_code, r3.json())
    
    if r3.status_code == 201:
        diz_id = r3.json()['dizimista']['id']
        
        print("\n6. Testando Adicionar Doação...")
        doacao = {
            "dizimista_id": diz_id,
            "valor": 150.50
        }
        r4 = requests.post(f"{BASE_URL}/doacoes/adicionar", json=doacao, headers=headers)
        print(r4.status_code, r4.json())
        
    print("\n7. Testando Busca de Dizimista...")
    r5 = requests.get(f"{BASE_URL}/dizimistas/buscar?q=Dizimista", headers=headers)
    print(r5.status_code, len(r5.json()), "encontrados.")
    print(r5.json())

else:
    print("Falha no login, interrompendo testes dependentes.")
