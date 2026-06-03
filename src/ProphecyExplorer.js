// PROFI-CY · ProphecyExplorer.js v2
// Modos: EXPLORAR | QUIZ | PROFI-CY (editor de profecías propias)
import { useState, useEffect } from "react";

const API = "http://localhost:5050/api";

const BOOKS_AT = [
  "Génesis","Éxodo","Levítico","Números","Deuteronomio","Josué","Jueces","Rut",
  "1 Samuel","2 Samuel","1 Reyes","2 Reyes","1 Crónicas","2 Crónicas","Esdras",
  "Nehemías","Ester","Job","Salmos","Proverbios","Eclesiastés","Cantar","Sabiduría",
  "Eclesiástico","Isaías","Jeremías","Lamentaciones","Baruc","Ezequiel","Daniel",
  "Oseas","Joel","Amós","Abdías","Jonás","Miqueas","Nahúm","Habacuc","Sofonías",
  "Ageo","Zacarías","Malaquías","Tobías","Judit","1 Macabeos","2 Macabeos",
];
const BOOKS_NT = [
  "Mateo","Marcos","Lucas","Juan","Hechos","Romanos","1 Corintios","2 Corintios",
  "Gálatas","Efesios","Filipenses","Colosenses","1 Tesalonicenses","2 Tesalonicenses",
  "1 Timoteo","2 Timoteo","Tito","Filemón","Hebreos","Santiago","1 Pedro","2 Pedro",
  "1 Juan","2 Juan","3 Juan","Judas","Apocalipsis",
];
const BOOK_ABBREV = {
  "Génesis":"gn","Éxodo":"ex","Levítico":"lv","Números":"nm","Deuteronomio":"dt",
  "Josué":"jos","Jueces":"jue","Rut":"rt","1 Samuel":"1sm","2 Samuel":"2sm",
  "1 Reyes":"1re","2 Reyes":"2re","Salmos":"sal","Proverbios":"pr","Isaías":"is",
  "Jeremías":"jr","Ezequiel":"ez","Daniel":"dn","Oseas":"os","Joel":"jl","Amós":"am",
  "Miqueas":"mi","Zacarías":"zac","Malaquías":"mal","Mateo":"mt","Marcos":"mc",
  "Lucas":"lc","Juan":"jn","Hechos":"hch","Romanos":"rm","1 Corintios":"1co",
  "2 Corintios":"2co","Gálatas":"ga","Efesios":"ef","Hebreos":"heb","Santiago":"stg",
  "1 Pedro":"1pe","2 Pedro":"2pe","1 Juan":"1jn","Apocalipsis":"ap",
  "Tobías":"tb","Judit":"jdt","1 Macabeos":"1mc","2 Macabeos":"2mc",
  "Sabiduría":"sab","Eclesiástico":"ecli","Baruc":"ba","Lamentaciones":"lm",
  "Cantar":"cnt","Eclesiastés":"ec","Job":"job","Esdras":"esd","Nehemías":"neh",
  "Ester":"est","1 Crónicas":"1cr","2 Crónicas":"2cr","Josué":"jos",
  "Nahúm":"na","Habacuc":"hab","Sofonías":"sof","Ageo":"ag","Abdías":"ab",
  "Jonás":"jon","Filipenses":"flp","Colosenses":"col","1 Tesalonicenses":"1ts",
  "2 Tesalonicenses":"2ts","1 Timoteo":"1tm","2 Timoteo":"2tm","Tito":"tit",
  "Filemón":"flm","Judas":"jud","2 Juan":"2jn","3 Juan":"3jn","Marcos":"mc",
};

const PROPHECY_DB = [
  { id:1, category:"Nacimiento",
    prophecy:{ book:"is", ch:7, vs:14, ref:"Isaías 7:14",
      summary:"La Virgen concebirá y dará a luz un hijo llamado Emmanuel",
      keyword:"Parthénos · Almah · Virgen" },
    fulfillment:{ book:"mt", ch:1, vs:23, ref:"Mateo 1:23",
      summary:"He aquí la virgen concebirá y dará a luz un hijo, y le pondrán por nombre Emmanuel" },
    written:"~735 aC", gap:"~735 años", probability:"1 en 1,000",
    fathers:"San Justino Mártir, San Ireneo, San Jerónimo",
    note:"La palabra hebrea 'almah' fue traducida por los LXX como 'parthénos' (virgen). Clave del debate Is 7:14.",
  },
  { id:2, category:"Nacimiento",
    prophecy:{ book:"mi", ch:5, vs:2, ref:"Miqueas 5:2",
      summary:"De Belén de Efrata saldrá el que ha de ser Señor de Israel",
      keyword:"Belén · Origen eterno" },
    fulfillment:{ book:"mt", ch:2, vs:6, ref:"Mateo 2:6",
      summary:"Y tú, Belén de la tierra de Judá, no eres en ninguna manera la menor entre los príncipes de Judá" },
    written:"~700 aC", gap:"~700 años", probability:"1 en 100,000",
    fathers:"Orígenes, San Cipriano",
    note:"Los propios sumos sacerdotes y escribas citaron esta profecía ante los Reyes Magos (Mt 2:5-6).",
  },
  { id:3, category:"Pasión",
    prophecy:{ book:"sal", ch:22, vs:1, ref:"Salmo 22:1",
      summary:"Dios mío, Dios mío, ¿por qué me has abandonado?",
      keyword:"Abandono · Crucifixión · Siervo" },
    fulfillment:{ book:"mt", ch:27, vs:46, ref:"Mateo 27:46",
      summary:"Y como a la hora novena Jesús clamó con gran voz, diciendo: Elí, Elí, ¿lama sabactani?" },
    written:"~1000 aC", gap:"~1000 años", probability:"1 en 1,000",
    fathers:"Lactancio, San Agustín — Enarrationes in Psalmos",
    note:"El Salmo 22 describe con precisión la crucifixión siglos antes de que Roma inventara ese método.",
  },
  { id:4, category:"Pasión",
    prophecy:{ book:"sal", ch:22, vs:18, ref:"Salmo 22:18",
      summary:"Repartieron entre sí mis vestidos, y sobre mi ropa echaron suertes",
      keyword:"Vestidos · Suertes · Soldados" },
    fulfillment:{ book:"jn", ch:19, vs:24, ref:"Juan 19:24",
      summary:"Se repartieron mis vestidos, y sobre mi ropa echaron suertes. Así que los soldados hicieron esto" },
    written:"~1000 aC", gap:"~1000 años", probability:"1 en 1,000",
    fathers:"San Justino — Diálogo con Trifón",
    note:"Juan cita explícitamente la profecía al narrar el hecho (Jn 19:24).",
  },
  { id:5, category:"Pasión",
    prophecy:{ book:"is", ch:53, vs:5, ref:"Isaías 53:5",
      summary:"Él fue herido por nuestras rebeliones, molido por nuestros pecados",
      keyword:"Siervo Sufriente · Expiación · Heridas" },
    fulfillment:{ book:"1pe", ch:2, vs:24, ref:"1 Pedro 2:24",
      summary:"Quien llevó él mismo nuestros pecados en su cuerpo sobre el madero. Por cuya herida fuisteis sanados" },
    written:"~700 aC", gap:"~700 años", probability:"1 en 10,000",
    fathers:"Eusebio de Cesarea, San Ireneo",
    note:"Isaías 53 es el capítulo más citado por los autores del NT. Describe la expiación vicaria con 700 años de anticipación.",
  },
  { id:6, category:"Entrada a Jerusalén",
    prophecy:{ book:"zac", ch:9, vs:9, ref:"Zacarías 9:9",
      summary:"Rey justo y victorioso, humilde y montado en un asno",
      keyword:"Rey · Asno · Jerusalén · Triunfo" },
    fulfillment:{ book:"jn", ch:12, vs:15, ref:"Juan 12:15",
      summary:"No temas, hija de Sión; he aquí tu Rey viene, montado sobre un pollino de asna" },
    written:"~520 aC", gap:"~520 años", probability:"1 en 1,000",
    fathers:"San Cirilo de Alejandría",
    note:"Los cuatro Evangelios registran este evento. Juan cita la profecía explícitamente.",
  },
  { id:7, category:"Traición",
    prophecy:{ book:"zac", ch:11, vs:13, ref:"Zacarías 11:13",
      summary:"30 piezas de plata devueltas al alfarero en la casa de YHWH",
      keyword:"30 monedas · Alfarero · Traición" },
    fulfillment:{ book:"mt", ch:27, vs:9, ref:"Mateo 27:9-10",
      summary:"Tomaron las 30 piezas de plata... y las dieron para el campo del alfarero, como me ordenó el Señor" },
    written:"~520 aC", gap:"~520 años", probability:"1 en 1,000,000",
    fathers:"Orígenes, San Juan Crisóstomo",
    note:"Mateo cita la profecía. El detalle de las 30 monedas y el campo del alfarero es estadísticamente improbable por azar.",
  },
  { id:8, category:"Resurrección",
    prophecy:{ book:"sal", ch:16, vs:10, ref:"Salmo 16:10",
      summary:"No dejarás mi alma en el Seol, ni permitirás que tu Santo vea corrupción",
      keyword:"Resurrección · Seol · Corrupción" },
    fulfillment:{ book:"hch", ch:2, vs:31, ref:"Hechos 2:31",
      summary:"Viéndolo antes, habló de la resurrección de Cristo, que su alma no fue dejada en el Hades" },
    written:"~1000 aC", gap:"~1000 años", probability:"1 en 10,000",
    fathers:"San Pedro en Pentecostés (Hch 2:25-31), San Agustín",
    note:"Pedro aplica este Salmo de David directamente a la resurrección de Cristo en su primer discurso.",
  },
  { id:9, category:"Divinidad",
    prophecy:{ book:"sal", ch:110, vs:1, ref:"Salmo 110:1",
      summary:"Dijo YHWH a mi Señor: Siéntate a mi diestra hasta que ponga a tus enemigos por estrado de tus pies",
      keyword:"Señor de David · Diestra · Pre-existencia" },
    fulfillment:{ book:"mt", ch:22, vs:44, ref:"Mateo 22:44",
      summary:"Jesús pregunta: Si David le llama Señor, ¿cómo es su hijo? — y nadie le pudo responder" },
    written:"~1000 aC", gap:"~1000 años", probability:"1 en 1,000",
    fathers:"Tertuliano, San Justino Mártir",
    note:"El versículo más citado del AT en el NT. Jesús mismo lo usa para demostrar su naturaleza divina.",
  },
  { id:10, category:"Nueva Alianza",
    prophecy:{ book:"jr", ch:31, vs:31, ref:"Jeremías 31:31",
      summary:"He aquí que vienen días en que haré nueva alianza con la casa de Israel",
      keyword:"Nueva Alianza · Corazón · Ley interior" },
    fulfillment:{ book:"heb", ch:8, vs:8, ref:"Hebreos 8:8-12",
      summary:"He aquí vienen días, dice el Señor, en que estableceré con la casa de Israel un nuevo pacto" },
    written:"~627 aC", gap:"~627 años", probability:"1 en 1,000",
    fathers:"San Ireneo — Adversus Haereses",
    note:"La palabra 'Alianza' (berith/diatheke) es la raíz de 'testamento'. Hebreos 8 cita esta profecía íntegramente.",
  },
];

const CATEGORIES = ["Todas", ...new Set(PROPHECY_DB.map(p => p.category))];

const QUIZ_OPTIONS = {
  1:["Mt 1:23","Lc 1:31","Jn 1:14","Is 9:6"],
  2:["Mt 2:6","Lc 2:4","Jn 7:42","Mi 5:4"],
  3:["Mt 27:46","Mc 15:34","Lc 23:46","Jn 19:28"],
  4:["Jn 19:24","Mt 27:35","Lc 23:34","Mc 15:24"],
  5:["1Pe 2:24","Rm 5:8","Heb 9:28","Col 1:20"],
  6:["Jn 12:15","Mt 21:5","Mc 11:7","Lc 19:35"],
  7:["Mt 27:9","Lc 22:5","Mc 14:11","Hch 1:18"],
  8:["Hch 2:31","Rm 6:9","1Co 15:4","Ef 1:20"],
  9:["Mt 22:44","Mc 12:36","Lc 20:42","Hch 2:34"],
  10:["Heb 8:8","Rm 11:27","Mt 26:28","Lc 22:20"],
};

// ─── Estado inicial del editor ───
const EDITOR_EMPTY = {
  category: "Nacimiento",
  // AT
  at_book: "Isaías", at_ch: 7, at_vs: 14,
  at_quote: "",
  at_written: "",
  at_keywords: "",
  gap: "",
  // NT
  nt_book: "Mateo", nt_ch: 1, nt_vs: 23,
  nt_quote: "",
  // Análisis
  probability: "",
  note: "",
  fathers: "",
};

// ─── Selector de versículo ───
function VerseSelector({ label, books, bookVal, chVal, vsVal,
  onBook, onCh, onVs, onViewParallel }) {
  return (
    <div className="ed-vs-row">
      <span className="ed-vs-label">{label}</span>
      <select className="ref-sel ed-sel" value={bookVal} onChange={e=>onBook(e.target.value)}>
        {books.map(b=><option key={b} value={b}>{b}</option>)}
      </select>
      <span className="ref-label">Cap</span>
      <input className="ref-num" type="number" min="1" max="150" value={chVal}
        onChange={e=>onCh(+e.target.value||1)}/>
      <span className="ref-label">Vers</span>
      <input className="ref-num" type="number" min="1" max="200" value={vsVal}
        onChange={e=>onVs(+e.target.value||1)}/>
      <button className="btn" style={{fontSize:"0.58rem"}}
        onClick={()=>onViewParallel(BOOK_ABBREV[bookVal]||bookVal.toLowerCase(),chVal,vsVal)}>
        ↗ VER
      </button>
    </div>
  );
}

export default function ProphecyExplorer({ onVerseClick, onGoQuiz }) {
  // Modos
  const [mode, setMode] = useState("explorer"); // explorer | quiz | editor

  // Explorer
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [category, setCategory] = useState("Todas");

  // Quiz
  const [quizIdx, setQuizIdx]       = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizScore, setQuizScore]   = useState(0);
  const [quizTotal, setQuizTotal]   = useState(0);
  const [quizOpts, setQuizOpts]     = useState(null); // shuffled once

  // Editor
  const [ed, setEd]               = useState(EDITOR_EMPTY);
  const [saved, setSaved]         = useState([]); // lista de profecías creadas
  const [edSaved, setEdSaved]     = useState(false);
  const [fetchingAt, setFetchAt]  = useState(false);
  const [fetchingNt, setFetchNt]  = useState(false);
  const [atText, setAtText]       = useState("");
  const [ntText, setNtText]       = useState("");
  const [adminAsDirect, setAdminAsDirect] = useState(false);
  const [customCat, setCustomCat] = useState("");   // Categoría personalizada cuando se elige "Otro"
  const [atExtras, setAtExtras]   = useState([]);   // Citas AT adicionales (profecías cíclicas)
  const [ntExtras, setNtExtras]   = useState([]);   // Citas NT adicionales

  // Detectar sesión admin desde localStorage
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('proficy_admin_token') : null;
  const isAdminLogged = !!adminToken;

  // Profecías aprobadas desde la DB (las que el moderador autorizó)
  const [dbProphecies, setDbProphecies] = useState([]);
  const reloadDbProphecies = async () => {
    try {
      const r = await fetch(`${API}/prophecy/list`);
      const d = await r.json();
      const mapped = (d.prophecies || []).map(p => {
        return {
          id: 'db_' + p.id,
          _dbId: p.id,
          category: p.category || 'Otro',
          prophecy: {
            book: p.prophecy_book,
            ch: p.prophecy_chapter,
            vs: p.prophecy_verse,
            ref: `${(p.prophecy_book||'').toUpperCase()} ${p.prophecy_chapter}:${p.prophecy_verse}`,
            summary: p.at_quote || 'Cargar texto desde la DB...',
            keyword: p.at_keywords || p.category || '',
            extras: p.at_extras || [],
          },
          fulfillment: {
            book: p.fulfillment_book,
            ch: p.fulfillment_chapter,
            vs: p.fulfillment_verse,
            ref: `${(p.fulfillment_book||'').toUpperCase()} ${p.fulfillment_chapter}:${p.fulfillment_verse}`,
            summary: p.nt_quote || '',
            extras: p.nt_extras || [],
          },
          written: p.at_written || '',
          gap: p.gap || '',
          probability: p.certainty || '',
          note: p.description || '',
          fathers: p.source || '',
          _fromDb: true,
        };
      });
      setDbProphecies(mapped);
    } catch {}
  };
  useEffect(() => { reloadDbProphecies(); }, []);

  const upd = (k,v) => setEd(e=>({...e,[k]:v}));

  // ── Helpers para citas extras (profecías cíclicas) ──
  const addExtra = (which) => {
    const blank = which === 'at'
      ? { book: "Isaías", ch: 1, vs: 1, quote: "" }
      : { book: "Mateo", ch: 1, vs: 1, quote: "" };
    if (which === 'at') setAtExtras(a=>[...a, blank]);
    else setNtExtras(a=>[...a, blank]);
  };
  const updExtra = (which, i, k, v) => {
    const setter = which === 'at' ? setAtExtras : setNtExtras;
    setter(a => a.map((e,idx) => idx===i ? {...e, [k]:v} : e));
  };
  const delExtra = (which, i) => {
    const setter = which === 'at' ? setAtExtras : setNtExtras;
    setter(a => a.filter((_,idx) => idx!==i));
  };

  // Cargar texto del versículo AT desde la API
  const fetchVerse = async (bookName, ch, vs, isAt) => {
    const abbrev = BOOK_ABBREV[bookName] || bookName.toLowerCase();
    if (isAt) setFetchAt(true); else setFetchNt(true);
    try {
      const r = await fetch(`${API}/parallel?book=${abbrev}&ch=${ch}&vs=${vs}`);
      const d = await r.json();
      const jer = d.versiculos?.find(v=>v.version_code==="JER");
      const text = jer?.text || "";
      if (isAt) setAtText(text);
      else setNtText(text);
    } catch {}
    if (isAt) setFetchAt(false); else setFetchNt(false);
  };

  const saveEntry = async () => {
    // Categoría final: si eligió "Otro" + escribió custom, usar custom
    const effectiveCat = (ed.category === "Otro" && customCat.trim()) ? customCat.trim() : ed.category;
    const payload = {
      prophecy_book: BOOK_ABBREV[ed.at_book] || ed.at_book.toLowerCase(),
      prophecy_chapter: ed.at_ch,
      prophecy_verse: ed.at_vs,
      fulfillment_book: BOOK_ABBREV[ed.nt_book] || ed.nt_book.toLowerCase(),
      fulfillment_chapter: ed.nt_ch,
      fulfillment_verse: ed.nt_vs,
      category: effectiveCat,
      probability: ed.probability,
      note: ed.note,
      fathers: ed.fathers,
      at_written: ed.at_written,
      at_keywords: ed.at_keywords,
      gap: ed.gap,
      at_quote: ed.at_quote || atText,
      nt_quote: ed.nt_quote || ntText,
      at_extras: atExtras.map(e => ({
        book: BOOK_ABBREV[e.book] || (e.book||"").toLowerCase(),
        ch: parseInt(e.ch) || 1,
        vs: parseInt(e.vs) || 1,
        quote: e.quote || "",
      })),
      nt_extras: ntExtras.map(e => ({
        book: BOOK_ABBREV[e.book] || (e.book||"").toLowerCase(),
        ch: parseInt(e.ch) || 1,
        vs: parseInt(e.vs) || 1,
        quote: e.quote || "",
      })),
      submitter_name: 'usuario',
      admin_direct: adminAsDirect,
    };
    try {
      const r = await fetch(`${API}/prophecy/submit`, {
        method:'POST',
        headers: { 'Content-Type':'application/json',
          ...(adminToken ? {'X-Admin-Token': adminToken} : {}) },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (r.ok) {
        setEdSaved(d.status === 'approved' ? 'approved' : 'pending');
        setEd(EDITOR_EMPTY);
        setAtText(""); setNtText("");
        setCustomCat("");
        setAtExtras([]); setNtExtras([]);
        setTimeout(()=>setEdSaved(false), 4500);
        // Si entró como aprobada directa, recargar la lista
        if (d.status === 'approved') reloadDbProphecies();
      } else {
        setEdSaved('error');
        setTimeout(()=>setEdSaved(false), 3000);
      }
    } catch {
      setEdSaved('error');
      setTimeout(()=>setEdSaved(false), 3000);
    }
  };

  // ── Quiz setup ──
  const filtered = category === "Todas" ? PROPHECY_DB : PROPHECY_DB.filter(p=>p.category===category);
  const quizProphecy = PROPHECY_DB[quizIdx % PROPHECY_DB.length];
  const rawOpts = QUIZ_OPTIONS[quizProphecy.id] || [];
  const correctOpt = rawOpts[0];
  // Shuffle solo cuando cambia el quizIdx
  const displayOpts = quizOpts || [...rawOpts].sort(()=>Math.random()-0.5);

  const handleQuizAnswer = opt => {
    if (quizAnswer) return;
    setQuizAnswer(opt);
    setQuizTotal(t=>t+1);
    if (opt===correctOpt) setQuizScore(s=>s+1);
  };
  const nextQuiz = () => {
    setQuizIdx(i=>i+1);
    setQuizAnswer(null);
    setQuizOpts(null);
  };

  return (
    <div className="pe-wrap">

      {/* ── HEADER ── */}
      <div className="pe-header">
        <div>
          <div className="pe-title">✠ DETECTIVE PROFÉTICO</div>
          <div className="pe-subtitle">Descubrí los patrones entre el AT y el NT</div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <button className={`btn${mode==="explorer"?" active":""}`}
            onClick={()=>setMode("explorer")}>🔍 EXPLORAR</button>
          <button className={`btn${mode==="quiz"?" active":""}`}
            onClick={()=>setMode("quiz")}>🎯 QUIZ</button>
          <button className={`btn${mode==="editor"?" active":""}`}
            style={mode==="editor"?{}:{borderColor:"var(--gold)",color:"var(--gold)"}}
            onClick={()=>setMode("editor")}>✠ PROFI-CY</button>
        </div>
      </div>

      {/* ══════════════════════════════════
          MODO EXPLORAR
      ══════════════════════════════════ */}
      {mode==="explorer" && (
        <div>
          <div className="pe-cats">
            {CATEGORIES.map(c=>(
              <button key={c} className={`btn${category===c?" active":""}`}
                onClick={()=>{setCategory(c);setSelected(null);setRevealed(false);}}>
                {c}
              </button>
            ))}
          </div>
          <div className="pe-layout">
            <div className="pe-list">
              <div className="tool-title">{filtered.length} PROFECÍAS</div>
              {filtered.map(p=>(
                <div key={p.id}
                  className={`pe-item${selected?.id===p.id?" pe-active":""}`}
                  onClick={()=>{setSelected(p);setRevealed(false);}}>
                  <div className="pe-item-ref">{p.prophecy.ref}</div>
                  <div className="pe-item-cat">{p.category}</div>
                  <div className="pe-item-sum">{p.prophecy.keyword}</div>
                </div>
              ))}
              {/* Profecías del usuario (DB - aprobadas por el moderador) */}
              {dbProphecies.length>0 && <>
                <div className="tool-title" style={{marginTop:12,color:"var(--gold-b)"}}>
                  ✠ APROBADAS POR EL MODERADOR ({dbProphecies.length})
                </div>
                {dbProphecies.map(p=>(
                  <div key={p.id}
                    className={`pe-item${selected?.id===p.id?" pe-active":""}`}
                    style={{borderColor:"rgba(159,224,140,0.4)"}}
                    onClick={()=>{setSelected(p);setRevealed(true);}}>
                    <div className="pe-item-ref">{p.prophecy.ref}</div>
                    <div className="pe-item-cat">{p.category}</div>
                    <div className="pe-item-sum">{p.prophecy.keyword}</div>
                  </div>
                ))}
              </>}

              {/* Profecías locales en sesión (deprecado, solo legacy) */}
              {saved.length>0 && <>
                <div className="tool-title" style={{marginTop:12,color:"var(--gold-b)"}}>
                  ✠ MIS PROFECÍAS ({saved.length})
                </div>
                {saved.map(p=>(
                  <div key={p.id}
                    className={`pe-item${selected?.id===p.id?" pe-active":""}`}
                    style={{borderColor:"rgba(232,184,75,0.4)"}}
                    onClick={()=>{setSelected(p);setRevealed(true);}}>
                    <div className="pe-item-ref">{p.prophecy.ref}</div>
                    <div className="pe-item-cat">{p.category}</div>
                    <div className="pe-item-sum">{p.prophecy.keyword}</div>
                  </div>
                ))}
              </>}

              {/* Botón ir al Quiz */}
              {onGoQuiz && (
                <div style={{marginTop:16,paddingTop:12,borderTop:"1px solid var(--bd)",textAlign:"center"}}>
                  <button className="pe-reveal-btn"
                    style={{fontSize:"0.72rem",padding:"8px 20px",letterSpacing:"2px"}}
                    onClick={onGoQuiz}>
                    🔎 IR AL QUIZ DE PROFECÍAS →
                  </button>
                </div>
              )}
            </div>

            <div className="pe-detail">
              {!selected ? (
                <div className="empty">
                  <span className="empty-cross">✠</span>
                  Seleccioná una profecía para investigarla
                </div>
              ) : (
                <div>
                  {/* PASO I — AT */}
                  <div className="pe-step">
                    <div className="pe-step-num">I</div>
                    <div className="pe-step-body">
                      <div className="pe-step-title">LA PROFECÍA — ANTIGUO TESTAMENTO</div>
                      <div className="pe-verse-ref"
                        onClick={()=>onVerseClick&&onVerseClick(
                          selected.prophecy.book,selected.prophecy.ch,selected.prophecy.vs)}>
                        {selected.prophecy.ref}
                        <span className="pe-click-hint"> ↗ ver en paralelo</span>
                      </div>
                      <div className="pe-verse-text">"{selected.prophecy.summary}"</div>
                      <div className="pe-meta">
                        <span>📅 Escrita: {selected.written}</span>
                        <span>🏷 {selected.prophecy.keyword}</span>
                      </div>
                    </div>
                  </div>

                  {/* Citas AT extras */}
                  {selected.prophecy.extras && selected.prophecy.extras.length>0 && (
                    <div className="pe-extras-block">
                      <div className="pe-extras-title">↳ También se ve en (AT):</div>
                      {selected.prophecy.extras.map((e,i)=>(
                        <div key={i} className="pe-extra"
                          onClick={()=>onVerseClick&&onVerseClick(e.book, e.ch, e.vs)}>
                          <span className="pe-extra-ref">{(e.book||'').toUpperCase()} {e.ch}:{e.vs} ↗</span>
                          {e.quote && <span className="pe-extra-q"> — "{e.quote.slice(0,120)}"</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FLECHA */}
                  <div className="pe-arrow">
                    <div className="pe-arrow-line"/>
                    <div className="pe-arrow-label">{selected.gap} después</div>
                    <div className="pe-arrow-tip">▼</div>
                  </div>

                  {/* PASO II — NT */}
                  {!revealed ? (
                    <div className="pe-reveal-btn-wrap">
                      <button className="pe-reveal-btn" onClick={()=>setRevealed(true)}>
                        ✠ REVELAR CUMPLIMIENTO
                      </button>
                      <div className="pe-reveal-hint">¿En qué libro del NT se cumple?</div>
                    </div>
                  ) : (
                    <div>
                      <div className="pe-step pe-step-nt">
                        <div className="pe-step-num pe-num-nt">II</div>
                        <div className="pe-step-body">
                          <div className="pe-step-title">CUMPLIMIENTO — NUEVO TESTAMENTO</div>
                          <div className="pe-verse-ref nt-ref"
                            onClick={()=>onVerseClick&&onVerseClick(
                              selected.fulfillment.book,selected.fulfillment.ch,selected.fulfillment.vs)}>
                            {selected.fulfillment.ref}
                            <span className="pe-click-hint"> ↗ ver en paralelo</span>
                          </div>
                          <div className="pe-verse-text">"{selected.fulfillment.summary}"</div>
                        </div>
                      </div>

                      {/* Citas NT extras */}
                      {selected.fulfillment.extras && selected.fulfillment.extras.length>0 && (
                        <div className="pe-extras-block">
                          <div className="pe-extras-title">↳ También se cumple en (NT):</div>
                          {selected.fulfillment.extras.map((e,i)=>(
                            <div key={i} className="pe-extra"
                              onClick={()=>onVerseClick&&onVerseClick(e.book, e.ch, e.vs)}>
                              <span className="pe-extra-ref">{(e.book||'').toUpperCase()} {e.ch}:{e.vs} ↗</span>
                              {e.quote && <span className="pe-extra-q"> — "{e.quote.slice(0,120)}"</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ANÁLISIS */}
                      <div className="pe-analysis">
                        <div className="pe-analysis-title">✠ ANÁLISIS PROFÉTICO</div>
                        <div className="pe-analysis-grid">
                          <div className="pe-stat">
                            <span className="pe-stat-n">{selected.gap}</span>
                            <span className="pe-stat-l">distancia temporal</span>
                          </div>
                          <div className="pe-stat">
                            <span className="pe-stat-n">{selected.probability}</span>
                            <span className="pe-stat-l">probabilidad por azar</span>
                          </div>
                        </div>
                        <div className="pe-note">{selected.note}</div>
                        <div className="pe-fathers">
                          <span className="pe-fathers-label">PADRES DE LA IGLESIA:</span>
                          {selected.fathers}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          MODO QUIZ
      ══════════════════════════════════ */}
      {mode==="quiz" && (
        <div className="quiz-wrap">
          <div className="quiz-score">
            <span className="quiz-score-n">{quizScore}/{quizTotal}</span>
            <span className="quiz-score-l">respuestas correctas</span>
          </div>
          <div className="quiz-card">
            <div className="quiz-label">PROFECÍA DEL ANTIGUO TESTAMENTO</div>
            <div className="quiz-ref">{quizProphecy.prophecy.ref}</div>
            <div className="quiz-text">"{quizProphecy.prophecy.summary}"</div>
            <div className="quiz-written">Escrita: {quizProphecy.written}</div>
            <div className="quiz-question">¿En qué versículo del NT se cumple?</div>
            <div className="quiz-opts">
              {displayOpts.map(opt=>{
                let cls="quiz-opt";
                if(quizAnswer){
                  if(opt===correctOpt) cls+=" quiz-correct";
                  else if(opt===quizAnswer) cls+=" quiz-wrong";
                }
                return <button key={opt} className={cls} onClick={()=>handleQuizAnswer(opt)}>{opt}</button>;
              })}
            </div>
            {quizAnswer&&(
              <div className={`quiz-feedback${quizAnswer===correctOpt?" quiz-fb-ok":" quiz-fb-err"}`}>
                {quizAnswer===correctOpt
                  ?`✓ ¡Correcto! ${quizProphecy.note.slice(0,80)}...`
                  :`✗ Era ${correctOpt} · ${quizProphecy.note.slice(0,80)}...`
                }
                <button className="btn" style={{marginLeft:12}} onClick={nextQuiz}>Siguiente →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          MODO EDITOR — ✠ PROFI-CY
      ══════════════════════════════════ */}
      {mode==="editor" && (
        <div className="ed-wrap">
          <div className="ed-header">
            <div className="ed-title">✠ EDITOR DE PROFECÍAS</div>
            <div className="ed-sub">Creá tu propio vínculo profético AT → NT</div>
            <select className="ver-sel" value={ed.category}
              onChange={e=>upd("category",e.target.value)}>
              {["Nacimiento","Pasión","Entrada a Jerusalén","Traición",
                "Resurrección","Divinidad","Nueva Alianza","Otro"].map(c=>(
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {ed.category === "Otro" && (
              <input className="ed-input" style={{marginTop:8,maxWidth:260}}
                placeholder="Escribí la categoría personalizada..."
                value={customCat} onChange={e=>setCustomCat(e.target.value)}/>
            )}
          </div>

          <div className="ed-body">

            {/* ── BLOQUE I: AT ── */}
            <div className="ed-block ed-block-at">
              <div className="ed-block-label">
                <span className="ed-roman">I</span>
                LA PROFECÍA — ANTIGUO TESTAMENTO
              </div>

              <VerseSelector
                label="Referencia AT"
                books={BOOKS_AT}
                bookVal={ed.at_book} chVal={ed.at_ch} vsVal={ed.at_vs}
                onBook={v=>upd("at_book",v)}
                onCh={v=>upd("at_ch",v)}
                onVs={v=>upd("at_vs",v)}
                onViewParallel={(b,c,v)=>{onVerseClick&&onVerseClick(b,c,v);}}
              />

              <button className="btn ed-fetch-btn"
                disabled={fetchingAt}
                onClick={()=>fetchVerse(ed.at_book,ed.at_ch,ed.at_vs,true)}>
                {fetchingAt?"Cargando...":"↓ CARGAR TEXTO DESDE LA DB"}
              </button>

              <textarea className="ed-textarea"
                placeholder={atText || "Cita textual de la profecía..."}
                value={ed.at_quote || atText}
                onChange={e=>upd("at_quote",e.target.value)}
                rows={3}/>

              <div className="ed-row2">
                <div className="ed-field">
                  <label className="ed-label">📅 FECHA DE ESCRITURA</label>
                  <input className="ed-input" placeholder="ej. ~735 aC"
                    value={ed.at_written} onChange={e=>upd("at_written",e.target.value)}/>
                </div>
                <div className="ed-field">
                  <label className="ed-label">🏷 PALABRAS CLAVE</label>
                  <input className="ed-input" placeholder="ej. Virgen · Almah · Emmanuel"
                    value={ed.at_keywords} onChange={e=>upd("at_keywords",e.target.value)}/>
                </div>
              </div>

              {/* CITAS AT ADICIONALES (profecías cíclicas) */}
              {atExtras.map((e, i) => (
                <div className="ed-extra-row" key={`at-${i}`}>
                  <span className="ed-extra-label">↳ Cita AT extra</span>
                  <select className="ref-sel ed-sel" value={e.book}
                    onChange={ev=>updExtra('at',i,'book',ev.target.value)}>
                    {BOOKS_AT.map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                  <input className="ref-num" type="number" min="1" max="150" value={e.ch}
                    onChange={ev=>updExtra('at',i,'ch',+ev.target.value||1)}/>
                  <input className="ref-num" type="number" min="1" max="200" value={e.vs}
                    onChange={ev=>updExtra('at',i,'vs',+ev.target.value||1)}/>
                  <button className="btn ed-extra-del" onClick={()=>delExtra('at',i)}>✕</button>
                </div>
              ))}
              <button className="btn ed-add-extra" onClick={()=>addExtra('at')}>
                + AGREGAR OTRA CITA AT
              </button>
            </div>

            {/* ── FLECHA CON AÑOS ── */}
            <div className="ed-arrow-block">
              <div className="ed-arrow-line-v"/>
              <div className="ed-arrow-years-row">
                <div className="ed-arrow-dash"/>
                <input className="ed-years-input" placeholder="años de distancia"
                  value={ed.gap} onChange={e=>upd("gap",e.target.value)}/>
                <div className="ed-arrow-dash"/>
              </div>
              <div className="ed-arrow-tip">▼</div>
            </div>

            {/* ── BLOQUE II: NT ── */}
            <div className="ed-block ed-block-nt">
              <div className="ed-block-label" style={{color:"#7090D0"}}>
                <span className="ed-roman" style={{color:"#7090D0"}}>II</span>
                CUMPLIMIENTO — NUEVO TESTAMENTO
              </div>

              <VerseSelector
                label="Referencia NT"
                books={BOOKS_NT}
                bookVal={ed.nt_book} chVal={ed.nt_ch} vsVal={ed.nt_vs}
                onBook={v=>upd("nt_book",v)}
                onCh={v=>upd("nt_ch",v)}
                onVs={v=>upd("nt_vs",v)}
                onViewParallel={(b,c,v)=>{onVerseClick&&onVerseClick(b,c,v);}}
              />

              <button className="btn ed-fetch-btn"
                disabled={fetchingNt}
                onClick={()=>fetchVerse(ed.nt_book,ed.nt_ch,ed.nt_vs,false)}>
                {fetchingNt?"Cargando...":"↓ CARGAR TEXTO DESDE LA DB"}
              </button>

              <textarea className="ed-textarea"
                placeholder={ntText || "Cita textual del cumplimiento..."}
                value={ed.nt_quote || ntText}
                onChange={e=>upd("nt_quote",e.target.value)}
                rows={3}/>

              {/* CITAS NT ADICIONALES (profecías cíclicas) */}
              {ntExtras.map((e, i) => (
                <div className="ed-extra-row" key={`nt-${i}`}>
                  <span className="ed-extra-label">↳ Cita NT extra</span>
                  <select className="ref-sel ed-sel" value={e.book}
                    onChange={ev=>updExtra('nt',i,'book',ev.target.value)}>
                    {BOOKS_NT.map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                  <input className="ref-num" type="number" min="1" max="150" value={e.ch}
                    onChange={ev=>updExtra('nt',i,'ch',+ev.target.value||1)}/>
                  <input className="ref-num" type="number" min="1" max="200" value={e.vs}
                    onChange={ev=>updExtra('nt',i,'vs',+ev.target.value||1)}/>
                  <button className="btn ed-extra-del" onClick={()=>delExtra('nt',i)}>✕</button>
                </div>
              ))}
              <button className="btn ed-add-extra" onClick={()=>addExtra('nt')}>
                + AGREGAR OTRA CITA NT
              </button>
            </div>

            {/* ── ANÁLISIS PROFÉTICO ── */}
            <div className="ed-analysis-block">
              <div className="ed-analysis-title">✠ ANÁLISIS PROFÉTICO</div>

              <div className="ed-analysis-grid">
                <div className="ed-anal-box">
                  <label className="ed-label">PROBABILIDAD POR AZAR</label>
                  <input className="ed-input" placeholder="ej. 1 en 100,000"
                    value={ed.probability} onChange={e=>upd("probability",e.target.value)}/>
                </div>
                <div className="ed-anal-box">
                  <label className="ed-label">DISTANCIA TEMPORAL</label>
                  <input className="ed-input" placeholder="ej. ~700 años"
                    value={ed.gap} onChange={e=>upd("gap",e.target.value)}/>
                </div>
              </div>

              <div className="ed-field" style={{marginTop:10}}>
                <label className="ed-label">NOTA EXPLICATIVA</label>
                <textarea className="ed-textarea" rows={3}
                  placeholder="Análisis teológico, contexto histórico, tipología..."
                  value={ed.note} onChange={e=>upd("note",e.target.value)}/>
              </div>

              <div className="ed-field" style={{marginTop:10}}>
                <label className="ed-label">PADRES DE LA IGLESIA / CITAS DE SANTOS</label>
                <textarea className="ed-textarea" rows={2}
                  placeholder="ej. San Justino Mártir — Apología I, cap. 33. San Agustín — Ciudad de Dios..."
                  value={ed.fathers} onChange={e=>upd("fathers",e.target.value)}/>
              </div>
            </div>

            {/* ── GUARDAR ── */}
            <div style={{textAlign:"center",padding:"16px 0"}}>
              {isAdminLogged && (
                <label style={{display:"block",color:"var(--gold-b)",marginBottom:10,
                               fontFamily:"Cinzel,serif",fontSize:"0.7rem",letterSpacing:"1px"}}>
                  <input type="checkbox" checked={adminAsDirect}
                    onChange={e=>setAdminAsDirect(e.target.checked)}
                    style={{marginRight:6}}/>
                  🔐 CARGAR DIRECTO COMO APROBADA (modo admin)
                </label>
              )}
              <button className="pe-reveal-btn" onClick={saveEntry}>
                ✠ {adminAsDirect ? "PUBLICAR APROBADA" : "ENVIAR PARA REVISIÓN"}
              </button>
              {edSaved === 'pending' && (
                <div style={{color:"var(--gold-b)",marginTop:10,fontFamily:"Cinzel,serif",
                             fontSize:"0.72rem",letterSpacing:"2px"}}>
                  ✓ ENVIADA PARA REVISIÓN — el moderador la verá pronto
                </div>
              )}
              {edSaved === 'approved' && (
                <div style={{color:"#9FE08C",marginTop:10,fontFamily:"Cinzel,serif",
                             fontSize:"0.72rem",letterSpacing:"2px"}}>
                  ✓ CARGADA Y APROBADA — visible inmediatamente
                </div>
              )}
              {edSaved === 'error' && (
                <div style={{color:"#E08080",marginTop:10,fontFamily:"Cinzel,serif",
                             fontSize:"0.72rem",letterSpacing:"2px"}}>
                  ✕ ERROR — no se pudo guardar, intentá de nuevo
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
