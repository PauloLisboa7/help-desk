@echo off
REM Run script para Django Admin Panel

echo Iniciando Django Admin Panel...
echo.

if not exist venv (
    echo Erro: Ambiente virtual nao encontrado!
    echo Execute setup.bat primeiro.
    pause
    exit /b 1
)

call venv\Scripts\activate.bat

echo Django Admin rodando em http://localhost:8000/admin/
echo.
echo Pressione Ctrl+C para parar.
echo.

python manage.py runserver 8000

pause
