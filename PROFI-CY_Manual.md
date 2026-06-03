# ✠ PROFI-CY — Manual de Usuario v1.0
### Interfaz Profética Bíblica · Corpus Multilingüe

---

## ¿Qué es PROFI-CY?

PROFI-CY es una herramienta de estudio bíblico profético que permite leer las Escrituras en **8 idiomas en paralelo** (Hebreo, Griego, Latín, Español, Inglés, Arameo), con análisis lingüístico, gematría y detección automática de profecías mesiánicas.

---

## REQUISITOS PARA ARRANCAR

Necesitás **dos terminales abiertas** en VS Code (botón `+`):

**Terminal 1 — API (backend):**
```
cd C:\Desarrollo\Web\proficy\api
python server.py
```
Verás: `✠ PROFI-CY API corriendo en http://localhost:5050`

**Terminal 2 — App (frontend):**
```
cd C:\Desarrollo\Web\proficy-app
npm start
```
Se abre solo en: `http://localhost:3000`

> ⚠ La Terminal 1 debe estar siempre corriendo mientras usás la app.

---

## LAS 6 PESTAÑAS PRINCIPALES

### ✠ PARALELO
Muestra un versículo en **todas las versiones disponibles** simultáneamente.

**Cómo usarlo:**
1. Elegí el libro en el selector de la barra superior
2. Escribí el capítulo y versículo
3. Hacé clic en **VER →** o presioná Enter
4. Usá **◀ ▶** para navegar versículo por versículo

**Qué ves en cada tarjeta:**
- Punto de color = idioma (rojo=hebreo, azul=griego, verde=latín, dorado=español)
- Código de versión (BHS, LXX, VUL, JER, etc.)
- El texto en el idioma original o traducción
- Cantidad de palabras y valor gematrístico (si aplica)

**Catena Aurea:** si aparece un recuadro rojo oscuro abajo, es el comentario de **Santo Tomás de Aquino** citando a los Padres de la Iglesia sobre ese versículo.

---

### 📖 LECTOR
Lee cualquier libro de corrido, capítulo por capítulo con scroll.

**Cómo usarlo:**
1. Elegí el libro y la versión en los selectores superiores
2. Usá la fila de números para saltar a cualquier capítulo
3. Usá **◀ ▶** para pasar al capítulo anterior/siguiente
4. Hacé scroll para leer el capítulo completo

**Profecías resaltadas:**
- Los versículos proféticos aparecen con el **número en rojo suave**
- A la derecha del versículo aparece una etiqueta `✠ Nombre de la profecía`
- Hacé clic en cualquier versículo para verlo en vista paralela

**Versiones disponibles:**
| Código | Versión | Idioma |
|--------|---------|--------|
| JER | Biblia de Jerusalén | Español |
| RVR | Reina-Valera | Español |
| RV60S | Reina-Valera 1960 con Strong | Español |
| VUL | Vulgata de San Jerónimo | Latín |
| LXX | Septuaginta | Griego Koiné |
| BHS | Biblia Hebraica Stuttgartensia | Hebreo |
| KJV | King James Version | Inglés |
| PES | Peshita | Arameo |

---

### 𝔔 INTERLINEAL
Muestra cada palabra del original con su **transliteración, pronunciación y número Strong**.

**Cómo usarlo:**
1. Primero navegá a un versículo en la pestaña PARALELO
2. Hacé clic en **𝔔 VER INTERLINEAL** o la pestaña directamente
3. Elegí el modo: **עברית HEBREO / ΕΛΛΗΝ GRIEGO / LAT LATÍN**
4. Hacé clic en cualquier palabra para ver su definición Strong

**Qué muestra cada bloque de palabra:**
```
┌─────────────────┐
│  בְּרֵאשִׁית     │ ← Texto original
│  bᵊrēšîṯ        │ ← Transliteración académica
│  b-r-sh-it      │ ← Pronunciación simplificada
│  SUBS.F.SG.A    │ ← Análisis morfológico
│  H7225          │ ← Número Strong (clickeable)
└─────────────────┘
```

**Guía de pronunciación:** hacé clic en `📖 GUÍA DE PRONUNCIACIÓN` al final del interlineal para ver la tabla completa de letras.

---

### GUÍA RÁPIDA DE PRONUNCIACIÓN HEBREA

| Letra | Nombre | Pronunciación |
|-------|--------|---------------|
| א | Alef | (silencio/oclusiva) |
| ב | Bet | b / v |
| ג | Guímel | g |
| ד | Dálet | d |
| ה | He | h |
| ו | Vav | v / w |
| ז | Zayin | z |
| ח | Jet | jh (gutural fuerte) |
| ט | Tet | t |
| י | Yod | y |
| כ/ך | Kaf | k / kh |
| ל | Lámed | l |
| מ/ם | Mem | m |
| נ/ן | Nun | n |
| ס | Sámej | s |
| ע | Ayin | (gutural suave) |
| פ/ף | Pe | p / f |
| צ/ץ | Tsadí | ts |
| ק | Qof | q (k velar) |
| ר | Resh | r |
| ש | Shin | sh / s |
| ת | Tav | t |

**Vocales (Nikkud):**
- ַ (pataj) = a
- ֵ (tsere) = e
- ִ (jiriq) = i
- ֹ (jolam) = o
- ּ (shuruq) = u
- ְ (shva) = e breve o silencio

---

### GUÍA RÁPIDA DE PRONUNCIACIÓN GRIEGA KOINÉ

| Letra | Pronunciación | Ejemplo |
|-------|---------------|---------|
| α | a | alfa |
| β | b | beta |
| γ | g / ng | gamma |
| δ | d | delta |
| ε | e breve | épsilon |
| ζ | dz | dzeta |
| η | e larga | eta |
| θ | th | théta |
| ι | i | iota |
| κ | k | kappa |
| λ | l | lambda |
| μ | m | mu |
| ν | n | nu |
| ξ | ks | xi |
| ο | o breve | ómicron |
| π | p | pi |
| ρ | r | ro |
| σ/ς | s | sigma |
| τ | t | tau |
| υ | y / u | ípsilon |
| φ | ph / f | phi |
| χ | kh / j | ji |
| ψ | ps | psi |
| ω | o larga | omega |

**Diptongos frecuentes:**
- αι = ai · οι = oi · ει = ei · αυ = af/av · ευ = ef/ev

---

### 🔍 BUSCAR
Búsqueda full-text en cualquier versión.

**Cómo usarlo:**
1. Escribí la palabra en el campo de búsqueda del header
2. Elegí la versión en el selector (JER, RVR, LXX, VUL...)
3. Presioná **BUSCAR** o Enter
4. Hacé clic en cualquier resultado para verlo en paralelo

**Consejo:** para buscar en griego o hebreo, tipeá la palabra con el teclado del sistema o copiá y pegá.

---

### 🔢 GEMATRÍA
Calcula el valor numérico de palabras en hebreo o griego.

**Cómo usarlo:**
1. Escribí una palabra en hebreo o griego
2. Presioná **CALCULAR** o Enter
3. Verás el valor total y el Mispar Katan (reducido)

**Valores notables pre-cargados:**
| Valor | Significado |
|-------|-------------|
| 26 | YHWH (יהוה) — el Nombre |
| 86 | Elohim (אלהים) |
| 358 | Mashiach (משיח) — Mesías |
| 386 | Yeshua (ישוע) — Jesús |
| 65 | Adonai (אדני) |
| 611 | Torah (תורה) |
| 376 | Shalom (שלום) |
| 888 | Iēsoûs (Ἰησοῦς) en griego |

---

### 📊 CORPUS
Estadísticas de la base de datos cargada.

Muestra el total de versículos, palabras indexadas, definiciones Strong y entradas de diccionario disponibles en el corpus local.

---

## PANEL LATERAL DERECHO

### Números Strong (al ver un versículo con BHS o LXX)
- Aparecen automáticamente los Strong del versículo
- Hacé clic en cualquiera para ver la **definición completa** del Multiléxico (Strong + Chávez + Vine + Tuggy + Swanson)
- Ver también todas las ocurrencias en el corpus

### Profecías rápidas
- Acceso directo a las 10 profecías mesiánicas clave
- Clic = va directo al versículo en vista paralela

### Índice lateral izquierdo
- Lista rápida de profecías y libros
- El libro/profecía activo se resalta en dorado

---

## PROFECÍAS MESIÁNICAS INCLUIDAS

El lector resalta automáticamente estas profecías:

| Referencia | Contenido |
|------------|-----------|
| Gn 3:15 | Protoevangelio — primera profecía |
| Is 7:14 | La Virgen concebirá · Parthénos |
| Is 9:6 | Hijo nos es dado · Emmanuel |
| Is 11:1 | Renuevo de Jesé |
| Is 40:3 | Voz que clama en el desierto |
| Is 53:1-12 | El Siervo Sufriente completo |
| Miq 5:2 | Nacimiento en Belén |
| Zac 9:9 | Rey sobre un asno |
| Zac 12:10 | Mirarán al que traspasaron |
| Dn 9:25-26 | Las 70 semanas · Cronología |
| Sal 22:1-18 | Abandono, escarnio, traspasaron |
| Sal 110:1,4 | Señor a mi Señor · Melquisedec |
| Jr 31:15 | Raquel llora sus hijos |
| Jr 31:31 | La Nueva Alianza |
| Os 11:1 | De Egipto llamé a mi Hijo |

---

## CORPUS DISPONIBLE

| Versión | Libros | Versículos | Idioma |
|---------|--------|-----------|--------|
| BHS | 39 (AT) | 23,213 | Hebreo masorético |
| LXX | 39 (AT) | 22,842 | Griego Koiné + Strong |
| VUL | 73 | 31,085 | Latín Clásico |
| JER | 73 | 35,391 | Español católico |
| RVR | 66 | 31,102 | Español |
| RV60S | 66 | 31,102 | Español + Strong |
| KJV | 66 | 31,102 | Inglés |
| PES | 27 (NT) | 7,801 | Arameo |
| **TOTAL** | — | **213,271** | **8 idiomas** |

**Referencias adicionales:**
- 14,142 definiciones Strong en español (Multiléxico completo)
- 819 entradas de la Catena Aurea (Santo Tomás + Padres)
- 350 entradas del Diccionario de Patrística (s. I-VI)
- 3,209 artículos de la Enciclopedia Católica

---

## SOLUCIÓN DE PROBLEMAS

**"Sin conexión con API"**
→ Verificá que `python server.py` esté corriendo en la Terminal 1.
→ Abrí `http://localhost:5050/api/health` en el navegador para confirmar.

**Error de MetaMask al abrir**
→ Es normal. MetaMask (extensión de Chrome) se inyecta en todas las páginas.
→ No afecta la app. Cerrá el popup y continuá.

**Versículos que no aparecen**
→ Algunos libros deuterocanónicos solo están en JER y VUL.
→ La BHS y LXX solo tienen el AT protocanónico (39 libros).

**La app carga pero está en blanco**
→ Abrí la consola del navegador (F12) y verificá el error.
→ Asegurate de haber reemplazado los archivos `src/` completos.

---

## CARPETAS DEL PROYECTO

```
C:\Desarrollo\Web\
├── proficy\
│   ├── db\
│   │   └── proficy.sqlite    ← Base de datos (369 MB)
│   └── api\
│       └── server.py         ← API Flask (Terminal 1)
└── proficy-app\
    ├── src\
    │   ├── App.js            ← App principal
    │   ├── Reader.js         ← Lector continuo
    │   ├── Interlinear.js    ← Vista interlineal
    │   └── index.css         ← Estilos
    └── package.json
```

---

*✠ Ad Maiorem Dei Gloriam · PROFI-CY v1.0 · 2026*
*Interfaz Profética Bíblica · Corpus Multilingüe*
