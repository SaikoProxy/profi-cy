// PROFI-CY · Quiz.js — Detective Profético (solo modo juego, sin editor)
import { useState, useEffect } from "react";

const API = `${window.location.protocol}//${window.location.hostname}:5050/api`;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(q) {
  return shuffle([q.nt_answer, ...(q.decoys || [])]).slice(0, 4);
}

const AT_LABELS = {
  gn:"Génesis",ex:"Éxodo",lv:"Levítico",nm:"Números",dt:"Deuteronomio",
  jos:"Josué",jue:"Jueces",rt:"Rut",sal:"Salmos",pr:"Proverbios",
  is:"Isaías",jr:"Jeremías",ez:"Ezequiel",dn:"Daniel",os:"Oseas",
  mi:"Miqueas",zac:"Zacarías",mal:"Malaquías",dn:"Daniel",
};
function atLabel(book) {
  return AT_LABELS[book] || book.toUpperCase();
}

function QuizGame({ questions, onBack }) {
  const [qIdx, setQIdx]     = useState(0);
  const [options, setOptions] = useState([]);
  const [chosen, setChosen] = useState(null);
  const [score, setScore]   = useState(0);
  const [done, setDone]     = useState(false);

  const q = questions[qIdx];

  useEffect(() => {
    if (q) setOptions(buildOptions(q));
    setChosen(null);
  }, [qIdx]);

  const pick = (opt) => {
    if (chosen) return;
    setChosen(opt);
    if (opt === q.nt_answer) setScore(s => s + 1);
  };

  const next = () => {
    if (qIdx + 1 >= questions.length) setDone(true);
    else setQIdx(i => i + 1);
  };

  const restart = () => { setQIdx(0); setScore(0); setDone(false); setChosen(null); };

  if (done) return (
    <div className="quiz-done">
      <div className="quiz-done-score">{score}/{questions.length}</div>
      <div className="quiz-done-label">RESPUESTAS CORRECTAS</div>
      <div className="quiz-done-msg">
        {score === questions.length
          ? "✠ Perfecto — conocés las profecías como los Padres"
          : score >= questions.length * 0.7
            ? "✠ Muy bien — seguí estudiando las Escrituras"
            : "✠ Repasá las profecías en la sección PROFECÍAS"}
      </div>
      <div style={{display:"flex",gap:12,marginTop:24,justifyContent:"center"}}>
        <button className="btn" onClick={restart}>↺ REINICIAR</button>
        <button className="btn" onClick={onBack}>← VOLVER</button>
      </div>
    </div>
  );

  if (!q) return null;

  return (
    <div className="quiz-game">
      <div className="quiz-progress">
        <div className="quiz-prog-bar">
          <div className="quiz-prog-fill" style={{width:`${(qIdx/questions.length)*100}%`}}/>
        </div>
        <span className="quiz-prog-label">
          {score}/{questions.length} · pregunta {qIdx+1} de {questions.length}
        </span>
      </div>

      <div className="quiz-card">
        <div className="quiz-at-label">PROFECÍA DEL ANTIGUO TESTAMENTO</div>
        <div className="quiz-at-ref">{atLabel(q.at_book)} {q.at_ch}:{q.at_vs}</div>
        {q.at_text && <div className="quiz-at-text">"{q.at_text}"</div>}
        {q.hint    && <div className="quiz-hint">{q.hint}</div>}

        <div className="quiz-question">¿En qué versículo del NT se cumple?</div>

        <div className="quiz-options">
          {options.map((opt, i) => {
            let cls = "quiz-opt";
            if (chosen) {
              if (opt === q.nt_answer)  cls += " quiz-opt-correct";
              else if (opt === chosen)  cls += " quiz-opt-wrong";
              else                      cls += " quiz-opt-dim";
            }
            return (
              <button key={i} className={cls} onClick={() => pick(opt)}>{opt}</button>
            );
          })}
        </div>

        {chosen && (
          <div className={`quiz-feedback ${chosen === q.nt_answer ? "quiz-fb-ok" : "quiz-fb-fail"}`}>
            {chosen === q.nt_answer
              ? `✓ Correcto — ${q.nt_answer}`
              : `✕ La respuesta era ${q.nt_answer}`}
          </div>
        )}
      </div>

      {chosen && (
        <div style={{textAlign:"center",marginTop:16}}>
          <button className="pe-reveal-btn" onClick={next}>
            {qIdx + 1 >= questions.length ? "VER RESULTADO ✠" : "SIGUIENTE →"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Quiz() {
  const [mode, setMode]         = useState("menu");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/quiz/list`);
      const d = await r.json();
      setQuestions(d.questions || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (mode === "game" && questions.length > 0)
    return <div className="quiz-wrap"><QuizGame questions={questions} onBack={() => setMode("menu")}/></div>;

  return (
    <div className="quiz-wrap">
      <div className="quiz-menu">

        {/* Mascota Luce */}
        <div style={{
          position:"relative",
          width:180,height:180,
          marginBottom:8,
          filter:"drop-shadow(0 0 18px rgba(232,184,75,0.35))",
          animation:"luce-float 3.5s ease-in-out infinite",
        }}>
          <img
            src="/luce.png"
            alt="Luce"
            style={{width:"100%",height:"100%",objectFit:"contain"}}
            onError={e=>e.target.style.display="none"}
          />
        </div>

        <div className="quiz-title">✠ DETECTIVE PROFÉTICO</div>
        <div className="quiz-subtitle">Descubrí los patrones entre el AT y el NT</div>
        <div className="quiz-menu-stats">
          <span>{questions.length} profecías</span>
          <span>·</span>
          <span>4 opciones cada una</span>
        </div>

        {loading
          ? <div className="loading" style={{marginTop:24}}>✠ Cargando ✠</div>
          : <button className="pe-reveal-btn"
              style={{minWidth:200,fontSize:"1rem",padding:"12px 32px",marginTop:32}}
              onClick={() => { load(); setMode("game"); }}
              disabled={questions.length === 0}>
              ▶ COMENZAR QUIZ
            </button>
        }

        {questions.length === 0 && !loading && (
          <div className="empty" style={{marginTop:24}}>
            <span className="empty-cross">✠</span>No hay preguntas cargadas
          </div>
        )}
      </div>
    </div>
  );
}
