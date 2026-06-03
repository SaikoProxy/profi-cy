// PROFI-CY · App.js v2 — con Lector + Interlineal
import { useState, useEffect, useCallback } from "react";
import "./index.css";
import Reader from "./Reader";
import Interlinear from "./Interlinear";
import ProphecyExplorer from "./ProphecyExplorer";
import Sacramentos from "./Sacramentos";
import Catequesis from "./Catequesis";
import CorpusReader from "./CorpusReader";
import AdminPanel from "./AdminPanel";
import Quiz from "./Quiz";
import SpiritEffects from "./SpiritEffects";

const API = `${window.location.protocol}//${window.location.hostname}:5050/api`;

const VER_NAMES = {
  BHS:"Hebraica Stuttgartensia",LXX:"Septuaginta + Strong",GNT:"Nuevo Testamento Griego (SBL)",
  VUL:"Vulgata (Jerónimo)",JER:"Biblia de Jerusalén",NAC:"Nácar-Colunga",
  BSA:"Biblia Serafín de Ausejo",RVR:"Reina-Valera",RV60S:"RV1960 + Strong",
  KJV:"King James",PES:"Peshita (Arameo)"
};
const LANG_PIP={hbo:"pip-hbo",grc:"pip-grc",la:"pip-la",es:"pip-es",en:"pip-en",aram:"pip-aram"};

const PROPHECIES=[
  {book:"gn",ch:3,vs:15,ref:"Gn 3:15",desc:"Protoevangelio"},
  {book:"is",ch:7,vs:14,ref:"Is 7:14",desc:"La Virgen · Parthénos"},
  {book:"is",ch:53,vs:5,ref:"Is 53:5",desc:"Siervo Sufriente"},
  {book:"mi",ch:5,vs:2,ref:"Miq 5:2",desc:"Nacimiento en Belén"},
  {book:"sal",ch:22,vs:1,ref:"Sal 22:1",desc:"Abandono en la Cruz"},
  {book:"sal",ch:110,vs:1,ref:"Sal 110:1",desc:"Señor a mi Señor"},
  {book:"zac",ch:9,vs:9,ref:"Zac 9:9",desc:"Rey sobre un asno"},
  {book:"zac",ch:12,vs:10,ref:"Zac 12:10",desc:"Mirarán al que traspasaron"},
  {book:"dn",ch:9,vs:25,ref:"Dn 9:25",desc:"Las 70 semanas"},
  {book:"is",ch:9,vs:6,ref:"Is 9:6",desc:"Hijo nos es dado"},
];

const GEM_KNOWN={26:"YHWH (יהוה)",86:"Elohim (אלהים)",358:"Mashiach (משיח)",
  386:"Yeshua (ישוע)",65:"Adonai (אדני)",611:"Torah (תורה)",376:"Shalom (שלום)",91:"Amen (אמן)"};

const BOOKS=[
  {a:"gn",n:"Génesis"},{a:"ex",n:"Éxodo"},{a:"lv",n:"Levítico"},{a:"nm",n:"Números"},
  {a:"dt",n:"Deuteronomio"},{a:"jos",n:"Josué"},{a:"jue",n:"Jueces"},{a:"rt",n:"Rut"},
  {a:"1sm",n:"1 Samuel"},{a:"2sm",n:"2 Samuel"},{a:"1re",n:"1 Reyes"},{a:"2re",n:"2 Reyes"},
  {a:"1cr",n:"1 Crónicas"},{a:"2cr",n:"2 Crónicas"},{a:"esd",n:"Esdras"},{a:"neh",n:"Nehemías"},
  {a:"est",n:"Ester"},{a:"job",n:"Job"},{a:"sal",n:"Salmos"},{a:"pr",n:"Proverbios"},
  {a:"ec",n:"Eclesiastés"},{a:"cnt",n:"Cantar"},{a:"sab",n:"Sabiduría"},{a:"ecli",n:"Eclesiástico"},
  {a:"is",n:"Isaías"},{a:"jr",n:"Jeremías"},{a:"lm",n:"Lamentaciones"},{a:"ba",n:"Baruc"},
  {a:"ez",n:"Ezequiel"},{a:"dn",n:"Daniel"},{a:"os",n:"Oseas"},{a:"jl",n:"Joel"},
  {a:"am",n:"Amós"},{a:"ab",n:"Abdías"},{a:"jon",n:"Jonás"},{a:"mi",n:"Miqueas"},
  {a:"na",n:"Nahúm"},{a:"hab",n:"Habacuc"},{a:"sof",n:"Sofonías"},{a:"ag",n:"Ageo"},
  {a:"zac",n:"Zacarías"},{a:"mal",n:"Malaquías"},{a:"tb",n:"Tobías"},{a:"jdt",n:"Judit"},
  {a:"1mc",n:"1 Macabeos"},{a:"2mc",n:"2 Macabeos"},
  {a:"mt",n:"Mateo"},{a:"mc",n:"Marcos"},{a:"lc",n:"Lucas"},{a:"jn",n:"Juan"},
  {a:"hch",n:"Hechos"},{a:"rm",n:"Romanos"},{a:"1co",n:"1 Corintios"},{a:"2co",n:"2 Corintios"},
  {a:"ga",n:"Gálatas"},{a:"ef",n:"Efesios"},{a:"flp",n:"Filipenses"},{a:"col",n:"Colosenses"},
  {a:"1ts",n:"1 Tesalonicenses"},{a:"2ts",n:"2 Tesalonicenses"},{a:"1tm",n:"1 Timoteo"},
  {a:"2tm",n:"2 Timoteo"},{a:"tit",n:"Tito"},{a:"heb",n:"Hebreos"},{a:"stg",n:"Santiago"},
  {a:"1pe",n:"1 Pedro"},{a:"2pe",n:"2 Pedro"},{a:"1jn",n:"1 Juan"},{a:"2jn",n:"2 Juan"},
  {a:"3jn",n:"3 Juan"},{a:"jud",n:"Judas"},{a:"ap",n:"Apocalipsis"},
];

function highlight(text,q){
  if(!q||!text) return text?.slice(0,130)+"...";
  const i=text.toLowerCase().indexOf(q.toLowerCase());
  if(i<0) return text.slice(0,130)+"...";
  const s=Math.max(0,i-25),e=Math.min(text.length,i+q.length+55);
  return <>{s>0&&"…"}{text.slice(s,i)}<em>{text.slice(i,i+q.length)}</em>{text.slice(i+q.length,e)}{e<text.length&&"…"}</>;
}

export default function App(){
  const [tab,setTab]=useState("paralelo");
  const [loading,setLoading]=useState(false);
  const [book,setBook]=useState("is");
  const [ch,setCh]=useState(7);
  const [vs,setVs]=useState(14);
  const [data,setData]=useState(null);
  const [q,setQ]=useState("");
  const [version,setVer]=useState("JER");
  const [results,setResults]=useState(null);
  const [strDetail,setStrDetail]=useState(null);
  const [gemText,setGemText]=useState("");
  const [gemRes,setGemRes]=useState(null);
  const [stats,setStats]=useState(null);

  const loadParallel=useCallback(async(b,c,v)=>{
    const bk=b||book,ck=c||ch,vk=v||vs;
    setLoading(true);setStrDetail(null);
    try{const r=await fetch(`${API}/parallel?book=${bk}&ch=${ck}&vs=${vk}`);setData(await r.json());}
    catch{setData({error:"Sin conexión con API"});}
    setLoading(false);
  },[book,ch,vs]);

  useEffect(()=>{loadParallel();},[]);

  const doSearch=async()=>{
    if(!q.trim())return;
    setTab("buscar");setLoading(true);
    try{const r=await fetch(`${API}/search?q=${encodeURIComponent(q)}&version=${version}`);setResults(await r.json());}
    catch{setResults({error:"Error"});}
    setLoading(false);
  };

  const loadStrong=async(num)=>{
    try{const r=await fetch(`${API}/strong?num=${num}`);setStrDetail(await r.json());}catch{}
  };

  const calcGem=async()=>{
    if(!gemText)return;
    try{const r=await fetch(`${API}/gematria?text=${encodeURIComponent(gemText)}`);setGemRes(await r.json());}catch{}
  };

  useEffect(()=>{
    if(tab==="stats"&&!stats)
      fetch(`${API}/stats`).then(r=>r.json()).then(setStats).catch(()=>{});
  },[tab,stats]);

  const goVerse=(bk,c,v)=>{
    setBook(bk);setCh(c);setVs(v);setTab("paralelo");
    setTimeout(()=>loadParallel(bk,c,v),50);
  };

  const isAdminUrl = typeof window!=='undefined' && window.location.search.includes('admin=1');
  const TABS=[
    ["paralelo","✠ PARALELO"],
    ["lector","📖 LECTOR"],
    ["interlineal","𝔔 INTERLINEAL"],
    ["profecias","🔮 PROFECÍAS"],
    ["sacramentos","✝️ SACRAMENTOS"],
    ["catequesis","📚 CATEQUESIS"],
    ["corpus_extra","📘 PADRES"],
    ["quiz","🔎 QUIZ"],
    ["stats","📊 ESTADÍSTICAS"],
    ...(isAdminUrl ? [["admin","🔐 ADMIN"]] : []),
  ];

  return(
    <div>
      <SpiritEffects tab={tab}/>
      <header className="header">
        <div className="logo">
          <div className="logo-main">✠ PROFI-CY</div>
          <div className="logo-sub">INTERFAZ PROFÉTICA</div>
        </div>
        <div className="search-wrap">
          <input className="search-input" value={q}
            onChange={e=>setQ(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&doSearch()}
            placeholder="Buscar en las Escrituras…"/>
          <select className="ver-sel" value={version} onChange={e=>setVer(e.target.value)}>
            {Object.keys(VER_NAMES).map(k=><option key={k} value={k}>{k}</option>)}
          </select>
          <button className="btn" onClick={doSearch}>BUSCAR</button>
        </div>
        <div className="nav-tabs">
          {TABS.map(([id,lbl])=>(
            <button key={id} className={`btn${tab===id?" active":""}`}
              onClick={()=>setTab(id)}>{lbl}</button>
          ))}
        </div>
      </header>

      {(tab==="paralelo"||tab==="interlineal")&&(
        <div className="ref-bar">
          <span className="ref-label">LIBRO</span>
          <select className="ref-sel" value={book} onChange={e=>setBook(e.target.value)}>
            {BOOKS.map(b=><option key={b.a} value={b.a}>{b.n}</option>)}
          </select>
          <span className="ref-label">CAP</span>
          <input className="ref-num" type="number" min="1" max="150" value={ch} onChange={e=>setCh(+e.target.value||1)}/>
          <span className="ref-label">VERS</span>
          <input className="ref-num" type="number" min="1" max="200" value={vs} onChange={e=>setVs(+e.target.value||1)}/>
          <button className="btn" onClick={()=>loadParallel()}>VER →</button>
          <button className="btn" onClick={()=>{const nv=Math.max(1,vs-1);setVs(nv);setTimeout(()=>loadParallel(book,ch,nv),60);}}>◀</button>
          <button className="btn" onClick={()=>{const nv=vs+1;setVs(nv);setTimeout(()=>loadParallel(book,ch,nv),60);}}>▶</button>
          {data?.libro&&<span className="ref-cur">{data.libro.name_es?.toUpperCase()} · {data.libro.testament}</span>}
        </div>
      )}

      <div className="layout">
        <div className="col-index">
          <div className="idx-title">PROFECÍAS</div>
          {PROPHECIES.map((p,i)=>(
            <div key={i} className={`idx-item${book===p.book&&ch===p.ch&&vs===p.vs?" active":""}`}
              onClick={()=>goVerse(p.book,p.ch,p.vs)}>
              <span className="idx-code">{p.ref}</span>
            </div>
          ))}
          <div className="idx-grp">LIBROS</div>
          {BOOKS.map(b=>(
            <div key={b.a} className={`idx-item${book===b.a?" active":""}`}
              onClick={()=>{setBook(b.a);setCh(1);setVs(1);setTimeout(()=>loadParallel(b.a,1,1),60);}}>
              <span className="idx-code">{b.a.toUpperCase()}</span>
              <span style={{fontSize:"0.78rem"}}>{b.n}</span>
            </div>
          ))}
        </div>

        <div className="col-main">
          {loading&&<div className="loading">✠ CONSULTANDO EL CORPUS ✠</div>}

          {!loading&&tab==="paralelo"&&data&&!data.error&&(
            <div>
              <div className="par-head">
                <div className="par-ref">{data.libro?.name_es||book.toUpperCase()} {ch}:{vs}</div>
                {data.libro?.name_la&&<div className="par-book">{data.libro.name_la}</div>}
                <span className={`badge${data.libro?.testament==="NT"?" nt":""}`}>{data.libro?.testament||"AT"}</span>
                <button className="btn" style={{marginLeft:"auto",fontSize:"0.6rem"}} onClick={()=>setTab("interlineal")}>𝔔 VER INTERLINEAL</button>
              </div>
              {data.versiculos?.map((v,i)=>(
                <div key={i} className="ver-card">
                  <div className="ver-head">
                    <span className={`pip ${LANG_PIP[v.lang_code]||"pip-es"}`}/>
                    <span className="ver-code">{v.version_code}</span>
                    <span className="ver-name">{VER_NAMES[v.version_code]||v.language}</span>
                  </div>
                  <div className={`ver-text${v.lang_code==="hbo"?" rtl":""}`}>{v.text}</div>
                  <div className="ver-meta">
                    <span>{v.word_count} palabras</span>
                    {v.gematria_val>0&&<span className="gem-v">Gematría: {v.gematria_val}</span>}
                  </div>
                </div>
              ))}
              {data.catena_aurea&&(
                <div className="catena">
                  <div className="catena-head">✠ CATENA AUREA · SANTO TOMÁS DE AQUINO</div>
                  <div className="catena-text">{data.catena_aurea}…</div>
                </div>
              )}
            </div>
          )}

          {tab==="lector"&&<Reader onVerseClick={(b,c,v)=>{setBook(b);setCh(c);setVs(v);}}/>}
          {tab==="interlineal"&&<Interlinear book={book} ch={ch} vs={vs} onStrongClick={loadStrong}/>}
          {tab==="profecias"&&<ProphecyExplorer onVerseClick={(b,c,v)=>goVerse(b,c,v)} onGoQuiz={()=>setTab("quiz")}/>}
          {tab==="sacramentos"&&<Sacramentos/>}
          {tab==="catequesis"&&<Catequesis/>}
          {tab==="corpus_extra"&&<CorpusReader/>}
          {tab==="quiz"&&<Quiz/>}
          {tab==="admin"&&<AdminPanel onVerseClick={(b,c,v)=>goVerse(b,c,v)}/>}

          {!loading&&tab==="buscar"&&results&&(
            <div>
              {results.error?<div className="empty">{results.error}</div>:<>
                <div className="srch-head">{results.total?.toLocaleString()} RESULTADOS · «{results.query}» · {version}</div>
                {results.resultados?.map((r,i)=>(
                  <div key={i} className="res-item" onClick={()=>goVerse(r.book_abbrev,r.chapter,r.verse)}>
                    <div className="res-ref"><span className="res-test">{r.testament}</span>{r.name_es} {r.chapter}:{r.verse}</div>
                    <div className="res-text">{highlight(r.text,results.query)}</div>
                  </div>
                ))}
              </>}
            </div>
          )}

          {tab==="gematria"&&(
            <div className="gem-panel">
              <div className="par-head"><div className="par-ref">🔢 GEMATRÍA</div></div>
              <div className="gem-row">
                <input className="gem-inp" value={gemText} onChange={e=>setGemText(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&calcGem()} placeholder="כתוב · ἄρχη · Write in Hebrew or Greek…"/>
                <button className="btn" onClick={calcGem}>CALCULAR</button>
              </div>
              {gemRes&&(<div className="gem-box">
                <div className="gem-num">{gemRes.valor}</div>
                <div className="gem-kt">MISPAR KATAN: {gemRes.katan}</div>
                {GEM_KNOWN[gemRes.valor]&&<div className="gem-kn">⚠ {GEM_KNOWN[gemRes.valor]}</div>}
              </div>)}
              <div className="tool-title" style={{marginTop:16}}>VALORES CONOCIDOS</div>
              <div className="gem-grid">
                {Object.entries(GEM_KNOWN).map(([val,label])=>(
                  <div key={val} className="gem-cell" onClick={()=>setGemRes({valor:+val,katan:+val%9||9})}>
                    <div className="gem-cn">{val}</div><div className="gem-cl">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="stats"&&stats&&(
            <div>
              <div className="par-head"><div className="par-ref">📊 CORPUS PROFI-CY</div></div>
              <div className="stats-grid">
                {[["Versículos",stats.totales?.versiculos?.toLocaleString()],
                  ["Palabras indexadas",stats.totales?.palabras_indexadas?.toLocaleString()],
                  ["Defs. Strong",stats.totales?.definiciones_strong?.toLocaleString()],
                  ["Catena Aurea",stats.totales?.comentarios_patristica?.toLocaleString()],
                  ["Diccionarios",stats.totales?.entradas_diccionarios?.toLocaleString()],
                ].map(([l,n])=>(<div key={l} className="stat-box"><span className="stat-n">{n}</span><div className="stat-l">{l}</div></div>))}
              </div>
            </div>
          )}

          {!loading&&tab==="buscar"&&!results&&<div className="empty"><span className="empty-cross">✠</span>Ingresá un término y presioná BUSCAR</div>}
          {!loading&&tab==="paralelo"&&data?.error&&<div className="empty"><span className="empty-cross">✠</span>{data.error}</div>}
        </div>

        <div className="col-tools">
          {strDetail?(
            <div className="tool-sec">
              <div className="tool-title">{strDetail.strong_num}
                <button className="btn" style={{marginLeft:6,padding:"1px 6px",fontSize:"0.55rem"}} onClick={()=>setStrDetail(null)}>✕</button>
              </div>
              <div className="str-det">
                <div className="str-det-num">{strDetail.strong_num}</div>
                <div className="str-det-def">{strDetail.definicion?.definition?.slice(0,400)||"Sin definición"}…</div>
              </div>
              <div className="tool-title">APARICIONES</div>
              {strDetail.ocurrencias?.map((o,i)=>(
                <div key={i} className="occ-item" onClick={()=>goVerse(o.book_abbrev,o.chapter,o.verse)}>
                  <span className="occ-ref">{o.name_es} {o.chapter}:{o.verse}</span>{o.text?.slice(0,55)}…
                </div>
              ))}
            </div>
          ):(
            <>
              {tab==="paralelo"&&data?.strong?.length>0&&(
                <div className="tool-sec">
                  <div className="tool-title">STRONG</div>
                  {data.strong.map((s,i)=>(
                    <div key={i} className="str-chip" onClick={()=>loadStrong(s.strong_num)}>
                      <span className="str-num">{s.strong_num}</span>
                      <span className="str-def">{s.definition?.slice(0,65)||"Ver definición"}…</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="tool-sec">
                <div className="tool-title">PROFECÍAS CLAVE</div>
                {PROPHECIES.map((p,i)=>(
                  <div key={i} className="proph-item" onClick={()=>goVerse(p.book,p.ch,p.vs)}>
                    <div className="proph-ref">{p.ref}</div>
                    <div className="proph-desc">{p.desc}</div>
                  </div>
                ))}
              </div>
              {tab==="paralelo"&&data?.libro&&(
                <div className="tool-sec">
                  <div className="tool-title">LIBRO</div>
                  <div className="str-det">
                    <div className="str-det-num">{data.libro.name_es}</div>
                    {data.libro.name_la&&<div style={{fontSize:"0.8rem",fontStyle:"italic",color:"var(--pa2)"}}>{data.libro.name_la}</div>}
                    <span className={`badge${data.libro.testament==="NT"?" nt":""}`} style={{marginTop:8,display:"inline-block"}}>{data.libro.testament}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
