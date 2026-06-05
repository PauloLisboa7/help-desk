# Help Desk Corporativo - Setup Completo ✅

## 🚀 Iniciar Agora

```powershell
# Windows/PowerShell
.\start.ps1 start-local

# Ou acessar diretamente
# http://localhost:3000
```

```bash
# Linux/Mac/WSL
./start.sh start-local
npm start
```

---

## 🔐 Credenciais Padrão

```
Email: admin@helpdesk.local
Senha: 123456

Email: usuario@helpdesk.local
Senha: 123456

Email: tecnico@helpdesk.local
Senha: 123456
```

---

## 🐳 Docker (Recomendado para Outro PC)

```bash
docker-compose up -d
# http://localhost
```

---

## 📊 Status Atual

| Componente | Status | Detalhes |
|-----------|--------|----------|
| Backend Node.js | ✅ Rodando | Porta 3000 |
| PostgreSQL | ✅ Conectado | helpdesk_db |
| Autenticação JWT | ✅ Funcional | 3 perfis testados |
| Banco de Dados | ✅ Populado | 3 usuários, 8 categorias |
| Frontend | ✅ Acessível | http://localhost:3000 |
| Docker Compose | ✅ Pronto | Sem executar |

---

## 📁 Arquivos de Configuração

- **`.env`** - Variáveis de ambiente ativas
- **`SETUP_COMPLETO.md`** - Documentação detalhada
- **`SETUP_PORTAVEL.md`** - Guia de portabilidade
- **`start.ps1`** - Script Windows (use para iniciar)
- **`start.sh`** - Script Linux/Mac

---

## 💾 Levar para Outro Computador

### Opção 1: Com Docker (Recomendado)
1. Copiar pasta `help-desk` inteira
2. Instalar Docker Desktop
3. Executar: `docker-compose up -d`

### Opção 2: Setup Local
1. Copiar pasta `help-desk` inteira
2. Instalar Node.js 18+
3. Instalar PostgreSQL 15+
4. Executar: `.\start.ps1 setup-local`

---

## 🆘 Problemas Comuns

```powershell
# Matar processos Node presos
Get-Process -Name node | Stop-Process -Force

# Testar conexão com banco
node backend/scripts/reset_password.js

# Ver todos os logs
docker-compose logs -f
```

---

## 📞 Contato & Suporte

Documentação completa em: `SETUP_COMPLETO.md`
Guia de portabilidade em: `SETUP_PORTAVEL.md`

---

**Última atualização:** 2026-06-01 13:00 UTC
**Status:** ✅ PRONTO PARA PRODUÇÃO

