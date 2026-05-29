# 🏗️ Arquitetura - Help Desk Corporativo

## 📐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                   │
│  HTML5 | CSS3 | JavaScript | Bootstrap 5                    │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────────────────────────────┐
│                    NGINX (Proxy Reverso)                     │
│  - SSL/TLS Termination                                       │
│  - Load Balancing                                            │
│  - Static File Serving                                       │
│  - Rate Limiting                                             │
└──────────────┬──────────────────────────────────────────────┘
               │
     ┌─────────┼─────────┐
     │         │         │
┌────▼──┐ ┌────▼──┐ ┌────▼──┐
│ App 1 │ │ App 2 │ │ App N │  Node.js + Express
└────┬──┘ └────┬──┘ └────┬──┘
     │         │         │
     └─────────┼─────────┘
               │
         ┌─────▼─────┐
         │  MySQL 8  │
         │  Database │
         └───────────┘
```

## 🔄 Arquitetura em Camadas

### 1. Presentation Layer (Frontend)

**Responsabilidade:** Interface do usuário

```
frontend/
├── index.html          → Tela de Login
├── pages/
│   ├── dashboard.html  → Dashboard Principal
│   └── ...
├── css/
│   └── style.css       → Estilos globais
└── js/
    ├── auth.js         → Autenticação JWT
    └── dashboard.js    → Lógica do Dashboard
```

**Tecnologias:**
- HTML5 semântico
- CSS3 com flexbox/grid
- JavaScript ES6+
- Bootstrap 5 components

**Fluxo de Dados:**
```
User Input → Validação → API Call → LocalStorage → Render UI
```

### 2. API Layer (Backend)

**Responsabilidade:** Lógica de negócio e integração com BD

```
backend/src/
├── app.js              → Express Server
├── config/
│   └── database.js     → Conexão MySQL
├── routes/
│   ├── authRoutes.js   → /auth
│   ├── userRoutes.js   → /users
│   └── ticketRoutes.js → /tickets
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   └── ticketController.js
├── models/
│   ├── User.js
│   ├── Ticket.js
│   └── Equipment.js
└── middleware/
    ├── auth.js         → JWT Authentication
    └── errorHandler.js → Error Handling
```

**Padrão de Requisição:**
```
Client Request
    ↓
Nginx Proxy
    ↓
Express Route
    ↓
Middleware (Auth, Validation)
    ↓
Controller (Business Logic)
    ↓
Database Query
    ↓
Response (JSON)
```

### 3. Data Layer (Database)

**Responsabilidade:** Persistência de dados

```
MySQL Database
├── usuarios              → Usuários do sistema
├── chamados              → Tickets de suporte
├── categorias            → Categorias de tickets
├── equipamentos          → Inventário
├── anexos                → Arquivos anexados
├── atualizacoes_chamados → Histórico de atualizações
├── logs_auditoria        → Auditoria
└── configuracao_sla      → Configuração de SLA
```

**Relações:**

```
usuarios (1) ─────── (N) chamados
  │
  ├─ (1) ────────── (N) atualizacoes_chamados
  └─ (1) ────────── (N) equipamentos

chamados (1) ─────── (N) anexos
  │
  └─ (1) ────────── (N) atualizacoes_chamados

categorias (1) ────── (N) chamados

configuracao_sla (N) ─ (N) chamados
```

## 🔐 Fluxo de Segurança

### Autenticação (JWT)

```
1. Login Request (email + senha)
   ↓
2. Validar credenciais contra BD
   ↓
3. Comparar hash de senha (BCrypt)
   ↓
4. Gerar JWT Token
   ├─ Claims: id, email, perfil, nome
   ├─ Expiration: 7 dias
   └─ Secret: JWT_SECRET (env)
   ↓
5. Retornar token ao cliente
   ↓
6. Cliente armazena em LocalStorage
   ↓
7. Enviar em Authorization: Bearer token
```

### Autorização (Role-Based)

```
Request com Token
   ↓
Validar token
   ↓
Extrair perfil do usuário
   ↓
Verificar permissão
   ├─ comum: abrir chamados
   ├─ tecnico: atender chamados
   └─ administrador: acesso total
   ↓
Permitir/Negar acesso
```

## 📊 Fluxo de Negócio - Chamado

```
┌────────────────────────────────────────────────┐
│ USUÁRIO COMUM abre novo chamado                │
└────────────┬─────────────────────────────────┘
             ↓
        POST /tickets
        {titulo, categoria, prioridade, ...}
             ↓
┌────────────────────────────────────────────────┐
│ Validar dados                                  │
│ - Campos obrigatórios                         │
│ - Valores válidos                             │
└────────────┬─────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────┐
│ Criar registro no BD                           │
│ - Gerar número sequencial                     │
│ - Status: "aberto"                            │
│ - SLA: calculado pela prioridade              │
│ - Data vencimento: criado_em + SLA            │
└────────────┬─────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────┐
│ Notificar TI (email)                           │
│ Criar entrada no log de auditoria             │
└────────────┬─────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────┐
│ TÉCNICO recebe e atribui para si               │
│ Status → "em_atendimento"                     │
└────────────┬─────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────┐
│ TÉCNICO trabalha no chamado                    │
│ - Adiciona comentários                         │
│ - Anexa documentos                             │
│ - Muda status se necessário                    │
└────────────┬─────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────┐
│ TÉCNICO marca como resolvido                   │
│ - Adiciona solução                             │
│ - Status → "resolvido"                         │
│ - Data resolução: agora                        │
└────────────┬─────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────┐
│ USUÁRIO avalia o atendimento                   │
│ - Visualiza solução                            │
│ - Deixa feedback (1-5 estrelas)                │
│ - Status → "fechado"                           │
└────────────┬─────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────┐
│ Arquivo finalizado                             │
│ - Gerar relatório                              │
│ - Atualizar métricas                           │
│ - Calcular SLA compliance                      │
└────────────────────────────────────────────────┘
```

## 📈 Escalabilidade

### Horizontal Scaling

```
Load Balancer (Nginx)
    ↓
├─ Backend Server 1 (Port 3001)
├─ Backend Server 2 (Port 3002)
├─ Backend Server 3 (Port 3003)
└─ Backend Server N (Port 300N)
    ↓
Shared MySQL Database
```

**Com Docker:**
```bash
docker-compose up -d --scale backend=3
```

### Vertical Scaling

- Aumentar CPU/RAM dos servidores
- Optimizar queries com índices
- Cache em Redis (futuro)
- CDN para assets estáticos

## 🔄 Integração Contínua

```
GitHub Push
    ↓
GitHub Actions Workflow
    ↓
├─ Lint & Format
├─ Unit Tests
├─ Build Docker Image
├─ Push to Registry
└─ Deploy to Production
    ↓
Nginx Reload
    ↓
Health Check
    ↓
Monitoramento
```

## 🛡️ Resiliência

### Retry Logic

```
Request falha
    ↓
Retry com backoff exponencial
    ↓
Max retries atingido?
    ├─ Não → tentar novamente
    └─ Sim → erro para usuário
```

### Circuit Breaker

```
Se fail rate > 50% em 1 minuto
    ↓
Circuit abre (rejeita requisições)
    ↓
Aguarda 30 segundos
    ↓
Tenta recuperação
```

### Health Checks

```
Docker:
HEALTHCHECK --interval=30s --timeout=10s --retries=3
  CMD curl http://localhost:3000/api/health

Nginx:
upstream backend {
  server backend:3000 max_fails=3 fail_timeout=30s;
}
```

## 📊 Performance Optimization

### Frontend
- Minificação CSS/JS
- Lazy loading de imagens
- Cache buster para assets
- Service Workers (PWA)

### Backend
- Índices no BD
- Query optimization
- Connection pooling
- Caching com Redis (futuro)

### Database
- Índices em campos frequentes
- Particionamento (para tabelas grandes)
- Limpeza de dados antigos
- Backup automático

## 🔍 Monitoramento

### Métricas Coletadas

```
├─ Application
│  ├─ Response time
│  ├─ Requests/segundo
│  ├─ Error rate
│  └─ CPU/Memory
│
├─ Database
│  ├─ Query time
│  ├─ Connections
│  ├─ Slow queries
│  └─ Disk usage
│
└─ Sistema
   ├─ Uptime
   ├─ Network I/O
   ├─ Disk I/O
   └─ Load average
```

## 🚀 Deployment Strategy

### Blue-Green Deployment

```
Blue (Atual)
    ↓
Green (Nova versão)
    ↓
Testes em Green
    ↓
Sucesso? → Switch traffic para Green
Falha? → Revert para Blue
```

### Canary Deployment

```
10% tráfego → Nova versão
Monitor por 5 minutos
Sem erros? → 50% tráfego
Sem erros? → 100% tráfego
```

---

**Documentação de Arquitetura v3.0 | 29/05/2026**
