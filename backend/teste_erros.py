import requests

BASE_URL = "http://127.0.0.1:5000/api"

print("\n--- Testando Falhas de Validação (O que ocorre quando o Frontend envia dados ruins) ---")

print("\n1. Login com Email inválido:")
r = requests.post(f"{BASE_URL}/auth/login", json={"email": "teste-invalido", "senha": "123"})
print(r.status_code, r.json())

print("\n2. Tentativa de cadastro de Dizimista enviar Texto na Carteira (sem JWT):")
r = requests.post(f"{BASE_URL}/dizimistas/cadastrar", json={"numero_carteira": "letra_a", "nome": "Joao"})
print(r.status_code, r.json())

print("\n3. Fazendo Login Correto para pegar JWT...")
r = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@teste.com", "senha": "senha12345"})
token = r.json()['token']
headers = {"Authorization": f"Bearer {token}"}

print("\n4. Dizimista com nome vazio e carteira < 0:")
r = requests.post(f"{BASE_URL}/dizimistas/cadastrar", json={"numero_carteira": -5, "nome": ""}, headers=headers)
print(r.status_code, r.json())

print("\n5. Doação com valor negativo:")
r = requests.post(f"{BASE_URL}/doacoes/adicionar", json={"dizimista_id": "848da0a9-uuid-invalido", "valor": -10.50}, headers=headers)
print(r.status_code, r.json())
