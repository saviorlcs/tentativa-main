"""
Filtro de conteúdo ofensivo para nicknames e tags
Detecta palavras ofensivas, obscenas, criminosas e inapropriadas em múltiplos idiomas
"""

import re
from typing import Tuple, List

# Lista de palavras ofensivas em português e variações
OFFENSIVE_WORDS = {
    # Palavrões e termos obscenos
    "puta", "puto", "fdp", "caralho", "cacete", "porra", "merda", "bosta", 
    "viado", "bicha", "veado", "gay", "sapatao", "sapata", "traveco", "travecos",
    "cu", "cuzao", "buceta", "xoxota", "piroca", "pinto", "pau", "rola",
    "foda", "foder", "fuder", "fudido", "fodido", "fodao", "fudao",
    "arrombado", "arrombada", "corno", "cornudo", "vagabundo", "vagabunda",
    "pqp", "vsf", "tnc", "kct", "krl", "fdm", "ctg", "pdp",
    
    # Termos racistas e discriminatórios
    "preto", "negro", "macaco", "macaca", "crioulo", "crioula", "pretinho",
    "branquelo", "amarelo", "japa", "japones", "china", "chines", "gringo",
    "nordestino", "baiano", "paraiba", "favelado", "favelada",
    
    # Termos de ódio e violência
    "hitler", "nazismo", "nazista", "nazi", "swastika", "kkk", "ariano",
    "genocidio", "terrorista", "bomba", "explosivo", "matar", "morte",
    "suicidio", "suicida", "enforcar", "enforcado", "sangue", "assassino",
    
    # Termos sexuais explícitos
    "sexo", "sexy", "tesao", "tesuda", "gostosa", "gostoso", "delicia",
    "punheta", "broxa", "brochar", "transar", "trepar", "fornicar",
    "oral", "anal", "orgia", "pornô", "porno", "pornografia",
    "estupro", "estuprador", "pedofilo", "pedofilia", "molestador",
    
    # Drogas e substâncias ilícitas
    "maconha", "erva", "baseado", "beck", "fumar", "cheirar", "pó",
    "cocaina", "coca", "crack", "heroina", "lsd", "ecstasy", "bala",
    "traficante", "trafico", "dealer", "drogas", "drogado",
    
    # Termos criminosos
    "roubar", "roubo", "ladrão", "ladrao", "bandido", "bandida",
    "assalto", "assaltante", "marginal", "criminoso", "crime",
    "hacker", "hack", "invadir", "invasao", "fraude", "fraudador",
    
    # Variações com números e símbolos comuns
    "p0rra", "m3rda", "b0sta", "fud1d0", "c4ralho", "put4",
    "s3x0", "dr0g4s", "m4t4r", "n4z1st4",
    
    # Palavras em inglês comuns
    "fuck", "shit", "bitch", "ass", "dick", "cock", "pussy", "whore",
    "nigger", "nigga", "nazi", "kill", "death", "rape", "porn", "sex",
    "drug", "weed", "cocaine", "heroin",
    
    # Palavras em espanhol comuns
    "puta", "puto", "mierda", "culo", "polla", "verga", "chingar",
    "pendejo", "cabron", "marica", "maricon", "nazi", "matar",
}

# Padrões regex para detectar variações
OFFENSIVE_PATTERNS = [
    r"[p|P][u|U][t|T][a|A4@]",  # puta e variações
    r"[f|F][d|D][p|P]",  # fdp
    r"[c|C][u|U]",  # cu (palavra muito curta, cuidado)
    r"[n|N][a|A][z|Z][i|I]",  # nazi
    r"[k|K]{3,}",  # kkk
    r"[f|F][0o][d|D][a|A4@]",  # foda com variações
    r"[p|P][0o][r|R]{2}[a|A4@]",  # porra com variações
    r"[m|M][e|E3][r|R][d|D][a|A4@]",  # merda com variações
    r"[s|S][e|E3][x|X][0o]",  # sexo com variações
    r"\d{3,}",  # Sequências longas de números (suspeito)
]

# Palavras permitidas que podem ser confundidas (whitelist)
ALLOWED_WORDS = {
    "sexta", "sextante", "sexto", "sexta-feira",  # contém "sexta" mas é OK
    "texto", "contexto", "pretexto",  # contém "texto" mas é OK
    "osexto",  # sobrenome comum
    "puto" # pode ser usado como substantivo comum em alguns contextos (mas ainda assim vamos bloquear)
}

def normalize_text(text: str) -> str:
    """Normaliza texto para facilitar detecção"""
    if not text:
        return ""
    
    # Remove espaços extras e converte para minúsculas
    text = text.lower().strip()
    
    # Remove caracteres especiais comuns usados para disfarçar palavras
    replacements = {
        '@': 'a', '4': 'a', '3': 'e', '1': 'i', '!': 'i',
        '0': 'o', '$': 's', '7': 't', '8': 'b', '9': 'g',
        '+': 't', '*': 'a', '#': 'h'
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    return text

def contains_offensive_content(text: str) -> Tuple[bool, List[str]]:
    """
    Verifica se o texto contém conteúdo ofensivo
    
    Returns:
        Tuple[bool, List[str]]: (tem_conteudo_ofensivo, lista_de_palavras_encontradas)
    """
    if not text:
        return False, []
    
    normalized = normalize_text(text)
    found_offensive = []
    
    # Verifica palavras exatas
    words = normalized.split()
    for word in words:
        if word in OFFENSIVE_WORDS and word not in ALLOWED_WORDS:
            found_offensive.append(word)
    
    # Verifica palavras dentro do texto (substring)
    for offensive_word in OFFENSIVE_WORDS:
        if offensive_word in normalized and offensive_word not in ALLOWED_WORDS:
            # Verifica se não está dentro de uma palavra permitida
            is_in_allowed = False
            for allowed in ALLOWED_WORDS:
                if offensive_word in allowed and allowed in normalized:
                    is_in_allowed = True
                    break
            
            if not is_in_allowed and offensive_word not in found_offensive:
                found_offensive.append(offensive_word)
    
    # Verifica padrões regex
    for pattern in OFFENSIVE_PATTERNS:
        matches = re.findall(pattern, normalized, re.IGNORECASE)
        if matches:
            found_offensive.extend([f"padrão: {m}" for m in matches if m not in found_offensive])
    
    return len(found_offensive) > 0, found_offensive

def is_valid_nickname(nickname: str, tag: str) -> Tuple[bool, str]:
    """
    Valida se nickname e tag são apropriados
    
    Returns:
        Tuple[bool, str]: (é_válido, mensagem_de_erro)
    """
    # Validações básicas de formato
    if not nickname or len(nickname) < 3:
        return False, "Nickname deve ter pelo menos 3 caracteres"
    
    if len(nickname) > 16:
        return False, "Nickname deve ter no máximo 16 caracteres"
    
    if not tag or len(tag) < 3:
        return False, "Tag deve ter pelo menos 3 caracteres"
    
    if len(tag) > 6:
        return False, "Tag deve ter no máximo 6 caracteres"
    
    # Verifica se contém apenas caracteres alfanuméricos
    if not nickname.isalnum():
        return False, "Nickname deve conter apenas letras e números"
    
    if not tag.isalnum():
        return False, "Tag deve conter apenas letras e números"
    
    # Verifica conteúdo ofensivo no nickname
    has_offensive_nick, offensive_words_nick = contains_offensive_content(nickname)
    if has_offensive_nick:
        return False, f"O nickname contém conteúdo inapropriado que viola nossas diretrizes. Por favor, escolha outro nome."
    
    # Verifica conteúdo ofensivo na tag
    has_offensive_tag, offensive_words_tag = contains_offensive_content(tag)
    if has_offensive_tag:
        return False, f"A tag contém conteúdo inapropriado que viola nossas diretrizes. Por favor, escolha outra tag."
    
    # Verifica a combinação completa
    full_name = f"{nickname}{tag}"
    has_offensive_full, offensive_words_full = contains_offensive_content(full_name)
    if has_offensive_full:
        return False, f"A combinação nickname#tag contém conteúdo inapropriado que viola nossas diretrizes. Por favor, escolha outros valores."
    
    return True, ""

def get_content_filter_message() -> str:
    """Retorna mensagem amigável sobre as diretrizes de conteúdo"""
    return (
        "⚠️ Seu nickname ou tag contém conteúdo que viola nossas diretrizes.\n\n"
        "Por favor, evite usar:\n"
        "• Palavrões ou linguagem obscena\n"
        "• Termos ofensivos, racistas ou discriminatórios\n"
        "• Referências a drogas, violência ou atividades ilegais\n"
        "• Conteúdo sexual explícito\n"
        "• Símbolos de ódio ou terrorismo\n\n"
        "Escolha um nome que seja respeitoso e apropriado para todos! 😊"
    )
