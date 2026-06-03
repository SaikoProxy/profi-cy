#!/usr/bin/env python3
"""
PROFI-CY · Corpus Manager
Parsea archivos e-Sword (.bblx, .cmtx, .dctx, .refx, .refi)
"""
import sqlite3, zlib, re, os, json
from html import unescape

BASE       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS_DIR = os.path.join(BASE, "corpus_extra")
os.makedirs(CORPUS_DIR, exist_ok=True)

BOOK_MAP = {
    1:"gn",2:"ex",3:"lv",4:"nm",5:"dt",6:"jos",7:"jue",8:"rt",
    9:"1sm",10:"2sm",11:"1re",12:"2re",13:"1cr",14:"2cr",
    15:"esd",16:"neh",17:"est",18:"job",19:"sal",20:"pr",
    21:"ec",22:"cnt",23:"is",24:"jr",25:"lm",26:"ez",27:"dn",
    28:"os",29:"jl",30:"am",31:"ab",32:"jon",33:"mi",34:"na",
    35:"hab",36:"sof",37:"ag",38:"zac",39:"mal",
    40:"mt",41:"mc",42:"lc",43:"jn",44:"hch",45:"rm",
    46:"1co",47:"2co",48:"ga",49:"ef",50:"flp",51:"col",
    52:"1ts",53:"2ts",54:"1tm",55:"2tm",56:"tit",57:"flm",
    58:"heb",59:"stg",60:"1pe",61:"2pe",62:"1jn",63:"2jn",
    64:"3jn",65:"jud",66:"ap",
}

# ══════════════════════════════════════════
# UTILIDADES DE TEXTO
# ══════════════════════════════════════════

def _rtf_unicode(m):
    n = int(m.group(1))
    if n < 0:
        n += 65536
    try:
        return chr(n)
    except Exception:
        return ''

def _rtf_hex(m):
    try:
        return bytes.fromhex(m.group(1)).decode('cp1252')
    except Exception:
        return ''

def _rtf_clean(text):
    """Nucleo de limpieza RTF — opera sobre string ya decodificado."""
    text = re.sub(r'\\u(-?[0-9]+)[?\s]', _rtf_unicode, text)
    text = re.sub(r"\\'([0-9a-fA-F]{2})", _rtf_hex, text)
    text = text.replace('\\par\r\n', '\n')
    text = text.replace('\\par\n', '\n')
    text = text.replace('\\par ', '\n')
    text = text.replace('\\par', '\n')
    text = text.replace('\\pard', '')
    text = text.replace('\\line', '\n')
    text = text.replace('\\\\', '\\')
    text = re.sub(r'\{\\fonttbl[^}]*\}', '', text, flags=re.DOTALL)
    text = re.sub(r'\{\\colortbl[^}]*\}', '', text, flags=re.DOTALL)
    text = re.sub(r'\{\\\*\\[^}]*\}', '', text, flags=re.DOTALL)
    text = re.sub(r'\\[a-zA-Z]+-?[0-9]* ?', '', text)
    text = text.replace('{', '').replace('}', '')
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r' \n|\n ', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def _to_str(raw):
    if isinstance(raw, (bytes, bytearray)):
        try:
            return raw.decode('utf-8')
        except UnicodeDecodeError:
            return raw.decode('latin-1', errors='replace')
    return str(raw)

def strip_rtf(raw):
    """RTF con header {\\rtf — verifica antes de limpiar."""
    text = _to_str(raw)
    if '{\\rtf' not in text[:40]:
        return text.strip()
    return _rtf_clean(text)

def strip_rtf_inline(raw):
    """RTF sin header — limpia directamente (Catena Aurea, Books.cmtx)."""
    return _rtf_clean(_to_str(raw))

def strip_html(html):
    """HTML -> texto plano con decodificacion completa de entidades."""
    if not html:
        return ''
    text = re.sub(r'<br\s*/?>', '\n', html, flags=re.IGNORECASE)
    text = re.sub(r'</p>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</div>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</h[1-6]>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', '', text)
    text = unescape(text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r' \n|\n ', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def decompress_esword(raw):
    """Descomprimir campo zlib de e-Sword."""
    raw = bytes(raw)
    for offset in range(8):
        if raw[offset:offset+1] == b'\x78' and raw[offset+1:offset+2] in (b'\x9c', b'\xda', b'\x01', b'\x5e'):
            try:
                return zlib.decompress(raw[offset:])
            except Exception:
                pass
    return raw

def split_html_by_sections(html):
    """Parte HTML gigante en secciones por spans rojos negrita+cursiva."""
    TITLE_RE = re.compile(
        r'<span[^>]*color:#800000[^>]*font-weight:bold[^>]*font-style:italic[^>]*>(.*?)</span>',
        re.IGNORECASE | re.DOTALL
    )
    splits = []
    for m in TITLE_RE.finditer(html):
        titulo = unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip()
        if titulo and len(titulo) > 5:
            splits.append((m.start(), titulo))

    if not splits:
        return [{"title": "Texto completo", "text": strip_html(html)}]

    results = []
    for i, (pos, titulo) in enumerate(splits):
        end = splits[i+1][0] if i+1 < len(splits) else len(html)
        text = strip_html(html[pos:end])
        if text:
            results.append({"title": titulo, "text": text})
    return results

# ══════════════════════════════════════════
# PARSERS POR FORMATO
# ══════════════════════════════════════════

def parse_refx(filepath):
    """.refx / .refy / .ref — Topics(Title, Notes) con zlib+RTF"""
    results = []
    db = sqlite3.connect(filepath)
    db.row_factory = sqlite3.Row
    try:
        rows = db.execute("SELECT Title, Notes FROM Topics ORDER BY rowid").fetchall()
        for r in rows:
            title = (r['Title'] or '').strip()
            if not r['Notes']:
                continue
            text = strip_rtf(decompress_esword(r['Notes']))
            if text:
                results.append({"title": title, "text": text})
    except Exception as e:
        print(f"Error parse_refx: {e}")
    db.close()
    return results

def parse_refi(filepath):
    """.refi — Reference(Chapter, Content) HTML. Si es una sola fila, parte por secciones."""
    results = []
    db = sqlite3.connect(filepath)
    db.row_factory = sqlite3.Row
    try:
        rows = db.execute("SELECT Chapter, Content FROM Reference ORDER BY rowid").fetchall()
        if len(rows) == 1:
            results = split_html_by_sections(rows[0]['Content'] or '')
        else:
            for r in rows:
                content = r['Content'] or ''
                text = strip_html(content) if '<' in content else strip_rtf(content)
                if text:
                    results.append({"title": (r['Chapter'] or '').strip(), "text": text})
    except Exception as e:
        print(f"Error parse_refi: {e}")
    db.close()
    return results

def parse_cmtx(filepath):
    """.cmtx — detecta esquema Verses o Commentary automaticamente"""
    db = sqlite3.connect(filepath)
    db.row_factory = sqlite3.Row
    tablas = {t[0] for t in db.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
    results = []
    try:
        if 'Verses' in tablas:
            rows = db.execute(
                "SELECT Book, ChapterBegin, VerseBegin, Comments "
                "FROM Verses ORDER BY Book, ChapterBegin, VerseBegin"
            ).fetchall()
            for r in rows:
                raw = r['Comments'] or ''
                if isinstance(raw, (bytes, bytearray)):
                    raw = decompress_esword(raw)
                text = strip_rtf_inline(raw)
                if text:
                    results.append({
                        "book":    BOOK_MAP.get(r['Book'], str(r['Book'])),
                        "chapter": r['ChapterBegin'],
                        "verse":   r['VerseBegin'],
                        "text":    text
                    })
        elif 'Commentary' in tablas:
            rows = db.execute(
                "SELECT Book, Chapter, Verse, Marker, Scripture "
                "FROM Commentary ORDER BY Book, Chapter, Verse"
            ).fetchall()
            for r in rows:
                text = strip_rtf(decompress_esword(r['Scripture']))
                if text:
                    results.append({
                        "book":    BOOK_MAP.get(r['Book'], str(r['Book'])),
                        "chapter": r['Chapter'],
                        "verse":   r['Verse'],
                        "marker":  r['Marker'] or '',
                        "text":    text
                    })
    except Exception as e:
        print(f"Error parse_cmtx: {e}")
    db.close()
    return results

def parse_dctx(filepath):
    """.dctx / .dct — Dictionary(Topic, Definition)"""
    results = []
    db = sqlite3.connect(filepath)
    db.row_factory = sqlite3.Row
    try:
        rows = db.execute("SELECT Topic, Definition FROM Dictionary ORDER BY Topic").fetchall()
        for r in rows:
            raw = r['Definition']
            if isinstance(raw, (bytes, bytearray)):
                raw = decompress_esword(raw)
            text = strip_rtf(raw)
            if text:
                results.append({"topic": r['Topic'], "definition": text})
    except Exception as e:
        print(f"Error parse_dctx: {e}")
    db.close()
    return results

def parse_any(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    if ext == '.refi':
        return {"type": "book",       "data": parse_refi(filepath)}
    elif ext in ('.refx', '.refy', '.ref'):
        return {"type": "book",       "data": parse_refx(filepath)}
    elif ext in ('.cmtx', '.cmt'):
        return {"type": "commentary", "data": parse_cmtx(filepath)}
    elif ext in ('.dctx', '.dct'):
        return {"type": "dictionary", "data": parse_dctx(filepath)}
    else:
        try:
            return {"type": "book", "data": parse_refx(filepath)}
        except Exception:
            return {"type": "unknown", "data": []}

def list_corpus():
    files = []
    for fname in os.listdir(CORPUS_DIR):
        fpath = os.path.join(CORPUS_DIR, fname)
        if os.path.isfile(fpath):
            files.append({
                "name":    fname,
                "size_kb": os.path.getsize(fpath) // 1024,
                "ext":     os.path.splitext(fname)[1].lower(),
            })
    return files

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        result = parse_any(sys.argv[1])
        print(f"Tipo: {result['type']}, Items: {len(result['data'])}")
        for item in result['data'][:5]:
            print(f"  [{item.get('title',item.get('topic',''))}] {item.get('text','')[:120]}")
