// PROFI-CY · Catequesis.js
// Catequesis católica — CIC, credos, mandamientos, oración, santos
import { useState } from "react";

const SECCIONES = [
  {
    id:"credo", titulo:"EL CREDO APOSTÓLICO", icono:"📜",
    subtitulo:"Los 12 Artículos de la Fe",
    contenido: [
      { n:1,  art:"Creo en Dios, Padre todopoderoso, Creador del cielo y de la tierra.", cic:"CIC 198-354",
        expl:"El primer artículo nos habla de Dios Uno y Trino, Padre, principio y fundamento de todo. Es Creador de todo lo visible e invisible." },
      { n:2,  art:"y en Jesucristo, su único Hijo, Nuestro Señor,", cic:"CIC 422-483",
        expl:"Jesús es el Mesías (Cristo), el Hijo de Dios hecho hombre. 'Señor' (Kyrios) es el nombre divino dado a Jesús, que indica su divinidad y soberanía." },
      { n:3,  art:"que fue concebido por obra y gracia del Espíritu Santo, nació de santa María Virgen,", cic:"CIC 484-570",
        expl:"La Encarnación: el Hijo eterno de Dios tomó naturaleza humana en el seno de María. La virginidad perpetua de María es dogma de fe (Éfeso, 431)." },
      { n:4,  art:"padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado,", cic:"CIC 571-630",
        expl:"Cristo sufrió su Pasión y muerte en la Cruz como sacrificio expiatorio por nuestros pecados. La muerte de Jesús es el acontecimiento central de la salvación." },
      { n:5,  art:"descendió a los infiernos, al tercer día resucitó de entre los muertos,", cic:"CIC 631-658",
        expl:"La Resurrección es el fundamento de nuestra fe (1Co 15:14). Cristo resucitó con su propio cuerpo glorificado." },
      { n:6,  art:"subió a los cielos y está sentado a la derecha de Dios, Padre todopoderoso.", cic:"CIC 659-667",
        expl:"La Ascensión es la glorificación definitiva de la humanidad de Cristo. Sentado a la diestra del Padre significa que participa del poder divino." },
      { n:7,  art:"Desde allí ha de venir a juzgar a los vivos y a los muertos.", cic:"CIC 668-682",
        expl:"Cristo vendrá al final de los tiempos para juzgar a todos los hombres según sus obras y su aceptación o rechazo de la gracia." },
      { n:8,  art:"Creo en el Espíritu Santo,", cic:"CIC 683-747",
        expl:"El Espíritu Santo es la tercera Persona de la Santísima Trinidad, igual al Padre y al Hijo. Es el Señor y dador de vida." },
      { n:9,  art:"la santa Iglesia católica, la comunión de los santos,", cic:"CIC 748-975",
        expl:"La Iglesia es el Cuerpo de Cristo, pueblo de Dios y templo del Espíritu Santo. La comunión de los santos une a los fieles vivos y difuntos." },
      { n:10, art:"el perdón de los pecados,", cic:"CIC 976-987",
        expl:"Por el Bautismo y la Penitencia, Cristo otorga el perdón de todos los pecados. Esta es una de las grandes obras de la misericordia divina." },
      { n:11, art:"la resurrección de la carne,", cic:"CIC 988-1019",
        expl:"Al fin del mundo, los cuerpos de todos los muertos resucitarán para reunirse con sus almas. La fe en la resurrección es esencial al cristianismo." },
      { n:12, art:"y la vida eterna. Amén.", cic:"CIC 1020-1065",
        expl:"El fin último del hombre es la vida eterna: ver a Dios cara a cara (visión beatífica). El Cielo, el Purgatorio y el Infierno son las realidades escatológicas finales." },
    ]
  },
  {
    id:"mandamientos", titulo:"LOS 10 MANDAMIENTOS", icono:"⚖️",
    subtitulo:"El Decálogo — Ex 20:1-17 · Dt 5:6-21",
    contenido: [
      { n:1,  art:"Amarás a Dios sobre todas las cosas.", cic:"CIC 2084-2141", expl:"Es el fundamento de toda la moral cristiana. Exige fe, esperanza y caridad. Prohíbe la idolatría, la superstición y la magia." },
      { n:2,  art:"No tomarás el nombre de Dios en vano.", cic:"CIC 2142-2167", expl:"El nombre de Dios es santo. Prohíbe el perjurio, la blasfemia y el uso irrespetuoso del nombre de Dios." },
      { n:3,  art:"Santificarás las fiestas.", cic:"CIC 2168-2195", expl:"El domingo es el día de la Resurrección. Los fieles están obligados a participar en la Misa dominical." },
      { n:4,  art:"Honrarás a tu padre y a tu madre.", cic:"CIC 2196-2257", expl:"Exige gratitud, respeto y obediencia a los padres. Se extiende a las autoridades legítimas." },
      { n:5,  art:"No matarás.", cic:"CIC 2258-2330", expl:"La vida humana es sagrada desde la concepción hasta la muerte natural. Prohíbe el homicidio, el aborto y la eutanasia." },
      { n:6,  art:"No cometerás actos impuros.", cic:"CIC 2331-2400", expl:"Exige la castidad según el estado de cada uno. Prohíbe los actos contrarios a la dignidad sexual." },
      { n:7,  art:"No robarás.", cic:"CIC 2401-2463", expl:"Exige justicia en las relaciones humanas y respeto por los bienes ajenos. Prohíbe el fraude y la corrupción." },
      { n:8,  art:"No darás falso testimonio ni mentirás.", cic:"CIC 2464-2513", expl:"Exige vivir en la verdad. Prohíbe la mentira, la calumnia y la hipocresía. Cristo es 'la Verdad' (Jn 14:6)." },
      { n:9,  art:"No consentirás pensamientos ni deseos impuros.", cic:"CIC 2514-2533", expl:"Exige la pureza de corazón (Mt 5:8). Prohíbe el deseo voluntario de acciones contrarias a la castidad." },
      { n:10, art:"No codiciarás los bienes ajenos.", cic:"CIC 2534-2557", expl:"Prohíbe la avaricia y el deseo desordenado de riquezas. Exige la pobreza de espíritu (Mt 5:3)." },
    ]
  },
  {
    id:"oracion", titulo:"EL PADRENUESTRO", icono:"🙏",
    subtitulo:"La Oración del Señor — Mt 6:9-13 · Lc 11:2-4",
    contenido: [
      { n:1, art:"Padre nuestro, que estás en el cielo,", cic:"CIC 2779-2802", expl:"'Padre' revela la relación nueva que Cristo nos ha dado con Dios. 'Nuestro' expresa la comunión de todos los hijos de Dios." },
      { n:2, art:"santificado sea tu Nombre,", cic:"CIC 2803-2815", expl:"Pedimos que el nombre de Dios sea reconocido como santo por todos los hombres." },
      { n:3, art:"venga tu Reino,", cic:"CIC 2816-2821", expl:"Pedimos la venida del Reino de Dios — ya presente en Cristo, que crecerá hasta ser perfecto al final de los tiempos." },
      { n:4, art:"hágase tu voluntad en la tierra como en el cielo.", cic:"CIC 2822-2827", expl:"Pedimos unirnos al plan salvífico de Dios. Como María ('Hágase en mí según tu Palabra') y Cristo en Getsemaní." },
      { n:5, art:"Danos hoy nuestro pan de cada día,", cic:"CIC 2828-2837", expl:"Pedimos el pan material y el pan espiritual: la Eucaristía, la Palabra de Dios, el Cuerpo de Cristo." },
      { n:6, art:"y perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden,", cic:"CIC 2838-2845", expl:"El perdón divino está vinculado a nuestra capacidad de perdonar. 'Sed misericordiosos como vuestro Padre' (Lc 6:36)." },
      { n:7, art:"y no nos dejes caer en la tentación, mas líbranos del mal. Amén.", cic:"CIC 2846-2865", expl:"Pedimos la gracia de no ceder a la tentación. 'El mal' es el Maligno — Satanás. Nos recuerda nuestra debilidad." },
    ]
  },
  {
    id:"virtudes", titulo:"VIRTUDES Y DONES", icono:"✨",
    subtitulo:"Virtudes Teologales, Cardinales y Dones del Espíritu",
    contenido: [
      { n:1, art:"Fe — Virtud Teologal", cic:"CIC 1814-1816", expl:"La fe es la virtud por la que creemos en Dios y en todo lo que Él ha revelado. Es un don gratuito y un acto humano libre." },
      { n:2, art:"Esperanza — Virtud Teologal", cic:"CIC 1817-1821", expl:"La esperanza es el deseo de la vida eterna y la confianza en las promesas de Cristo. Preserva del desánimo y del egoísmo." },
      { n:3, art:"Caridad — Virtud Teologal", cic:"CIC 1822-1829", expl:"La caridad es amar a Dios sobre todas las cosas y al prójimo como a uno mismo. Es 'el vínculo de la perfección' (Col 3:14)." },
      { n:4, art:"Prudencia — Virtud Cardinal", cic:"CIC 1806", expl:"Dispone la razón práctica a discernir el bien verdadero. Es 'auriga virtutum' — conductora de las virtudes." },
      { n:5, art:"Justicia — Virtud Cardinal", cic:"CIC 1807", expl:"La voluntad constante de dar a Dios y al prójimo lo que les es debido. Regula las relaciones con los demás." },
      { n:6, art:"Fortaleza — Virtud Cardinal", cic:"CIC 1808", expl:"Asegura la firmeza en las dificultades y la constancia en la búsqueda del bien. Llega hasta el martirio." },
      { n:7, art:"Templanza — Virtud Cardinal", cic:"CIC 1809", expl:"Modera el atractivo de los placeres y procura el equilibrio en el uso de los bienes creados." },
      { n:8, art:"Los 7 Dones del Espíritu Santo", cic:"CIC 1830-1831", expl:"Sabiduría · Entendimiento · Consejo · Fortaleza · Ciencia · Piedad · Temor de Dios. (Is 11:2)" },
    ]
  },
];

export default function Catequesis() {
  const [seccion, setSeccion] = useState("credo");
  const [expanded, setExpanded] = useState(null);
  const sec = SECCIONES.find(s => s.id === seccion);

  return (
    <div className="cat-wrap">
      <div className="cat-header">
        <div className="cat-title">✠ CATEQUESIS</div>
        <div className="cat-sub">Catecismo de la Iglesia Católica · Doctrina de la Fe</div>
      </div>

      <div className="cat-nav">
        {SECCIONES.map(s => (
          <button key={s.id} className={`btn${seccion===s.id?" active":""}`}
            onClick={()=>{setSeccion(s.id);setExpanded(null);}}>
            {s.icono} {s.titulo.split(" ").slice(0,2).join(" ")}
          </button>
        ))}
        <button className={`btn${seccion==="santos"?" active":""}`}
          style={seccion==="santos"?{}:{borderColor:"#7090D0",color:"#7090D0"}}
          onClick={()=>setSeccion("santos")}>
          👼 SANTOS
        </button>
      </div>

      {/* ── SECCIONES CIC ── */}
      {sec && seccion !== "santos" && (
        <div>
          <div className="cat-section-title">
            <span className="cat-section-icon">{sec.icono}</span>
            {sec.titulo}
          </div>
          <div className="cat-section-sub">{sec.subtitulo}</div>
          <div className="cat-items">
            {sec.contenido.map((item, i) => (
              <div key={i} className={`cat-item${expanded===i?" cat-expanded":""}`}
                onClick={()=>setExpanded(expanded===i?null:i)}>
                <div className="cat-item-head">
                  <span className="cat-item-n">{item.n}</span>
                  <span className="cat-item-art">"{item.art}"</span>
                  <span className="cat-item-cic">{item.cic}</span>
                  <span className="cat-item-arrow">{expanded===i?"▲":"▼"}</span>
                </div>
                {expanded===i && <div className="cat-item-expl">{item.expl}</div>}
              </div>
            ))}
          </div>
          <div className="cat-oracion">
            <div className="cat-or-label">✠ ACTO DE CONTRICIÓN</div>
            <div className="cat-or-text">
              Señor mío Jesucristo, Dios y hombre verdadero, me pesa de todo corazón haberte ofendido,
              porque eres infinitamente bueno y el pecado te desagrada. Propongo firmemente, con tu gracia,
              enmendarme y alejarme de las ocasiones de pecado, confesarme y cumplir la penitencia.
              Confío en que me perdonarás por tu infinita misericordia. Amén.
            </div>
          </div>
        </div>
      )}

      {/* ── SECCIÓN SANTOS ── */}
      {seccion === "santos" && (
        <div>
          <div className="cat-section-title">
            <span className="cat-section-icon">👼</span>
            SANTOS · ENCÍCLICAS · PATRONOS
          </div>
          <div className="cat-section-sub">Documentos del Magisterio · Santos Contemporáneos</div>

          {/* ENCÍCLICA: Magnifica Humanitas */}
          <div style={{
            background:"var(--bg2)", border:"1px solid var(--bd)",
            borderTop:"3px solid var(--gold)", borderRadius:"var(--r)",
            marginBottom:20, overflow:"hidden",
          }}>
            <div style={{position:"relative",width:"100%",height:200,overflow:"hidden",background:"#0d0905"}}>
              <img
                src="https://www.vatican.va/content/dam/leo-xiv/images/2026/magnifica-humanitas-banner.jpg"
                alt="Magnifica Humanitas"
                style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.6}}
                onError={e=>e.target.style.display="none"}
              />
              <div style={{
                position:"absolute",inset:0,
                background:"linear-gradient(135deg,rgba(18,12,6,0.88) 0%,rgba(30,18,8,0.55) 100%)",
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                gap:8,padding:"0 24px",textAlign:"center",
              }}>
                <div style={{fontFamily:"Cinzel,serif",fontSize:"0.52rem",letterSpacing:4,color:"var(--gold)",opacity:0.75}}>
                  SANTA SEDE · 15 MAYO 2026
                </div>
                <div style={{fontFamily:"Cinzel Decorative,serif",fontSize:"1.6rem",color:"var(--gold-p)",lineHeight:1.15}}>
                  Magnifica<br/>Humanitas
                </div>
                <div style={{fontFamily:"Cinzel,serif",fontSize:"0.62rem",letterSpacing:2.5,color:"var(--gold-b)",opacity:0.85}}>
                  PAPA LEÓN XIV
                </div>
              </div>
              <div style={{
                position:"absolute",top:12,left:14,
                background:"rgba(196,146,42,0.92)",
                fontFamily:"Cinzel,serif",fontSize:"0.52rem",letterSpacing:2,
                color:"#000",padding:"3px 12px",borderRadius:10,
              }}>✠ NUEVA ENCÍCLICA 2026</div>
            </div>
            <div style={{padding:"18px 22px"}}>
              <div style={{fontSize:"0.9rem",color:"var(--pa2)",lineHeight:1.7,marginBottom:16,fontStyle:"italic"}}>
                Primera encíclica del Papa León XIV. Documento magisterial sobre la dignidad de la persona humana,
                la razón, la fe y el diálogo entre la Iglesia y el mundo contemporáneo.
              </div>
              <a href="https://www.vatican.va/content/leo-xiv/es/encyclicals/documents/20260515-magnifica-humanitas.html"
                target="_blank" rel="noopener noreferrer"
                style={{
                  display:"inline-flex",alignItems:"center",gap:8,
                  fontFamily:"Cinzel,serif",fontSize:"0.62rem",letterSpacing:2,
                  color:"#000",background:"var(--gold)",
                  border:"1px solid var(--gold-b)",borderRadius:"var(--r)",
                  padding:"9px 22px",textDecoration:"none",
                }}>
                ✠ LEER EN EL VATICANO →
              </a>
            </div>
          </div>

          {/* CARLO ACUTIS */}
          <div style={{
            background:"var(--bg2)",border:"1px solid var(--bd)",
            borderTop:"3px solid #6080B0",borderRadius:"var(--r)",
            overflow:"hidden",
          }}>
            <div style={{display:"flex",flexWrap:"wrap"}}>
              <div style={{width:150,minHeight:210,flexShrink:0,position:"relative",overflow:"hidden",background:"#080c18"}}>
                <img
                  src="/carlo_acutis.jpg"
                  alt="Carlo Acutis"
                  style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",opacity:0.9}}
                  onError={e=>e.target.style.display="none"}
                />
                <div style={{
                  position:"absolute",bottom:0,left:0,right:0,
                  background:"linear-gradient(transparent,rgba(0,0,0,0.88))",
                  padding:"28px 8px 10px",
                  fontFamily:"Cinzel,serif",fontSize:"0.5rem",letterSpacing:1.5,
                  color:"rgba(160,190,255,0.9)",textAlign:"center",
                }}>1991 — 2006</div>
              </div>
              <div style={{flex:1,padding:"20px 22px",minWidth:180}}>
                <div style={{
                  fontFamily:"Cinzel,serif",fontSize:"0.5rem",letterSpacing:3,
                  color:"#7090D0",marginBottom:6,
                }}>PATRÓN DE PROFI-CY</div>
                <div style={{fontFamily:"Cinzel Decorative,serif",fontSize:"1.05rem",color:"var(--pa)",marginBottom:5}}>
                  Carlo Acutis
                </div>
                <div style={{fontFamily:"Cinzel,serif",fontSize:"0.56rem",letterSpacing:1.5,color:"#7090D0",marginBottom:14}}>
                  SANTO · CANONIZADO 27 ABR 2025
                </div>
                <div style={{fontSize:"0.88rem",color:"var(--pa2)",lineHeight:1.72,marginBottom:16}}>
                  Joven italiano, apasionado de la informática y la Eucaristía.
                  Creó el primer sitio web de milagros eucarísticos del mundo.
                  <br/>
                  <span style={{color:"var(--gold)",fontStyle:"italic"}}>
                    "La Eucaristía es mi autopista al Cielo."
                  </span>
                </div>
                <a href="https://www.miracolieucaristici.org/es/liste/list.html"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display:"inline-flex",alignItems:"center",gap:6,
                    fontFamily:"Cinzel,serif",fontSize:"0.6rem",letterSpacing:1.5,
                    color:"#7090D0",background:"rgba(100,130,200,0.1)",
                    border:"1px solid rgba(100,130,200,0.35)",borderRadius:"var(--r)",
                    padding:"8px 18px",textDecoration:"none",
                  }}>
                  ☉ MILAGROS EUCARÍSTICOS →
                </a>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
