// PROFI-CY · AdminPanel.js v3 — Tabs: Pendientes | Aprobadas | Libros Corpus | Quiz
import { useState, useEffect, useCallback } from "react";

const API = `${window.location.protocol}//${window.location.hostname}:5050/api`;
const TOKEN_KEY = 'proficy_admin_token';

const CATEGORIES = [
  "Nacimiento","Pasión","Entrada a Jerusalén","Traición",
  "Resurrección","Divinidad","Nueva Alianza","Otro"
];

export default function AdminPanel({ onVerseClick }) {
  const [token, setToken] = useState(()=>localStorage.getItem(TOKEN_KEY)||null);
  const [code, setCode] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("pending"); // "pending" | "approved" | "books" | "quiz"
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editBuf, setEditBuf] = useState({});
  // Libros corpus
  const [allBooks, setAllBooks] = useState([]);
  const [visibleBooks, setVisibleBooks] = useState(null);
  const [booksMsg, setBooksMsg] = useState("");
  // Quiz
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizEditing, setQuizEditing] = useState(null); // null=lista, obj=form
  const [quizMsg, setQuizMsg] = useState("");
  const BOOKS_AT = ["gn","ex","lv","nm","dt","jos","jue","rt","1sm","2sm","1re","2re",
    "1cr","2cr","esd","neh","est","job","sal","pr","ec","cnt","is","jr","lm",
    "ez","dn","os","jl","am","ab","jon","mi","na","hab","sof","ag","zac","mal"];
  const BOOKS_NT = ["mt","mc","lc","jn","hch","rm","1co","2co","ga","ef","flp","col",
    "1ts","2ts","1tm","2tm","tit","flm","heb","stg","1pe","2pe","1jn","2jn","3jn","jud","ap"];

  useEffect(()=>{
    if (!token) return;
    fetch(`${API}/admin/verify`,{headers:{'X-Admin-Token':token}})
      .then(r=>r.json())
      .then(d=>{ if(!d.valid){ localStorage.removeItem(TOKEN_KEY); setToken(null); }})
      .catch(()=>{});
  },[]);

  const loadPending = () => {
    if (!token) return;
    setLoading(true);
    fetch(`${API}/prophecy/pending`,{headers:{'X-Admin-Token':token}})
      .then(r=>r.json()).then(d=>setPending(d.pending||[]))
      .catch(()=>{}).finally(()=>setLoading(false));
  };

  const loadApproved = () => {
    if (!token) return;
    setLoading(true);
    fetch(`${API}/prophecy/approved`,{headers:{'X-Admin-Token':token}})
      .then(r=>r.json()).then(d=>setApproved(d.approved||[]))
      .catch(()=>{}).finally(()=>setLoading(false));
  };

  const loadBooks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [lr, vr] = await Promise.all([
        fetch(`${API}/corpus/list`).then(r=>r.json()),
        fetch(`${API}/corpus/visibility`,{headers:{'X-Admin-Token':token}}).then(r=>r.json())
      ]);
      // Filtrar igual que CorpusReader: excluir .bblx, .dctx, _visibility.json
      // Incluir los pre-cargados (.refx) para poder ocultarlos también
      const SKIP_EXT = new Set(['.bblx','.bbli','.dctx','.dct','.py','.json']);
      const filtered = (lr.files || []).filter(f =>
        !f.name.startsWith('_') &&
        !SKIP_EXT.has(f.ext)
      );
      setAllBooks(filtered);
      setVisibleBooks(vr.visible || null);
    } catch(e){ console.error(e); }
    setLoading(false);
  };

  const loadQuiz = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/quiz/list`);
      const d = await r.json();
      setQuizQuestions(d.questions || []);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(()=>{
    if(token){ loadPending(); }
  },[token]);

  const switchTab = (t) => {
    setTab(t);
    setEditingId(null);
    setQuizEditing(null);
    if (t==="approved" && approved.length===0) loadApproved();
    if (t==="books") loadBooks();
    if (t==="quiz") loadQuiz();
  };

  const doLogin = async () => {
    setLoginErr(""); setLoading(true);
    try {
      const r = await fetch(`${API}/admin/login`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({code})});
      const d = await r.json();
      if (!r.ok) setLoginErr(d.error||"Error");
      else { localStorage.setItem(TOKEN_KEY, d.token); setToken(d.token); setCode(""); }
    } catch { setLoginErr("Error de conexión"); }
    setLoading(false);
  };

  const doLogout = () => { localStorage.removeItem(TOKEN_KEY); setToken(null); setPending([]); setApproved([]); };

  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(""),2800); };

  const doApprove = async (id) => {
    const r = await fetch(`${API}/prophecy/approve`,{method:'POST',
      headers:{'Content-Type':'application/json','X-Admin-Token':token},
      body:JSON.stringify({id})});
    if (r.ok) { flash(`✓ Aprobada #${id}`); setPending(p=>p.filter(x=>x.id!==id)); }
  };

  const doReject = async (id) => {
    if (!window.confirm("¿Rechazar esta profecía?")) return;
    const r = await fetch(`${API}/prophecy/reject`,{method:'POST',
      headers:{'Content-Type':'application/json','X-Admin-Token':token},
      body:JSON.stringify({id})});
    if (r.ok) { flash(`✕ Rechazada #${id}`); setPending(p=>p.filter(x=>x.id!==id)); }
  };

  const doDelete = async (id, fromList) => {
    if (!window.confirm(`¿BORRAR DEFINITIVAMENTE la profecía #${id}? Esta acción no se puede deshacer.`)) return;
    const r = await fetch(`${API}/prophecy/delete`,{method:'POST',
      headers:{'Content-Type':'application/json','X-Admin-Token':token},
      body:JSON.stringify({id})});
    if (r.ok) {
      flash(`🗑 Borrada #${id}`);
      if (fromList==="pending") setPending(p=>p.filter(x=>x.id!==id));
      if (fromList==="approved") setApproved(p=>p.filter(x=>x.id!==id));
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditBuf({
      category: p.category||'Otro',
      at_keywords: p.at_keywords||'',
      at_written: p.at_written||'',
      gap: p.gap||'',
      at_quote: p.at_quote||'',
      nt_quote: p.nt_quote||'',
      description: p.description||'',
      source: p.source||'',
      certainty: p.certainty||'',
      prophecy_book: p.prophecy_book||'',
      prophecy_chapter: p.prophecy_chapter||1,
      prophecy_verse: p.prophecy_verse||1,
      fulfillment_book: p.fulfillment_book||'',
      fulfillment_chapter: p.fulfillment_chapter||1,
      fulfillment_verse: p.fulfillment_verse||1,
    });
  };
  const cancelEdit = () => { setEditingId(null); setEditBuf({}); };
  const updEdit = (k,v) => setEditBuf(b=>({...b, [k]:v}));

  const saveEdit = async (id, fromList) => {
    const r = await fetch(`${API}/prophecy/edit`,{method:'POST',
      headers:{'Content-Type':'application/json','X-Admin-Token':token},
      body:JSON.stringify({id, ...editBuf})});
    if (r.ok) {
      flash(`✓ Editada #${id}`);
      const updater = p=>p.map(x=>x.id===id?{...x,...editBuf}:x);
      if (fromList==="pending") setPending(updater);
      if (fromList==="approved") setApproved(updater);
      setEditingId(null); setEditBuf({});
    } else { flash(`✕ Error al editar`); }
  };

  // ── Quiz editor helpers ──
  const flashQuiz = m => { setQuizMsg(m); setTimeout(()=>setQuizMsg(""),2500); };

  const quizStartNew = () => setQuizEditing({
    at_book:"is", at_ch:7, at_vs:14, at_text:"",
    nt_answer:"Mt 1:23", nt_book:"mt", nt_ch:1, nt_vs:23,
    decoys:["","",""], hint:"", active:1,
  });

  const quizStartEdit = (q) => setQuizEditing({...q, decoys: [...(q.decoys||["","",""])]});

  const qUpd = (k,v) => setQuizEditing(e=>({...e,[k]:v}));
  const qUpdDecoy = (i,v) => setQuizEditing(e=>{
    const d=[...(e.decoys||[])];
    d[i]=v;
    return {...e,decoys:d};
  });

  const quizSave = async () => {
    const payload = {
      ...quizEditing,
      at_ch: parseInt(quizEditing.at_ch),
      at_vs: parseInt(quizEditing.at_vs),
      nt_ch: parseInt(quizEditing.nt_ch),
      nt_vs: parseInt(quizEditing.nt_vs),
      decoys: (quizEditing.decoys||[]).filter(d=>d.trim()),
    };
    if (payload.decoys.length < 3) { flashQuiz("✕ Necesitás 3 opciones falsas mínimo"); return; }
    const r = await fetch(`${API}/quiz/save`,{
      method:"POST",
      headers:{"Content-Type":"application/json","X-Admin-Token":token},
      body: JSON.stringify(payload),
    });
    if (r.ok) { flashQuiz("✓ Guardado"); setQuizEditing(null); loadQuiz(); }
    else flashQuiz("✕ Error al guardar");
  };

  const quizDelete = async (id) => {
    if (!window.confirm("¿Borrar esta pregunta del quiz?")) return;
    await fetch(`${API}/quiz/delete`,{
      method:"POST",
      headers:{"Content-Type":"application/json","X-Admin-Token":token},
      body:JSON.stringify({id}),
    });
    loadQuiz();
  };

  const quizToggle = async (q) => {
    await fetch(`${API}/quiz/save`,{
      method:"POST",
      headers:{"Content-Type":"application/json","X-Admin-Token":token},
      body: JSON.stringify({...q, active: q.active?0:1, decoys:q.decoys||[]}),
    });
    loadQuiz();
  };

  // ── Gestión de visibilidad de libros ──
  const isVisible = (fname) => {
    if (visibleBooks === null) return true; // null = todos visibles
    return visibleBooks.includes(fname);
  };

  const toggleBook = (fname) => {
    if (visibleBooks === null) {
      // Pasar de "todos visibles" a "todos menos este"
      const newVisible = allBooks.map(f=>f.name).filter(n=>n!==fname);
      setVisibleBooks(newVisible);
    } else {
      if (visibleBooks.includes(fname)) {
        setVisibleBooks(visibleBooks.filter(n=>n!==fname));
      } else {
        setVisibleBooks([...visibleBooks, fname]);
      }
    }
  };

  const saveVisibility = async () => {
    try {
      const r = await fetch(`${API}/corpus/visibility`,{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Admin-Token':token},
        body: JSON.stringify({visible: visibleBooks})
      });
      const d = await r.json();
      if (d.ok) setBooksMsg("✓ Configuración guardada");
      else setBooksMsg("✕ Error al guardar");
    } catch { setBooksMsg("✕ Error de conexión"); }
    setTimeout(()=>setBooksMsg(""),3000);
  };

  const showAll = () => setVisibleBooks(null);

  // ── RENDER CARD (reutilizable para pending y approved) ──
  const renderCard = (p, fromList) => (
    <div key={p.id} className="admin-card">
      <div className="admin-card-head">
        <span className="admin-card-cat">{p.category||'Sin categoría'}</span>
        <span className="admin-card-by">#{p.id} · por: {p.submitter} · {p.created_at}</span>
      </div>

      {editingId === p.id ? (
        <div className="admin-edit">
          <div className="admin-edit-row">
            <label className="admin-edit-lbl">CATEGORÍA</label>
            <select className="admin-edit-inp" value={editBuf.category}
              onChange={e=>updEdit('category',e.target.value)}>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              {!CATEGORIES.includes(editBuf.category) && editBuf.category &&
                <option value={editBuf.category}>{editBuf.category} (custom)</option>}
            </select>
          </div>
          <div className="admin-edit-row">
            <label className="admin-edit-lbl">PALABRAS CLAVE / TÍTULO</label>
            <input className="admin-edit-inp" value={editBuf.at_keywords}
              onChange={e=>updEdit('at_keywords',e.target.value)}
              placeholder="ej. Virgen · Almah · Emmanuel"/>
          </div>
          <div className="admin-edit-row admin-edit-row2">
            <div style={{flex:1}}>
              <label className="admin-edit-lbl">FECHA ESCRITURA</label>
              <input className="admin-edit-inp" value={editBuf.at_written}
                onChange={e=>updEdit('at_written',e.target.value)} placeholder="ej. ~735 aC"/>
            </div>
            <div style={{flex:1}}>
              <label className="admin-edit-lbl">DISTANCIA</label>
              <input className="admin-edit-inp" value={editBuf.gap}
                onChange={e=>updEdit('gap',e.target.value)} placeholder="ej. ~735 años"/>
            </div>
            <div style={{flex:1}}>
              <label className="admin-edit-lbl">PROBABILIDAD</label>
              <input className="admin-edit-inp" value={editBuf.certainty}
                onChange={e=>updEdit('certainty',e.target.value)} placeholder="ej. 1 en 100,000"/>
            </div>
          </div>
          <div className="admin-edit-row">
            <label className="admin-edit-lbl">CITA AT</label>
            <textarea className="admin-edit-inp" rows={2} value={editBuf.at_quote}
              onChange={e=>updEdit('at_quote',e.target.value)}/>
          </div>
          <div className="admin-edit-row">
            <label className="admin-edit-lbl">CITA NT</label>
            <textarea className="admin-edit-inp" rows={2} value={editBuf.nt_quote}
              onChange={e=>updEdit('nt_quote',e.target.value)}/>
          </div>
          <div className="admin-edit-row">
            <label className="admin-edit-lbl">ANÁLISIS</label>
            <textarea className="admin-edit-inp" rows={3} value={editBuf.description}
              onChange={e=>updEdit('description',e.target.value)}/>
          </div>
          <div className="admin-edit-row">
            <label className="admin-edit-lbl">PADRES / CITAS</label>
            <textarea className="admin-edit-inp" rows={2} value={editBuf.source}
              onChange={e=>updEdit('source',e.target.value)}/>
          </div>
          <div className="admin-card-actions">
            <button className="btn admin-approve" onClick={()=>saveEdit(p.id,fromList)}>💾 GUARDAR</button>
            <button className="btn" onClick={cancelEdit}>✕ CANCELAR</button>
          </div>
        </div>
      ) : (
        <>
          <div className="admin-card-body">
            <div className="admin-prop">
              <span className="admin-prop-lbl">📜 AT:</span>
              <span className="admin-prop-ref"
                onClick={()=>onVerseClick&&onVerseClick(p.prophecy_book,p.prophecy_chapter,p.prophecy_verse)}>
                {(p.prophecy_book||'').toUpperCase()} {p.prophecy_chapter}:{p.prophecy_verse} ↗
              </span>
              <span style={{margin:"0 8px",color:"var(--txd)"}}>→</span>
              <span className="admin-prop-lbl">✠ NT:</span>
              <span className="admin-prop-ref"
                onClick={()=>onVerseClick&&onVerseClick(p.fulfillment_book,p.fulfillment_chapter,p.fulfillment_verse)}>
                {(p.fulfillment_book||'').toUpperCase()} {p.fulfillment_chapter}:{p.fulfillment_verse} ↗
              </span>
            </div>
            {p.at_keywords && <div className="admin-prop">
              <span className="admin-prop-lbl">🏷</span>
              <span style={{color:"var(--gold-b)",fontStyle:"italic"}}>{p.at_keywords}</span>
            </div>}
            {p.description && <div className="admin-note">📝 {p.description}</div>}
          </div>
          <div className="admin-card-actions">
            {fromList==="pending" && (
              <button className="btn admin-approve" onClick={()=>doApprove(p.id)}>✓ APROBAR</button>
            )}
            <button className="btn admin-edit-btn" onClick={()=>startEdit(p)}>✏️ EDITAR</button>
            {fromList==="pending" && (
              <button className="btn admin-reject" onClick={()=>doReject(p.id)}>✕ RECHAZAR</button>
            )}
            <button className="btn"
              style={{background:"#3a0a0a",color:"#e08080",border:"1px solid #7a2020",marginLeft:"auto"}}
              onClick={()=>doDelete(p.id,fromList)}>
              🗑 BORRAR
            </button>
          </div>
        </>
      )}
    </div>
  );

  // ── LOGIN ──
  if (!token) {
    return (
      <div className="admin-wrap">
        <div className="admin-login">
          <div className="admin-title">✠ ACCESO ADMINISTRADOR</div>
          <div className="admin-sub">Solo personal autorizado para moderación doctrinal</div>
          <input className="admin-input" type="password" placeholder="Código de acceso"
            value={code} onChange={e=>setCode(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&doLogin()} autoFocus/>
          {loginErr && <div className="admin-err">⚠ {loginErr}</div>}
          <button className="pe-reveal-btn" onClick={doLogin} disabled={loading||!code}>
            {loading ? "Verificando..." : "✠ INGRESAR"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      {/* Header */}
      <div className="admin-header">
        <div>
          <div className="admin-title">✠ PANEL DE MODERACIÓN</div>
          <div className="admin-sub">
            {tab==="pending" && `${pending.length} pendiente${pending.length===1?"":"s"}`}
            {tab==="approved" && `${approved.length} aprobada${approved.length===1?"":"s"}`}
            {tab==="books" && "Visibilidad de libros en Corpus Extra"}
          {tab==="quiz" && `${quizQuestions.length} pregunta${quizQuestions.length===1?"":"s"} en el Quiz`}
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button className="btn" onClick={()=>{
            if(tab==="pending") loadPending();
            if(tab==="approved") loadApproved();
            if(tab==="books") loadBooks();
            if(tab==="quiz") loadQuiz();
          }}>↻ RECARGAR</button>
          <button className="btn" onClick={doLogout}>SALIR</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,padding:"0 0 12px",borderBottom:"1px solid var(--brd)",marginBottom:12}}>
        {[
          ["pending","⏳ PENDIENTES"],
          ["approved","✓ APROBADAS"],
          ["books","📚 LIBROS CORPUS"],
          ["quiz","🔎 QUIZ"],
        ].map(([key,label])=>(
          <button key={key}
            className="btn"
            style={{
              background: tab===key ? "var(--gold-b)" : "transparent",
              color: tab===key ? "#000" : "var(--gold-b)",
              border: "1px solid var(--gold-b)",
              fontFamily:"Cinzel,serif",
              fontSize:"0.7rem",
              letterSpacing:"1.5px",
              padding:"4px 14px",
            }}
            onClick={()=>switchTab(key)}>{label}</button>
        ))}
      </div>

      {msg && <div className="admin-msg">{msg}</div>}

      {/* ── TAB PENDIENTES ── */}
      {tab==="pending" && (
        loading ? <div className="loading">✠ Cargando ✠</div> :
        pending.length === 0 ? (
          <div className="empty"><span className="empty-cross">✠</span>No hay profecías pendientes</div>
        ) : (
          <div>{pending.map(p=>renderCard(p,"pending"))}</div>
        )
      )}

      {/* ── TAB APROBADAS ── */}
      {tab==="approved" && (
        loading ? <div className="loading">✠ Cargando ✠</div> :
        approved.length === 0 ? (
          <div className="empty"><span className="empty-cross">✠</span>No hay profecías aprobadas todavía</div>
        ) : (
          <div>{approved.map(p=>renderCard(p,"approved"))}</div>
        )
      )}

      {/* ── TAB LIBROS CORPUS ── */}
      {tab==="books" && (
        <div>
          <div style={{marginBottom:12,color:"var(--txd)",fontSize:"0.78rem",fontFamily:"Cinzel,serif",letterSpacing:"1px"}}>
            Activá o desactivá los libros que los usuarios pueden ver en la sección PADRES.
            Los libros pre-incluidos (Enoc, Hermas, Catena) siempre son visibles.
          </div>
          {booksMsg && <div className="admin-msg">{booksMsg}</div>}
          {loading ? <div className="loading">✠ Cargando ✠</div> : (
            <>
              <div style={{marginBottom:10,display:"flex",gap:8}}>
                <button className="btn" onClick={showAll}
                  style={{fontSize:"0.7rem"}}>☑ MOSTRAR TODOS</button>
                <button className="btn admin-approve" onClick={saveVisibility}
                  style={{fontSize:"0.7rem"}}>💾 GUARDAR CAMBIOS</button>
              </div>
              {allBooks.length === 0 && (
                <div className="empty">No hay libros extra en corpus_extra/</div>
              )}
              {allBooks.map(f=>{
                const vis = isVisible(f.name);
                return (
                  <div key={f.name} style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"8px 14px", marginBottom:6,
                    background: vis ? "rgba(180,140,60,0.07)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${vis?"var(--gold-b)":"var(--brd)"}`,
                    borderRadius:4, cursor:"pointer",
                    opacity: vis ? 1 : 0.45,
                  }} onClick={()=>toggleBook(f.name)}>
                    <span style={{fontSize:"1.2rem"}}>{vis?"👁":"🚫"}</span>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"Cinzel,serif",fontSize:"0.8rem",color:"var(--gold-b)"}}>
                        {f.name.replace(/\.[^.]+$/,"")}
                      </div>
                      <div style={{fontSize:"0.68rem",color:"var(--txd)"}}>
                        {f.ext} · {f.size_kb} KB
                      </div>
                    </div>
                    <div style={{
                      width:36,height:20,borderRadius:10,
                      background: vis ? "var(--gold-b)" : "#333",
                      position:"relative", transition:"background 0.2s",
                    }}>
                      <div style={{
                        position:"absolute", top:3, left: vis?18:3,
                        width:14, height:14, borderRadius:"50%",
                        background:"#111", transition:"left 0.2s",
                      }}/>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── TAB QUIZ ── */}
      {tab==="quiz" && (
        <div>
          {quizMsg && <div className="admin-msg">{quizMsg}</div>}

          {/* FORMULARIO DE EDICIÓN */}
          {quizEditing ? (
            <div>
              <div className="admin-header" style={{marginBottom:14}}>
                <div className="admin-title" style={{fontSize:"0.9rem"}}>
                  ✠ {quizEditing.id ? "EDITAR" : "NUEVA"} PREGUNTA
                </div>
                <button className="btn" onClick={()=>setQuizEditing(null)}>← CANCELAR</button>
              </div>
              <div className="admin-edit">
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
                  <div>
                    <label className="admin-edit-lbl">LIBRO AT</label>
                    <select className="admin-edit-inp" value={quizEditing.at_book}
                      onChange={e=>qUpd("at_book",e.target.value)}>
                      {BOOKS_AT.map(b=><option key={b} value={b}>{b.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="admin-edit-lbl">CAPÍTULO</label>
                    <input className="admin-edit-inp" type="number" min={1}
                      value={quizEditing.at_ch} onChange={e=>qUpd("at_ch",e.target.value)}/>
                  </div>
                  <div>
                    <label className="admin-edit-lbl">VERSÍCULO</label>
                    <input className="admin-edit-inp" type="number" min={1}
                      value={quizEditing.at_vs} onChange={e=>qUpd("at_vs",e.target.value)}/>
                  </div>
                </div>

                <div className="admin-edit-row">
                  <label className="admin-edit-lbl">TEXTO DE LA PROFECÍA (lo que verá el usuario)</label>
                  <textarea className="admin-edit-inp" rows={2} value={quizEditing.at_text||""}
                    placeholder="Cita del AT..."
                    onChange={e=>qUpd("at_text",e.target.value)}/>
                </div>

                <div className="admin-edit-row">
                  <label className="admin-edit-lbl">FECHA ESCRITURA (hint opcional)</label>
                  <input className="admin-edit-inp" value={quizEditing.hint||""}
                    placeholder="ej. ~735 aC" onChange={e=>qUpd("hint",e.target.value)}/>
                </div>

                <div style={{borderTop:"1px solid var(--brd)",margin:"12px 0",paddingTop:12}}>
                  <label className="admin-edit-lbl">RESPUESTA CORRECTA (NT)</label>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,marginTop:6}}>
                    <div>
                      <label className="admin-edit-lbl" style={{fontSize:"0.6rem"}}>ETIQUETA visible ("Mt 1:23")</label>
                      <input className="admin-edit-inp" value={quizEditing.nt_answer}
                        placeholder="Mt 1:23" onChange={e=>qUpd("nt_answer",e.target.value)}/>
                    </div>
                    <div>
                      <label className="admin-edit-lbl" style={{fontSize:"0.6rem"}}>LIBRO</label>
                      <select className="admin-edit-inp" value={quizEditing.nt_book}
                        onChange={e=>qUpd("nt_book",e.target.value)}>
                        {BOOKS_NT.map(b=><option key={b} value={b}>{b.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="admin-edit-lbl" style={{fontSize:"0.6rem"}}>CAP</label>
                      <input className="admin-edit-inp" type="number" min={1}
                        value={quizEditing.nt_ch} onChange={e=>qUpd("nt_ch",e.target.value)}/>
                    </div>
                    <div>
                      <label className="admin-edit-lbl" style={{fontSize:"0.6rem"}}>VS</label>
                      <input className="admin-edit-inp" type="number" min={1}
                        value={quizEditing.nt_vs} onChange={e=>qUpd("nt_vs",e.target.value)}/>
                    </div>
                  </div>
                </div>

                <div style={{marginTop:12}}>
                  <label className="admin-edit-lbl">3 OPCIONES FALSAS (decoys)</label>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{marginTop:6}}>
                      <input className="admin-edit-inp"
                        value={(quizEditing.decoys||["","",""])[i]||""}
                        placeholder={`Opción falsa ${i+1} — ej. "Jn 1:14"`}
                        onChange={e=>qUpdDecoy(i,e.target.value)}/>
                    </div>
                  ))}
                </div>

                <div style={{display:"flex",gap:8,marginTop:16}}>
                  <button className="btn admin-approve" onClick={quizSave}>💾 GUARDAR</button>
                  <button className="btn" onClick={()=>setQuizEditing(null)}>CANCELAR</button>
                </div>
              </div>
            </div>
          ) : (
            /* LISTA DE PREGUNTAS */
            <div>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
                <button className="btn admin-approve" onClick={quizStartNew}>+ NUEVA PREGUNTA</button>
              </div>
              {loading && <div className="loading">✠ Cargando ✠</div>}
              {!loading && quizQuestions.length===0 && (
                <div className="empty"><span className="empty-cross">✠</span>No hay preguntas todavía</div>
              )}
              {quizQuestions.map(q=>(
                <div key={q.id} className="admin-card" style={{opacity:q.active?1:0.45}}>
                  <div className="admin-card-head">
                    <span className="admin-card-cat">
                      {q.at_book.toUpperCase()} {q.at_ch}:{q.at_vs} → {q.nt_answer}
                    </span>
                    <span className="admin-card-by">#{q.id} · {q.active?"activa":"inactiva"}</span>
                  </div>
                  {q.at_text && (
                    <div className="admin-note" style={{margin:"6px 14px"}}>"{q.at_text}"</div>
                  )}
                  <div style={{padding:"4px 14px 8px",fontSize:"0.7rem",color:"var(--txd)"}}>
                    Opciones: {q.nt_answer} / {(q.decoys||[]).join(" / ")}
                  </div>
                  <div className="admin-card-actions">
                    <button className="btn admin-edit-btn" onClick={()=>quizStartEdit(q)}>✏️ EDITAR</button>
                    <button className="btn" style={{fontSize:"0.7rem"}} onClick={()=>quizToggle(q)}>
                      {q.active?"⏸ DESACTIVAR":"▶ ACTIVAR"}
                    </button>
                    <button className="btn"
                      style={{background:"#3a0a0a",color:"#e08080",border:"1px solid #7a2020",marginLeft:"auto"}}
                      onClick={()=>quizDelete(q.id)}>🗑 BORRAR</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
