# PROFI-CY — Reconstruir DB desde partes
# Ejecutar desde C:\Desarrollo\Web\proficy\db\
# PowerShell: .\RECONSTRUIR_v2.ps1

Write-Host "✠ PROFI-CY — Reconstruyendo base de datos..." -ForegroundColor Yellow
Write-Host ""

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $dir

# Paso 1: Unir las dos partes en un .gz
Write-Host "Paso 1: Uniendo partes..." -ForegroundColor Cyan
$outputGz = Join-Path $dir "proficy.sqlite.gz"
$stream = [System.IO.File]::OpenWrite($outputGz)
$partes = @("proficy_parte_aa", "proficy_parte_ab")
foreach ($parte in $partes) {
    $rutaParte = Join-Path $dir $parte
    if (Test-Path $rutaParte) {
        $bytes = [System.IO.File]::ReadAllBytes($rutaParte)
        $stream.Write($bytes, 0, $bytes.Length)
        Write-Host "  ✓ $parte agregado ($([math]::Round($bytes.Length/1MB, 1)) MB)"
    } else {
        Write-Host "  ✗ No encontrado: $rutaParte" -ForegroundColor Red
    }
}
$stream.Close()
Write-Host ""

# Paso 2: Descomprimir el .gz
Write-Host "Paso 2: Descomprimiendo..." -ForegroundColor Cyan
$outputDb = Join-Path $dir "proficy.sqlite"
$inputStream = [System.IO.File]::OpenRead($outputGz)
$gzStream = New-Object System.IO.Compression.GZipStream($inputStream, [System.IO.Compression.CompressionMode]::Decompress)
$outputStream = [System.IO.File]::OpenWrite($outputDb)
$gzStream.CopyTo($outputStream)
$gzStream.Close()
$outputStream.Close()
$inputStream.Close()

# Paso 3: Verificar
if (Test-Path $outputDb) {
    $sizeMB = [math]::Round((Get-Item $outputDb).Length / 1MB)
    Write-Host ""
    Write-Host "✓ proficy.sqlite reconstruida!" -ForegroundColor Green
    Write-Host "  Tamaño: $sizeMB MB (esperado: ~369 MB)" -ForegroundColor Green
    Write-Host "  Ruta: $outputDb" -ForegroundColor Green
} else {
    Write-Host "✗ Error al reconstruir" -ForegroundColor Red
}

Write-Host ""
Write-Host "Presiona Enter para cerrar..."
Read-Host
