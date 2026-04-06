from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.supabase_client import supabase
from datetime import datetime
import calendar

estatisticas_bp = Blueprint("estatisticas_bp", __name__)


@estatisticas_bp.route("/", methods=["GET"])
@jwt_required()
def get_estatisticas():
    try:
        agora = datetime.now()
        ano = agora.year
        mes = agora.month
        _, ultimo_dia = calendar.monthrange(ano, mes)

        data_inicio = f"{ano}-{str(mes).zfill(2)}-01T00:00:00"
        data_fim = f"{ano}-{str(mes).zfill(2)}-{ultimo_dia}T23:59:59"

        # 1. Total de Dizimistas Ativos
        resp_ativos = (
            supabase.table("dizimistas")
            .select("id", count="exact")
            .eq("ativo", True)
            .execute()
        )
        total_dizimistas = resp_ativos.count if resp_ativos.count is not None else 0

        # 2. Total Arrecadado e Contribuintes no Mês
        resp_doacoes = (
            supabase.table("doacoes")
            .select("valor, dizimista_id")
            .gte("data_hora", data_inicio)
            .lte("data_hora", data_fim)
            .execute()
        )

        total_arrecadado = 0
        dizimistas_unicos = set()

        for d in resp_doacoes.data:
            total_arrecadado += float(d.get("valor", 0))
            if d.get("dizimista_id"):
                dizimistas_unicos.add(d.get("dizimista_id"))

        contribuintes_no_mes = len(dizimistas_unicos)

        return (
            jsonify(
                {
                    "totalArrecadado": total_arrecadado,
                    "totalDizimistas": total_dizimistas,
                    "contribuintesNoMes": contribuintes_no_mes,
                }
            ),
            200,
        )

    except Exception as e:
        return (
            jsonify({"erro": "Erro ao carregar estatísticas", "detalhe": str(e)}),
            500,
        )
