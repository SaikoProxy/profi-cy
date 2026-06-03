@echo off
echo ✠ PROFI-CY — Reconstruyendo base de datos...
echo.

REM Unir las partes
copy /b proficy_parte_aa + proficy_parte_ab proficy.sqlite.gz
echo ✓ Partes unidas

REM Descomprimir (necesita 7-Zip instalado)
"C:\Program Files\7-Zip\7z.exe" e proficy.sqlite.gz
echo ✓ Descomprimido

REM Verificar
if exist proficy.sqlite (
    echo ✓ proficy.sqlite listo!
    echo   Tamaño esperado: ~369 MB
) else (
    echo ✗ Error — verificar que 7-Zip esté instalado
)
pause
