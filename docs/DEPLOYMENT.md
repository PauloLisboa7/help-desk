# 🐳 Guia de Deployment - Help Desk Corporativo

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Deployment em Docker](#deployment-em-docker)
3. [Deployment em Servidor Linux](#deployment-em-servidor-linux)
4. [CI/CD com GitHub Actions](#cicd-com-github-actions)
5. [Monitoramento](#monitoramento)
6. [Backup e Recovery](#backup-e-recovery)

## ✅ Pré-requisitos

### Docker Deployment
- Docker 20.0+
- Docker Compose 1.29+
- 2GB RAM mínimo
- 10GB espaço em disco

### Linux Deployment
- Ubuntu 20.04 LTS+
- Node.js 18+
- MySQL 8.0+
- Nginx 1.18+
- 2GB RAM mínimo
- Certificado SSL válido

## 🐳 Deployment em Docker

### 1. Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone do Repositório

```bash
cd /opt
git clone https://github.com/seu-usuario/help-desk.git
cd help-desk
```

### 3. Configuração de Variáveis

```bash
# Copiar arquivo de ambiente
cp .env.example .env

# Editar com suas credenciais
nano .env
```

**Variáveis críticas para produção:**
```env
NODE_ENV=production
DB_PASSWORD=senha_forte_aqui_123!@#
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
CORS_ORIGIN=https://seu-dominio.com
```

### 4. Gerar Certificados SSL

```bash
# Criar diretório SSL
mkdir -p docker/ssl

# Gerar certificado auto-assinado (teste)
openssl req -x509 -newkey rsa:4096 -keyout docker/ssl/key.pem -out docker/ssl/cert.pem -days 365 -nodes

# Ou usar Let's Encrypt (recomendado para produção)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --standalone -d seu-dominio.com
sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem docker/ssl/cert.pem
sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem docker/ssl/key.pem
```

### 5. Iniciar Containers

```bash
# Construir imagens
docker-compose build

# Iniciar em background
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

### 6. Acessar a Aplicação

```
Frontend: https://seu-dominio.com
Backend: https://seu-dominio.com/api
PHPMyAdmin: https://seu-dominio.com:8080
```

## 🐧 Deployment em Servidor Linux

### 1. Instalar Dependências

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL
sudo apt install -y mysql-server

# Nginx
sudo apt install -y nginx

# Git
sudo apt install -y git

# PM2 (process manager)
sudo npm install -g pm2
```

### 2. Clonar e Configurar

```bash
cd /opt
git clone https://github.com/seu-usuario/help-desk.git
cd help-desk

# Instalar dependências
npm install --production

# Copiar .env
cp .env.example .env
nano .env
```

### 3. Configurar Banco de Dados

```bash
# Login no MySQL
sudo mysql -u root -p

# Executar SQL
CREATE DATABASE helpdesk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'helpdesk'@'localhost' IDENTIFIED BY 'senha_forte';
GRANT ALL PRIVILEGES ON helpdesk_db.* TO 'helpdesk'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Importar schema
mysql -u helpdesk -p helpdesk_db < database/schema.sql
```

### 4. Configurar PM2

```bash
# Criar arquivo de configuração
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'help-desk',
    script: './backend/src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Iniciar com PM2
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Iniciar no boot
pm2 startup systemd -u $USER --hp /home/$USER
```

### 5. Configurar Nginx

```bash
# Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/help-desk

# Conteúdo:
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    root /opt/help-desk/frontend;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads {
        alias /opt/help-desk/uploads;
        expires 30d;
    }
}

# Ativar site
sudo ln -s /etc/nginx/sites-available/help-desk /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Restart
sudo systemctl restart nginx
```

### 6. Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot certonly --nginx -d seu-dominio.com

# Auto-renovação
sudo systemctl enable certbot.timer
```

## 🔄 CI/CD com GitHub Actions

### 1. Criar Arquivo de Workflow

```bash
mkdir -p .github/workflows
nano .github/workflows/deploy.yml
```

**Conteúdo:**
```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker Image
      run: docker-compose build
    
    - name: Push to Registry
      run: |
        docker login -u ${{ secrets.DOCKER_USER }} -p ${{ secrets.DOCKER_PASSWORD }}
        docker tag help-desk:latest ${{ secrets.DOCKER_USER }}/help-desk:latest
        docker push ${{ secrets.DOCKER_USER }}/help-desk:latest
    
    - name: Deploy to Server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          cd /opt/help-desk
          git pull origin main
          docker-compose down
          docker-compose up -d
          docker-compose exec -T backend npm run migrate
```

## 📊 Monitoramento

### PM2 Monitoramento

```bash
# Instalar ferramentas
pm2 install pm2-auto-restart
pm2 install pm2-logrotate

# Dashboard
pm2 monit

# Logs
pm2 logs help-desk
```

### Docker Monitoramento

```bash
# Ver uso de recursos
docker stats

# Logs em tempo real
docker-compose logs -f

# Health check
docker inspect helpdesk-backend | grep Health
```

### Prometheus + Grafana (Avançado)

```bash
# Adicionar ao docker-compose.yml
prometheus:
  image: prom/prometheus:latest
  volumes:
    - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana:latest
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=senha
```

## 💾 Backup e Recovery

### Backup Automático de Banco de Dados

```bash
# Script: backup.sh
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="helpdesk_db"
DB_USER="helpdesk"
DB_PASSWORD=$(grep DB_PASSWORD /opt/help-desk/.env | cut -d '=' -f2)

mkdir -p $BACKUP_DIR

# Backup
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Manter últimos 7 dias
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup concluído: $BACKUP_DIR/backup_$DATE.sql.gz"

# Adicionar ao crontab
crontab -e
# Adicionar: 0 2 * * * /opt/help-desk/backup.sh
```

### Restore de Backup

```bash
# Restaurar banco
gunzip < /opt/backups/backup_YYYYMMDD_HHMMSS.sql.gz | mysql -u helpdesk -p helpdesk_db
```

### Backup de Arquivos

```bash
# Backup de uploads
tar -czf /opt/backups/uploads_$(date +%Y%m%d).tar.gz /opt/help-desk/uploads/

# Backup completo
tar -czf /opt/backups/full_backup_$(date +%Y%m%d).tar.gz /opt/help-desk/ \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='logs'
```

## 🚨 Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
docker-compose logs help-desk-backend

# Verificar status do BD
docker-compose logs help-desk-mysql

# Reiniciar
docker-compose restart
```

### Banco de dados recusa conexão

```bash
# Verificar conexão
docker-compose exec mysql mysql -u helpdesk -p helpdesk_db -e "SELECT 1"

# Reiniciar MySQL
docker-compose restart mysql

# Dar tempo de inicialização
sleep 30
```

### Falta de espaço em disco

```bash
# Verificar uso
df -h

# Limpar images Docker não utilizadas
docker image prune -a

# Limpar volumes
docker volume prune
```

---

**Guia de Deployment v3.0 | 29/05/2026**
