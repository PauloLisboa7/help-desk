# Help Desk Corporativo - Setup Portável com Docker

## 🚀 Opção 1: Rodar Localmente (Linux/Mac/WSL2 com PostgreSQL)

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+
- npm

### Passos de Configuração

```bash
# 1. Clonar/baixar o projeto
cd help-desk

# 2. Instalar dependências
npm install

# 3. Criar arquivo .env
cp .env.example .env

# 4. Editar .env com suas credenciais PostgreSQL:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=helpdesk
# DB_PASSWORD=helpdesk_password
# DB_NAME=helpdesk_db

# 5. Criar banco e usuário no PostgreSQL (como superuser):
# CREATE ROLE helpdesk WITH LOGIN PASSWORD 'helpdesk_password';
# CREATE DATABASE helpdesk_db OWNER helpdesk;

# 6. Executar migrações
npm run migrate

# 7. Popular com dados de teste
node backend/src/seed.js

# 8. Iniciar servidor
npm start

# Acesse: http://localhost:3000
```

### Credenciais de Teste
```
Admin:    admin@helpdesk.local / 123456
Usuário:  usuario@helpdesk.local / 123456
Técnico:  tecnico@helpdesk.local / 123456
```

---

## 🐳 Opção 2: Rodar com Docker Compose (Recomendado para Portabilidade)

### Pré-requisitos
- Docker Desktop 4.0+
- Docker Compose 2.0+

### Passos de Configuração

```bash
# 1. Clonar/baixar o projeto
cd help-desk

# 2. (Opcional) Editar docker-compose.yml se precisar alterar portas ou versões

# 3. Subir containers (PostgreSQL + Backend + Nginx + pgAdmin)
docker-compose up -d

# Aguarde ~30 segundos para o PostgreSQL inicializar

# 4. Verificar status dos containers
docker-compose ps

# 5. Acessar o sistema
# Frontend:  http://localhost/
# Backend:   http://localhost:3000
# pgAdmin:   http://localhost:5050
```

### Credenciais padrão do Docker

```
PostgreSQL:
  Host: postgres (dentro da rede Docker) ou localhost:5432 (do host)
  User: helpdesk
  Password: helpdesk_password
  Database: helpdesk_db

pgAdmin:
  Email: admin@example.com
  Password: admin_password

Sistema Help Desk:
  Admin:    admin@helpdesk.local / 123456
  Usuário:  usuario@helpdesk.local / 123456
  Técnico:  tecnico@helpdesk.local / 123456
```

### Gerenciar Containers

```bash
# Parar containers
docker-compose down

# Parar e remover volumes (limpar dados)
docker-compose down -v

# Ver logs do backend
docker-compose logs -f backend

# Ver logs do PostgreSQL
docker-compose logs -f postgres

# Acessar shell do backend
docker-compose exec backend bash

# Acessar shell do PostgreSQL
docker-compose exec postgres psql -U helpdesk -d helpdesk_db
```

---

## 📦 Estrutura do docker-compose.yml

```yaml
services:
  postgres:
    # PostgreSQL 15 Alpine
    # Porta: 5432
    # Volume: postgres_data (persistente)
    
  backend:
    # Node.js backend
    # Porta: 3000
    # Depende de: postgres (espera saúde)
    
  nginx:
    # Proxy reverso + Servidor estático
    # Portas: 80 (HTTP), 443 (HTTPS)
    
  pgAdmin:
    # Gerenciador PostgreSQL
    # Porta: 5050
```

---

## 🔧 Passar para Outro Computador

### Opção A: Apenas código-fonte (requer setup local)

1. Copie a pasta `help-desk` inteira
2. Execute os passos da **Opção 1** acima

### Opção B: Com Docker (mais portável)

1. Copie a pasta `help-desk` inteira
2. Execute os passos da **Opção 2** acima (Docker Compose)
3. Nenhuma configuração adicional necessária — tudo está containerizado!

### Opção C: Backup do banco + código

```bash
# No computador atual:
docker-compose exec postgres pg_dump -U helpdesk -d helpdesk_db > backup.sql

# No novo computador:
docker-compose up -d postgres  # Aguarde inicializar
docker-compose exec postgres psql -U helpdesk -d helpdesk_db < backup.sql
docker-compose up -d  # Suba todo o stack
```

---

## 🛠️ Troubleshooting

### "Conexão recusada ao banco de dados"
- Verifique se PostgreSQL está rodando: `docker-compose ps postgres`
- Aguarde 30 segundos para o banco inicializar completamente
- Verifique credenciais no `.env`

### "Porta 3000 já em uso"
```bash
# Mudar porta no docker-compose.yml:
# ports:
#   - "3001:3000"

# Ou matar processo Node:
npx kill-port 3000  # Linux/Mac
Get-Process -Name node | Stop-Process  # PowerShell
```

### "pgAdmin não conecta ao PostgreSQL"
1. No pgAdmin, adicione servidor manualmente
2. Host: `postgres` (não localhost!)
3. User: `helpdesk`
4. Password: `helpdesk_password`

---

## 📝 Variáveis de Ambiente (.env)

```env
# Servidor
NODE_ENV=development
PORT=3000

# Banco de Dados
DB_HOST=localhost        # ou 'postgres' se usar Docker
DB_PORT=5432
DB_USER=helpdesk
DB_PASSWORD=helpdesk_password
DB_NAME=helpdesk_db

# JWT
JWT_SECRET=sua_chave_jwt_super_secreta_aqui
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## 🚀 Quick Start - Resumo

### Local
```bash
npm install
npm run migrate
node backend/src/seed.js
npm start
# http://localhost:3000
```

### Docker
```bash
docker-compose up -d
# http://localhost (ou :3000 direto)
```

---

## 📞 Suporte

Para problemas de conectividade, verifique:
1. `.env` tem as credenciais corretas
2. PostgreSQL está rodando e acessível
3. Porta 3000 não está em uso
4. Firewall não está bloqueando conexões

