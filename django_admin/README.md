# Django Admin Panel - Help Desk Corporativo

## 🚀 Instalação e Execução

### 1. Criar ambiente virtual Python
```bash
cd backend/django_admin
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 2. Instalar dependências
```bash
pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e configure as credenciais do PostgreSQL:
```
DB_NAME=helpdesk_db
DB_USER=helpdesk
DB_PASSWORD=helpdesk_password
DB_HOST=localhost
DB_PORT=5432
```

### 4. Executar servidor Django
```bash
python manage.py runserver 8000
```

### 5. Acessar o painel admin
```
http://localhost:8000/admin/
```

## 👤 Login Admin

Use as mesmas credenciais do Help Desk Node.js:
- **Email**: admin@helpdesk.local
- **Senha**: 123456

> ⚠️ **NOTA**: As credenciais no Django admin devem ser criadas via `createsuperuser`. 
> O Django e Node.js compartilham a mesma tabela de usuários (`usuarios`), 
> mas o Django usa sua própria tabela `auth_user` para autenticação de admin.

## 📋 Funcionalidades

O painel Django admin oferece gerenciamento completo de:

- **Usuários**: CRUD completo, visualização de perfis, status ativo/inativo
- **Chamados**: Visualização, edição de status, atribuição de técnicos, histórico
- **Categorias**: Gerenciamento de categorias e níveis de suporte
- **Equipamentos**: Inventário com status, responsável, data de aquisição
- **Atualizações**: Histórico de mudanças em chamados
- **Anexos**: Gerenciamento de arquivos
- **Auditoria**: Log completo de ações do sistema

## 🔐 Segurança em Produção

Antes de colocar em produção:
1. Mudar `SECRET_KEY` em `settings.py`
2. Definir `DEBUG = False`
3. Configurar `ALLOWED_HOSTS` com domínios válidos
4. Usar HTTPS
5. Configurar um arquivo `.env` com variáveis seguras

## 📦 Estrutura

```
django_admin/
├── manage.py                    # Utilidades Django
├── requirements.txt             # Dependências Python
├── helpdesk_admin/
│   ├── settings.py             # Configuração Django
│   ├── urls.py                 # URLs do projeto
│   ├── wsgi.py                 # Configuração WSGI
│   └── core/
│       ├── models.py           # Modelos de dados (refletindo o PostgreSQL)
│       ├── admin.py            # Customização do admin Django
│       ├── views.py            # Views (opcional)
│       └── apps.py             # Configuração da aplicação
```

## 🔗 Integração com Node.js

- O Django e Node.js **compartilham o mesmo banco de dados PostgreSQL**
- Os modelos Django espelham a estrutura do banco criado pelo Node.js
- Django usa `managed = False` para não criar/alterar tabelas
- Ambos podem rodar simultaneamente em portas diferentes (Node: 3000, Django: 8000)

## 📝 Notas

- O Django admin usa a tabela `auth_user` interna para autenticação
- O histórico de usuários compartilhados fica na tabela `usuarios` (Node.js)
- Consulte a documentação Django para customizações adicionais
