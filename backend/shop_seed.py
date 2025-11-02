# backend/shop_seed.py
# Sistema de raridade exponencial para a loja do Pomociclo
# rarity_score: 0.0 (mais simples) → 1.0 (mais único)
# Preço: 4h (score=0) → 5000h (score=1) de forma exponencial
# Categorias: Comum (0-0.60) | Raro (0.60-0.85) | Especial (0.85-0.95) | Lendário (0.95-1.0)

from math import pow, log
from typing import List, Dict, Any

# ================== CONFIGURAÇÕES ==================
MIN_HOURS = 4
MAX_HOURS = 5000
HOURS_PER_COIN = 12  # 1 coin = 12 minutos de estudo = 0.2 horas

# Thresholds de raridade
THRESHOLDS = {
    "common": (0.00, 0.60),
    "rare": (0.60, 0.85),
    "epic": (0.85, 0.95),
    "legendary": (0.95, 1.00)
}

# Quantidade de itens por tipo
ITEMS_PER_TYPE = {
    "seal": 25,
    "border": 25,
    "theme": 25
}

# ================== FÓRMULAS ==================

def hours_from_rarity_score(score: float) -> float:
    """
    Converte rarity_score (0.0-1.0) em horas de estudo usando curva exponencial.
    Fórmula: hours = MIN_HOURS * (MAX_HOURS/MIN_HOURS)^score
    Resultado: score=0 → 4h, score=1 → 5000h
    """
    if score <= 0:
        return MIN_HOURS
    if score >= 1:
        return MAX_HOURS
    
    ratio = MAX_HOURS / MIN_HOURS  # 1250
    hours = MIN_HOURS * pow(ratio, score)
    return round(hours, 1)


def coins_from_hours(hours: float) -> int:
    """Converte horas em coins (preço do item)."""
    return int(hours * HOURS_PER_COIN)


def get_rarity_category(score: float) -> str:
    """Determina a categoria de raridade baseada no score."""
    for category, (min_s, max_s) in THRESHOLDS.items():
        if min_s <= score < max_s:
            return category
    return "legendary"  # score >= 0.95


def calculate_level_requirement(score: float) -> int:
    """Calcula o nível necessário baseado no rarity_score."""
    # Nível 1-50, crescimento suave
    if score < 0.40:
        return 1
    elif score < 0.70:
        return int(5 + (score - 0.40) * 30)  # 5-14
    elif score < 0.90:
        return int(15 + (score - 0.70) * 75)  # 15-30
    else:
        return int(31 + (score - 0.90) * 190)  # 31-50


# ================== FEATURES DE INDIVIDUALIDADE ==================

def get_uniqueness_features(score: float, rarity: str, item_type: str, index: int) -> List[str]:
    """
    Retorna features especiais baseadas no rarity_score.
    Quanto maior o score, mais features únicas o item tem.
    """
    features = []
    
    # Features básicas (todos têm)
    features.append(f"Edição #{index + 1}")
    
    # Score 0.30+: Nome temático
    if score >= 0.30:
        themes = ["Stellar", "Cosmic", "Ethereal", "Mystic", "Divine", "Prismatic", 
                 "Celestial", "Quantum", "Nebula", "Aurora", "Phoenix", "Infinity"]
        theme = themes[int(score * 100) % len(themes)]
        features.append(f"Tema: {theme}")
    
    # Score 0.50+: Animação básica
    if score >= 0.50:
        features.append("Animação: Brilho pulsante")
    
    # Score 0.65+: Partículas
    if score >= 0.65:
        features.append("Efeito: Partículas orbitais")
    
    # Score 0.75+: Animação avançada
    if score >= 0.75:
        animations = ["Rotação estelar", "Ondas de energia", "Pulso quântico", "Espiral galáctica"]
        anim = animations[int(score * 1000) % len(animations)]
        features.append(f"Animação: {anim}")
    
    # Score 0.85+: Interatividade
    if score >= 0.85:
        features.append("Interativo: Responde ao hover")
    
    # Score 0.90+: Efeitos holográficos
    if score >= 0.90:
        features.append("Holográfico: Efeito prismático")
    
    # Score 0.95+: Features lendárias
    if score >= 0.95:
        features.append("Lendário: Trilha de partículas")
        features.append("Celebração: Explosão de fogos")
        features.append(f"Colecionável Raro #{int((1.0 - score) * 100)}")
    
    return features


def generate_visual_effects(score: float, rarity: str, item_type: str, index: int = 0) -> Dict[str, Any]:
    """Gera efeitos visuais progressivos baseados no score."""
    
    # === MAPEAMENTO FIXO PARA EVITAR DUPLICATAS ===
    # Cada selo recebe uma cor ÚNICA e bem diferenciada
    # Distribuição em todo o espectro de cores com espaçamento estratégico
    
    if item_type == "seal":
        # Mapeamento FIXO de cores únicas para cada um dos 25 selos
        # Usando distribuição estratégica no círculo cromático para máxima diferenciação
        SEAL_COLORS = {
            # Grupo 1: Vermelho-Laranja-Amarelo (0-60)
            0: 0,     # Vermelho puro
            1: 15,    # Vermelho-laranja
            2: 30,    # Laranja
            3: 45,    # Laranja-amarelo
            
            # Grupo 2: Amarelo-Verde (60-120)
            4: 60,    # Amarelo
            5: 75,    # Amarelo-verde
            6: 90,    # Verde-amarelo
            7: 105,   # Verde claro
            
            # Grupo 3: Verde-Ciano (120-180)
            8: 120,   # Verde puro
            9: 135,   # Verde-ciano
            10: 150,  # Ciano-verde
            11: 165,  # Turquesa
            
            # Grupo 4: Ciano-Azul (180-240)
            12: 180,  # Ciano puro
            13: 195,  # Ciano-azul
            14: 210,  # Azul claro
            15: 225,  # Azul-ciano
            
            # Grupo 5: Azul-Roxo (240-300)
            16: 240,  # Azul puro
            17: 255,  # Azul-roxo
            18: 270,  # Roxo-azul
            19: 285,  # Roxo
            
            # Grupo 6: Magenta-Vermelho (300-360)
            20: 300,  # Magenta
            21: 315,  # Rosa-magenta
            22: 330,  # Rosa
            23: 345,  # Rosa-vermelho
            24: 355,  # Vermelho-rosa
        }
        
        hue = SEAL_COLORS.get(index, (index * 15) % 360)
    else:
        # Para borders e themes, mantém lógica anterior com mais variação
        if score >= 0.85:
            hue_offset = (index * 73 + int(score * 100) * 17) % 360
        else:
            hue_offset = (index * 37) % 360
        
        hue_base = int((score * 360 * 3.7) % 360)
        hue = (hue_base + hue_offset) % 360
    
    # Saturação e luminosidade otimizadas para distinção visual
    if item_type == "seal":
        # Selos: saturação alta e variação na luminosidade para melhor distinção
        saturation = int(75 + (index % 4) * 5)  # 75-90% - cores vibrantes
        lightness = int(55 - (index % 3) * 3)   # 55-49% - ajuste fino
    else:
        # Borders e themes: mantém lógica anterior
        saturation = int(65 + (index % 5) * 6 + score * 25)
        lightness = int(50 - (index % 3) * 2 - score * 8)
    
    base_color = f"hsl({hue}, {saturation}%, {lightness}%)"
    accent_color = f"hsl({(hue + 60) % 360}, {saturation + 5}%, {lightness - 5}%)"
    
    # Temas variados por tipo
    seal_themes = ["default", "fire", "water", "earth", "air", "light", "dark", "cyber", "neon", "matrix", "aurora", "plasma", "quantum", "crystal", "cosmic", "stellar", "nebula", "void", "galaxy", "prisma", "hologram", "energy", "spirit", "divine", "chaos"]
    border_themes = ["default", "cyber", "neon", "circuit", "aurora", "plasma", "energy", "crystal", "cosmic", "divine", "void", "infinity"]
    # TEMAS PREMIUM - Organizados por raridade
    # Comum (0-0.60): Temas básicos mas bonitos
    # Raro (0.60-0.85): Temas vibrantes com efeitos sutis  
    # Épico (0.85-0.95): Temas incríveis com animações
    # Lendário (0.95-1.0): Temas únicos com efeitos especiais
    theme_themes = [
        # Comum (índices 0-14)
        "default", "cyber", "neon", "ocean", "forest", 
        "sunset", "twilight", "midnight", "slate", "storm",
        "ember", "breeze", "tide", "shadow", "dawn",
        
        # Raro (índices 15-19)
        "aurora", "plasma", "nebula", "crystal", "prism",
        
        # Épico (índices 20-23)
        "cosmic", "phoenix", "void", "galaxy",
        
        # Lendário (índices 24)
        "infinity"
    ]
    
    if item_type == "seal":
        theme_list = seal_themes
        # Mapeia cada índice para um tema único
        selected_theme = theme_list[index % len(theme_list)]
    elif item_type == "border":
        theme_list = border_themes
        theme_index = index % len(theme_list)
        selected_theme = theme_list[theme_index]
    else:  # theme
        theme_list = theme_themes
        theme_index = index % len(theme_list)
        selected_theme = theme_list[theme_index]
    
    effects = {
        "base_color": base_color,
        "accent_color": accent_color,
        "glow_intensity": "low" if score < 0.60 else "medium" if score < 0.85 else "high" if score < 0.95 else "extreme",
        "animation_speed": 1.0 + score * 2.0,  # 1x a 3x
        "particle_count": int(score * 50),  # 0 a 50 partículas
        "theme": selected_theme,  # Adiciona o tema visual
        "rarity": rarity,  # Adiciona raridade
        "hue": hue,  # Expõe o hue para debugging
    }
    
    # Efeitos específicos por tipo
    if item_type == "seal":
        effects.update({
            "icon_size": 1.0 + score * 0.5,
            "has_particles": score >= 0.65,
            "has_orbit": score >= 0.75,
            "has_hologram": score >= 0.90,
        })
    elif item_type == "border":
        effects.update({
            "thickness": 2 + int(score * 5),  # 2-7px
            "border_radius": 12 + int(score * 16),  # 12-28px
            "has_gradient": score >= 0.60,
            "has_animation": score >= 0.70,
        })
    elif item_type == "theme":
        effects.update({
            "gradient_stops": 2 + int(score * 3),  # 2-5 stops
            "bg_animation": score >= 0.70,
            "timer_reactive": score >= 0.85,
            "celebrate_on_complete": score >= 0.95,
        })
    
    return effects


def generate_descriptive_name(score: float, rarity: str, item_type: str, index: int) -> str:
    """Gera nomes descritivos e progressivamente mais elaborados."""
    
    # Prefixos por raridade
    prefixes = {
        "common": ["Simples", "Básico", "Iniciante", "Clássico", "Standard"],
        "rare": ["Brilhante", "Radiante", "Luminoso", "Vibrante", "Intenso"],
        "epic": ["Épico", "Majestoso", "Sublime", "Grandioso", "Supremo"],
        "legendary": ["Lendário", "Mítico", "Divino", "Transcendente", "Celestial"]
    }
    
    # Temas cósmicos
    themes = ["Estelar", "Cósmico", "Galáctico", "Nebuloso", "Quântico", 
             "Astral", "Etéreo", "Prisma", "Aurora", "Infinity"]
    
    # Sufixos especiais para scores altos
    suffixes = ["Prime", "Omega", "Alpha", "Nova", "Genesis"]
    
    prefix = prefixes[rarity][int(score * 100) % len(prefixes[rarity])]
    theme = themes[int(score * 1000) % len(themes)]
    
    # Nome base
    type_names = {
        "seal": "Selo",
        "border": "Borda",
        "theme": "Tema"
    }
    
    base_name = type_names[item_type]
    
    # Estrutura do nome varia por raridade
    if score < 0.60:  # Comum
        return f"{base_name} {prefix} #{index + 1}"
    elif score < 0.85:  # Raro
        return f"{base_name} {theme} {prefix}"
    elif score < 0.95:  # Épico
        suffix = suffixes[int(score * 100) % len(suffixes)]
        return f"{base_name} {theme} {suffix}"
    else:  # Lendário
        edition = int((1.0 - score) * 100)
        return f"{base_name} {theme} OMEGA • Ed. #{edition}"


# ================== GERAÇÃO DE ITENS ==================

def generate_items_for_type(item_type: str, count: int) -> List[Dict[str, Any]]:
    """Gera 'count' itens para um tipo específico com distribuição exponencial."""
    items = []
    
    for i in range(count):
        # Distribuição não-linear: mais itens comuns, menos lendários
        # Usando curva inversa: primeiros itens têm scores baixos
        t = i / (count - 1) if count > 1 else 0
        
        # Curva exponencial para concentrar mais itens em scores baixos
        rarity_score = pow(t, 1.8)  # Exponente > 1 = mais itens comuns
        rarity_score = round(rarity_score, 4)
        
        # Calcula métricas
        hours = hours_from_rarity_score(rarity_score)
        price = coins_from_hours(hours)
        rarity = get_rarity_category(rarity_score)
        level_req = calculate_level_requirement(rarity_score)
        
        # Gera features únicas
        uniqueness_features = get_uniqueness_features(rarity_score, rarity, item_type, i)
        effects = generate_visual_effects(rarity_score, rarity, item_type, i)
        name = generate_descriptive_name(rarity_score, rarity, item_type, i)
        
        # Descrição dinâmica
        desc_parts = [f"Item {rarity.upper()}", f"{int(hours)}h de estudo"]
        if rarity_score >= 0.85:
            desc_parts.append("Efeitos avançados")
        if rarity_score >= 0.95:
            desc_parts.append("COLECIONÁVEL RARO")
        
        description = " • ".join(desc_parts)
        
        # Monta o item
        item = {
            "id": f"{item_type}_{i + 1:03d}",
            "item_type": item_type,
            "name": name,
            "description": description,
            "rarity_score": rarity_score,
            "rarity": rarity,
            "hours_value": hours,
            "price": price,
            "level_required": level_req,
            "effects": effects,
            "uniqueness_features": uniqueness_features,
            "tags": [rarity, item_type, f"tier_{int(rarity_score * 10)}"],
            "badge_color": {
                "common": "slate",
                "rare": "blue",
                "epic": "purple",
                "legendary": "amber"
            }[rarity],
            "animation_level": int(rarity_score * 5),  # 0-5
        }
        
        items.append(item)
    
    return items


def build_items() -> List[Dict[str, Any]]:
    """Gera todos os itens da loja."""
    all_items = []
    
    for item_type, count in ITEMS_PER_TYPE.items():
        items = generate_items_for_type(item_type, count)
        all_items.extend(items)
    
    return all_items


# ================== ESTATÍSTICAS ==================

def print_shop_statistics(items: List[Dict[str, Any]]):
    """Imprime estatísticas sobre os itens gerados."""
    print("\n" + "="*60)
    print("ESTATÍSTICAS DA LOJA - POMOCICLO")
    print("="*60)
    
    # Contagem por raridade
    by_rarity = {}
    by_type = {}
    
    for item in items:
        rarity = item["rarity"]
        item_type = item["item_type"]
        
        by_rarity[rarity] = by_rarity.get(rarity, 0) + 1
        by_type[item_type] = by_type.get(item_type, 0) + 1
    
    print(f"\nTotal de itens: {len(items)}")
    print(f"\nPor tipo:")
    for t, count in sorted(by_type.items()):
        print(f"  • {t.capitalize()}: {count} itens")
    
    print(f"\nPor raridade:")
    for r in ["common", "rare", "epic", "legendary"]:
        count = by_rarity.get(r, 0)
        pct = (count / len(items)) * 100
        print(f"  • {r.capitalize()}: {count} itens ({pct:.1f}%)")
    
    # Faixa de preços
    prices = [item["price"] for item in items]
    print(f"\nFaixa de preços:")
    print(f"  • Mínimo: C${min(prices):,} ({min([i['hours_value'] for i in items])}h)")
    print(f"  • Máximo: C${max(prices):,} ({max([i['hours_value'] for i in items])}h)")
    print(f"  • Médio: C${sum(prices)//len(prices):,}")
    
    # Exemplos por categoria
    print(f"\n" + "-"*60)
    print("EXEMPLOS POR CATEGORIA:")
    print("-"*60)
    
    for rarity in ["common", "rare", "epic", "legendary"]:
        items_of_rarity = [i for i in items if i["rarity"] == rarity]
        if items_of_rarity:
            example = items_of_rarity[len(items_of_rarity)//2]  # Pega um do meio
            print(f"\n[{rarity.upper()}] {example['name']}")
            print(f"  Score: {example['rarity_score']:.4f}")
            print(f"  Preço: C${example['price']:,} ({example['hours_value']}h)")
            print(f"  Nível: {example['level_required']}")
            print(f"  Features: {len(example['uniqueness_features'])} únicas")
    
    print("\n" + "="*60 + "\n")


# ================== EXPORTAÇÃO ==================

# Gera os itens
SHOP_ITEMS = build_items()

# Mostra estatísticas (comentar em produção se quiser)
if __name__ == "__main__":
    print_shop_statistics(SHOP_ITEMS)
