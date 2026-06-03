// PROFI-CY · Reader.js v2 — libros filtrados por versión
import { useState, useEffect, useRef } from "react";

const API = `${window.location.protocol}//${window.location.hostname}:5050/api`;

const AT_39 = [
  {a:"gn",n:"Génesis",c:50},{a:"ex",n:"Éxodo",c:40},{a:"lv",n:"Levítico",c:27},
  {a:"nm",n:"Números",c:36},{a:"dt",n:"Deuteronomio",c:34},{a:"jos",n:"Josué",c:24},
  {a:"jue",n:"Jueces",c:21},{a:"rt",n:"Rut",c:4},{a:"1sm",n:"1 Samuel",c:31},
  {a:"2sm",n:"2 Samuel",c:24},{a:"1re",n:"1 Reyes",c:22},{a:"2re",n:"2 Reyes",c:25},
  {a:"1cr",n:"1 Crónicas",c:29},{a:"2cr",n:"2 Crónicas",c:36},{a:"esd",n:"Esdras",c:10},
  {a:"neh",n:"Nehemías",c:13},{a:"est",n:"Ester",c:10},{a:"job",n:"Job",c:42},
  {a:"sal",n:"Salmos",c:150},{a:"pr",n:"Proverbios",c:31},{a:"ec",n:"Eclesiastés",c:12},
  {a:"cnt",n:"Cantar",c:8},{a:"is",n:"Isaías",c:66},{a:"jr",n:"Jeremías",c:52},
  {a:"lm",n:"Lamentaciones",c:5},{a:"ez",n:"Ezequiel",c:48},{a:"dn",n:"Daniel",c:12},
  {a:"os",n:"Oseas",c:14},{a:"jl",n:"Joel",c:3},{a:"am",n:"Amós",c:9},
  {a:"ab",n:"Abdías",c:1},{a:"jon",n:"Jonás",c:4},{a:"mi",n:"Miqueas",c:7},
  {a:"na",n:"Nahúm",c:3},{a:"hab",n:"Habacuc",c:3},{a:"sof",n:"Sofonías",c:3},
  {a:"ag",n:"Ageo",c:2},{a:"zac",n:"Zacarías",c:14},{a:"mal",n:"Malaquías",c:4},
];
const DC_7 = [
  {a:"tb",n:"Tobías",c:14},{a:"jdt",n:"Judit",c:16},{a:"1mc",n:"1 Macabeos",c:16},
  {a:"2mc",n:"2 Macabeos",c:15},{a:"sab",n:"Sabiduría",c:19},
  {a:"ecli",n:"Eclesiástico",c:51},{a:"ba",n:"Baruc",c:6},
];
const NT_27 = [
  {a:"mt",n:"Mateo",c:28},{a:"mc",n:"Marcos",c:16},{a:"lc",n:"Lucas",c:24},
  {a:"jn",n:"Juan",c:21},{a:"hch",n:"Hechos",c:28},{a:"rm",n:"Romanos",c:16},
  {a:"1co",n:"1 Corintios",c:16},{a:"2co",n:"2 Corintios",c:13},{a:"ga",n:"Gálatas",c:6},
  {a:"ef",n:"Efesios",c:6},{a:"flp",n:"Filipenses",c:4},{a:"col",n:"Colosenses",c:4},
  {a:"1ts",n:"1 Tesalonicenses",c:5},{a:"2ts",n:"2 Tesalonicenses",c:3},
  {a:"1tm",n:"1 Timoteo",c:6},{a:"2tm",n:"2 Timoteo",c:4},{a:"tit",n:"Tito",c:3},
  {a:"flm",n:"Filemón",c:1},{a:"heb",n:"Hebreos",c:13},{a:"stg",n:"Santiago",c:5},
  {a:"1pe",n:"1 Pedro",c:5},{a:"2pe",n:"2 Pedro",c:3},{a:"1jn",n:"1 Juan",c:5},
  {a:"2jn",n:"2 Juan",c:1},{a:"3jn",n:"3 Juan",c:1},{a:"jud",n:"Judas",c:1},
  {a:"ap",n:"Apocalipsis",c:22},
];

// Libros disponibles por versión
function getBooksForVer(ver) {
  if (ver==="BHS"||ver==="LXX") return AT_39;
  if (ver==="PES"||ver==="GNT") return NT_27;
  if (ver==="JER"||ver==="VUL"||ver==="NAC"||ver==="BSA") return [...AT_39,...DC_7,...NT_27];
  return [...AT_39,...NT_27]; // RVR, RV60S, KJV
}
const AT_SET = new Set(AT_39.map(b=>b.a));
const DC_SET = new Set(DC_7.map(b=>b.a));

const PROPHETIC = {
  "gn-3-15":"Protoevangelio","is-7-14":"La Virgen · Parthénos",
  "is-9-6":"Hijo nos es dado","is-11-1":"Renuevo de Jesé",
  "is-40-3":"Voz que clama","is-53-1":"Siervo Sufriente",
  "is-53-2":"Siervo Sufriente","is-53-3":"Varón de dolores",
  "is-53-4":"Llevó enfermedades","is-53-5":"Herido por nuestras iniquidades",
  "is-53-6":"Como ovejas","is-53-7":"Cordero al matadero",
  "is-53-10":"Voluntad del Señor","is-53-11":"Justificará a muchos",
  "mi-5-2":"Nacimiento en Belén","zac-9-9":"Rey sobre asno",
  "zac-12-10":"Mirarán al que traspasaron","mal-3-1":"Mi mensajero",
  "dn-9-25":"Las 70 semanas","dn-9-26":"Muerte del Ungido",
  "sal-22-1":"Abandono en la Cruz","sal-22-7":"Escarnio",
  "sal-22-16":"Traspasaron manos y pies","sal-22-18":"Repartieron vestidos",
  "sal-110-1":"Señor a mi Señor","sal-110-4":"Sacerdote según Melquisedec",
  "jr-31-15":"Raquel llora","jr-31-31":"Nueva Alianza",
  "os-11-1":"De Egipto llamé a mi Hijo",
};

const VER_LIST = [
  {code:"JER", label:"Biblia de Jerusalén (73 libros)"},
  {code:"NAC", label:"Nácar-Colunga (73 libros)"},
  {code:"BSA", label:"Serafín de Ausejo (73 libros)"},
  {code:"RVR", label:"Reina-Valera (66 libros)"},
  {code:"RV60S",label:"RV 1960 + Strong (66 libros)"},
  {code:"VUL", label:"Vulgata Latina (73 libros)"},
  {code:"BHS", label:"Hebreo BHS (AT 39 libros)"},
  {code:"LXX", label:"Septuaginta Griega (AT 39 libros)"},
  {code:"GNT", label:"NT Griego SBL (27 libros)"},
  {code:"KJV", label:"King James (66 libros)"},
  {code:"PES", label:"Peshita Arameo (NT 27 libros)"},
];

export default function Reader({ onVerseClick }) {
  const [version, setVersion] = useState("JER");
  const [books, setBooks]     = useState(getBooksForVer("JER"));
  const [bookAbbrev, setBA]   = useState("jn");
  const [chapter, setChapter] = useState(1);
  const [maxCh, setMaxCh]     = useState(21);
  const [verses, setVerses]   = useState([]);
  const [loading, setLoading] = useState(false);
  const topRef = useRef(null);

  const changeVersion = (ver) => {
    const newBooks = getBooksForVer(ver);
    setVersion(ver);
    setBooks(newBooks);
    const exists = newBooks.find(b => b.a === bookAbbrev);
    const first  = exists || newBooks[0];
    if (!exists) { setBA(first.a); setChapter(1); setMaxCh(first.c); }
    loadChapter(exists ? bookAbbrev : first.a, exists ? chapter : 1, ver);
  };

  const changeBook = (abbrev) => {
    const bk = books.find(b => b.a === abbrev);
    setBA(abbrev); setChapter(1); setMaxCh(bk?.c||50);
    loadChapter(abbrev, 1, version);
  };

  const loadChapter = async (ba, ch, ver) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/chapter?book=${ba}&ch=${ch}&version=${ver}`);
      if (r.ok) {
        const d = await r.json();
        setVerses(d.verses||[]);
      } else {
        setVerses([{verse:1,text:`Sin datos para ${ver} en este capítulo`,prophetic:null}]);
      }
    } catch {
      setVerses([{verse:1,text:"Error de conexión",prophetic:null}]);
    }
    setLoading(false);
    topRef.current?.scrollIntoView({behavior:'smooth'});
  };

  useEffect(() => {
    setMaxCh(21);
    loadChapter("jn", 1, "JER");
  }, []);

  const goChapter = (dir) => {
    const nc = chapter+dir;
    if (nc<1||nc>maxCh) return;
    setChapter(nc);
    loadChapter(bookAbbrev, nc, version);
  };

  const bookName = books.find(b=>b.a===bookAbbrev)?.n || bookAbbrev;
  const isRTL = version==="BHS";

  return (
    <div className="reader-wrap">
      <div className="reader-controls">
        <span className="ref-label">VERSIÓN</span>
        <select className="ref-sel" style={{maxWidth:260}} value={version}
          onChange={e=>changeVersion(e.target.value)}>
          {VER_LIST.map(v=><option key={v.code} value={v.code}>{v.code} — {v.label}</option>)}
        </select>

        <span className="ref-label">LIBRO</span>
        <select className="ref-sel" value={bookAbbrev}
          onChange={e=>changeBook(e.target.value)}>
          {books.some(b=>AT_SET.has(b.a)) && (
            <optgroup label="── ANTIGUO TESTAMENTO ──">
              {books.filter(b=>AT_SET.has(b.a)).map(b=><option key={b.a} value={b.a}>{b.n}</option>)}
            </optgroup>
          )}
          {books.some(b=>DC_SET.has(b.a)) && (
            <optgroup label="── DEUTEROCANÓNICOS ──">
              {books.filter(b=>DC_SET.has(b.a)).map(b=><option key={b.a} value={b.a}>{b.n}</option>)}
            </optgroup>
          )}
          {books.some(b=>!AT_SET.has(b.a)&&!DC_SET.has(b.a)) && (
            <optgroup label="── NUEVO TESTAMENTO ──">
              {books.filter(b=>!AT_SET.has(b.a)&&!DC_SET.has(b.a)).map(b=><option key={b.a} value={b.a}>{b.n}</option>)}
            </optgroup>
          )}
        </select>

        <button className="btn" onClick={()=>goChapter(-1)} disabled={chapter<=1}>◀</button>
        <span className="reader-chap-label">{bookName} {chapter}</span>
        <button className="btn" onClick={()=>goChapter(1)} disabled={chapter>=maxCh}>▶</button>
      </div>

      <div className="reader-ch-row">
        {Array.from({length:maxCh},(_,i)=>i+1).map(n=>(
          <button key={n} className={`ch-btn${chapter===n?" active":""}`}
            onClick={()=>{setChapter(n);loadChapter(bookAbbrev,n,version);}}>
            {n}
          </button>
        ))}
      </div>

      <div className="reader-body" ref={topRef}>
        {loading && <div className="loading">✠ CARGANDO CAPÍTULO ✠</div>}
        {!loading && (
          <div className={`chapter-text${isRTL?" rtl":""}`}>
            <h2 className="chapter-title">{bookName} · Capítulo {chapter}</h2>
            {verses.map((v,i)=>(
              <span key={i} className={`verse-span${v.prophetic?" prophetic":""}`}
                onClick={()=>onVerseClick&&onVerseClick(bookAbbrev,chapter,v.verse)}
                title={v.prophetic||undefined}>
                <sup className={`verse-num${v.prophetic?" proph-num":""}`}>{v.verse}</sup>
                {v.text}{" "}
                {v.prophetic && <span className="proph-tag">✠ {v.prophetic}</span>}
              </span>
            ))}
            {verses.length===0&&!loading&&
              <div className="empty">Sin versículos para este capítulo en {version}</div>}
          </div>
        )}
      </div>

      <div className="reader-nav-bottom">
        <button className="btn" onClick={()=>goChapter(-1)} disabled={chapter<=1}>◀ Cap. {chapter-1}</button>
        <span style={{color:"var(--txd)",fontSize:"0.72rem",fontFamily:"Cinzel,serif"}}>{chapter} / {maxCh}</span>
        <button className="btn" onClick={()=>goChapter(1)} disabled={chapter>=maxCh}>Cap. {chapter+1} ▶</button>
      </div>
    </div>
  );
}
