#!/usr/bin/env python3
"""
PROFI-CY · API Server v2
Ejecutar: python server.py
"""
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3, re, unicodedata, os, zlib, hmac, hashlib, time, json
from werkzeug.utils import secure_filename
from corpus_parser import parse_any, list_corpus, CORPUS_DIR
from bhs_parser import parse_bhs_interlinear

app = Flask(__name__, static_folder=None, static_url_path=None)
CORS(app)

BASE    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE, "db", "proficy.sqlite")
BUILD_DIR = os.path.join(BASE, "build")

HEBREW_GEMATRIA = {
    '\u05d0':1,'\u05d1':2,'\u05d2':3,'\u05d3':4,'\u05d4':5,
    '\u05d5':6,'\u05d6':7,'\u05d7':8,'\u05d8':9,'\u05d9':10,
    '\u05db':20,'\u05dc':30,'\u05de':40,'\u05e0':50,'\u05e1':60,
    '\u05e2':70,'\u05e4':80,'\u05e6':90,'\u05e7':100,'\u05e8':200,
    '\u05e9':300,'\u05ea':400,'\u05da':500,'\u05dd':600,'\u05df':700,
    '\u05e3':800,'\u05e5':900,
}
GREEK_GEMATRIA = {
    'a':1,'b':2,'g':3,'d':4,'e':5,'z':7,'h':8,'q':9,'i':10,
    'k':20,'l':30,'m':40,'n':50,'x':60,'o':70,'p':80,'r':100,
    's':200,'t':300,'u':400,'f':500,'c':600,'y':700,'w':800,
}
PROPHETIC = {
    ("gn",3,15):"Protoevangelio · Primera profecía mesiánica",
    ("is",7,14):"La Virgen · Parthénos · Ecce Virgo",
    ("is",9,6):"Hijo nos es dado · Emmanuel",
    ("is",11,1):"Renuevo de Jesé",
    ("is",40,3):"Voz que clama en el desierto",
    ("is",53,1):"Siervo Sufriente · Is 53",
    ("is",53,2):"Siervo Sufriente · Is 53",
    ("is",53,3):"Varón de dolores",
    ("is",53,4):"Llevó nuestras enfermedades",
    ("is",53,5):"Herido por nuestras iniquidades",
    ("is",53,6):"Como ovejas errantes",
    ("is",53,7):"Cordero al matadero",
    ("is",53,10):"Voluntad del Señor",
    ("is",53,11):"Justificará a muchos",
    ("mi",5,2):"Nacimiento en Belén",
    ("zac",9,9):"Rey sobre un asno",
    ("zac",12,10):"Mirarán al que traspasaron",
    ("mal",3,1):"Mi mensajero preparará el camino",
    ("dn",9,25):"Las 70 semanas · Cronología mesiánica",
    ("dn",9,26):"Muerte del Ungido",
    ("sal",22,1):"Dios mío, por qué me has abandonado",
    ("sal",22,7):"Escarnio del pueblo",
    ("sal",22,16):"Traspasaron mis manos y pies",
    ("sal",22,18):"Repartieron mis vestidos",
    ("sal",110,1):"Señor a mi Señor",
    ("sal",110,4):"Sacerdote según Melquisedec",
    ("jr",31,15):"Raquel llora sus hijos",
    ("jr",31,31):"Nueva Alianza",
    ("os",11,1):"De Egipto llamé a mi Hijo",
}

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def r2l(rows): return [dict(r) for r in rows]
def r2d(row):  return dict(row) if row else None


def bhs_hebreo_limpio(text):
    try:
        words = parse_bhs_interlinear(text)
        if words:
            return " ".join(w["hebrew"] for w in words if w.get("hebrew"))
    except Exception as e:
        print("bhs_hebreo_limpio: fallo, devuelvo crudo:", e)
    return text


# ══════════════════════════════════════════
# ENDPOINTS — todos ANTES del app.run()
# ══════════════════════════════════════════

@app.route("/api/health")
def health():
    try:
        db = get_db()
        count = db.execute("SELECT COUNT(*) FROM verses").fetchone()[0]
        vers  = db.execute("SELECT code, language, verse_count FROM versions ORDER BY code").fetchall()
        db.close()
        return jsonify({"status":"ok","total_verses":count,"versions":r2l(vers)})
    except Exception as e:
        return jsonify({"status":"error","msg":str(e),"db_path":DB_PATH}), 500


@app.route("/api/parallel")
def parallel():
    book = request.args.get("book","").lower()
    ch   = request.args.get("ch", type=int)
    vs   = request.args.get("vs", type=int)
    if not book or not ch or not vs:
        return jsonify({"error":"Faltan: book, ch, vs"}), 400
    db = get_db()

    try:
        libro = r2d(db.execute(
            "SELECT name_es,name_la,testament FROM books WHERE abbrev=?",(book,)).fetchone())
    except Exception as e:
        print("parallel: books fallo:", e); libro = None

    versos = r2l(db.execute("""
        SELECT v.version_code,v.lang_code,v.text,v.word_count,v.gematria_val,ver.language
        FROM verses v JOIN versions ver ON ver.code=v.version_code
        WHERE v.book_abbrev=? AND v.chapter=? AND v.verse=?
        ORDER BY v.lang_code,v.version_code""",(book,ch,vs)).fetchall())
    for v in versos:
        if v.get("version_code") == "BHS" and v.get("text"):
            v["text"] = bhs_hebreo_limpio(v["text"])

    try:
        catena = db.execute("""
            SELECT text FROM commentaries
            WHERE source_code='CATENA' AND book_abbrev=?
              AND chapter_begin<=? AND chapter_end>=? AND verse_begin<=? AND verse_end>=?
            LIMIT 1""",(book,ch,ch,vs,vs)).fetchone()
    except Exception as e:
        print("parallel: catena fallo:", e); catena = None

    try:
        strongs = r2l(db.execute("""
            SELECT DISTINCT si.strong_num,si.lang,sd.definition
            FROM strong_index si LEFT JOIN strong_definitions sd ON sd.strong_num=si.strong_num
            WHERE si.book_abbrev=? AND si.chapter=? AND si.verse=?
            ORDER BY si.strong_num LIMIT 20""",(book,ch,vs)).fetchall())
    except Exception as e:
        print("parallel: strong_index fallo:", e); strongs = []

    db.close()
    return jsonify({
        "referencia":f"{book.upper()} {ch}:{vs}",
        "libro":libro,"versiculos":versos,
        "catena_aurea":catena["text"][:600] if catena else None,
        "strong":strongs
    })
@app.route("/api/chapter")
def chapter():
    book    = request.args.get("book","").lower()
    ch      = request.args.get("ch", type=int)
    version = request.args.get("version","JER")
    if not book or not ch:
        return jsonify({"error":"Faltan: book, ch"}), 400
    db = get_db()
    rows = db.execute("""
        SELECT verse,text,word_count,gematria_val
        FROM verses WHERE book_abbrev=? AND chapter=? AND version_code=?
        ORDER BY verse""",(book,ch,version)).fetchall()
    db.close()
    result = []
    for r in rows:
        txt = r["text"]
        if version == "BHS" and txt:
            txt = bhs_hebreo_limpio(txt)
        result.append({
            "verse":r["verse"],"text":txt,
            "word_count":r["word_count"],"gematria":r["gematria_val"],
            "prophetic":PROPHETIC.get((book,ch,r["verse"]),None)
        })
    return jsonify({"book":book,"chapter":ch,"version":version,
                    "verse_count":len(result),"verses":result})


@app.route("/api/search")
def search():
    q       = request.args.get("q","").strip()
    version = request.args.get("version","JER")
    testam  = request.args.get("testamento","")
    limit   = request.args.get("limit",20,type=int)
    if not q or len(q)<2:
        return jsonify({"error":"Query muy corta"}), 400
    qn = re.sub(r'[\u0300-\u036f]','',unicodedata.normalize('NFD',q.lower()))
    ql = f"%{qn}%"
    db = get_db()
    ts = "AND b.testament=?" if testam else ""
    p  = [ql,version]+([testam.upper()] if testam else [])+[limit]
    rows = r2l(db.execute(f"""
        SELECT wi.book_abbrev,wi.chapter,wi.verse,wi.frequency,
               v.text,b.name_es,b.testament
        FROM word_index wi
        JOIN verses v ON (v.book_abbrev=wi.book_abbrev AND v.chapter=wi.chapter
                          AND v.verse=wi.verse AND v.version_code=wi.version_code)
        JOIN books b ON b.abbrev=wi.book_abbrev
        WHERE wi.word LIKE ? AND wi.version_code=? {ts}
        ORDER BY b.canon_order,wi.chapter,wi.verse LIMIT ?""",p).fetchall())
    total = db.execute(f"""
        SELECT COUNT(DISTINCT wi.book_abbrev||wi.chapter||wi.verse)
        FROM word_index wi JOIN books b ON b.abbrev=wi.book_abbrev
        WHERE wi.word LIKE ? AND wi.version_code=? {ts}
        """,[ql,version]+([testam.upper()] if testam else [])).fetchone()[0]
    db.close()
    return jsonify({"query":q,"total":total,"resultados":rows})


@app.route("/api/strong")
def strong():
    num = request.args.get("num","").upper()
    if not num: return jsonify({"error":"Falta: num"}), 400
    db  = get_db()
    defn = r2d(db.execute("SELECT * FROM strong_definitions WHERE strong_num=?",(num,)).fetchone())
    ver  = "LXX" if num.startswith("G") else "BHS"
    refs = r2l(db.execute("""
        SELECT si.book_abbrev,si.chapter,si.verse,v.text,b.name_es
        FROM strong_index si
        JOIN verses v ON (v.book_abbrev=si.book_abbrev AND v.chapter=si.chapter
                         AND v.verse=si.verse AND v.version_code=?)
        JOIN books b ON b.abbrev=si.book_abbrev
        WHERE si.strong_num=? AND si.version_code=?
        ORDER BY b.canon_order,si.chapter,si.verse LIMIT 20""",(ver,num,ver)).fetchall())
    db.close()
    return jsonify({"strong_num":num,"definicion":defn,"ocurrencias":refs})


@app.route("/api/gematria")
def gematria():
    text = request.args.get("text","")
    if not text: return jsonify({"error":"Falta: text"}), 400
    total = sum(HEBREW_GEMATRIA.get(unicodedata.normalize('NFC',c),0) for c in text)
    if total == 0:
        nfd = unicodedata.normalize('NFD',text.lower())
        total = sum(GREEK_GEMATRIA.get(c,0) for c in nfd)
    katan = total
    while katan > 9: katan = sum(int(d) for d in str(katan))
    db = get_db()
    mismos = r2l(db.execute(
        "SELECT book_abbrev,chapter,verse FROM verses WHERE gematria_val=? AND lang_code='hbo' LIMIT 5",(total,)).fetchall())
    db.close()
    return jsonify({"texto":text,"valor":total,"katan":katan,"versos_mismo_valor":mismos})


@app.route("/api/dict")
def dictionary():
    q = request.args.get("q","").strip()
    source = request.args.get("source","")
    if not q: return jsonify({"error":"Falta: q"}), 400
    db = get_db()
    ss = "AND source_code=?" if source else ""
    p  = [f"%{q}%"]+([source] if source else [])+[10]
    rows = r2l(db.execute(f"SELECT source_code,source_name,topic,definition FROM dictionaries WHERE topic LIKE ? {ss} ORDER BY source_code LIMIT ?",p).fetchall())
    db.close()
    return jsonify({"query":q,"resultados":rows})


@app.route("/api/stats")
def stats():
    db = get_db()
    vers = r2l(db.execute("SELECT code,language,verse_count FROM versions ORDER BY code").fetchall())
    totals = {
        "versiculos":             db.execute("SELECT COUNT(*) FROM verses").fetchone()[0],
        "palabras_indexadas":     db.execute("SELECT COUNT(DISTINCT word) FROM word_index").fetchone()[0],
        "definiciones_strong":    db.execute("SELECT COUNT(*) FROM strong_definitions").fetchone()[0],
        "comentarios_patristica": db.execute("SELECT COUNT(*) FROM commentaries").fetchone()[0],
        "entradas_diccionarios":  db.execute("SELECT COUNT(*) FROM dictionaries").fetchone()[0],
    }
    db.close()
    return jsonify({"versiones":vers,"totales":totals})


@app.route("/api/interlinear")
def interlinear():
    book = request.args.get("book","").lower()
    ch   = request.args.get("ch", type=int)
    vs   = request.args.get("vs", type=int)
    if not book or not ch or not vs:
        return jsonify({"error":"Faltan: book, ch, vs"}), 400
    db = get_db()
    bhs = db.execute("""
        SELECT text FROM verses
        WHERE book_abbrev=? AND chapter=? AND verse=? AND version_code='BHS'
    """, (book, ch, vs)).fetchone()
    strongs = []
    try:
        cols = {row[1] for row in db.execute("PRAGMA table_info(strong_definitions)").fetchall()}
        sel = ["si.strong_num", "sd.definition"]
        if "original_word" in cols:    sel.append("sd.original_word")
        if "transliteration" in cols:  sel.append("sd.transliteration")
        q = ("SELECT DISTINCT " + ", ".join(sel) + """
            FROM strong_index si
            LEFT JOIN strong_definitions sd ON sd.strong_num=si.strong_num
            WHERE si.book_abbrev=? AND si.chapter=? AND si.verse=? AND si.version_code='BHS'
            ORDER BY si.strong_num""")
        strongs = r2l(db.execute(q, (book, ch, vs)).fetchall())
    except Exception as e:
        print("interlinear: enriquecimiento Strong omitido:", e)
        strongs = []
    db.close()
    if not bhs:
        return jsonify({"error":"No hay BHS para este versículo (solo AT)","words":[]}), 200
    words = parse_bhs_interlinear(bhs["text"])
    strong_map = {s['strong_num']: s for s in strongs}
    for w in words:
        s = strong_map.get(w['strong'])
        if not s:
            continue
        if (not w['es'] or w['es']=='—') and s.get('definition'):
            defn = (s['definition'] or '').split('\n')[0][:80]
            if defn: w['es'] = defn
        if s.get('original_word'):   w['hebrew_ml'] = s['original_word']
        if s.get('transliteration'): w['translit_ml'] = s['transliteration']
    return jsonify({"book":book,"chapter":ch,"verse":vs,
                    "words":words,"word_count":len(words)})


import json as _json

BBLX_DIR = CORPUS_DIR

BBLX_FILES = {
    'NA27':  'iNA27__Nestle_Aland_Interlineal_Griego_Español__1_.bblx',
    'BYZ':   'Interlineal_Griego_Español_Byzantino.bblx',
    'WH':    'Interlineal_Griego_Español_Westcott_y_Hort.bblx',
    'TISCH': 'Interlineal_Griego_Español_Tischendorf.bblx',
}

NT_BOOKS = {
    'mt':40,'mc':41,'lc':42,'jn':43,'hch':44,'rm':45,
    '1co':46,'2co':47,'ga':48,'ef':49,'flp':50,'col':51,
    '1ts':52,'2ts':53,'1tm':54,'2tm':55,'tit':56,'flm':57,
    'heb':58,'stg':59,'1pe':60,'2pe':61,'1jn':62,'2jn':63,
    '3jn':64,'jud':65,'ap':66,
}

MORPH_ES_MAP = {
    'N':'sust.','V':'vb.','A':'adj.','ADJ':'adj.','PREP':'prep.',
    'CONJ':'conj.','ADV':'adv.','P':'pron.','T':'art.','D':'dem.',
    'R':'rel.','INJ':'interj.','PRT':'part.',
    'NSM':'nom.sg.m','NSF':'nom.sg.f','NSN':'nom.sg.n',
    'GSM':'gen.sg.m','GSF':'gen.sg.f','GSN':'gen.sg.n',
    'DSM':'dat.sg.m','DSF':'dat.sg.f','DSN':'dat.sg.n',
    'ASM':'ac.sg.m','ASF':'ac.sg.f','ASN':'ac.sg.n',
    'NPM':'nom.pl.m','NPF':'nom.pl.f','NPN':'nom.pl.n',
    'GPM':'gen.pl.m','APM':'ac.pl.m','DPM':'dat.pl.m',
    'GPF':'gen.pl.f','APF':'ac.pl.f','DPF':'dat.pl.f',
    'GPN':'gen.pl.n','APN':'ac.pl.n','DPN':'dat.pl.n',
    '-1S':'1sg','-2S':'2sg','-3S':'3sg',
    '-1P':'1pl','-2P':'2pl','-3P':'3pl',
    'PAI':'pres.act.ind','IAI':'imp.act.ind','AAI':'aor.act.ind',
    'FAI':'fut.act.ind','PAP':'pres.act.part','AAP':'aor.act.part',
    'PAN':'pres.act.inf','AAN':'aor.act.inf',
    'PPI':'pres.pas.ind','2AAI':'aor2.act.ind','2AAP':'aor2.act.part',
    'PMI':'pres.med.ind','AMI':'aor.med.ind','FMI':'fut.med.ind',
    'PAO':'pres.act.opt','AAO':'aor.act.opt',
    'PAM':'pres.act.imp','AAM':'aor.act.imp',
}

WORD_RE_NT = re.compile(
    r"((?:\\'[0-9a-fA-F]{2}[\s]*)+)"
    r"\s*\{[^}]*\\super\s+(G\d+:[^}]+)\}"
    r"\s*\{[^}]*\\cf2\s+([^}]+)\}",
    re.DOTALL
)

def _hex_to_greek(hex_str):
    bytes_list = re.findall(r"\\'([0-9a-fA-F]{2})", hex_str)
    try:
        return bytes(int(b,16) for b in bytes_list).decode('cp1253').strip()
    except:
        return ''

def _morph_es(code):
    if not code: return ''
    parts = code.split('-')
    tipo = MORPH_ES_MAP.get(parts[0], parts[0].lower())
    if len(parts) > 1:
        resto = '-'.join(parts[1:])
        desc = MORPH_ES_MAP.get(resto, resto.lower())
        return f"{tipo} {desc}"
    return tipo

def _grk_translit(word):
    MAP = {
        'α':'a','β':'b','γ':'g','δ':'d','ε':'e','ζ':'dz','η':'ē','θ':'th',
        'ι':'i','κ':'k','λ':'l','μ':'m','ν':'n','ξ':'ks','ο':'o','π':'p',
        'ρ':'r','σ':'s','ς':'s','τ':'t','υ':'u','φ':'ph','χ':'kh','ψ':'ps','ω':'ō',
        'ά':'a','έ':'e','ή':'ē','ί':'i','ό':'o','ύ':'u','ώ':'ō',
        'ϊ':'i','ΐ':'i','ϋ':'u','ΰ':'u',
    }
    result = []
    for ch in word.lower():
        ch_norm = unicodedata.normalize('NFC', ch)
        result.append(MAP.get(ch_norm, ch_norm))
    return ''.join(result)

def parse_nt_verse(scripture):
    if isinstance(scripture, (bytes, bytearray)):
        try: text = scripture.decode('utf-8')
        except: text = scripture.decode('latin-1', errors='replace')
    else:
        text = str(scripture)
    words = []
    for m in WORD_RE_NT.finditer(text):
        greek = _hex_to_greek(m.group(1))
        sm    = m.group(2).strip()
        es    = m.group(3).strip()
        parts = sm.split(':', 1)
        strong = parts[0]
        morph  = parts[1] if len(parts)>1 else ''
        if greek:
            words.append({
                'greek':   greek,
                'translit': _grk_translit(greek),
                'strong':  strong,
                'morph':   morph,
                'morph_es': _morph_es(morph),
                'es':      es,
            })
    return words

_bblx_cache = {}
def _get_bblx_conn(version='NA27'):
    KEYWORDS = {
        'NA27':  ['NA27', 'Nestle', 'nestle', 'iNA27'],
        'BYZ':   ['Byzantino', 'byzantino', 'Byzantine', 'BYZ'],
        'WH':    ['Westcott', 'westcott', 'WH'],
        'TISCH': ['Tischendorf', 'tischendorf', 'TISCH'],
    }
    keywords = KEYWORDS.get(version, KEYWORDS['NA27'])
    candidates = []
    try:
        for fname in os.listdir(BBLX_DIR):
            if not fname.lower().endswith('.bblx'):
                continue
            for kw in keywords:
                if kw in fname:
                    candidates.append(os.path.join(BBLX_DIR, fname))
                    break
    except Exception as e:
        return None, f"Error listando corpus_extra: {e}"
    if not candidates:
        return None, f"No se encontró bblx para {version} en corpus_extra/"
    fpath = candidates[0]
    if fpath not in _bblx_cache:
        try:
            conn = sqlite3.connect(fpath, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            _bblx_cache[fpath] = conn
        except Exception as e:
            return None, f"Error abriendo {fpath}: {e}"
    return _bblx_cache[fpath], None

@app.route("/api/interlinear_nt")
def interlinear_nt():
    book    = request.args.get("book","").lower()
    ch      = request.args.get("ch", type=int)
    vs      = request.args.get("vs", type=int)
    version = request.args.get("version", "NA27").upper()
    if not book or not ch or not vs:
        return jsonify({"error":"Faltan: book, ch, vs"}), 400
    if book not in NT_BOOKS:
        return jsonify({"error":"Libro no es NT", "words":[]}), 200
    book_num = NT_BOOKS[book]
    conn, err = _get_bblx_conn(version)
    if err:
        return jsonify({"error": err, "words":[]}), 200
    row = conn.execute(
        "SELECT Scripture FROM Bible WHERE Book=? AND Chapter=? AND Verse=?",
        (book_num, ch, vs)
    ).fetchone()
    if not row:
        return jsonify({"error":"Verso no encontrado", "words":[]}), 200
    words = parse_nt_verse(row['Scripture'])
    db = get_db()
    try:
        for w in words:
            defn = db.execute(
                "SELECT definition FROM strong_definitions WHERE strong_num=?",
                (w['strong'],)
            ).fetchone()
            if defn and defn['definition']:
                w['definition'] = defn['definition'].split('\n')[0][:120]
    except: pass
    db.close()
    return jsonify({
        "book":book, "chapter":ch, "verse":vs,
        "version": version,
        "words": words, "word_count": len(words)
    })


@app.route("/api/catena")
def catena_list():
    book  = request.args.get("book","").lower()
    limit = request.args.get("limit",200,type=int)
    db = get_db()
    try:
        if book:
            rows = r2l(db.execute("""
                SELECT book_abbrev,chapter_begin,chapter_end,verse_begin,verse_end,
                       source_code,author,text
                FROM commentaries
                WHERE source_code='CATENA' AND book_abbrev=?
                ORDER BY chapter_begin,verse_begin LIMIT ?
            """,(book,limit)).fetchall())
        else:
            rows = r2l(db.execute("""
                SELECT book_abbrev,chapter_begin,verse_begin,author,
                       substr(text,1,200) as text
                FROM commentaries WHERE source_code='CATENA'
                ORDER BY book_abbrev,chapter_begin,verse_begin LIMIT ?
            """,(limit,)).fetchall())
    except Exception as e:
        db.close()
        return jsonify({"total":0,"entries":[],"error":str(e)}), 200
    db.close()
    return jsonify({"total":len(rows),"entries":rows})


@app.route("/api/corpus/visibility", methods=["GET","POST"])
def corpus_visibility():
    vis_path = os.path.join(CORPUS_DIR, "_visibility.json")
    if request.method == "POST":
        err = require_admin()
        if err: return err
        data = request.get_json(silent=True) or {}
        visible = data.get('visible')
        with open(vis_path, 'w', encoding='utf-8') as f:
            import json as _json2
            _json2.dump({"visible": visible}, f)
        return jsonify({"ok": True, "visible": visible})
    if os.path.exists(vis_path):
        try:
            with open(vis_path, 'r', encoding='utf-8') as f:
                import json as _json2
                cfg = _json2.load(f)
            return jsonify({"visible": cfg.get("visible")})
        except:
            pass
    return jsonify({"visible": None})


@app.route("/api/corpus/list")
def corpus_list():
    return jsonify({"files": list_corpus()})


@app.route("/api/corpus/upload", methods=["POST"])
def corpus_upload():
    if 'file' not in request.files:
        return jsonify({"error":"No se recibió archivo"}), 400
    f = request.files['file']
    if not f.filename:
        return jsonify({"error":"Nombre vacío"}), 400
    ext = os.path.splitext(f.filename)[1].lower()
    allowed = {'.refx','.refy','.ref','.bblx','.bbli','.cmtx','.cmt','.dctx','.dct'}
    if ext not in allowed:
        return jsonify({"error":f"Formato no soportado: {ext}"}), 400
    fname = secure_filename(f.filename)
    fpath = os.path.join(CORPUS_DIR, fname)
    f.save(fpath)
    return jsonify({"ok":True,"file":fname,"size_kb":os.path.getsize(fpath)//1024})


@app.route("/api/corpus/read")
def corpus_read():
    fname   = request.args.get("file","")
    chapter = request.args.get("ch", type=int)
    print(f"[corpus/read] file='{fname}' ch={chapter}")
    if not fname:
        return jsonify({"error":"Falta: file"}), 400
    fpath = os.path.join(CORPUS_DIR, fname)
    if not os.path.exists(fpath):
        matches = [f for f in os.listdir(CORPUS_DIR)
                   if f.lower().replace(' ','_') == fname.lower().replace(' ','_')]
        if matches:
            fpath = os.path.join(CORPUS_DIR, matches[0])
            fname = matches[0]
        else:
            return jsonify({"error":f"Archivo no encontrado: {fname}",
                            "disponibles": os.listdir(CORPUS_DIR)}), 404
    try:
        result = parse_any(fpath)
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": f"Error parseando archivo: {str(e)}"}), 500
    data   = result.get("data",[])
    if chapter is not None:
        if 0 <= chapter < len(data):
            return jsonify({"type":result["type"],"item":data[chapter],
                            "total":len(data),"index":chapter})
        return jsonify({"error":"Capítulo fuera de rango"}), 404
    index = []
    for i,item in enumerate(data):
        if result["type"]=="book":
            index.append({"i":i,"title":item.get("title","")})
        elif result["type"]=="commentary":
            index.append({"i":i,"book":item.get("book"),
                          "chapter":item.get("chapter"),"verse":item.get("verse")})
        else:
            index.append({"i":i,"topic":item.get("topic","")})
    return jsonify({"type":result["type"],"total":len(data),"index":index})


# ═══════════════════════════════════════════════════════════════
# QUIZ PROFÉTICO
# ═══════════════════════════════════════════════════════════════

def ensure_quiz_table():
    db = get_db()
    db.execute("""
        CREATE TABLE IF NOT EXISTS quiz_questions (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            at_book   TEXT NOT NULL,
            at_ch     INTEGER NOT NULL,
            at_vs     INTEGER NOT NULL,
            at_text   TEXT,
            nt_answer TEXT NOT NULL,
            nt_book   TEXT NOT NULL,
            nt_ch     INTEGER NOT NULL,
            nt_vs     INTEGER NOT NULL,
            decoys    TEXT NOT NULL DEFAULT '[]',
            hint      TEXT,
            active    INTEGER NOT NULL DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    count = db.execute("SELECT COUNT(*) FROM quiz_questions").fetchone()[0]
    if count == 0:
        SEED = [
            ("is",7,14,"\u2018La virgen concebir\u00e1 y dar\u00e1 a luz un hijo llamado Emmanuel\u2019",
             "Mt 1:23","mt",1,23,["Jn 1:14","Lc 1:31","Is 9:6"],"~735 aC"),
            ("mi",5,2,"\u2018De ti saldr\u00e1 el que ha de ser soberano en Israel\u2019",
             "Mt 2:6","mt",2,6,["Lc 2:4","Jn 7:42","Is 11:1"],"~730 aC"),
            ("zac",9,9,"\u2018Tu rey viene a ti, justo y victorioso, humilde y cabalgando sobre un asno\u2019",
             "Mt 21:5","mt",21,5,["Mc 11:7","Jn 12:15","Lc 19:35"],"~520 aC"),
            ("sal",22,18,"\u2018Repartieron entre s\u00ed mis vestidos y echaron suertes sobre mi t\u00fanica\u2019",
             "Jn 19:24","jn",19,24,["Mt 27:35","Mc 15:24","Lc 23:34"],"~1000 aC"),
            ("is",53,9,"\u2018Le dieron sepultura con los malvados, aunque no hab\u00eda cometido violencia\u2019",
             "Mt 27:57","mt",27,57,["Mc 15:43","Lc 23:50","Jn 19:38"],"~700 aC"),
            ("dn",9,25,"\u2018Desde que salga la orden de restaurar Jerusal\u00e9n hasta el Mes\u00edas: siete semanas y sesenta y dos semanas\u2019",
             "Lc 3:1","lc",3,1,["Mt 3:1","Mc 1:4","Jn 1:23"],"~538 aC"),
            ("os",11,1,"\u2018De Egipto llam\u00e9 a mi hijo\u2019",
             "Mt 2:15","mt",2,15,["Lc 2:39","Mc 1:9","Jn 1:11"],"~750 aC"),
            ("jr",31,15,"\u2018Se escucha en Ram\u00e1 una voz... es Raquel que llora a sus hijos\u2019",
             "Mt 2:18","mt",2,18,["Mc 1:3","Lc 1:5","Jn 1:29"],"~600 aC"),
            ("zac",12,10,"\u2018Mirar\u00e1n al que traspasaron\u2019",
             "Jn 19:37","jn",19,37,["Mt 27:49","Mc 15:39","Ap 1:7"],"~520 aC"),
            ("sal",110,4,"\u2018T\u00fa eres sacerdote para siempre, seg\u00fan el orden de Melquisedec\u2019",
             "Heb 5:6","heb",5,6,["Rm 8:34","Heb 7:17","Jn 17:19"],"~1000 aC"),
        ]
        for s in SEED:
            db.execute("""
                INSERT INTO quiz_questions
                  (at_book,at_ch,at_vs,at_text,nt_answer,nt_book,nt_ch,nt_vs,decoys,hint)
                VALUES (?,?,?,?,?,?,?,?,?,?)
            """, (s[0],s[1],s[2],s[3],s[4],s[5],s[6],s[7],json.dumps(s[8]),s[9]))
        db.commit()
    db.close()

try:
    ensure_quiz_table()
except Exception as e:
    print(f"Warning: no se pudo crear tabla quiz: {e}")

@app.route("/api/quiz/list")
def quiz_list():
    db = get_db()
    rows = r2l(db.execute(
        "SELECT * FROM quiz_questions WHERE active=1 ORDER BY RANDOM()"
    ).fetchall())
    db.close()
    for r in rows:
        try: r['decoys'] = json.loads(r.get('decoys') or '[]')
        except: r['decoys'] = []
    return jsonify({"questions": rows})

@app.route("/api/quiz/save", methods=["POST"])
def quiz_save():
    err = require_admin()
    if err: return err
    data = request.get_json(silent=True) or {}
    qid  = data.get('id')
    required = ['at_book','at_ch','at_vs','nt_answer','nt_book','nt_ch','nt_vs','decoys']
    for k in required:
        if k not in data: return jsonify({"error": f"Falta: {k}"}), 400
    decoys_json = json.dumps(data['decoys'] if isinstance(data['decoys'],list) else [])
    db = get_db()
    if qid:
        db.execute("""
            UPDATE quiz_questions SET
              at_book=?,at_ch=?,at_vs=?,at_text=?,
              nt_answer=?,nt_book=?,nt_ch=?,nt_vs=?,
              decoys=?,hint=?,active=?
            WHERE id=?
        """, (
            data['at_book'].lower(), int(data['at_ch']), int(data['at_vs']),
            data.get('at_text','')[:500],
            data['nt_answer'][:30], data['nt_book'].lower(),
            int(data['nt_ch']), int(data['nt_vs']),
            decoys_json, data.get('hint','')[:200],
            int(data.get('active',1)), qid
        ))
    else:
        cur = db.execute("""
            INSERT INTO quiz_questions
              (at_book,at_ch,at_vs,at_text,nt_answer,nt_book,nt_ch,nt_vs,decoys,hint,active)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (
            data['at_book'].lower(), int(data['at_ch']), int(data['at_vs']),
            data.get('at_text','')[:500],
            data['nt_answer'][:30], data['nt_book'].lower(),
            int(data['nt_ch']), int(data['nt_vs']),
            decoys_json, data.get('hint','')[:200],
            int(data.get('active',1))
        ))
        qid = cur.lastrowid
    db.commit(); db.close()
    return jsonify({"ok": True, "id": qid})

@app.route("/api/quiz/delete", methods=["POST"])
def quiz_delete():
    err = require_admin()
    if err: return err
    qid = (request.get_json(silent=True) or {}).get('id')
    if not qid: return jsonify({"error":"Falta id"}), 400
    db = get_db()
    db.execute("DELETE FROM quiz_questions WHERE id=?", (qid,))
    db.commit(); db.close()
    return jsonify({"ok": True})


# ═══════════════════════════════════════════════════════════════
# MÓDULO ADMIN + MODERACIÓN DE PROFECÍAS
# ═══════════════════════════════════════════════════════════════

ADMIN_CODE = os.environ.get('ADMIN_CODE', 'dev_change_me_in_env')
TOKEN_TTL = 60 * 60 * 24 * 7

def make_admin_token():
    ts = str(int(time.time()))
    sig = hmac.new(ADMIN_CODE.encode(), ts.encode(), hashlib.sha256).hexdigest()[:32]
    return f"{ts}.{sig}"

def verify_admin_token(token):
    if not token or '.' not in token: return False
    try:
        ts_str, sig = token.split('.', 1)
        if time.time() - int(ts_str) > TOKEN_TTL: return False
        expected = hmac.new(ADMIN_CODE.encode(), ts_str.encode(), hashlib.sha256).hexdigest()[:32]
        return hmac.compare_digest(expected, sig)
    except: return False

def get_admin_token():
    return request.headers.get('X-Admin-Token') or request.args.get('token','')

def require_admin():
    if not verify_admin_token(get_admin_token()):
        return jsonify({"error":"Sesión admin inválida o expirada"}), 401
    return None

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json(silent=True) or {}
    code = data.get('code','')
    if not code or not hmac.compare_digest(code, ADMIN_CODE):
        time.sleep(1)
        return jsonify({"error":"Código incorrecto"}), 403
    return jsonify({"token": make_admin_token(), "ttl_seconds": TOKEN_TTL})

@app.route("/api/admin/verify")
def admin_verify():
    return jsonify({"valid": verify_admin_token(get_admin_token())})

@app.route("/api/prophecy/submit", methods=["POST"])
def prophecy_submit():
    data = request.get_json(silent=True) or {}
    req = ['prophecy_book','prophecy_chapter','prophecy_verse',
           'fulfillment_book','fulfillment_chapter','fulfillment_verse']
    for k in req:
        if not data.get(k): return jsonify({"error":f"Falta: {k}"}), 400
    is_admin = verify_admin_token(get_admin_token())
    status = 'approved' if (is_admin and data.get('admin_direct')) else 'pending'
    at_extras_json = json.dumps(data.get('at_extras') or [])[:4000]
    nt_extras_json = json.dumps(data.get('nt_extras') or [])[:4000]
    db = get_db()
    cur = db.execute("""INSERT INTO prophetic_links
        (prophecy_book, prophecy_chapter, prophecy_verse,
         fulfillment_book, fulfillment_chapter, fulfillment_verse,
         category, certainty, description, source, status, submitter,
         at_written, at_keywords, gap, at_quote, nt_quote,
         at_extras, nt_extras,
         created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))""", (
        data['prophecy_book'].lower(), int(data['prophecy_chapter']), int(data['prophecy_verse']),
        data['fulfillment_book'].lower(), int(data['fulfillment_chapter']), int(data['fulfillment_verse']),
        (data.get('category','Otro') or 'Otro')[:80],
        (data.get('probability','') or '')[:80],
        (data.get('note','') or '')[:3000],
        (data.get('fathers','') or '')[:1500],
        status,
        (data.get('submitter_name','anónimo') or 'anónimo')[:80],
        (data.get('at_written','') or '')[:80],
        (data.get('at_keywords','') or '')[:200],
        (data.get('gap','') or '')[:80],
        (data.get('at_quote','') or '')[:2000],
        (data.get('nt_quote','') or '')[:2000],
        at_extras_json, nt_extras_json,
    ))
    new_id = cur.lastrowid
    db.commit(); db.close()
    return jsonify({"ok":True, "id":new_id, "status":status})

@app.route("/api/prophecy/edit", methods=["POST"])
def prophecy_edit():
    err = require_admin()
    if err: return err
    data = request.get_json(silent=True) or {}
    pid = data.get('id')
    if not pid: return jsonify({"error":"Falta id"}), 400
    EDITABLE = {
        'category': 80, 'certainty': 80, 'description': 3000, 'source': 1500,
        'at_written': 80, 'at_keywords': 200, 'gap': 80,
        'at_quote': 2000, 'nt_quote': 2000,
        'prophecy_book': 10, 'fulfillment_book': 10,
    }
    INT_FIELDS = {'prophecy_chapter','prophecy_verse','fulfillment_chapter','fulfillment_verse'}
    fields = []
    values = []
    for k, maxlen in EDITABLE.items():
        if k in data:
            v = data[k]
            if isinstance(v, str): v = v[:maxlen]
            if k.endswith('_book') and isinstance(v, str): v = v.lower()
            fields.append(f"{k}=?")
            values.append(v)
    for k in INT_FIELDS:
        if k in data:
            try:
                fields.append(f"{k}=?")
                values.append(int(data[k]))
            except: pass
    for k in ('at_extras', 'nt_extras'):
        if k in data:
            v = data[k] if isinstance(data[k], list) else []
            fields.append(f"{k}=?")
            values.append(json.dumps(v)[:4000])
    if not fields:
        return jsonify({"error":"Nada que actualizar"}), 400
    fields.append("updated_at=datetime('now')")
    values.append(pid)
    db = get_db()
    n = db.execute(f"UPDATE prophetic_links SET {', '.join(fields)} WHERE id=?", values).rowcount
    db.commit(); db.close()
    return jsonify({"ok":True, "updated":n})

@app.route("/api/prophecy/list")
def prophecy_list():
    db = get_db()
    rows = r2l(db.execute(
        "SELECT * FROM prophetic_links WHERE status='approved' ORDER BY created_at DESC"
    ).fetchall())
    for r in rows:
        try: r['at_extras'] = json.loads(r.get('at_extras') or '[]')
        except: r['at_extras'] = []
        try: r['nt_extras'] = json.loads(r.get('nt_extras') or '[]')
        except: r['nt_extras'] = []
    db.close()
    return jsonify({"prophecies": rows})

@app.route("/api/prophecy/pending")
def prophecy_pending():
    err = require_admin()
    if err: return err
    db = get_db()
    rows = r2l(db.execute(
        "SELECT * FROM prophetic_links WHERE status='pending' ORDER BY created_at ASC"
    ).fetchall())
    for r in rows:
        try: r['at_extras'] = json.loads(r.get('at_extras') or '[]')
        except: r['at_extras'] = []
        try: r['nt_extras'] = json.loads(r.get('nt_extras') or '[]')
        except: r['nt_extras'] = []
    db.close()
    return jsonify({"pending": rows})

@app.route("/api/prophecy/approved")
def prophecy_approved():
    err = require_admin()
    if err: return err
    db = get_db()
    rows = r2l(db.execute(
        "SELECT * FROM prophetic_links WHERE status='approved' ORDER BY created_at DESC"
    ).fetchall())
    for r in rows:
        try: r['at_extras'] = json.loads(r.get('at_extras') or '[]')
        except: r['at_extras'] = []
        try: r['nt_extras'] = json.loads(r.get('nt_extras') or '[]')
        except: r['nt_extras'] = []
    db.close()
    return jsonify({"approved": rows})

@app.route("/api/prophecy/delete", methods=["POST"])
def prophecy_delete():
    err = require_admin()
    if err: return err
    pid = (request.get_json(silent=True) or {}).get('id')
    if not pid: return jsonify({"error":"Falta id"}), 400
    db = get_db()
    n = db.execute("DELETE FROM prophetic_links WHERE id=?", (pid,)).rowcount
    db.commit(); db.close()
    return jsonify({"ok":True, "deleted":n})

@app.route("/api/prophecy/approve", methods=["POST"])
def prophecy_approve():
    err = require_admin()
    if err: return err
    pid = (request.get_json(silent=True) or {}).get('id')
    if not pid: return jsonify({"error":"Falta id"}), 400
    db = get_db()
    n = db.execute("UPDATE prophetic_links SET status='approved' WHERE id=? AND status='pending'",(pid,)).rowcount
    db.commit(); db.close()
    return jsonify({"ok":True, "updated":n})

@app.route("/api/prophecy/reject", methods=["POST"])
def prophecy_reject():
    err = require_admin()
    if err: return err
    pid = (request.get_json(silent=True) or {}).get('id')
    if not pid: return jsonify({"error":"Falta id"}), 400
    db = get_db()
    n = db.execute("UPDATE prophetic_links SET status='rejected' WHERE id=?",(pid,)).rowcount
    db.commit(); db.close()
    return jsonify({"ok":True, "updated":n})


# ══════════════════════════════════════════
# SERVIR REACT BUILD — Railway
# ══════════════════════════════════════════

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    # Proteger rutas API
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404
    # Servir archivo estático si existe como archivo (no directorio)
    full = os.path.join(BUILD_DIR, path)
    if path and os.path.isfile(full):
        return send_from_directory(BUILD_DIR, path)
    # Todo lo demás → index.html (React Router)
    return send_from_directory(BUILD_DIR, "index.html")


# ══════════════════════════════════════════
# ARRANQUE — siempre al final
# ══════════════════════════════════════════
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    print(f"\n✠ PROFI-CY corriendo en http://0.0.0.0:{port}")
    print(f"  DB: {DB_PATH} ({'OK' if os.path.exists(DB_PATH) else 'NO ENCONTRADA'})")
    print(f"  Build: {BUILD_DIR} ({'OK' if os.path.exists(BUILD_DIR) else 'NO ENCONTRADO'})")
    app.run(host="0.0.0.0", port=port, debug=False)
