import pdfplumber
import json
import re

def is_float(value):
    try:
        float(str(value).replace(',', '.'))
        return True
    except (ValueError, TypeError):
        return False

def to_float(value):
    try:
        return float(str(value).replace(',', '.'))
    except (ValueError, TypeError):
        return None

def extract_pump_data(pdf_path, pages):
    pumps_db = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num in pages:
            print(f"Processando página {page_num + 1}...")
            # pdfplumber is 0-indexed. User requested pages: 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19, 21, 22
            # Which corresponds to: 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 21
            page = pdf.pages[page_num]
            tables = page.extract_tables()
            
            for table_idx, table in enumerate(tables):
                vazoes = []
                headers_found = False
                vazao_start_col = 3 # usually column 3 is where flows start
                
                for row_idx, row in enumerate(table):
                    if not row: continue
                    
                    # Identificar a linha de Vazão: geralmente tem um "0" e termina com números crescentes, e antecede a linha "Altura"
                    str_row = [str(x) for x in row if x is not None]
                    
                    if not headers_found:
                        # Find the row that holds flow arrays
                        # Characterized by starting with None/Model/etc, and having a sequence of numbers starting with '0'
                        if '0' in str_row and len([x for x in str_row if is_float(x)]) > 5:
                            # Encontramos a linha de vazões
                            start_idx = row.index('0') if '0' in row else 3
                            vazao_start_col = start_idx
                            vazoes_raw = row[start_idx:]
                            vazoes = []
                            for v in vazoes_raw:
                                if is_float(v): vazoes.append(to_float(v))
                                else: break # Stop at non-float (e.g., Peso/Dimensões)
                            headers_found = True
                    else:
                        # Extrair dados do modelo
                        # A linha de modelo tem modelo na coluna 0, e a potencia na 1
                        if row[0] and type(row[0]) == str and len(row[0]) > 4 and '-' in row[0]:
                            modelo = row[0].replace('\n', ' ').strip()
                            # Check if it's a real model and not a header string like "Altura Manométrica"
                            if "m.c.a." in modelo or "Altura" in modelo:
                                continue
                            
                            potencia_cv = to_float(row[1])
                            mcas_raw = row[vazao_start_col:vazao_start_col + len(vazoes)]
                            mcas = [to_float(x) for x in mcas_raw]
                            
                            # Mapear pares (Q, H) onde MCA é válido
                            curva = []
                            for q, h in zip(vazoes, mcas):
                                if h is not None:
                                    curva.append({"q": q, "h": h})
                                    
                            if potencia_cv and curva:
                                pumps_db.append({
                                    "modelo": modelo,
                                    "potencia_cv": potencia_cv,
                                    "curva": curva,
                                    "mca_max": max([p["h"] for p in curva]),
                                    "mca_min": min([p["h"] for p in curva]),
                                    "vazao_max": max([p["q"] for p in curva]),
                                    "vazao_min": min([p["q"] for p in curva])
                                })
    
    with open('bombas_leao.json', 'w', encoding='utf-8') as f:
        json.dump(pumps_db, f, indent=4, ensure_ascii=False)
    
    print(f"Extração concluída! {len(pumps_db)} modelos salvos em bombas_leao.json")

if __name__ == "__main__":
    target_pages = [4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 21]
    extract_pump_data("leao_tabela_selecao_07-2019_web.pdf", target_pages)
