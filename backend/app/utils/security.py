from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Instância do hasher
ph = PasswordHasher()

def hash_senha(senha_texto_plano: str) -> str:
    """Gera um hash utilizando Argon2."""
    return ph.hash(senha_texto_plano)

def verificar_senha(hash_salvo: str, senha_fornecida: str) -> bool:
    """Verifica se a senha em texto plano corresponde ao hash Argon2."""
    try:
        return ph.verify(hash_salvo, senha_fornecida)
    except VerifyMismatchError:
        return False
