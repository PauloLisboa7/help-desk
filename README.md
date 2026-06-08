# 🎫 Sistema Help Desk Corporativo v3.0

Plataforma web completa para gerenciamento de chamados técnicos corporativos, desenvolvida em **Node.js**, **Express.js**, **MySQL** e **Bootstrap 5**.

## 📋 Sumário

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Arquitetura](#arquitetura)
- [Stack Tecnológico](#stack-tecnológico)
- [Documentação](#documentação)

## ✨ Características

- ✅ **Autenticação Segura** - JWT + BCrypt
- ✅ **Gerenciamento de Chamados** - Abertura, atribuição e acompanhamento
- ✅ **Dashboard Administrativo** - Métricas e relatórios em tempo real
- ✅ **Controle de SLA** - Monitoramento de prazos de atendimento
- ✅ **Gerenciamento de Usuários** - 3 níveis de perfil (comum, técnico, admin)
- ✅ **Inventário de Equipamentos** - Controle de computadores, impressoras e rede
- ✅ **Sistema de Prioridades** - Baixa, Média, Alta e Crítica
- ✅ **Upload de Anexos** - Até 10MB por arquivo
- ✅ **Interface Responsiva** - Funciona em desktop, tablet e mobile
- ✅ **Containerização Docker** - Deploy simplificado

## 🛠️ Requisitos

### Desenvolvimento Local

- **Node.js** v18.0.0+
- **npm** ou **yarn**
- **MySQL** 8.0+
- **Git**

### Produção (Docker)

- **Docker** 20.0+
- **Docker Compose** 1.29+

## 📦 Instalação

### 1. Clonar o Repositório

```bash
git clone <seu-repositorio>
cd HELP-DESK
```

### 2. Instalação Local (Desenvolvimento)

```bash
# Instalar dependências
npm install

# Copiar arquivo de configuração
cp .env.example .env

# Configurar variáveis de ambiente
# Edite o arquivo .env com suas credenciais do banco de dados
```

### 3. Configurar Banco de Dados

```bash
# Criar banco de dados
mysql -u root -p -e "CREATE DATABASE helpdesk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Importar schema
mysql -u helpdesk -p helpdesk_db < database/schema.sql
```

### 4. Iniciar em Desenvolvimento

```bash
# Com nodemon (recarrega automático)
npm run dev

# Ou produção
npm start
```

A aplicação estará acessível em `http://localhost:3000`

## 🐳 Instalação com Docker

```bash
# Construir e iniciar containers
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Parar containers
docker-compose down
```

**Acessos:**
- Frontend: `http://localhost`
- Backend: `http://localhost:3000`
- PHPMyAdmin: `http://localhost:8080`

## 🎛️ Painel Django Admin

Um painel administrativo completo rodando em Django para gerenciar toda a aplicação.

### Inicialização Rápida

#### Windows
```bash
cd backend/django_admin
setup.bat
```

#### Linux/Mac
```bash
cd backend/django_admin
bash setup.sh
```

### Rodar o Painel Django

#### Windows
```bash
cd backend/django_admin
run.bat
```

#### Linux/Mac
```bash
cd backend/django_admin
bash run.sh
```

Acesse em: **`http://localhost:8000/admin/`**

### Funcionalidades do Django Admin

- 👤 **Gerenciamento de Usuários** - CRUD, perfis, status
- 🎫 **Chamados** - Visualizar, editar, atribuir técnicos
- 📂 **Categorias** - Gerenciar categorias e níveis de suporte
- 📦 **Equipamentos** - Inventário completo
- 📝 **Atualizações** - Histórico de mudanças
- 📎 **Anexos** - Gerenciar arquivos
- 🔐 **Logs de Auditoria** - Rastreamento de ações

### Dados Compartilhados

O Django admin e o Node.js **compartilham o mesmo banco de dados PostgreSQL**, permitindo:
- Gerenciar dados em tempo real
- Sincronização automática entre aplicações
- Ambos rodando simultaneamente (Node: 3000, Django: 8000)

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
# Servidor
NODE_ENV=development
PORT=3000

# Banco de Dados
DB_HOST=localhost
DB_PORT=3306
DB_USER=helpdesk
DB_PASSWORD=sua_senha
DB_NAME=helpdesk_db

# JWT
JWT_SECRET=sua_chave_jwt_super_secreta
JWT_EXPIRE=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app

# SLA Padrão (horas)
SLA_CRITICAL=4
SLA_HIGH=8
SLA_MEDIUM=24
SLA_LOW=72
```

## 🚀 Uso

### Acessar o Sistema

1. Abra `http://localhost:3000` no navegador
2. Faça login com credenciais padrão:
   - **Usuário:** `admin@helpdesk.local`
   - **Senha:** `123456` (alterar após primeiro acesso!)

### Perfis de Usuário

| Perfil | Permissões |
|--------|-----------|
| **Comum** | Abrir chamados, acompanhar seus chamados |
| **Técnico** | Atender chamados, criar atualizações, fechar tickets |
| **Administrador** | Acesso total, gerenciar usuários, relatórios |

### Principais Funcionalidades

#### 1. Dashboard
- Visualizar métricas de chamados
- Monitor de SLA em tempo real
- Gráficos de produtividade

#### 2. Novo Chamado
- Título e descrição detalhada
- Seleção de categoria
- Definir prioridade
- Anexar arquivos

#### 3. Gerenciamento de Chamados
- Listar chamados por status
- Buscar e filtrar
- Atualizar status
- Adicionar comentários
- Anexar documentos

#### 4. Inventário
- Registrar equipamentos
- Controlar localização
- Marcar como ativo/inativo
- Histórico de manutenção

## 🏗️ Arquitetura

### Estrutura de Diretórios

```
HELP-DESK/
├── backend/
│   ├── src/
│   │   ├── app.js              # Aplicação Express
│   │   ├── config/
│   │   │   └── database.js     # Configuração BD
│   │   ├── controllers/        # Lógica de negócio
│   │   ├── routes/             # Definição de rotas
│   │   ├── models/             # Modelos de dados
│   │   └── middleware/         # Middlewares (auth, etc)
│   └── package.json
├── frontend/
│   ├── index.html              # Tela de login
│   ├── pages/
│   │   └── dashboard.html      # Dashboard
│   ├── css/
│   │   └── style.css           # Estilos globais
│   └── js/
│       ├── auth.js             # Autenticação
│       └── dashboard.js        # Dashboard JS
├── database/
│   ├── schema.sql              # Schema inicial
│   └── migrations/             # Scripts de migração
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   └── nginx.conf
├── docs/                       # Documentação
└── README.md
```

### Fluxo de Autenticação

```
Login → Validar Credenciais → Gerar JWT → Armazenar LocalStorage → Redirecionar Dashboard
```

### Fluxo de Chamado

```
Usuário Comum
↓
Abre Chamado
↓
Triagem (Atribuição)
↓
Técnico em Atendimento
↓
Solução/Resolução
↓
Fechamento
↓
Usuário Avalia
```

## 💾 Stack Tecnológico

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.18+
- **Banco de Dados:** MySQL 8.0
- **Autenticação:** JWT (jsonwebtoken)
- **Criptografia:** BCrypt.js
- **Validação:** Express-validator
- **Segurança:** Helmet, CORS

### Frontend
- **Markup:** HTML5
- **Estilos:** CSS3 + Bootstrap 5
- **Interatividade:** JavaScript (ES6+)
- **Ícones:** Font Awesome 6
- **Armazenamento:** LocalStorage

### DevOps
- **Containerização:** Docker
- **Orquestração:** Docker Compose
- **Proxy Reverso:** Nginx
- **SSL/TLS:** Self-signed (produção usar CA)

## 📊 Requisitos Não-Funcionais Atendidos

| Requisito | Status | Descrição |
|-----------|--------|-----------|
| Interface Responsiva | ✅ | Funciona em desktop, tablet e mobile |
| Segurança JWT | ✅ | Tokens com expiração e refresh |
| Criptografia de Senhas | ✅ | BCrypt com salt 10 |
| Backup Automático | ⏳ | Scripts SQL prontos |
| Tempo de Resposta | ✅ | < 3 segundos (otimizado) |
| Disponibilidade | ✅ | 99% com Docker + Health Checks |

## 🔐 Segurança

- **HTTPS:** Configurado no Nginx
- **CORS:** Restrito ao domínio
- **Helmet:** Headers de segurança
- **JWT:** Token com expiração
- **BCrypt:** Hashing de senhas
- **SQL Injection:** Prepared statements
- **XSS:** Sanitização de inputs

## 📈 Monitoramento e Logs

```bash
# Ver logs do backend
docker logs helpdesk-backend

# Ver logs do Nginx
docker logs helpdesk-nginx

# Ver logs do MySQL
docker logs helpdesk-mysql
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 📞 Suporte

Para dúvidas ou problemas:
- 📧 Email: suporte@helpdesk.local
- 💬 Chat: Contate o departamento de TI
- 📚 Documentação: Ver pasta `/docs`

## 🎯 Roadmap

- [ ] Integração com Azure DevOps
- [ ] Dashboard de análise preditiva
- [ ] Mobile app nativa (React Native)
- [ ] Integração com Slack/Teams
- [ ] Chat em tempo real
- [ ] Gamificação (pontos, badges)
- [ ] API GraphQL
- [ ] Multilíngue

## 📄 Documentação Adicional

- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture](docs/ARCHITECTURE.md)

---

**Desenvolvido com ❤️ para Técnico em Desenvolvimento de Sistemas 2025.1.22**

Versão: 3.0 | Data: 29/05/2026
