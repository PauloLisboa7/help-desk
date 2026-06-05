#!/bin/bash
# Script de inicialização rápida do Help Desk

echo "🎫 Help Desk Corporativo - Inicializador"
echo "=========================================="
echo ""

# Verificar opção
OPTION=${1:-"help"}

case $OPTION in
  start-local)
    echo "▶️  Iniciando em modo LOCAL..."
    npm start
    ;;
  
  start-docker)
    echo "▶️  Iniciando com DOCKER COMPOSE..."
    docker-compose up -d
    echo ""
    echo "✅ Containers iniciados!"
    echo ""
    echo "📍 Acessar:"
    echo "   Frontend/Nginx:  http://localhost"
    echo "   Backend API:     http://localhost:3000"
    echo "   pgAdmin:         http://localhost:5050"
    echo ""
    echo "📊 Monitorar logs: docker-compose logs -f"
    ;;
  
  setup-local)
    echo "🔧 Setup LOCAL..."
    npm install
    npm run migrate
    node backend/src/seed.js
    echo "✅ Setup concluído! Execute: npm start"
    ;;
  
  setup-docker)
    echo "🐳 Setup DOCKER..."
    if ! command -v docker &> /dev/null; then
      echo "❌ Docker não está instalado!"
      exit 1
    fi
    echo "✅ Docker Compose pronto! Execute: ./start.sh start-docker"
    ;;
  
  stop)
    echo "⏹️  Parando containers..."
    docker-compose down
    echo "✅ Containers parados"
    ;;
  
  logs)
    echo "📋 Logs do backend:"
    docker-compose logs -f backend
    ;;
  
  *)
    echo "Uso: ./start.sh [COMANDO]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start-local      - Iniciar servidor Node localmente"
    echo "  start-docker     - Iniciar com Docker Compose"
    echo "  setup-local      - Setup inicial (npm install + migrate + seed)"
    echo "  setup-docker     - Verificar Docker"
    echo "  stop             - Parar containers Docker"
    echo "  logs             - Ver logs em tempo real"
    echo "  help             - Mostrar esta mensagem"
    echo ""
    echo "Exemplos:"
    echo "  ./start.sh start-local"
    echo "  ./start.sh start-docker"
    ;;
esac
