// PROFI-CY · Interlinear.js v3
// Usa el endpoint /api/interlinear que devuelve análisis completo desde Python
// Layout fijo: Hebreo (RTL) → Transliteración → Español · 3 filas uniformes
import { useState, useEffect } from "react";

const API = `${window.location.protocol}//${window.location.hostname}:5050/api`;

// Pronunciación griega para LXX
const GRK_PRONUNC = {
  '\u03b1':'a','\u03b2':'b','\u03b3':'g','\u03b4':'d','\u03b5':'e',
  '\u03b6':'dz','\u03b7':'\u0113','\u03b8':'th','\u03b9':'i','\u03ba':'k',
  '\u03bb':'l','\u03bc':'m','\u03bd':'n','\u03be':'ks','\u03bf':'o',
  '\u03c0':'p','\u03c1':'r','\u03c3':'s','\u03c2':'s','\u03c4':'t',
  '\u03c5':'u','\u03c6':'ph','\u03c7':'kh','\u03c8':'ps','\u03c9':'\u014d',
};
const GRK_ES = {
  '\u03ba\u03b1\u03b9':'y','\u03b8\u03b5\u03bf\u03c2':'Dios','\u03ba\u03c5\u03c1\u03b9\u03bf\u03c2':'Se\u00f1or',
  '\u03b9\u03b7\u03c3\u03bf\u03c5\u03c2':'Jes\u00fas','\u03bb\u03bf\u03b3\u03bf\u03c2':'Palabra',
  '\u03c5\u03b9\u03bf\u03c2':'Hijo','\u03c0\u03b1\u03c4\u03b7\u03c1':'Padre',
  '\u03c0\u03bd\u03b5\u03c5\u03bc\u03b1':'Esp\u00edritu','\u03b1\u03b3\u03b9\u03bf\u03c2':'santo',
  '\u03b6\u03c9\u03b7':'vida','\u03c6\u03c9\u03c2':'luz','\u03b3\u03b7':'tierra',
  '\u03bf\u03c5\u03c1\u03b1\u03bd\u03bf\u03c2':'cielo','\u03b1\u03c1\u03c7\u03b7':'principio',
  '\u03c3\u03b7\u03bc\u03b5\u03b9\u03bf\u03bd':'se\u00f1al','\u03c0\u03b1\u03c1\u03b8\u03b5\u03bd\u03bf\u03c2':'virgen',
  '\u03b5\u03bd':'en','\u03b5\u03b9\u03c2':'hacia','\u03b5\u03c7\u03b8\u03c1\u03b1\u03bd':'enemistad',
  '\u03b3\u03c5\u03bd\u03b1\u03b9\u03ba\u03bf\u03c2':'mujer','\u03c3\u03c0\u03b5\u03c1\u03bc\u03b1':'simiente',
  '\u03b9\u03b4\u03bf\u03c5':'he aqu\u00ed','\u03b4\u03c9\u03c3\u03b5\u03b9':'dar\u00e1',
  '\u03ba\u03b5\u03c6\u03b1\u03bb\u03b7\u03bd':'cabeza','\u03c4\u03b7\u03c1\u03b7\u03c3\u03b5\u03b9':'pisar\u00e1',
};
const LAT_ES = {
  'dominus':'Se\u00f1or','deus':'Dios','et':'y','in':'en','est':'es',
  'ipse':'\u00e9l mismo','signum':'se\u00f1al','virgo':'virgen','filius':'hijo',
  'nomen':'nombre','dabit':'dar\u00e1','enim':'pues','lux':'luz',
  'terra':'tierra','caelum':'cielo','verbum':'Palabra','spiritus':'Esp\u00edritu',
  'pater':'Padre','ecce':'he aqu\u00ed','inimicitias':'enemistad','mulier':'mujer',
  'semen':'simiente','caput':'cabeza','calcaneam':'tal\u00f3n','nos':'nosotros',
};

function pronuncGrk(word) {
  const c = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return [...c].map(ch => GRK_PRONUNC[ch]||ch).join('');
}
function translateGrk(word) {
  const c = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\u03b1-\u03c9]/g,'');
  return GRK_ES[c] || GRK_ES[word.toLowerCase()] || '\u2014';
}
function translateLat(word) {
  return LAT_ES[word.toLowerCase().replace(/[^a-z]/g,'')] || '\u2014';
}
function parseLXX(text) {
  if (!text) return [];
  return text.split(/\s+/).filter(w=>/[\u03b1-\u03c9\u0391-\u03a9]/.test(w)).slice(0,25).map(w=>{
    const c = w.replace(/[^\u03b1-\u03c9\u0391-\u03a9\u03ac-\u03ce]/g,'');
    return { original:w, translit:pronuncGrk(c||w), es:translateGrk(c||w), lang:'grc' };
  });
}
function parseVUL(text) {
  if (!text) return [];
  return text.split(/\s+/).filter(w=>w.length>1&&/[a-zA-Z]/.test(w)).slice(0,25).map(w=>{
    const c = w.replace(/[^a-zA-Z]/g,'');
    return { original:w, translit:c.toLowerCase(), es:translateLat(c), lang:'la' };
  });
}

// ── Bloque de palabra uniforme ──
function WordBlock({ original, translit, es, strong, lang, onStrongClick }) {
  const isHeb = lang === 'hbo';
  const isGrk = lang === 'grc';
  return (
    <div className="wb"
      onClick={() => strong && onStrongClick && onStrongClick(strong)}
      title={strong ? `Click para ver ${strong} en el Multiléxico` : undefined}>
      <div className={`wb-orig ${isHeb?'wb-heb':isGrk?'wb-grk':'wb-lat'}`}>
        {original}
      </div>
      <div className="wb-pron">{translit || '\u2014'}</div>
      <div className="wb-esp">{es || '\u2014'}</div>
      {strong && <div className="wb-str">{strong}</div>}
    </div>
  );
}

// ── Guía de pronunciación ──
function PronuncGuide({ lang }) {
  const HEB = [
    ['\u05d0','Alef','(sil)'],  ['\u05d1','Bet','b/v'],  ['\u05d2','Guímel','g'],
    ['\u05d3','Dálet','d'],     ['\u05d4','He','h'],      ['\u05d5','Vav','v'],
    ['\u05d6','Zayin','z'],     ['\u05d7','Jet','jh'],    ['\u05d8','Tet','t'],
    ['\u05d9','Yod','y'],       ['\u05db','Kaf','k/kh'],  ['\u05dc','Lámed','l'],
    ['\u05de','Mem','m'],       ['\u05e0','Nun','n'],     ['\u05e1','Sámej','s'],
    ['\u05e2','Ayin','(gut)'],  ['\u05e4','Pe','p/f'],    ['\u05e6','Tsadí','ts'],
    ['\u05e7','Qof','q'],       ['\u05e8','Resh','r'],    ['\u05e9','Shin','sh'],
    ['\u05ea','Tav','t'],
  ];
  const GRK = [
    ['\u03b1','Alfa','a'],['\u03b2','Beta','b'],['\u03b3','Gamma','g'],
    ['\u03b4','Delta','d'],['\u03b5','Épsilon','e'],['\u03b6','Dzeta','dz'],
    ['\u03b7','Eta','\u0113'],['\u03b8','Théta','th'],['\u03b9','Iota','i'],
    ['\u03ba','Kappa','k'],['\u03bb','Lambda','l'],['\u03bc','Mu','m'],
    ['\u03bd','Nu','n'],['\u03be','Xi','ks'],['\u03bf','Ómicron','o'],
    ['\u03c0','Pi','p'],['\u03c1','Ro','r'],['\u03c3/\u03c2','Sigma','s'],
    ['\u03c4','Tau','t'],['\u03c5','Ípsilon','u'],['\u03c6','Fi','ph/f'],
    ['\u03c7','Ji','kh/j'],['\u03c8','Psi','ps'],['\u03c9','Omega','\u014d'],
  ];
  const LAT = [
    ['a','A','a'],['b','B','b'],['c','C','k/s'],['d','D','d'],['e','E','e'],
    ['f','F','f'],['g','G','g'],['i','I','i'],['l','L','l'],['m','M','m'],
    ['n','N','n'],['o','O','o'],['p','P','p'],['q','Q','k'],['r','R','r'],
    ['s','S','s'],['t','T','t'],['u','U','u'],['v','V','u/v'],['x','X','ks'],
    ['ae','AE','e'],['ph','PH','f'],['qu','QU','kw'],
  ];
  const tbl = lang==='hebrew'?HEB:lang==='greek'?GRK:LAT;
  const ttl = lang==='hebrew'?'📖 PRONUNCIACIÓN HEBREA':
              lang==='greek' ?'📖 PRONUNCIACIÓN GRIEGA KOINÉ':'📖 PRONUNCIACIÓN LATINA';
  return (
    <details className="pg-wrap">
      <summary className="pg-sum">{ttl}</summary>
      <div className="pg-table">
        {tbl.map(([l,n,p])=>(
          <div key={l} className="pg-cell">
            <span className="pg-letter">{l}</span>
            <span className="pg-name">{n}</span>
            <span className="pg-sound">{p}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function Interlinear({ book, ch, vs, onStrongClick }) {
  const [data, setData]         = useState(null);
  const [interData, setInter]   = useState(null);   // BHS (AT)
  const [interNT, setInterNT]   = useState(null);   // NA27 (NT)
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState('hebrew');
  const [ntVersion, setNtVersion] = useState('NA27');

  const NT_BOOKS = ['mt','mc','lc','jn','hch','rm','1co','2co','ga','ef','flp',
    'col','1ts','2ts','1tm','2tm','tit','flm','heb','stg','1pe','2pe','1jn',
    '2jn','3jn','jud','ap'];
  const isNT = NT_BOOKS.includes(book?.toLowerCase());

  useEffect(() => {
    if (!book || !ch || !vs) return;
    setLoading(true);
    setInterNT(null);
    setInter(null);
    fetch(`${API}/parallel?book=${book}&ch=${ch}&vs=${vs}`)
      .then(r=>r.json()).then(setData).catch(()=>{});
    if (isNT) {
      fetch(`${API}/interlinear_nt?book=${book}&ch=${ch}&vs=${vs}&version=${ntVersion}`)
        .then(r=>r.json()).then(d=>{ setInterNT(d); setLoading(false); })
        .catch(()=>setLoading(false));
      setMode('greek');
    } else {
      fetch(`${API}/interlinear?book=${book}&ch=${ch}&vs=${vs}`)
        .then(r=>r.json()).then(d=>{ setInter(d); setLoading(false); })
        .catch(()=>setLoading(false));
      setMode('hebrew');
    }
  }, [book, ch, vs, ntVersion]);

  if (loading) return <div className="loading">✠ CARGANDO INTERLINEAL ✠</div>;
  if (!data)   return <div className="empty"><span className="empty-cross">✠</span>Seleccioná un versículo en PARALELO</div>;

  const lxx = data.versiculos?.find(v=>v.version_code==='LXX');
  const vul = data.versiculos?.find(v=>v.version_code==='VUL');
  const jer = data.versiculos?.find(v=>v.version_code==='JER');
  const hasBHS = interData && !interData.error && (interData.words||[]).length > 0;
  const hasNT  = interNT  && !interNT.error  && (interNT.words||[]).length > 0;
  const grkWords = lxx ? parseLXX(lxx.text) : [];
  const latWords = vul ? parseVUL(vul.text) : [];

  return (
    <div className="inter-wrap">
      {/* Header */}
      <div className="inter-hd">
        <span className="inter-ref-lbl">{data.libro?.name_es} {ch}:{vs}</span>
        {/* Botones de modo */}
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {isNT ? (
            <>
              <button className={`btn${mode==='greek'?' active':''}`} onClick={()=>setMode('greek')}>
                ΕΛΛΗΝ GRIEGO
              </button>
              {lxx && <button className={`btn${mode==='greek-lxx'?' active':''}`} onClick={()=>setMode('greek-lxx')}>LXX</button>}
              {vul && <button className={`btn${mode==='latin'?' active':''}`} onClick={()=>setMode('latin')}>LAT LATÍN</button>}
            </>
          ) : (
            <>
              {hasBHS && <button className={`btn${mode==='hebrew'?' active':''}`} onClick={()=>setMode('hebrew')}>עברית HEBREO</button>}
              {lxx   && <button className={`btn${mode==='greek'?' active':''}`} onClick={()=>setMode('greek')}>ΕΛΛΗΝ GRIEGO</button>}
              {vul   && <button className={`btn${mode==='latin'?' active':''}`} onClick={()=>setMode('latin')}>LAT LATÍN</button>}
            </>
          )}
        </div>
      </div>

      {/* Leyenda de columnas */}
      <div className="inter-legend">
        <span>ORIGINAL</span><span>PRONUNCIACIÓN</span><span>ESPAÑOL</span>
      </div>

      {/* ══ GRIEGO NT ══ */}
      {mode==='greek' && isNT && (
        <div>
          <div className="inter-lang-tag" style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <span>GRIEGO NT ·</span>
            {['NA27','BYZ','WH','TISCH'].map(v=>(
              <button key={v}
                className={`btn${ntVersion===v?' active':''}`}
                style={{fontSize:'0.7rem',padding:'2px 6px'}}
                onClick={()=>setNtVersion(v)}>{v}</button>
            ))}
          </div>
          {!hasNT ? (
            <div className="empty" style={{padding:'20px'}}>
              Griego NT no disponible — copiá los .bblx a corpus_extra/
            </div>
          ) : (
            <>
              <div className="wb-grid">
                {interNT.words.map((w,i) => (
                  <div key={i} className="wb wb-heb-card"
                    onClick={()=>w.strong&&onStrongClick&&onStrongClick(w.strong)}
                    title={w.morph_es||w.morph||''}>
                    <div className="wb-orig wb-grk">{w.greek}</div>
                    <div className="wb-pron">{w.translit||'—'}</div>
                    <div className="wb-esp">{w.es||'—'}</div>
                    {w.morph && <div className="wb-morph-tag">{w.morph.split('-')[0]}</div>}
                    {w.strong && <div className="wb-str">{w.strong}</div>}
                  </div>
                ))}
              </div>
              <details className="morph-table-wrap">
                <summary className="pg-sum">📋 TABLA MORFOLÓGICA GRIEGA</summary>
                <table className="morph-table">
                  <thead>
                    <tr>
                      <th>Griego</th><th>Translit.</th><th>Strong</th>
                      <th>Morfología</th><th>Español</th><th>Definición</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interNT.words.map((w,i)=>(
                      <tr key={i} className="morph-row"
                        onClick={()=>w.strong&&onStrongClick&&onStrongClick(w.strong)}>
                        <td className="wb-grk" style={{fontSize:'1.1rem'}}>{w.greek}</td>
                        <td className="morph-tr">{w.translit}</td>
                        <td className="morph-st" style={{cursor:w.strong?'pointer':'default',color:'var(--gold)'}}>{w.strong||'—'}</td>
                        <td className="morph-mo" title={w.morph}>{w.morph_es||w.morph||'—'}</td>
                        <td className="morph-es">{w.es||'—'}</td>
                        <td className="morph-es" style={{color:'var(--text-muted)',fontSize:'0.75rem'}}>{w.definition||''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          )}
          {jer && <div className="inter-trad"><span className="inter-trad-lbl">✠ JERUSALÉN:</span> {jer.text}</div>}
          <PronuncGuide lang="greek"/>
        </div>
      )}

      {/* ══ HEBREO BHS ══ */}
      {mode==='hebrew' && (
        <div>
          <div className="inter-lang-tag">HEBREO · Biblia Hebraica Stuttgartensia (BHS) · Análisis morfológico</div>
          {!hasBHS ? (
            <div className="empty" style={{padding:'20px'}}>
              BHS no disponible para este libro (solo AT protocanónico)
            </div>
          ) : (
            <>
              {/* Grid de palabras RTL */}
              <div className="wb-grid wb-rtl">
                {interData.words.map((w,i) => (
                  <div key={i} className="wb wb-heb-card"
                    onClick={()=>w.strong&&onStrongClick&&onStrongClick(w.strong)}
                    title={w.morph_es||w.morph||''}>
                    {/* Fila 1: hebreo con nikkud */}
                    <div className="wb-orig wb-heb">{w.hebrew}</div>
                    {/* Fila 2: transliteración académica */}
                    <div className="wb-pron">{w.translit||'—'}</div>
                    {/* Fila 3: español */}
                    <div className="wb-esp">{w.es||'—'}</div>
                    {/* Morfología */}
                    {w.morph && (
                      <div className="wb-morph-tag">{w.morph.split('.')[0]}</div>
                    )}
                    {/* Strong badge */}
                    {w.strong && <div className="wb-str">{w.strong}</div>}
                  </div>
                ))}
              </div>

              {/* Tabla morfológica detallada */}
              <details className="morph-table-wrap">
                <summary className="pg-sum">📋 TABLA MORFOLÓGICA DETALLADA</summary>
                <table className="morph-table">
                  <thead>
                    <tr>
                      <th>Hebreo</th>
                      <th>Transliteración</th>
                      <th>Pronunciación</th>
                      <th>Strong</th>
                      <th>Morfología</th>
                      <th>Español</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interData.words.map((w,i)=>(
                      <tr key={i}
                        className="morph-row"
                        onClick={()=>w.strong&&onStrongClick&&onStrongClick(w.strong)}>
                        <td className="morph-heb">{w.hebrew}</td>
                        <td className="morph-tr">{w.translit}</td>
                        <td className="morph-pr">{w.pronunc}</td>
                        <td className="morph-st"
                          style={{cursor:w.strong?'pointer':'default',color:'var(--gold)'}}>
                          {w.strong||'—'}
                        </td>
                        <td className="morph-mo" title={w.morph}>{w.morph_es||w.morph||'—'}</td>
                        <td className="morph-es">{w.es||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          )}
          {jer && <div className="inter-trad"><span className="inter-trad-lbl">✠ JERUSALÉN:</span> {jer.text}</div>}
          <PronuncGuide lang="hebrew"/>
        </div>
      )}

      {/* ══ GRIEGO LXX (AT) ══ */}
      {mode==='greek' && !isNT && lxx && (
        <div>
          <div className="inter-lang-tag">GRIEGO KOINÉ · Septuaginta (LXX) con Strong</div>
          <div className="wb-grid">
            {grkWords.map((w,i)=>(
              <WordBlock key={i} original={w.original} translit={w.translit}
                es={w.es} lang="grc" onStrongClick={onStrongClick}/>
            ))}
          </div>
          {jer && <div className="inter-trad"><span className="inter-trad-lbl">✠ JERUSALÉN:</span> {jer.text}</div>}
          <PronuncGuide lang="greek"/>
        </div>
      )}

      {/* ══ LATÍN VUL ══ */}
      {mode==='latin' && vul && (
        <div>
          <div className="inter-lang-tag">LATÍN · Vulgata de San Jerónimo (405 AD)</div>
          <div className="wb-grid">
            {latWords.map((w,i)=>(
              <WordBlock key={i} original={w.original} translit={w.translit}
                es={w.es} lang="la" onStrongClick={onStrongClick}/>
            ))}
          </div>
          {jer && <div className="inter-trad"><span className="inter-trad-lbl">✠ JERUSALÉN:</span> {jer.text}</div>}
          <PronuncGuide lang="latin"/>
        </div>
      )}
    </div>
  );
}
