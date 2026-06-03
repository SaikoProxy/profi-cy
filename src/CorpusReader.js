// PROFI-CY · CorpusReader.js
// Lector de libros extra: Padres, Santos, Enoc, Comentarios
import { useState, useEffect } from "react";

const API = `${window.location.protocol}//${window.location.hostname}:5050/api`;

const EXT_LABELS = {
  ".refx":"Libro / Referencia",".refy":"Libro / Referencia",".ref":"Libro",
  ".bblx":"Biblia e-Sword",".bbli":"Biblia interlineal",
  ".cmtx":"Comentario bíblico",".cmt":"Comentario bíblico",
  ".dctx":"Diccionario",".dct":"Diccionario",
};
const EXT_ICONS = {
  ".refx":"📖",".refy":"📖",".ref":"📖",
  ".bblx":"📜",".bbli":"📜",
  ".cmtx":"💬",".cmt":"💬",
  ".dctx":"📚",".dct":"📚",
};

// Libros pre-incluidos (en corpus_extra/ del servidor)
// El nombre se verifica contra la lista real del servidor al montar
const PRELOADED_META = [
  { nameHint:"Enoc",   label:"Libro de Enoc",        icon:"⚡", desc:"Texto apócrifo — 108 capítulos" },
  { nameHint:"Hermas", label:"El Pastor de Hermas",   icon:"✏", desc:"Padre Apostólico · s. II" },
  { nameHint:"Catena", label:"Catena Aurea",           icon:"✠", desc:"Santo Tomás de Aquino — Padres de la Iglesia", special:"catena" },
];

export default function CorpusReader() {
  const [files, setFiles]         = useState([]);
  const [preloaded, setPreloaded]  = useState([]);
  const [dictFiles, setDictFiles]  = useState([]);   // diccionarios separados
  const [dictSearch, setDictSearch]= useState("");
  const [dictResults, setDictResults] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState(null);   // { name, type }
  const [index, setIndex]         = useState([]);      // lista de capítulos
  const [chapter, setChapter]     = useState(null);   // capítulo actual
  const [chIdx, setChIdx]         = useState(0);

  // Cargar lista al montar
  useEffect(() => { loadFiles(); }, []);

  // Cargar lista de archivos del servidor
  const loadFiles = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/corpus/list`);
      const d = await r.json();
      const allFiles = d.files || [];
      // Resolver nombres reales de preloaded (libros y Catena)
      const resolved = PRELOADED_META.map(meta => {
        if (meta.special === 'catena') return { ...meta, name: '__catena__' };
        const match = allFiles.find(f =>
          f.name.toLowerCase().includes(meta.nameHint.toLowerCase())
        );
        return match ? { ...meta, name: match.name } : null;
      }).filter(Boolean);
      setPreloaded(resolved);
      // Separar diccionarios (.dctx) del resto
      const preloadedNames = resolved.map(p => p.name);
      const dicts = allFiles.filter(f => f.ext === '.dctx' || f.ext === '.dct');
      // Solo mostrar libros que el admin habilitó (si existe visibility config)
      let visibleNames = null;
      try {
        const vr = await fetch(`${API}/corpus/visibility`);
        const vd = await vr.json();
        visibleNames = vd.visible || null;
      } catch {}
      const others = allFiles.filter(f => {
        if (f.ext === '.dctx' || f.ext === '.dct') return false;
        if (preloadedNames.includes(f.name)) return false;
        if (visibleNames && !visibleNames.includes(f.name)) return false;
        return true;
      });
      setDictFiles(dicts);
      setFiles(others);
    } catch {}
    setLoading(false);
  };

  // Abrir un archivo y cargar su índice
  const openFile = async (fname, special) => {
    setLoading(true);
    setChapter(null);
    setIndex([]);
    try {
      if (special === "catena") {
        const r = await fetch(`${API}/catena?limit=200`);
        const d = await r.json();
        setSelected({ name: fname, type: "catena" });
        const idx = (d.entries || []).map((e,i) => ({
          i, title: `${e.book_abbrev?.toUpperCase()} ${e.chapter_begin}:${e.verse_begin} — ${(e.author||'Padres').slice(0,30)}`
        }));
        setIndex(idx);
        setChapter({ _entries: d.entries, _type: 'catena' });
        setChIdx(0);
        setLoading(false);
        return;
      }
      // Construir URL con URLSearchParams para evitar problemas de encoding con espacios
      const url1 = new URL(`${API}/corpus/read`);
      url1.searchParams.set('file', fname);
      const r = await fetch(url1.toString());
      if (!r.ok) {
        const txt = await r.text();
        console.error('corpus/read index error:', r.status, txt.slice(0,200));
        setLoading(false);
        return;
      }
      const d = await r.json();
      if (d.error) {
        console.error('corpus/read error:', d.error);
        setLoading(false);
        return;
      }
      const idx = d.index || [];
      setSelected({ name: fname, type: d.type });
      setIndex(idx);
      setChIdx(0);
      // Cargar primer capítulo
      if (idx.length > 0) {
        const url2 = new URL(`${API}/corpus/read`);
        url2.searchParams.set('file', fname);
        url2.searchParams.set('ch', '0');
        const r2 = await fetch(url2.toString());
        const d2 = await r2.json();
        setChapter(d2.item || null);
      }
    } catch(e) {
      console.error('openFile error:', e);
    }
    setLoading(false);
  };

  // Cargar capítulo específico
  const loadChapter = async (fname, idx) => {
    setLoading(true);
    try {
      const url = new URL(`${API}/corpus/read`);
      url.searchParams.set('file', fname || selected?.name || '');
      url.searchParams.set('ch', String(idx));
      const r = await fetch(url.toString());
      const d = await r.json();
      setChapter(d.item || null);
      setChIdx(idx);
    } catch(e) {
      console.error('loadChapter error:', e);
    }
    setLoading(false);
  };

  // Buscar en diccionarios
  const searchDicts = async () => {
    if (!dictSearch.trim()) return;
    setLoading(true);
    setDictResults([]);
    try {
      const results = [];
      for (const df of dictFiles) {
        const url = new URL(`${API}/corpus/read`);
        url.searchParams.set('file', df.name);
        const r = await fetch(url.toString());
        const d = await r.json();
        const hits = (d.index || []).filter(item =>
          (item.topic || '').toLowerCase().includes(dictSearch.toLowerCase())
        ).slice(0, 5).map(item => ({ ...item, source: df.name }));
        results.push(...hits);
      }
      setDictResults(results);
    } catch {}
    setLoading(false);
  };

  const loadDictEntry = async (fname, idx) => {
    setLoading(true);
    try {
      const url = new URL(`${API}/corpus/read`);
      url.searchParams.set('file', fname);
      url.searchParams.set('ch', String(idx));
      const r = await fetch(url.toString());
      const d = await r.json();
      setSelected({ name: fname, type: 'dictionary' });
      setChapter(d.item || null);
      setChIdx(idx);
    } catch {}
    setLoading(false);
  };

  // Nav de capítulos
  const goChapter = (dir) => {
    const next = chIdx + dir;
    if (next < 0 || next >= index.length) return;
    loadChapter(null, next);
  };

  const chLabel = (item) => {
    if (!item) return "";
    if (item.title !== undefined) return item.title || `Sección ${chIdx+1}`;
    if (item.topic !== undefined) return item.topic;
    return `${item.book} ${item.chapter}:${item.verse}`;
  };

  return (
    <div className="corpus-wrap">

      {/* ── HEADER ── */}
      <div className="corpus-header">
        <div>
          <div className="corpus-title">✠ CORPUS EXTRA</div>
          <div className="corpus-sub">Padres de la Iglesia · Santos · Apócrifos · Comentarios</div>
        </div>
        <button className="btn" onClick={loadFiles}>↺ ACTUALIZAR</button>
      </div>

      <div className="corpus-layout">

        {/* ── PANEL IZQUIERDO: lista de libros ── */}
        <div className="corpus-sidebar">

    

          {/* Pre-cargados */}
          <div className="corpus-section-label">✠ INCLUIDOS</div>
          {preloaded.map(p => (
            <div key={p.name}
              className={`corpus-book-item${selected?.name===p.name?" corpus-book-active":""}`}
              onClick={()=>openFile(p.name, p.special)}>
              <span className="corpus-book-icon">{p.icon}</span>
              <div>
                <div className="corpus-book-name">{p.label}</div>
                <div className="corpus-book-desc">{p.desc}</div>
              </div>
            </div>
          ))}

          {/* Archivos del usuario */}
          {files.length > 0 && (
            <>
              <div className="corpus-section-label">MIS LIBROS ({files.length})</div>
              {files.map(f => (
                <div key={f.name}
                  className={`corpus-book-item${selected?.name===f.name?" corpus-book-active":""}`}
                  onClick={()=>openFile(f.name)}>
                  <span className="corpus-book-icon">
                    {EXT_ICONS[f.ext]||"📄"}
                  </span>
                  <div>
                    <div className="corpus-book-name">{f.name.replace(/\.[^.]+$/,"")}</div>
                    <div className="corpus-book-desc">{EXT_LABELS[f.ext]||f.ext} · {f.size_kb} KB</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {files.length === 0 && !loading && null}

          {/* Diccionarios */}
          {dictFiles.length > 0 && (
            <>
              <div className="corpus-section-label">📚 DICCIONARIOS ({dictFiles.length})</div>
              <div style={{display:"flex",gap:4,padding:"0 0 6px"}}>
                <input
                  className="search-input"
                  style={{flex:1,fontSize:"0.75rem",padding:"4px 8px",height:28}}
                  placeholder="Buscar en diccionarios…"
                  value={dictSearch}
                  onChange={e=>setDictSearch(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&searchDicts()}
                />
                <button className="btn" style={{padding:"2px 8px",fontSize:"0.7rem"}} onClick={searchDicts}>IR</button>
              </div>
              {dictFiles.map(f => (
                <div key={f.name}
                  className={`corpus-book-item${selected?.name===f.name?" corpus-book-active":""}`}
                  onClick={()=>openFile(f.name)}>
                  <span className="corpus-book-icon">📚</span>
                  <div>
                    <div className="corpus-book-name">{f.name.replace(/\.[^.]+$/,"")}</div>
                    <div className="corpus-book-desc">{f.size_kb} KB</div>
                  </div>
                </div>
              ))}
              {dictResults.length > 0 && (
                <>
                  <div className="corpus-section-label" style={{marginTop:8}}>RESULTADOS</div>
                  {dictResults.map((res,i) => (
                    <div key={i} className="corpus-book-item"
                      onClick={()=>loadDictEntry(res.source, res.i)}>
                      <span className="corpus-book-icon">🔍</span>
                      <div>
                        <div className="corpus-book-name">{res.topic}</div>
                        <div className="corpus-book-desc">{res.source.replace(/\.[^.]+$/,"")}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* ── PANEL CENTRAL: lector ── */}
        <div className="corpus-reader">
          {loading && <div className="loading">✠ CARGANDO ✠</div>}

          {!loading && !selected && (
            <div className="empty">
              <span className="empty-cross">✠</span>
              Seleccioná un libro para leer
            </div>
          )}

          {!loading && selected && (
            <div>
              {/* Nav de capítulos */}
              <div className="corpus-nav">
                <button className="btn" onClick={()=>goChapter(-1)} disabled={chIdx<=0}>◀</button>
                <div className="corpus-nav-center">
                  <select className="ref-sel" value={chIdx}
                    onChange={e=>loadChapter(null,+e.target.value)}>
                    {index.map((item,i)=>(
                      <option key={i} value={i}>{chLabel(item)}</option>
                    ))}
                  </select>
                  <span className="corpus-nav-count">{chIdx+1} / {index.length}</span>
                </div>
                <button className="btn" onClick={()=>goChapter(1)} disabled={chIdx>=index.length-1}>▶</button>
              </div>

              {/* Texto del capítulo */}
              {chapter && (
                <div className="corpus-text-wrap">
                  <h2 className="corpus-chapter-title">
                    {chLabel(index[chIdx])}
                  </h2>
                  <div className="corpus-text">
                    {/* Catena Aurea: mostrar entrada directamente */}
                    {chapter._type === 'catena' ? (
                      <div>
                        <p style={{fontStyle:'italic',color:'var(--gold-b)',marginBottom:12}}>
                          {chapter._entries?.[chIdx]?.author || 'Padres de la Iglesia'}
                        </p>
                        {(chapter._entries?.[chIdx]?.text || '').split('\n').map((line,i)=>(
                          <p key={i}>{line || '\u00a0'}</p>
                        ))}
                      </div>
                    ) : chapter.text
                      ? chapter.text.split('\n').map((line,i) => (
                          <p key={i} className={line.trim()?"":" corpus-spacer"}>{line || "\u00a0"}</p>
                        ))
                      : chapter.definition
                        ? <p>{chapter.definition}</p>
                        : <p className="empty">Sin contenido</p>
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── PANEL DERECHO: índice de capítulos ── */}
        <div className="corpus-index">
          {selected && index.length > 0 && (
            <>
              <div className="tool-title">ÍNDICE</div>
              <div className="corpus-index-list">
                {index.map((item,i)=>(
                  <div key={i}
                    className={`corpus-index-item${i===chIdx?" corpus-index-active":""}`}
                    onClick={()=>loadChapter(null,i)}>
                    {chLabel(item)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
