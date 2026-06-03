# PROFI-CY — Reconstruir DB desde partes
Write-Host "✠ Reconstruyendo proficy.sqlite..." -ForegroundColor Yellow

# Unir partes
$parts = @("proficy_parte_aa", "proficy_parte_ab")
$output = [System.IO.File]::OpenWrite("proficy.sqlite.gz")
foreach ($part in $parts) {
    $bytes = [System.IO.File]::ReadAllBytes($part)
    $output.Write($bytes, 0, $bytes.Length)
    Write-Host "  ✓ $part agregado"
}
$output.Close()

# Descomprimir
Add-Type -Assembly System.IO.Compression.FileSystem
$gz = [System.IO.Compression.GZipStream]::new(
    [System.IO.File]::OpenRead("proficy.sqlite.gz"),
    [System.IO.Compression.CompressionMode]::Decompress
)
$out = [System.IO.File]::OpenWrite("proficy.sqlite")
$gz.CopyTo($out)
$gz.Close(); $out.Close()

$size = (Get-Item "proficy.sqlite").Length / 1MB
Write-Host "✓ proficy.sqlite listo! ($([math]::Round($size)) MB)" -ForegroundColor Green
