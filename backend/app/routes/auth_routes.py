from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required
from app.schemas.auth_schemas import LoginSchema, CreateUserSchema
from app.utils.security import hash_senha, verificar_senha
from app.models.supabase_client import supabase
from pydantic import ValidationError
from datetime import timedelta

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        dados = request.get_json()
        if not dados:
            return jsonify({"erro": "Nenhum dado enviado"}), 400

        LoginSchema(**dados)  # Valida e levanta ValidationError caso falhe

        email = dados.get("email")
        senha = dados.get("senha")
        recaptcha_token = dados.get("recaptcha_token")

        import os
        import requests

        # Validar reCAPTCHA v3 apenas se a chave estiver configurada no .env (para não quebrar em dev local se vazio)
        recaptcha_secret = os.getenv("RECAPTCHA_SECRET_KEY")
        if recaptcha_secret and recaptcha_token:
            rc_resp = requests.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={"secret": recaptcha_secret, "response": recaptcha_token},
            ).json()

            # success e score >= 0.5 define que é humano confiável
            if not rc_resp.get("success") or rc_resp.get("score", 0) < 0.5:
                return (
                    jsonify(
                        {
                            "erro": "Atividade suspeita detectada (Falha no reCAPTCHA)",
                            "google_response": rc_resp,
                        }
                    ),
                    403,
                )

        # Buscar usuário no Supabase
        if supabase is None:
            return jsonify({"erro": "Banco de dados não configurado"}), 500

        resposta = supabase.table("usuarios").select("*").eq("email", email).execute()
        usuarios = resposta.data

        if len(usuarios) == 0:
            return jsonify({"erro": "Credenciais inválidas"}), 401

        usuario = usuarios[0]

        if not verificar_senha(usuario["senha_hash"], senha):
            return jsonify({"erro": "Credenciais inválidas"}), 401

        # Gera JWT
        access_token = create_access_token(
            identity=usuario["id"], expires_delta=timedelta(hours=8)
        )

        return (
            jsonify(
                {
                    "token": access_token,
                    "usuario": {
                        "id": usuario["id"],
                        "nome": usuario["nome"],
                        "email": usuario["email"],
                    },
                }
            ),
            200,
        )

    except ValidationError as e:
        return jsonify({"erro": "Dados inválidos", "detalhes": e.errors()}), 400
    except Exception as e:
        return jsonify({"erro": "Erro interno no servidor", "detalhe": str(e)}), 500


@auth_bp.route("/criar", methods=["POST"])
@jwt_required()
def criar_usuario():
    try:
        dados = request.get_json()
        if not dados:
            return jsonify({"erro": "Nenhum dado enviado"}), 400

        CreateUserSchema(**dados)

        email = dados.get("email")

        # Verificar se email ja existe
        resp_check = (
            supabase.table("usuarios").select("id").eq("email", email).execute()
        )
        if len(resp_check.data) > 0:
            return jsonify({"erro": "Este e-mail já está em uso"}), 409

        novo_usuario = {
            "nome": dados.get("nome"),
            "email": email,
            "senha_hash": hash_senha(dados.get("senha")),
        }

        resposta = supabase.table("usuarios").insert(novo_usuario).execute()

        return jsonify({"mensagem": "Usuário criado com sucesso!"}), 201

    except ValidationError as e:
        return jsonify({"erro": "Dados inválidos", "detalhes": e.errors()}), 400
    except Exception as e:
        return jsonify({"erro": "Erro interno no servidor", "detalhe": str(e)}), 500
