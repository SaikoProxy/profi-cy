@echo off
cd /d C:\Desarrollo\Web\proficy\api
echo Instalando dependencias...
pip install flask flask-cors
echo.
echo Arrancando PROFI-CY API...
echo Abre el navegador en: http://localhost:5050/api/health
echo.
python server.py
pause
