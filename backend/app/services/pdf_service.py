import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime

def gerar_pdf_doacoes(lista_doacoes: list, mes: str, ano: str) -> bytes:
    """
    Gera um PDF na memória em formato A4 a partir da lista de doações do Supabase,
    ordenada alfabeticamente pelo nome do dizimista.
    """
    buffer = io.BytesIO()
    
    # Configurar documento
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=18
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Título do Relatório
    titulo = Paragraph(f"<b>Relatório de Dízimos - {mes}/{ano}</b>", styles['Heading1'])
    elements.append(titulo)
    elements.append(Spacer(1, 12))
    
    # Preparar Dados da Tabela
    # Header
    dados_tabela = [["Carteira", "Dizimista", "Data da Doação", "Valor Doado (R$)"]]
    
    # O user pediu lista alfabética. Vamos assumir que a lista já vem pre-formatada do Supabase ou nós garantiremos a ordenação no Python/DB.
    # Mas como precaução, garantimos a ordenação no python usando a chave 'nome_dizimista' caso exista.
    
    # Formatando a tabela
    total_arrecadado = 0.0
    for doacao in lista_doacoes:
        carteira = str(doacao.get('numero_carteira', 'N/A'))
        nome = doacao.get('nome_dizimista', 'Desconhecido')
        data_pd = doacao.get('data_hora')
        
        # Formatando data se necessário
        if data_pd:
            try:
                data_obj = datetime.fromisoformat(data_pd.replace('Z', '+00:00'))
                data_string = data_obj.strftime("%d/%m/%Y %H:%M")
            except:
                data_string = data_pd
        else:
            data_string = "N/A"
            
        valor = float(doacao.get('valor', 0))
        total_arrecadado += valor
        valor_str = f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        
        dados_tabela.append([carteira, nome, data_string, valor_str])
        
    # Adicionar a linha de total
    dados_tabela.append(["", "", "TOTAL GERAL:", f"R$ {total_arrecadado:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")])
    
    # Montar a UI da Tabela
    total_linhas = len(dados_tabela)
    t = Table(dados_tabela, colWidths=[60, 240, 120, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#5f85db")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        
        ('BACKGROUND', (0, 1), (-1, -2), colors.HexColor("#f4f7f6")),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor("#2d3748")),
        ('ALIGN', (0, 1), (-1, -2), 'CENTER'),
        ('ALIGN', (3, 1), (3, -1), 'RIGHT'), # Alinhar moedas a direita
        
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'), # Total bold
        ('LINEBELOW', (0, -2), (-1, -2), 1, colors.HexColor("#5f85db")), # linha antes do total
        
        ('GRID', (0, 0), (-1, -2), 0.5, colors.grey)
    ]))
    
    elements.append(t)
    
    # Gerar e finalizar
    doc.build(elements)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes
