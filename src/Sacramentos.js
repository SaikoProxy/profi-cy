// PROFI-CY · Sacramentos.js — copia exacta desde proficy-app
// Los 7 Sacramentos — catequesis católica completa con base bíblica
import { useState } from "react";

const SACRAMENTOS = [
  { id:1, nombre:"BAUTISMO", latin:"Baptismus", icono:"💧", color:"#4080C0",
    definicion:"El Bautismo es el primero y más necesario de los sacramentos. Por él somos liberados del pecado original, incorporados a Cristo y a su Iglesia, y hechos hijos adoptivos de Dios.",
    institucion:"Mt 28:19 — 'Id y haced discípulos a todas las naciones, bautizándolos en el nombre del Padre, del Hijo y del Espíritu Santo.'",
    escritura:[{ref:"Jn 3:5",text:"El que no naciere de agua y de Espíritu, no puede entrar en el reino de Dios."},{ref:"Rm 6:3-4",text:"¿No sabéis que todos los que hemos sido bautizados en Cristo Jesús, hemos sido bautizados en su muerte?"},{ref:"Hch 2:38",text:"Convertíos y bautícese cada uno de vosotros en el nombre de Jesucristo."}],
    efectos:["Perdón del pecado original y de todos los pecados personales","Nacimiento a la vida nueva en Cristo","Incorporación a la Iglesia, Cuerpo de Cristo","Recepción del Espíritu Santo","Carácter espiritual indeleble"],
    ministro:"Obispo, presbítero o diácono. En caso de necesidad, cualquier persona con la debida intención.",
    materia:"Agua natural. Triple infusión o inmersión.",
    forma:"'Yo te bautizo en el nombre del Padre, y del Hijo, y del Espíritu Santo.'",
    cic:"CIC 1213-1284",
    imagen:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Baptism_of_Christ%2C_by_Piero_della_Francesca.jpg/400px-Baptism_of_Christ%2C_by_Piero_della_Francesca.jpg",
    imagen_desc:"Bautismo de Cristo · Piero della Francesca (1448-1450)" },
  { id:2, nombre:"CONFIRMACIÓN", latin:"Confirmatio", icono:"🕊️", color:"#C08020",
    definicion:"La Confirmación perfecciona la gracia bautismal. Da el Espíritu Santo para arraigarnos más profundamente en la filiación divina y nos incorpora más firmemente a Cristo.",
    institucion:"Hch 8:14-17 — Los apóstoles impusieron las manos sobre los bautizados y recibieron el Espíritu Santo.",
    escritura:[{ref:"Hch 2:1-4",text:"Fueron todos llenos del Espíritu Santo y comenzaron a hablar en otras lenguas."},{ref:"2Co 1:21-22",text:"El que nos confirma junto con vosotros en Cristo y el que nos ungió es Dios, que también nos selló."},{ref:"Is 11:2",text:"Reposará sobre él el Espíritu del Señor: espíritu de sabiduría e inteligencia."}],
    efectos:["Aumento y profundización de la gracia bautismal","Don pleno del Espíritu Santo con sus siete dones","Vínculo más perfecto con la Iglesia","Fortaleza para defender y difundir la fe","Carácter espiritual indeleble"],
    ministro:"El Obispo es el ministro ordinario. Puede delegar en presbíteros.",
    materia:"Crisma (aceite de oliva con bálsamo) consagrado por el Obispo.",
    forma:"'Recibe por esta señal el don del Espíritu Santo.'",
    cic:"CIC 1285-1321",
    imagen:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Confirmation_icon.jpg/400px-Confirmation_icon.jpg",
    imagen_desc:"Pentecostés · El Greco (1600)" },
  { id:3, nombre:"EUCARISTÍA", latin:"Eucharistia", icono:"✝️", color:"#C4922A",
    definicion:"La Eucaristía es la fuente y cumbre de la vida cristiana. Cristo está verdadera, real y sustancialmente presente bajo las especies del pan y del vino. Es el sacrificio de su Cuerpo y Sangre.",
    institucion:"Mt 26:26-28 — 'Tomad, comed, esto es mi cuerpo... Bebed de ella todos, porque esto es mi sangre de la Alianza.'",
    escritura:[{ref:"Jn 6:51-56",text:"Mi carne es verdadera comida y mi sangre es verdadera bebida. El que come mi carne y bebe mi sangre, permanece en mí y yo en él."},{ref:"1Co 11:23-26",text:"El Señor Jesús, la noche en que fue entregado, tomó el pan... Esto es mi cuerpo que se entrega por vosotros."},{ref:"Lc 24:35",text:"Ellos contaban lo que les había pasado en el camino y cómo le habían reconocido en la fracción del pan."}],
    efectos:["Unión íntima con Cristo","Perdón de los pecados veniales","Preservación de futuros pecados graves","Fortalecimiento de la caridad","Prenda de la gloria futura","Unidad del Cuerpo Místico"],
    ministro:"Solo el sacerdote válidamente ordenado.",
    materia:"Pan de trigo y vino de uva.",
    forma:"Las palabras de la consagración pronunciadas por el sacerdote in persona Christi.",
    cic:"CIC 1322-1419",
    imagen:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Da_Vinci_-_Last_Supper_restored.jpg/400px-Da_Vinci_-_Last_Supper_restored.jpg",
    imagen_desc:"La Última Cena · Leonardo da Vinci (1495-1498)" },
  { id:4, nombre:"PENITENCIA", latin:"Paenitentia", icono:"🙏", color:"#805080",
    definicion:"El sacramento de la Penitencia o Reconciliación perdona los pecados cometidos después del Bautismo mediante la absolución del sacerdote.",
    institucion:"Jn 20:22-23 — 'Recibid el Espíritu Santo. A quienes perdonéis los pecados, les quedan perdonados.'",
    escritura:[{ref:"Jn 20:23",text:"A quienes perdonéis los pecados, les quedan perdonados; a quienes se los retengáis, les quedan retenidos."},{ref:"Lc 15:20",text:"Cuando todavía estaba lejos, le vio su padre y, conmovido, corrió hacia él, se echó a su cuello y le besó."},{ref:"1Jn 1:9",text:"Si confesamos nuestros pecados, él es fiel y justo para perdonar nuestros pecados."}],
    efectos:["Perdón de los pecados mortales y veniales","Reconciliación con Dios y con la Iglesia","Paz y serenidad de conciencia","Fortaleza espiritual para la lucha","Remisión de la pena eterna"],
    ministro:"El sacerdote con jurisdicción (aprobación del Obispo).",
    materia:"Los actos del penitente: contrición, confesión, satisfacción.",
    forma:"'Yo te absuelvo de tus pecados en el nombre del Padre, y del Hijo y del Espíritu Santo.'",
    cic:"CIC 1422-1498",
    imagen:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Rembrandt_-_Return_of_the_Prodigal_Son.jpg/400px-Rembrandt_-_Return_of_the_Prodigal_Son.jpg",
    imagen_desc:"El Hijo Pródigo · Rembrandt (1668)" },
  { id:5, nombre:"UNCIÓN DE ENFERMOS", latin:"Unctio Infirmorum", icono:"🫒", color:"#608060",
    definicion:"La Unción de los Enfermos es el sacramento para los que están gravemente enfermos. Une al enfermo con la Pasión de Cristo para su bien y el de toda la Iglesia.",
    institucion:"Sant 5:14-15 — 'Llamad a los presbíteros de la Iglesia, que oren sobre el enfermo y le unjan con óleo en el nombre del Señor.'",
    escritura:[{ref:"Stg 5:14-15",text:"La oración de la fe salvará al enfermo y el Señor hará que se levante; y si hubiese cometido pecados, le serán perdonados."},{ref:"Mc 6:13",text:"Ungían con aceite a muchos enfermos y los curaban."},{ref:"Is 53:4",text:"Él tomó nuestras enfermedades y cargó con nuestras dolencias."}],
    efectos:["Gracia especial de fortaleza, paz y ánimo para soportar el sufrimiento","Unión con la Pasión de Cristo","Fortaleza contra las tentaciones del demonio","Perdón de los pecados si el enfermo no pudo confesarse","Recuperación de la salud si conviene a la salvación"],
    ministro:"Solo el sacerdote o el obispo.",
    materia:"Óleo de los enfermos bendecido por el Obispo.",
    forma:"'Por esta santa unción y por su bondadosa misericordia te ayude el Señor con la gracia del Espíritu Santo.'",
    cic:"CIC 1499-1532",
    imagen:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Nicolas_Poussin_-_The_Sacrament_of_Extreme_Unction.jpg/400px-Nicolas_Poussin_-_The_Sacrament_of_Extreme_Unction.jpg",
    imagen_desc:"Extremaunción · Nicolas Poussin (1640)" },
  { id:6, nombre:"ORDEN SAGRADO", latin:"Ordo", icono:"⛪", color:"#A04040",
    definicion:"El Orden Sagrado es el sacramento por el cual la misión confiada por Cristo a sus apóstoles continúa ejerciéndose en la Iglesia. Comprende tres grados: episcopado, presbiterado y diaconado.",
    institucion:"Lc 22:19 — 'Haced esto en memoria mía.' · 2Tm 1:6 — 'Reavives el don de Dios que está en ti por la imposición de mis manos.'",
    escritura:[{ref:"Heb 5:1",text:"Todo sumo sacerdote es tomado de entre los hombres y está puesto en favor de los hombres en lo que se refiere a Dios."},{ref:"1Tm 4:14",text:"No descuides el carisma que hay en ti, que se te dio mediante profecía con la imposición de manos del colegio de presbíteros."},{ref:"Mal 1:11",text:"En todo lugar se ofrece a mi nombre un sacrificio de incienso y una oblación pura."}],
    efectos:["Configuración con Cristo Sacerdote, Profeta y Rey","Carácter sacerdotal indeleble","Gracia especial del Espíritu Santo para el ministerio","Autoridad para actuar en nombre de Cristo (in persona Christi)"],
    ministro:"Solo el Obispo válidamente consagrado.",
    materia:"Imposición de manos del Obispo sobre la cabeza del ordenando.",
    forma:"Oración consecratoria propia de cada grado.",
    cic:"CIC 1536-1600",
    imagen:"https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Nicolas_Poussin_-_The_Sacrament_of_Ordination.jpg/400px-Nicolas_Poussin_-_The_Sacrament_of_Ordination.jpg",
    imagen_desc:"Ordenación · Nicolas Poussin (1647)" },
  { id:7, nombre:"MATRIMONIO", latin:"Matrimonium", icono:"💍", color:"#906030",
    definicion:"El Matrimonio es la alianza por la que un hombre y una mujer constituyen entre sí un consorcio íntimo de toda la vida, ordenado al bien de los cónyuges y a la generación y educación de la prole.",
    institucion:"Gn 2:24 — 'Por eso dejará el hombre a su padre y a su madre y se unirá a su mujer, y los dos serán una sola carne.'",
    escritura:[{ref:"Gn 2:24",text:"Por eso dejará el hombre a su padre y a su madre y se unirá a su mujer, y los dos serán una sola carne."},{ref:"Ef 5:25",text:"Maridos, amad a vuestras mujeres como Cristo amó a la Iglesia y se entregó a sí mismo por ella."},{ref:"Mt 19:6",text:"Ya no son dos, sino una sola carne. Lo que Dios ha unido, que no lo separe el hombre."}],
    efectos:["Vínculo conyugal perpetuo e indisoluble","Gracia para amarse con amor sobrenatural","Santificación mutua de los esposos","Gracia para recibir, educar y amar a los hijos","Imagen de la unión de Cristo con su Iglesia"],
    ministro:"Los propios esposos son ministros entre sí. El sacerdote o diácono asiste como testigo cualificado.",
    materia:"El consentimiento libre de los esposos.",
    forma:"Las palabras del consentimiento: 'Yo te recibo a ti como esposo/a y me entrego a ti, y prometo serte fiel...'",
    cic:"CIC 1601-1666",
    imagen:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Nicolas_Poussin_-_The_Sacrament_of_Marriage.jpg/400px-Nicolas_Poussin_-_The_Sacrament_of_Marriage.jpg",
    imagen_desc:"Matrimonio · Nicolas Poussin (1647)" },
];

export default function Sacramentos() {
  const [selected, setSelected] = useState(SACRAMENTOS[2]);
  const [section, setSection]   = useState("definicion");

  return (
    <div className="sac-wrap">
      <div className="sac-header">
        <div className="sac-title">✠ LOS SIETE SACRAMENTOS</div>
        <div className="sac-sub">Institución divina · Catecismo de la Iglesia Católica</div>
      </div>
      <div className="sac-selector">
        {SACRAMENTOS.map(s=>(
          <div key={s.id} className={`sac-chip${selected?.id===s.id?" sac-chip-active":""}`}
            style={selected?.id===s.id?{borderColor:s.color,background:`${s.color}22`}:{}}
            onClick={()=>{setSelected(s);setSection("definicion");}}>
            <span className="sac-chip-icon">{s.icono}</span>
            <span className="sac-chip-name">{s.nombre}</span>
          </div>
        ))}
      </div>
      {selected&&(
        <div className="sac-detail">
          <div className="sac-detail-head" style={{borderColor:selected.color}}>
            <div className="sac-detail-icon">{selected.icono}</div>
            <div>
              <div className="sac-detail-name" style={{color:selected.color}}>{selected.nombre}</div>
              <div className="sac-detail-latin">{selected.latin}</div>
              <div className="sac-detail-cic">{selected.cic}</div>
            </div>
            <div className="sac-img-wrap">
              <img src={selected.imagen} alt={selected.imagen_desc} className="sac-img"
                onError={e=>{e.target.style.display='none'}}/>
              <div className="sac-img-desc">{selected.imagen_desc}</div>
            </div>
          </div>
          <div className="sac-tabs">
            {[["definicion","DEFINICIÓN"],["escritura","ESCRITURA"],["teologia","TEOLOGÍA"]].map(([id,lbl])=>(
              <button key={id} className={`btn${section===id?" active":""}`} onClick={()=>setSection(id)}>{lbl}</button>
            ))}
          </div>
          {section==="definicion"&&(
            <div>
              <div className="sac-definicion">{selected.definicion}</div>
              <div className="sac-inst-label">✠ INSTITUCIÓN POR CRISTO</div>
              <div className="sac-inst">{selected.institucion}</div>
              <div className="sac-efectos-title">EFECTOS</div>
              <ul className="sac-efectos">
                {selected.efectos.map((e,i)=><li key={i} className="sac-efecto"><span className="sac-efecto-bullet">✠</span>{e}</li>)}
              </ul>
            </div>
          )}
          {section==="escritura"&&(
            <div>
              <div className="sac-inst-label">BASE BÍBLICA</div>
              {selected.escritura.map((v,i)=>(
                <div key={i} className="sac-verse">
                  <div className="sac-verse-ref" style={{color:selected.color}}>{v.ref}</div>
                  <div className="sac-verse-text">"{v.text}"</div>
                </div>
              ))}
            </div>
          )}
          {section==="teologia"&&(
            <div>
              <div className="sac-teo-grid">
                <div className="sac-teo-box"><div className="sac-teo-label">MINISTRO</div><div className="sac-teo-val">{selected.ministro}</div></div>
                <div className="sac-teo-box"><div className="sac-teo-label">MATERIA</div><div className="sac-teo-val">{selected.materia}</div></div>
              </div>
              <div className="sac-teo-box" style={{marginTop:10}}>
                <div className="sac-teo-label">FORMA (PALABRAS)</div>
                <div className="sac-teo-val sac-forma">"{selected.forma}"</div>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="sac-footer">
        <div className="sac-footer-title">ORDEN DE LOS SACRAMENTOS</div>
        <div className="sac-orden">
          {[{grupo:"INICIACIÓN CRISTIANA",items:["💧 Bautismo","🕊️ Confirmación","✝️ Eucaristía"]},
            {grupo:"CURACIÓN",items:["🙏 Penitencia","🫒 Unción de Enfermos"]},
            {grupo:"SERVICIO A LA COMUNIÓN",items:["⛪ Orden Sagrado","💍 Matrimonio"]}
          ].map((g,i)=>(
            <div key={i} className="sac-grupo">
              <div className="sac-grupo-label">{g.grupo}</div>
              {g.items.map((item,j)=><div key={j} className="sac-grupo-item">{item}</div>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
