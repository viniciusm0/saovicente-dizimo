from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional

class CadastrarDizimistaSchema(BaseModel):
    numero_carteira: int = Field(..., gt=0, description="Número da carteira do dizimista, deve ser maior que 0")
    nome: str = Field(..., min_length=3, max_length=150, description="Nome completo do dizimista")

class AdicionarDoacaoSchema(BaseModel):
    dizimista_id: str = Field(..., min_length=36, max_length=36, description="UUID do dizimista")
    valor: float = Field(..., gt=0, description="Valor do dízimo, deve ser maior que zero")
    data_hora: Optional[datetime] = Field(None, description="Data e hora da doação (opcional, assume o momento atual se vazio)")

    @field_validator('data_hora', mode='before')
    def parse_datetime(cls, value):
        if not value:
            return None
        # O Pydantic já lida com parses de ISO 8601 nativamente, 
        # mas estamos convertendo string vazia para None.
        return value
