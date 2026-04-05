from app import create_app

app = create_app()

if __name__ == '__main__':
    # Em produção, usaremos gunicorn ou servidor WSGI. No desenvolvimento, run nativo.
    app.run(debug=True, port=5000)
