import os, gzip, shutil

# Ejecutar desde C:\Desarrollo\Web\proficy\db\
# python reconstruir.py

print("PROFI-CY - Reconstruyendo base de datos...")
print("")

carpeta = os.path.dirname(os.path.abspath(__file__))

# Paso 1: unir partes
print("Paso 1: Uniendo partes...")
gz_path = os.path.join(carpeta, "proficy.sqlite.gz")
with open(gz_path, "wb") as out:
    for parte in ["proficy_parte_aa", "proficy_parte_ab"]:
        ruta = os.path.join(carpeta, parte)
        with open(ruta, "rb") as f:
            datos = f.read()
            out.write(datos)
            print(f"  OK {parte} ({len(datos)//1024//1024} MB)")

# Paso 2: descomprimir
print("")
print("Paso 2: Descomprimiendo (puede tardar 1-2 minutos)...")
db_path = os.path.join(carpeta, "proficy.sqlite")
with gzip.open(gz_path, "rb") as gz:
    with open(db_path, "wb") as db:
        shutil.copyfileobj(gz, db)

# Paso 3: verificar
size_mb = os.path.getsize(db_path) // 1024 // 1024
print("")
print(f"LISTO! proficy.sqlite reconstruida")
print(f"Tamano: {size_mb} MB (esperado: ~369 MB)")
print(f"Ruta: {db_path}")
input("\nPresiona Enter para cerrar...")
