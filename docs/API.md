# 📚 Documentação Técnica - Help Desk Corporativo v3.0

## 📑 Índice
1. [API REST](#api-rest)
2. [Modelos de Dados](#modelos-de-dados)
3. [Endpoints](#endpoints)
4. [Códigos de Status](#códigos-de-status)
5. [Tratamento de Erros](#tratamento-de-erros)

## 🔌 API REST

### Base URL
```
Development: http://localhost:3000/api
Production: https://helpdesk.seu-dominio.com/api
```

### Autenticação
Todos os endpoints (exceto login) requerem um JWT Token no header:

```
Authorization: Bearer seu_token_jwt_aqui
```

## 📊 Modelos de Dados

### Usuario
```json
{
  "id": 1,
  "nome": "João Silva",
  "email": "joao@helpdesk.local",
  "perfil": "administrador",
  "departamento": "TI",
  "telefone": "(85) 99999-9999",
  "ativo": true,
  "ultimo_acesso": "2026-05-29T10:30:00Z",
  "criado_em": "2026-01-01T00:00:00Z"
}
```

### Chamado
```json
{
  "id": 1,
  "numero_chamado": "CH-2026-001",
  "titulo": "Erro ao imprimir",
  "descricao": "Computador não consegue imprimir",
  "usuario_id": 2,
  "tecnico_id": 3,
  "categoria_id": 2,
  "prioridade": "media",
  "status": "em_atendimento",
  "sla_horas": 24,
  "data_vencimento": "2026-05-30T10:30:00Z",
  "data_resolucao": null,
  "criado_em": "2026-05-29T10:30:00Z",
  "atualizado_em": "2026-05-29T10:30:00Z"
}
```

## 🔗 Endpoints

### Autenticação

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "usuario": "admin@helpdesk.local",
  "senha": "123456"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "Administrador",
    "email": "admin@helpdesk.local",
    "perfil": "administrador"
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
Authorization: Bearer seu_token

{
  "refreshToken": "seu_refresh_token"
}
```

### Usuários

#### Listar Usuários
```http
GET /users?page=1&limit=10&perfil=tecnico
Authorization: Bearer seu_token
```

**Response (200):**
```json
{
  "total": 15,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": 1,
      "nome": "Técnico João",
      "email": "joao@helpdesk.local",
      "perfil": "tecnico"
    }
  ]
}
```

#### Obter Usuário
```http
GET /users/:id
Authorization: Bearer seu_token
```

#### Criar Usuário
```http
POST /users
Authorization: Bearer seu_token
Content-Type: application/json

{
  "nome": "Novo Usuário",
  "email": "novo@helpdesk.local",
  "senha": "senha_segura_123",
  "perfil": "tecnico",
  "departamento": "Suporte"
}
```

#### Atualizar Usuário
```http
PUT /users/:id
Authorization: Bearer seu_token
Content-Type: application/json

{
  "nome": "Nome Atualizado",
  "departamento": "TI"
}
```

#### Deletar Usuário
```http
DELETE /users/:id
Authorization: Bearer seu_token
```

### Chamados

#### Listar Chamados
```http
GET /tickets?status=aberto&prioridade=alta&page=1&limit=20
Authorization: Bearer seu_token
```

**Query Parameters:**
- `status`: aberto, em_atendimento, resolvido, fechado
- `prioridade`: baixa, media, alta, critica
- `categoria_id`: ID da categoria
- `usuario_id`: ID do usuário
- `page`: Número da página (default: 1)
- `limit`: Itens por página (default: 20)
- `sort`: Campo para ordenação (default: -criado_em)

**Response (200):**
```json
{
  "total": 45,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "id": 1,
      "numero_chamado": "CH-2026-001",
      "titulo": "Erro ao imprimir",
      "usuario": {
        "id": 2,
        "nome": "João Silva"
      },
      "status": "em_atendimento",
      "prioridade": "media"
    }
  ]
}
```

#### Obter Detalhes do Chamado
```http
GET /tickets/:id
Authorization: Bearer seu_token
```

**Response (200):**
```json
{
  "id": 1,
  "numero_chamado": "CH-2026-001",
  "titulo": "Erro ao imprimir",
  "descricao": "Computador não consegue imprimir",
  "usuario": {
    "id": 2,
    "nome": "João Silva",
    "email": "joao@empresa.com"
  },
  "tecnico": {
    "id": 3,
    "nome": "Técnico Maria"
  },
  "categoria": {
    "id": 2,
    "nome": "Impressora"
  },
  "prioridade": "media",
  "status": "em_atendimento",
  "atualizacoes": [
    {
      "id": 1,
      "tipo": "comentario",
      "descricao": "Iniciado atendimento",
      "usuario": {
        "nome": "Técnico Maria"
      },
      "criado_em": "2026-05-29T10:30:00Z"
    }
  ],
  "anexos": [
    {
      "id": 1,
      "nome_arquivo": "relatorio.pdf",
      "url": "/uploads/chamados/CH-2026-001/relatorio.pdf",
      "tamanho": 2048000
    }
  ],
  "criado_em": "2026-05-29T08:00:00Z",
  "atualizado_em": "2026-05-29T10:30:00Z"
}
```

#### Criar Chamado
```http
POST /tickets
Authorization: Bearer seu_token
Content-Type: application/json

{
  "titulo": "Erro ao conectar na rede",
  "descricao": "Meu computador não consegue conectar na rede corporativa",
  "categoria_id": 2,
  "prioridade": "alta"
}
```

**Response (201):**
```json
{
  "id": 45,
  "numero_chamado": "CH-2026-045",
  "titulo": "Erro ao conectar na rede",
  "status": "aberto",
  "message": "Chamado criado com sucesso"
}
```

#### Atualizar Chamado
```http
PUT /tickets/:id
Authorization: Bearer seu_token
Content-Type: application/json

{
  "status": "em_atendimento",
  "tecnico_id": 3,
  "prioridade": "critica"
}
```

#### Adicionar Comentário
```http
POST /tickets/:id/comments
Authorization: Bearer seu_token
Content-Type: application/json

{
  "descricao": "Problema identificado: driver da impressora desatualizado"
}
```

#### Upload de Anexo
```http
POST /tickets/:id/upload
Authorization: Bearer seu_token
Content-Type: multipart/form-data

Form Data:
- file: (arquivo até 10MB)
```

#### Resolver Chamado
```http
PUT /tickets/:id/resolve
Authorization: Bearer seu_token
Content-Type: application/json

{
  "solucao": "Reinstalei o driver e reiniciei a impressora. Problema resolvido."
}
```

#### Fechar Chamado
```http
PUT /tickets/:id/close
Authorization: Bearer seu_token
Content-Type: application/json

{
  "avaliacao": 5,
  "comentario_avaliacao": "Excelente atendimento!"
}
```

### Categorias

#### Listar Categorias
```http
GET /categories
Authorization: Bearer seu_token
```

**Response (200):**
```json
[
  {
    "id": 1,
    "nome": "Computador",
    "descricao": "Problemas com computadores",
    "ativo": true
  }
]
```

### Equipamentos (Inventário)

#### Listar Equipamentos
```http
GET /equipment?tipo=computador&status=ativo
Authorization: Bearer seu_token
```

#### Criar Equipamento
```http
POST /equipment
Authorization: Bearer seu_token
Content-Type: application/json

{
  "tipo": "computador",
  "modelo": "Dell OptiPlex 7090",
  "serie": "ABC123456",
  "localizacao": "Sala 101",
  "status": "ativo",
  "responsavel_id": 2
}
```

### Dashboard

#### Métricas Gerais
```http
GET /dashboard/metrics
Authorization: Bearer seu_token
```

**Response (200):**
```json
{
  "chamados_abertos": 5,
  "chamados_atendimento": 3,
  "chamados_resolvidos_hoje": 8,
  "sla_vencido": 1,
  "tempo_medio_resolucao": 4.5,
  "taxa_satisfacao": 4.8
}
```

#### Relatório de SLA
```http
GET /reports/sla?data_inicio=2026-05-01&data_fim=2026-05-29
Authorization: Bearer seu_token
```

## 🔢 Códigos de Status

| Código | Significado | Descrição |
|--------|------------|-----------|
| 200 | OK | Requisição bem-sucedida |
| 201 | Created | Recurso criado com sucesso |
| 204 | No Content | Sucesso, sem conteúdo |
| 400 | Bad Request | Erro na requisição |
| 401 | Unauthorized | Não autenticado |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito (ex: email duplicado) |
| 422 | Unprocessable Entity | Validação falhou |
| 500 | Internal Server Error | Erro no servidor |

## ⚠️ Tratamento de Erros

### Formato de Erro Padrão
```json
{
  "error": "Descrição do erro",
  "code": "ERROR_CODE",
  "details": {
    "field": "Qual campo"
  }
}
```

### Exemplos

#### Validação
```json
{
  "error": "Erro de validação",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ]
}
```

#### Não Autenticado
```json
{
  "error": "Token de autenticação não encontrado",
  "code": "NO_TOKEN"
}
```

#### Token Expirado
```json
{
  "error": "Token expirado",
  "code": "TOKEN_EXPIRED"
}
```

## 🔄 Rate Limiting

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1622505600
```

Limite: 100 requisições por 15 minutos por IP

## 📋 Paginação

Todos os endpoints de listagem suportam paginação:

```http
GET /tickets?page=2&limit=50
```

**Response inclui:**
```json
{
  "total": 250,
  "page": 2,
  "limit": 50,
  "pages": 5,
  "data": []
}
```

## 🔄 Webhooks (Planejado)

```json
POST https://seu-servidor.com/webhook

{
  "evento": "chamado.criado",
  "dados": {
    "id": 1,
    "numero": "CH-2026-001"
  },
  "timestamp": "2026-05-29T10:30:00Z"
}
```

---

**Documentação v3.0 | 29/05/2026**
