from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.schemas.dizimista_schemas import CadastrarDizimistaSchema, AdicionarDoacaoSchema
from app.models.supabase_client import supabase
from pydantic import ValidationError
from datetime import datetime

dizimista_bp = Blueprint('dizimista_bp', __name__)

@dizimista_bp.route('/cadastrar', methods=['POST'])
@jwt_required()
def cadastrar_dizimista():
    try:
        dados = request.get_json()
        if not dados:
            return jsonify({"erro": "Nenhum dado enviado"}), 400
            
        # Pydantic cuidará para que nome seja string sem vazio e carteira int > 0
        CadastrarDizimistaSchema(**dados)
        
        carteira = dados.get('numero_carteira')
        
        # Verificar se a carteira já existe
        resp_check = supabase.table('dizimistas').select('id').eq('numero_carteira', carteira).execute()
        if len(resp_check.data) > 0:
            return jsonify({"erro": "Já existe um dizimista cadastrado com essa carteira"}), 409
            
        novo_dizimista = {
            "numero_carteira": carteira,
            "nome": dados.get('nome').strip()
        }
        
        resposta = supabase.table('dizimistas').insert(novo_dizimista).execute()
        return jsonify({"mensagem": "Dizimista cadastrado com sucesso!", "dizimista": resposta.data[0]}), 201
        
    except ValidationError as e:
        return jsonify({"erro": "Dados inválidos", "detalhes": e.errors()}), 400
    except Exception as e:
        return jsonify({"erro": "Erro interno no servidor", "detalhe": str(e)}), 500


@dizimista_bp.route('/buscar', methods=['GET'])
@jwt_required()
def buscar_dizimistas():
    try:
        query = request.args.get('q', '').strip()
        
        # Se a query for apenas numeros, busca por carteira exata (eq). Se for texto, busca por nome (ilike)
        if query.isdigit():
            resposta = supabase.table('dizimistas').select('*').eq('numero_carteira', int(query)).execute()
        elif query:
            # Busca ignorando case, como uma cláusula LIKE %query% no SQL
            resposta = supabase.table('dizimistas').select('*').ilike('nome', f'%{query}%').execute()
        else:
            # Lista as mais recentes se não houver busca
            resposta = supabase.table('dizimistas').select('*').order('criado_em', desc=True).limit(50).execute()
            
        return jsonify(resposta.data), 200
        
    except Exception as e:
        return jsonify({"erro": "Erro interno no servidor", "detalhe": str(e)}), 500
