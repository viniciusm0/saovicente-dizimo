from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.schemas.dizimista_schemas import CadastrarDizimistaSchema, EditarDizimistaSchema
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
            
        CadastrarDizimistaSchema(**dados)
        carteira = dados.get('numero_carteira')
        
        resp_check = supabase.table('dizimistas').select('id').eq('numero_carteira', carteira).execute()
        if len(resp_check.data) > 0:
            return jsonify({"erro": "Já existe um dizimista cadastrado com essa carteira"}), 409
            
        novo_dizimista = {
            "numero_carteira": carteira,
            "nome": dados.get('nome').strip(),
            "ativo": True
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
        status = request.args.get('status', 'ativo')
        is_ativo = True if status == 'ativo' else False
        
        base_query = supabase.table('dizimistas').select('*').eq('ativo', is_ativo)
        
        if query.isdigit():
            resposta = base_query.eq('numero_carteira', int(query)).execute()
        elif query:
            resposta = base_query.ilike('nome', f'%{query}%').execute()
        else:
            resposta = base_query.order('criado_em', desc=True).limit(50).execute()
            
        return jsonify(resposta.data), 200
        
    except Exception as e:
        return jsonify({"erro": "Erro interno no servidor", "detalhe": str(e)}), 500

@dizimista_bp.route('/editar/<id>', methods=['PUT'])
@jwt_required()
def editar_dizimista(id):
    try:
        dados = request.get_json()
        if not dados:
            return jsonify({"erro": "Nenhum dado enviado"}), 400
            
        EditarDizimistaSchema(**dados)
        
        # Validar num_carteira duplicado caso tenha sido enviado
        if 'numero_carteira' in dados:
            resp_check = supabase.table('dizimistas').select('id').eq('numero_carteira', dados['numero_carteira']).neq('id', id).execute()
            if len(resp_check.data) > 0:
                return jsonify({"erro": "Já existe outro dizimista com essa carteira"}), 409
                
        atualizacao = {}
        if 'numero_carteira' in dados:
            atualizacao['numero_carteira'] = dados['numero_carteira']
        if 'nome' in dados:
            atualizacao['nome'] = dados['nome'].strip()
            
        if not atualizacao:
            return jsonify({"erro": "Nenhum dado válido para atualizar"}), 400
            
        resposta = supabase.table('dizimistas').update(atualizacao).eq('id', id).execute()
        if len(resposta.data) == 0:
            return jsonify({"erro": "Dizimista não encontrado"}), 404
            
        return jsonify({"mensagem": "Dizimista atualizado com sucesso!", "dizimista": resposta.data[0]}), 200

    except ValidationError as e:
        return jsonify({"erro": "Dados inválidos", "detalhes": e.errors()}), 400
    except Exception as e:
        return jsonify({"erro": "Erro interno no servidor", "detalhe": str(e)}), 500

@dizimista_bp.route('/desativar/<id>', methods=['PUT'])
@jwt_required()
def desativar_dizimista(id):
    try:
        resposta = supabase.table('dizimistas').update({'ativo': False}).eq('id', id).execute()
        if len(resposta.data) == 0:
            return jsonify({"erro": "Dizimista não encontrado"}), 404
        return jsonify({"mensagem": "Dizimista desativado com sucesso!"}), 200
    except Exception as e:
        return jsonify({"erro": "Erro interno no servidor", "detalhe": str(e)}), 500

@dizimista_bp.route('/restaurar/<id>', methods=['PUT'])
@jwt_required()
def restaurar_dizimista(id):
    try:
        resposta = supabase.table('dizimistas').update({'ativo': True}).eq('id', id).execute()
        if len(resposta.data) == 0:
            return jsonify({"erro": "Dizimista não encontrado"}), 404
        return jsonify({"mensagem": "Dizimista restaurado com sucesso!"}), 200
    except Exception as e:
        return jsonify({"erro": "Erro interno no servidor", "detalhe": str(e)}), 500

@dizimista_bp.route('/<id>/doacoes', methods=['GET'])
@jwt_required()
def historico_doacoes(id):
    try:
        resposta = supabase.table('doacoes').select('*').eq('dizimista_id', id).order('data_hora', desc=True).execute()
        return jsonify(resposta.data), 200
    except Exception as e:
        return jsonify({"erro": "Erro interno no servidor", "detalhe": str(e)}), 500
