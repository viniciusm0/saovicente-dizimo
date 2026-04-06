import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env
load_dotenv()


def create_app():
    app = Flask(__name__)

    # Configurar CORS com Origin específica
    frontend_url = os.getenv("FRONTEND_URL")
    if not frontend_url:
        raise ValueError("ERRO DE ARQUITETURA: FRONTEND_URL ausente. Defina a URL do seu frontend no .env (ex: http://localhost:5173 para teste ou a URL da Vercel)")
    CORS(app, resources={r"/api/*": {"origins": frontend_url.split(",")}})

    # Configurações do App (Proteção contra token default)
    jwt_secret = os.getenv("JWT_SECRET")
    env_mode = os.getenv("FLASK_ENV", "development")

    if not jwt_secret and env_mode != "development":
        raise ValueError(
            "ERRO CRÍTICO DE SEGURANÇA: JWT_SECRET não configurado no ambiente de produção!"
        )

    app.config["JWT_SECRET_KEY"] = jwt_secret

    # Inicializar extensões
    from flask_jwt_extended import JWTManager

    jwt = JWTManager(app)

    # Registrar Blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.dizimistas_routes import dizimista_bp
    from app.routes.doacoes_routes import doacoes_bp
    from app.routes.estatisticas_routes import estatisticas_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(dizimista_bp, url_prefix="/api/dizimistas")
    app.register_blueprint(doacoes_bp, url_prefix="/api/doacoes")
    app.register_blueprint(estatisticas_bp, url_prefix="/api/estatisticas")

    @app.route("/api/ping", methods=["GET"])
    def ping():
        return {
            "status": "ok",
            "message": "Backend Flask do Sistema de Dízimos Rodando!",
        }

    return app
