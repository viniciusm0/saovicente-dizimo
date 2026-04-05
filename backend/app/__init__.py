import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configurar CORS (permitir chamadas do frontend Vite na porta 5173 e 5174)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Configurações do App
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'super-secret-key-mudar-depois')
    
    # Inicializar extensões
    from flask_jwt_extended import JWTManager
    jwt = JWTManager(app)
    
    # Registrar Blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.dizimistas_routes import dizimista_bp
    from app.routes.doacoes_routes import doacoes_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dizimista_bp, url_prefix='/api/dizimistas')
    app.register_blueprint(doacoes_bp, url_prefix='/api/doacoes')

    @app.route('/api/ping', methods=['GET'])
    def ping():
        return {"status": "ok", "message": "Backend Flask do Sistema de Dízimos Rodando!"}
        
    return app
