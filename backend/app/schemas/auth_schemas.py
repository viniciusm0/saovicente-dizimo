from pydantic import BaseModel, EmailStr, Field

class LoginSchema(BaseModel):
    email: EmailStr = Field(..., description="E-mail do usuário")
    senha: str = Field(..., min_length=1, description="Senha do usuário")
    recaptcha_token: str = Field(None, description="Token invisível do reCAPTCHA v3. Temporariamente None em ambiente de testes.")

class CreateUserSchema(BaseModel):
    nome: str = Field(..., min_length=3, max_length=100, description="Nome completo")
    email: EmailStr = Field(..., description="E-mail único")
    senha: str = Field(..., min_length=8, max_length=64, description="Senha forte de no mínimo 8 caracteres")
