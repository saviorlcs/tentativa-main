"""
Rotas Administrativas.
Rotas para funções administrativas do sistema.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict

from database import db
from shop_seed import build_items

router = APIRouter(prefix="/admin")


@router.post("/seed-shop")
async def admin_seed_shop():
    """
    Popula o banco de dados com itens da loja.
    Usado para inicializar ou resetar a loja.
    
    ATENÇÃO: Esta rota deve ser protegida em produção!
    
    Returns:
        dict: {"success": True, "items_count": int}
    """
    try:
        # Limpa itens existentes
        await db.shop_items.delete_many({})
        
        # Gera novos itens usando o seed
        items = build_items()
        
        if items:
            # Insere novos itens
            items_to_insert = []
            for item in items:
                item_dict = item.model_dump() if hasattr(item, 'model_dump') else dict(item)
                items_to_insert.append(item_dict)
            
            await db.shop_items.insert_many(items_to_insert)
        
        return {
            "success": True,
            "message": "Loja populada com sucesso",
            "items_count": len(items)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao popular loja: {str(e)}"
        )
