#!/bin/bash
# Script de inicialização do Backend - Pomociclo API
# Uso: ./start.sh ou bash start.sh

echo "🚀 Iniciando Pomociclo Backend..."
echo ""

# Verifica se as dependências estão instaladas
if ! python -c "import fastapi" 2>/dev/null; then
    echo "📦 Instalando dependências..."
    pip install -r requirements.txt
    echo "✓ Dependências instaladas!"
    echo ""
fi

# Verifica MongoDB
if ! pgrep mongod > /dev/null; then
    echo "⚠️  MongoDB não está rodando!"
    echo "   Inicie o MongoDB primeiro: sudo systemctl start mongod"
    echo ""
    exit 1
fi

echo "✓ MongoDB está rodando"
echo ""

# Inicia o servidor
echo "🌐 Iniciando servidor na porta 8001..."
echo "   Documentação: http://localhost:8001/api/docs"
echo ""

python server.py
