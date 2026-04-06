from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required
from app.schemas.dizimista_schemas import AdicionarDoacaoSchema, EditarDoacaoSchema
from app.models.supabase_client import supabase
from app.services.pdf_service import gerar_pdf_doacoes
from pydantic import ValidationError
from datetime import datetime

doacoes_bp = Blueprint("doacoes_bp", __name__)


@doacoes_bp.route("/adicionar", methods=["POST"])
@jwt_required()
def adicionar_doacao():
    try:
        dados = request.get_json()
        if not dados:
            return jsonify({"erro": "Nenhum dado enviado"}), 400

        AdicionarDoacaoSchema(**dados)

        # Validar se o dizimista existe
        dizimista_id = dados.get("dizimista_id")
        resp_dizimista = (
            supabase.table("dizimistas").select("id").eq("id", dizimista_id).execute()
        )

        if len(resp_dizimista.data) == 0:
            return jsonify({"erro": "Dizimista não encontrado"}), 404

        data_hora = dados.get("data_hora")
        if not data_hora:
            data_hora = datetime.now().isoformat()

        nova_doacao = {
            "dizimista_id": dizimista_id,
            "valor": dados.get("valor"),
            "data_hora": data_hora,
        }

        resposta = supabase.table("doacoes").insert(nova_doacao).execute()
        return (
            jsonify(
                {
                    "mensagem": "Doação registrada com sucesso!",
                    "doacao": resposta.data[0],
                }
            ),
            201,
        )

    except ValidationError as e:
        return jsonify({"erro": "Dados inválidos", "detalhes": e.errors()}), 400
    except Exception as e:
        return jsonify({"erro": "Erro interno no servidor", "detalhe": str(e)}), 500

@doacoes_bp.route('/relatorio', methods=['GET'])
@jwt_required()
def relatorio_mensal():
    try:
        mes = request.args.get('mes')
        ano = request.args.get('ano')
        
        if not mes or not ano:
            return jsonify({"erro": "Os parâmetros 'mes' e 'ano' são obrigatórios (ex: ?mes=04&ano=2026)."}), 400
            
        # Converter para filtro de data no Supabase (início do mês até o fim do mês)
        # Ex: "2026-04-01" até "2026-04-30 23:59:59"
        # Simplificação: buscar usando o gte e lte
        import calendar
        _, ultimo_dia = calendar.monthrange(int(ano), int(mes))
        
        data_inicio = f"{ano}-{mes.zfill(2)}-01T00:00:00"
        data_fim = f"{ano}-{mes.zfill(2)}-{ultimo_dia}T23:59:59"
        
        # Buscar doações do mês.
        # Precisamos de um JOIN manual com dizimistas já que supabase-py as vezes não simplifica.
        # Supabase nativamente suporta JOIN: .select("*, dizimistas(numero_carteira, nome)")
        resposta = supabase.table('doacoes').select("valor, data_hora, dizimistas(numero_carteira, nome)").gte('data_hora', data_inicio).lte('data_hora', data_fim).execute()
        
        # Formatar pro Pydantic/Service
        # Precisamos ordenar alfabeticamente pela propriedade "nome" dentro dicionario relacional
        doacoes_raw = resposta.data
        doacoes_formatadas = []
        for d in doacoes_raw:
            doacoes_formatadas.append({
                "numero_carteira": d.get("dizimistas", {}).get("numero_carteira"),
                "nome_dizimista": d.get("dizimistas", {}).get("nome"),
                "valor": d.get("valor"),
                "data_hora": d.get("data_hora")
            })
            
        # Ordenação Alfabética
        doacoes_formatadas.sort(key=lambda x: x.get('nome_dizimista', '').lower())
        
        # Gerar o PDF na memóra
        pdf_binario = gerar_pdf_doacoes(doacoes_formatadas, str(mes).zfill(2), str(ano))
        
        # Enviar de volta
        response = make_response(pdf_binario)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=relatorio_dizimos_{mes}_{ano}.pdf'
        
        return response
        
    except Exception as e:
        return jsonify({"erro": "Erro ao gerar PDF", "detalhe": str(e)}), 500

@doacoes_bp.route('/editar/<id>', methods=['PUT'])
@jwt_required()
def editar_doacao(id):
    try:
        dados = request.get_json()
        if not dados:
            return jsonify({"erro": "Nenhum dado enviado"}), 400
            
        EditarDoacaoSchema(**dados)
        
        atualizacao = {}
        if 'valor' in dados:
            atualizacao['valor'] = dados['valor']
        if 'data_hora' in dados:
            atualizacao['data_hora'] = dados['data_hora']
            
        if not atualizacao:
            return jsonify({"erro": "Nenhum dado válido para atualizar"}), 400
            
        resposta = supabase.table('doacoes').update(atualizacao).eq('id', id).execute()
        if len(resposta.data) == 0:
            return jsonify({"erro": "Doação não encontrada"}), 404
            
        return jsonify({"mensagem": "Doação atualizada com sucesso!", "doacao": resposta.data[0]}), 200

    except ValidationError as e:
        return jsonify({"erro": "Dados inválidos", "detalhes": e.errors()}), 400
    except Exception as e:
        return jsonify({"erro": "Erro interno no servidor", "detalhe": str(e)}), 500

@doacoes_bp.route('/deletar/<id>', methods=['DELETE'])
@jwt_required()
def deletar_doacao(id):
    try:
        resposta = supabase.table('doacoes').delete().eq('id', id).execute()
        if len(resposta.data) == 0:
            return jsonify({"erro": "Doação não encontrada"}), 404
        return jsonify({"mensagem": "Doação deletada com sucesso!"}), 200
    except Exception as e:
        return jsonify({"erro": "Erro interno no servidor", "detalhe": str(e)}), 500
