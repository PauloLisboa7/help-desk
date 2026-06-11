#!/usr/bin/env pwsh
# Script de inicialização rápida do Help Desk (Windows/PowerShell)

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

Write-Host "Help Desk Corporativo - Inicializador" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

switch ($Command) {
    "start-local" {
        Write-Host "Iniciando servidor Node local..." -ForegroundColor Yellow
        npm start
    }

    "start-django" {
        Write-Host "Iniciando painel Django..." -ForegroundColor Yellow
        $projectRoot = (Get-Location).Path
        $venvPath = Join-Path $projectRoot 'backend\django_admin\venv'

        if (-not (Test-Path $venvPath)) {
            Write-Host "Criando ambiente virtual Django..." -ForegroundColor Cyan
            python -m venv $venvPath
            & "$venvPath\Scripts\python.exe" -m pip install --upgrade pip
            & "$venvPath\Scripts\python.exe" -m pip install -r "$projectRoot\backend\django_admin\requirements.txt"
        }

        Write-Host "Abrindo nova janela para Django..." -ForegroundColor Yellow
        Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit','-Command',"Set-Location '$projectRoot'; .\backend\django_admin\venv\Scripts\python.exe backend\django_admin\manage.py runserver")
    }

    "start-all" {
        Write-Host "Iniciando Node backend e Django admin..." -ForegroundColor Yellow
        $projectRoot = (Get-Location).Path

        Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit','-Command',"Set-Location '$projectRoot'; npm start")
        Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit','-Command',"Set-Location '$projectRoot'; .\start.ps1 start-django")

        Write-Host "Servidores iniciados em janelas separadas." -ForegroundColor Green
        Write-Host "Acessar: http://localhost:3000 e http://localhost:8000" -ForegroundColor Cyan
    }

    "start-docker" {
        Write-Host "Iniciando com DOCKER COMPOSE..." -ForegroundColor Yellow
        docker-compose up -d
        Write-Host ""
        Write-Host "Containers iniciados!" -ForegroundColor Green
        Write-Host "Acessar:" -ForegroundColor Cyan
        Write-Host "   Frontend/Nginx:  http://localhost" -ForegroundColor White
        Write-Host "   Backend API:     http://localhost:3000" -ForegroundColor White
        Write-Host "   pgAdmin:         http://localhost:5050" -ForegroundColor White
        Write-Host ""
        Write-Host "Monitorar logs: docker-compose logs -f" -ForegroundColor White
    }

    "setup-local" {
        Write-Host "Setup LOCAL..." -ForegroundColor Yellow
        npm install
        npm run migrate
        node backend/src/seed.js
        Write-Host "Setup concluído! Execute: npm start" -ForegroundColor Green
    }

    "setup-docker" {
        Write-Host "Setup DOCKER..." -ForegroundColor Yellow
        if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
            Write-Host "Docker não está instalado!" -ForegroundColor Red
            exit 1
        }
        Write-Host "Docker Compose pronto! Execute: .\start.ps1 start-docker" -ForegroundColor Green
    }

    "stop" {
        Write-Host "Parando containers..." -ForegroundColor Yellow
        docker-compose down
        Write-Host "Containers parados" -ForegroundColor Green
    }

    "logs" {
        Write-Host "Logs do backend:" -ForegroundColor Yellow
        docker-compose logs -f backend
    }

    "test-login" {
        Write-Host "Testando logins..." -ForegroundColor Yellow
        $uri = "http://localhost:3000/api/auth/login"
        @(
            @{ email = "admin@helpdesk.local"; pass = "123456"; role = "Admin" },
            @{ email = "usuario@helpdesk.local"; pass = "123456"; role = "Usuario" },
            @{ email = "tecnico@helpdesk.local"; pass = "123456"; role = "Tecnico" }
        ) | ForEach-Object {
            $body = @{ email = $_.email; senha = $_.pass } | ConvertTo-Json
            try {
                Invoke-WebRequest -Uri $uri -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop | Out-Null
                Write-Host "OK $($_.role)" -ForegroundColor Green
            } catch {
                Write-Host "FALHOU $($_.role)" -ForegroundColor Red
            }
        }
    }

    default {
        Write-Host "Uso: .\start.ps1 [COMANDO]`n" -ForegroundColor Cyan
        Write-Host "Comandos disponíveis:" -ForegroundColor Cyan
        Write-Host "  start-local      - Iniciar servidor Node localmente" -ForegroundColor White
        Write-Host "  start-django     - Iniciar painel Django (admin)" -ForegroundColor White
        Write-Host "  start-all        - Iniciar Node backend + Django admin" -ForegroundColor White
        Write-Host "  start-docker     - Iniciar com Docker Compose" -ForegroundColor White
        Write-Host "  setup-local      - Setup inicial" -ForegroundColor White
        Write-Host "  setup-docker     - Verificar Docker" -ForegroundColor White
        Write-Host "  stop             - Parar containers Docker" -ForegroundColor White
        Write-Host "  logs             - Ver logs em tempo real" -ForegroundColor White
        Write-Host "  test-login       - Testar logins" -ForegroundColor White
        Write-Host "  help             - Mostrar esta mensagem" -ForegroundColor White
        Write-Host ""
        Write-Host "Exemplos:" -ForegroundColor Cyan
        Write-Host "  .\start.ps1 start-local" -ForegroundColor Gray
        Write-Host "  .\start.ps1 start-django" -ForegroundColor Gray
        Write-Host "  .\start.ps1 start-all" -ForegroundColor Gray
        Write-Host "  .\start.ps1 start-docker" -ForegroundColor Gray
        Write-Host "  .\start.ps1 test-login" -ForegroundColor Gray
    }
}
