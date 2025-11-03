"""
Modelos Pydantic relacionados à loja.
Define as estruturas de dados para itens da loja e compras.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List


class ShopItem(BaseModel):
    """Modelo de item da loja com detalhes de customização."""
    model_config = ConfigDict(extra="ignore")
    
    id: str  # ID único do item (ex: 'seal_focus_dot_01')
    item_type: str  # Tipo: 'seal' | 'border' | 'theme'
    name: str  # Nome do item
    price: int  # Preço em moedas
    rarity: str  # Raridade: 'common' | 'epic' | 'rare' | 'legendary'
    level_required: int = 1  # Nível necessário para comprar
    tags: List[str] = Field(default_factory=list)  # Tags para categorização
    categories: List[str] = Field(default_factory=list)  # Categorias
    description: Optional[str] = None  # Descrição do item
    effects: dict = Field(default_factory=dict)  # Efeitos visuais / animações
    perks: dict = Field(default_factory=dict)  # Vantagens cosméticas ou QoL
    image_url: Optional[str] = None  # URL da imagem


class PurchaseItem(BaseModel):
    """Modelo de requisição para comprar um item."""
    item_id: str  # ID do item a comprar
