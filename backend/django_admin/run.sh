#!/bin/bash
# Run script para Django Admin Panel

echo "Iniciando Django Admin Panel..."
echo ""

if [ ! -d "venv" ]; then
    echo "Erro: Ambiente virtual nao encontrado!"
    echo "Execute setup.sh primeiro."
    exit 1
fi

source venv/bin/activate

echo "Django Admin rodando em http://localhost:8000/admin/"
echo ""
echo "Pressione Ctrl+C para parar."
echo ""

python manage.py runserver 8000
