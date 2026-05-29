# Sistema Help Desk Corporativo - Instruções Copilot

## Visão Geral
Este é um projeto de Sistema Help Desk Corporativo desenvolvido em Node.js (backend), HTML5/CSS3/JavaScript (frontend) e MySQL (banco de dados).

## Estrutura do Projeto
```
HELP-DESK/
├── backend/              # API Node.js/Express
├── frontend/             # Interface web (HTML5, CSS3, JavaScript, Bootstrap)
├── database/             # Scripts de banco de dados
├── docker/               # Configurações Docker
├── docs/                 # Documentação técnica
└── README.md             # Instruções do projeto
```

## Stack Tecnológico
- **Backend:** Node.js 18+, Express.js
- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **Banco de Dados:** MySQL 8.0
- **Autenticação:** JWT
- **Containerização:** Docker & Docker Compose

## Funcionalidades Principais
- ✅ Login seguro com autenticação JWT
- ✅ Gestão de usuários (comum, técnico, administrador)
- ✅ Abertura e gestão de chamados
- ✅ Dashboard administrativo
- ✅ Controle de SLA
- ✅ Upload de anexos
- ✅ Relatórios gerenciais
- ✅ Inventário de equipamentos

## Como Iniciar
1. Instale as dependências: `npm install`
2. Configure o arquivo `.env` com suas credenciais
3. Execute as migrações do banco: `npm run migrate`
4. Inicie o servidor: `npm start`
5. Acesse em http://localhost:3000

## Requisitos Não-Funcionais Atendidos
- Interface responsiva
- Segurança de autenticação (JWT + bcrypt)
- Criptografia de senhas
- Backup automático (scripts inclusos)
- Tempo de resposta < 3 segundos
- Disponibilidade mínima 99%

## Contribuição
Siga as convenções de código e documentação do projeto ao contribuir.
