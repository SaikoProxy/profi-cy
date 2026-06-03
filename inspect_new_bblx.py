# inspect_new_bblx.py
import sqlite3, os, glob

CARPETA = 'C:\\Desarrollo\\Web\\proficy\\corpus_extra'
archivos = [f for f in os.listdir(CARPETA) 
            if f.lower().endswith(('.bblx','.bbli')) 
            and ('nacar' in f.lower() or 'colunga' in f.lower() 
                 or 'serafin' in f.lower() or 'seraf' in f.lower())]

print(f"📂 Archivos detectados: {archivos}\n")

for nombre in archivos:
    f = os.path.join(CARPETA, nombre)
    print(f"\n{'═'*70}")
    print(f"  {nombre}  ({os.path.getsize(f)/1024/1024:.1f} MB)")
    print(f"{'═'*70}")
    try:
        c = sqlite3.connect(f)
        tablas = [r[0] for r in c.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()]
        print(f"  Tablas: {tablas}")

        for t in tablas:
            cols = [x[1] for x in c.execute(f"PRAGMA table_info({t})").fetchall()]
            cnt = c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
            print(f"\n  ▸ {t}  ({cnt:,} filas)  cols={cols}")

            if t.lower() in ('bible','scriptures','verses','book'):
                book_col = next((co for co in cols 
                                if co.lower() in ('book','book_num','b','bk')), None)
                if book_col:
                    libros = c.execute(
                        f"SELECT {book_col}, COUNT(*) FROM {t} "
                        f"GROUP BY {book_col} ORDER BY {book_col}"
                    ).fetchall()
                    print(f"     Total libros: {len(libros)}")
                    for b, n in libros:
                        first = c.execute(
                            f"SELECT * FROM {t} WHERE {book_col}=? LIMIT 1", (b,)
                        ).fetchone()
                        first_str = str(first)[:110] if first else ""
                        print(f"       libro {b:>3} ({n:>5} v) → {first_str}")
        c.close()
    except Exception as e:
        print(f"  ❌ {e}")