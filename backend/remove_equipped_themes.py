#!/usr/bin/env python3
"""
Script para remover todos os temas equipados dos usuários
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def remove_all_equipped_themes():
    """Remove todos os temas equipados de todos os usuários"""
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client.pomociclo
    
    try:
        # Atualiza todos os usuários, setando equipped_items.theme para None
        result = await db.users.update_many(
            {},  # Todos os usuários
            {"$set": {"equipped_items.theme": None}}
        )
        
        print(f"✅ Temas removidos com sucesso!")
        print(f"📊 Total de usuários atualizados: {result.modified_count}")
        
        # Verifica quantos usuários ainda têm tema equipado (deve ser 0)
        remaining = await db.users.count_documents({"equipped_items.theme": {"$ne": None}})
        print(f"📊 Usuários com tema equipado restantes: {remaining}")
        
    except Exception as e:
        print(f"❌ Erro ao remover temas: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(remove_all_equipped_themes())
