#!/bin/bash
# Setup script para Django Admin Panel

echo ""
echo "===================================="
echo "Help Desk Django Admin - Setup"
echo "===================================="
echo ""

# Criar venv
if [ ! -d "venv" ]; then
    echo "[1/4] Criando ambiente virtual..."
    python3 -m venv venv
else
    echo "[1/4] Ambiente virtual ja existe."
fi

# Ativar venv
echo "[2/4] Ativando ambiente virtual..."
source venv/bin/activate

# Instalar dependencias
echo "[3/4] Instalando dependencias..."
pip install -r requirements.txt --quiet

# Criar superuser
echo "[4/4] Criando superuser Django..."
echo ""
echo "Digite as credenciais do administrador Django:"
echo "(pode ser diferente das credenciais do Help Desk Node.js)"
echo ""
python manage.py createsuperuser

echo ""
echo "===================================="
echo "Setup concluido!"
echo "===================================="
echo ""
echo "Para iniciar o servidor:"
echo "python manage.py runserver 8000"
echo ""
echo "Acesse: http://localhost:8000/admin/"
echo ""
