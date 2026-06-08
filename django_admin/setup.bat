@echo off
REM Setup script para Django Admin Panel

echo.
echo ====================================
echo Help Desk Django Admin - Setup
echo ====================================
echo.

REM Criar venv
if not exist venv (
    echo [1/4] Criando ambiente virtual...
    python -m venv venv
) else (
    echo [1/4] Ambiente virtual ja existe.
)

REM Ativar venv
echo [2/4] Ativando ambiente virtual...
call venv\Scripts\activate.bat

REM Instalar dependencias
echo [3/4] Instalando dependencias...
pip install -r requirements.txt --quiet

REM Criar superuser
echo [4/4] Criando superuser Django...
echo.
echo Digite as credenciais do administrador Django:
echo (pode ser diferente das credenciais do Help Desk Node.js)
echo.
python manage.py createsuperuser

echo.
echo ====================================
echo Setup concluido!
echo ====================================
echo.
echo Para iniciar o servidor:
echo python manage.py runserver 8000
echo.
echo Acesse: http://localhost:8000/admin/
echo.
pause
