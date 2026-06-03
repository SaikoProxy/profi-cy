# -*- coding: utf-8 -*-
"""
bhs_parser.py
Parser interlineal para texto BHS (Biblia Hebraica Stuttgartensia Enhanced)
proveniente de una DB e-Sword SQLite (modulo BHSE+++), importado a proficy.sqlite.

FORMATO REAL EN proficy.sqlite (verses.text con version_code='BHS'):
Texto APLANADO, una palabra tras otra, con campos separados por U+200e (LRM):

    HEBREO \u200e TRANSLIT \u200e LEMA \u200e GLOSS_EN \u200e H####+LEXICON  HEBREO_2 \u200e ...

donde:
  - el ultimo campo de cada palabra (H#### + lexicon BDB/TWOT/GES) trae PEGADO
    el hebreo de la palabra siguiente (sin separador), y
  - los procliticos (prefijos como  לְ / הַ / וְ ) tienen Strong = H0 (sin Strong real).

Tambien soporta el formato HTML original del .bbli (celdas <td> con <heb>/<blu>/
<red>/<num>) por si algun dia se reimporta el crudo.

NOTA: la DB NO contiene morfologia (VERB.QAL.IMPF...). Por eso los campos
'morph' y 'morph_es' NO se incluyen en el output (decision del proyecto).

Salida: lista de dicts:
    {hebrew, hebrew_clean, translit, strong, es, gloss_en, pronunc}
"""

import re
import html
import unicodedata

# ---------------------------------------------------------------------------
# 1) RANGOS UNICODE HEBREOS
# ---------------------------------------------------------------------------
_HE_LETTER_MIN = 0x05D0   # letras base hebreas (incl. finales) U+05D0..U+05EA
_HE_LETTER_MAX = 0x05EA


def _clean_hebrew(hebrew):
    """hebrew_clean: solo letras-base; quita nikkud, cantilacion, maqaf, sof pasuq."""
    return "".join(c for c in hebrew if _HE_LETTER_MIN <= ord(c) <= _HE_LETTER_MAX)


# ---------------------------------------------------------------------------
# 2) PRONUNCIACION SILABICA (para no-hebraistas)
#    La translit de la DB YA trae el acento marcado:
#      ˈ (U+02C8) = tonica primaria, ˌ (U+02CC) = secundaria.
#    Ambas se colocan ANTES de la silaba acentuada. Las usamos para saber
#    cual silaba va en MAYUSCULAS, y luego las quitamos.
# ---------------------------------------------------------------------------
_STRESS_PRIMARY = "\u02C8"    # ˈ
_STRESS_SECONDARY = "\u02CC"  # ˌ

# Reduccion de signos academicos SBL -> fonetica simple para hispanohablantes
_PRON_REDUCE = {
    "ā": "a", "ē": "e", "ī": "i", "ō": "o", "ū": "u",
    "ă": "a", "ĕ": "e", "ŏ": "o", "ᵃ": "a", "ᵉ": "", "ᵒ": "o",
    "î": "i", "ê": "e", "ô": "o", "û": "u",
    "ḵ": "j", "ḡ": "g", "ḏ": "d", "ḇ": "v", "ṯ": "t", "p̄": "f",
    "ḥ": "j", "ṭ": "t", "ṣ": "ts", "š": "sh", "ś": "s",
    "ʾ": "", "ʿ": "", "ʔ": "", "ʕ": "",
}
_PRON_VOWELS = set("aeiou")


def _syllabify(s):
    """Divide cadena fonetica simple en silabas (preferencia silaba abierta)."""
    idx = [i for i, ch in enumerate(s) if ch in _PRON_VOWELS]
    if not idx:
        return [s] if s else []
    sylls, start = [], 0
    for k, vpos in enumerate(idx):
        if k == len(idx) - 1:
            sylls.append(s[start:])
        else:
            nextv = idx[k + 1]
            cons = nextv - vpos - 1
            end = vpos + 1 if cons <= 1 else vpos + 1 + (cons - 1)
            sylls.append(s[start:end])
            start = end
    return [x for x in sylls if x]


def _to_pronunc(translit_raw):
    """
    translit de la DB (con ˈ/ˌ) -> 'si-LA-bas' con tonica en MAYUSCULAS.
    Estrategia: localizar la posicion de la silaba tonica usando ˈ, reducir
    a fonetica simple, silabificar, y poner en mayuscula la silaba que contiene
    la vocal inmediatamente posterior a la marca de acento primario.
    """
    if not translit_raw:
        return ""

    # 1) Marcar la posicion de la tonica: indice de la 1ra vocal tras ˈ (o ˌ)
    stress_char_index = None
    pos = translit_raw.find(_STRESS_PRIMARY)
    if pos == -1:
        pos = translit_raw.find(_STRESS_SECONDARY)
    if pos != -1:
        # contar cuantas vocales (en la forma reducida) hay ANTES de esa marca
        before = translit_raw[:pos]
        red_before = before
        for k, v in _PRON_REDUCE.items():
            red_before = red_before.replace(k, v)
        red_before = "".join(ch for ch in red_before.lower() if ch.isalpha())
        stress_char_index = sum(1 for ch in red_before if ch in _PRON_VOWELS)

    # 2) Reducir toda la translit a fonetica simple (sin marcas de acento)
    s = translit_raw.replace(_STRESS_PRIMARY, "").replace(_STRESS_SECONDARY, "")
    for k, v in _PRON_REDUCE.items():
        s = s.replace(k, v)
    # Shva (ᵊ) que sobrevive suelto: si no quedo vocal, suena como 'e' breve
    # (ej. wᵊ -> "we", šᵊmô -> "shemo"); si ya hay vocal plena al lado, se elide.
    if "ᵊ" in s:
        s = re.sub(r"ᵊ(?=[bcdfghjklmnpqrstvwxyzñ])", "e", s)  # shva movil -> e
        s = s.replace("ᵊ", "")                                  # shva quiescente -> nada
    s = s.lower()
    # colapsar dobles consonantes (gemina) para no inflar silabas
    collapsed = []
    for ch in s:
        if collapsed and ch == collapsed[-1] and ch not in _PRON_VOWELS:
            continue
        collapsed.append(ch)
    s = "".join(ch for ch in collapsed if ch.isalpha())

    sylls = _syllabify(s)
    if not sylls:
        return ""

    # 3) Determinar que silaba contiene la vocal tonica (la N-esima vocal)
    target = len(sylls) - 1  # default: ultima (milra)
    if stress_char_index is not None:
        vcount = 0
        for si, syl in enumerate(sylls):
            vin = sum(1 for ch in syl if ch in _PRON_VOWELS)
            if stress_char_index < vcount + vin:
                target = si
                break
            vcount += vin
    sylls[target] = sylls[target].upper()
    return "-".join(sylls)


# ---------------------------------------------------------------------------
# 3) DICCIONARIO EN_ES (ingles -> espanol) — palabras frecuentes del AT.
#    Foco en verbos, sustantivos teologicos y particulas. Claves en minuscula.
# ---------------------------------------------------------------------------
EN_ES = {
    # --- Particulas / conectores ---
    "therefore": "por tanto", "behold": "he aquí", "lo": "he aquí",
    "now": "ahora", "then": "entonces", "and": "y", "but": "pero",
    "or": "o", "for": "porque", "because": "porque", "so": "así que",
    "thus": "así", "yet": "sin embargo", "also": "también",
    "indeed": "ciertamente", "surely": "ciertamente", "truly": "verdaderamente",
    "verily": "de cierto", "if": "si", "when": "cuando", "while": "mientras",
    "until": "hasta", "before": "antes", "after": "después",
    "above": "encima", "below": "debajo", "between": "entre",
    "among": "entre", "within": "dentro", "without": "sin",
    "with": "con", "from": "de", "to": "a", "in": "en", "into": "en",
    "out": "fuera", "upon": "sobre", "over": "sobre", "under": "bajo",
    "against": "contra", "toward": "hacia", "through": "a través de",
    "around": "alrededor", "beside": "junto a", "behind": "detrás",
    "as": "como", "like": "como", "according": "según",
    "not": "no", "no": "no", "never": "nunca", "nothing": "nada",
    "none": "ninguno", "neither": "ni", "nor": "ni",
    "yes": "sí", "all": "todo", "every": "cada", "each": "cada uno",
    "some": "algunos", "many": "muchos", "few": "pocos", "much": "mucho",
    "more": "más", "most": "la mayoría", "less": "menos", "very": "muy",
    "only": "solo", "even": "aun", "still": "todavía", "again": "otra vez",
    "here": "aquí", "there": "allí", "where": "donde", "whither": "adónde",
    "how": "cómo", "why": "por qué", "what": "qué", "who": "quién",
    "which": "cual", "whom": "a quién", "whose": "cuyo", "that": "que",
    "this": "este", "these": "estos", "those": "aquellos", "such": "tal",
    "lest": "no sea que", "though": "aunque", "moreover": "además",
    "wherefore": "por lo cual", "henceforth": "de aquí en adelante",
    "forever": "para siempre", "always": "siempre",

    # --- Verbos frecuentes ---
    "give": "dar", "gave": "dio", "given": "dado", "take": "tomar",
    "took": "tomó", "taken": "tomado", "make": "hacer", "made": "hizo",
    "do": "hacer", "did": "hizo", "done": "hecho", "say": "decir",
    "said": "dijo", "speak": "hablar", "spoke": "habló", "spoken": "hablado",
    "tell": "contar", "told": "contó", "call": "llamar", "called": "llamó",
    "cry": "clamar", "cried": "clamó", "shout": "gritar", "answer": "responder",
    "answered": "respondió", "ask": "pedir", "asked": "pidió",
    "go": "ir", "went": "fue", "gone": "ido", "come": "venir",
    "came": "vino", "bring": "traer", "brought": "trajo", "send": "enviar",
    "sent": "envió", "return": "volver", "returned": "volvió",
    "walk": "andar", "walked": "anduvo", "run": "correr", "flee": "huir",
    "fled": "huyó", "pursue": "perseguir", "rise": "levantarse",
    "rose": "se levantó", "arise": "levantarse", "stand": "estar de pie",
    "stood": "estuvo de pie", "sit": "sentarse", "sat": "se sentó",
    "dwell": "habitar", "dwelt": "habitó", "abide": "permanecer",
    "remain": "permanecer", "stay": "quedarse", "lie": "acostarse",
    "lay": "puso", "fall": "caer", "fell": "cayó", "fallen": "caído",
    "see": "ver", "saw": "vio", "seen": "visto", "look": "mirar",
    "watch": "vigilar", "hear": "oír",
    "heard": "oyó", "listen": "escuchar", "know": "conocer", "knew": "conoció",
    "known": "conocido", "understand": "entender", "remember": "recordar",
    "forget": "olvidar", "forgot": "olvidó", "think": "pensar",
    "believe": "creer", "trust": "confiar", "fear": "temer",
    "feared": "temió", "love": "amar", "loved": "amó", "hate": "odiar",
    "hated": "odió", "desire": "desear", "want": "querer", "wish": "desear",
    "seek": "buscar", "sought": "buscó", "find": "hallar", "found": "halló",
    "lose": "perder", "lost": "perdió", "keep": "guardar", "kept": "guardó",
    "guard": "guardar", "save": "salvar",
    "saved": "salvó", "deliver": "librar", "delivered": "libró",
    "redeem": "redimir", "redeemed": "redimió", "rescue": "rescatar",
    "help": "ayudar", "helped": "ayudó", "serve": "servir", "served": "sirvió",
    "worship": "adorar", "worshiped": "adoró", "praise": "alabar",
    "praised": "alabó", "bless": "bendecir", "blessed": "bendijo",
    "curse": "maldecir", "cursed": "maldijo", "pray": "orar",
    "prayed": "oró", "sacrifice": "sacrificar", "offer": "ofrecer",
    "offered": "ofreció", "sing": "cantar", "sang": "cantó",
    "rejoice": "alegrarse", "weep": "llorar", "wept": "lloró",
    "mourn": "lamentar", "judge": "juzgar", "judged": "juzgó",
    "rule": "gobernar", "reign": "reinar", "reigned": "reinó",
    "command": "mandar", "commanded": "mandó", "obey": "obedecer",
    "rebel": "rebelarse", "sin": "pecar", "sinned": "pecó",
    "transgress": "transgredir", "forgive": "perdonar", "forgave": "perdonó",
    "atone": "expiar", "cleanse": "limpiar", "purify": "purificar",
    "sanctify": "santificar", "consecrate": "consagrar", "anoint": "ungir",
    "anointed": "ungió", "create": "crear", "created": "creó",
    "form": "formar", "formed": "formó", "build": "edificar",
    "built": "edificó", "establish": "establecer", "plant": "plantar",
    "sow": "sembrar", "reap": "segar", "harvest": "cosechar",
    "eat": "comer", "ate": "comió", "eaten": "comido", "drink": "beber",
    "drank": "bebió", "feed": "alimentar", "fill": "llenar", "filled": "llenó",
    "empty": "vaciar", "pour": "derramar", "poured": "derramó",
    "wash": "lavar", "washed": "lavó", "open": "abrir", "opened": "abrió",
    "shut": "cerrar", "close": "cerrar", "break": "quebrar", "broke": "quebró",
    "destroy": "destruir", "destroyed": "destruyó", "kill": "matar",
    "killed": "mató", "slay": "matar", "slew": "mató", "smite": "herir",
    "smote": "hirió", "strike": "golpear", "struck": "golpeó",
    "wound": "herir", "heal": "sanar", "healed": "sanó", "die": "morir",
    "died": "murió", "dead": "muerto", "live": "vivir", "lived": "vivió",
    "alive": "vivo", "bear": "dar a luz", "bore": "dio a luz",
    "born": "nacido", "beget": "engendrar", "begat": "engendró",
    "grow": "crecer", "grew": "creció", "increase": "aumentar",
    "multiply": "multiplicar", "gather": "reunir", "gathered": "reunió",
    "scatter": "dispersar", "lead": "guiar", "led": "guió", "carry": "llevar",
    "carried": "llevó", "lift": "alzar", "lifted": "alzó", "raise": "levantar",
    "set": "poner", "put": "poner", "place": "colocar",
    "wait": "esperar", "hope": "esperar", "rest": "reposar", "rested": "reposó",
    "work": "trabajar", "labor": "trabajar",
    "sign": "señal", "wonder": "maravilla", "miracle": "milagro",
    "cut": "cortar", "tear": "rasgar", "burn": "quemar", "burned": "quemó",
    "kindle": "encender", "shine": "brillar", "appear": "aparecer",
    "appeared": "apareció", "hide": "esconder", "hid": "escondió",
    "reveal": "revelar", "show": "mostrar", "showed": "mostró",
    "teach": "enseñar", "taught": "enseñó", "learn": "aprender",
    "write": "escribir", "wrote": "escribió", "read": "leer",
    "count": "contar", "number": "contar", "measure": "medir",
    "weigh": "pesar", "swear": "jurar", "swore": "juró", "vow": "prometer",
    "test": "probar", "tempt": "tentar", "prove": "probar", "choose": "elegir",
    "chose": "eligió", "chosen": "elegido", "reject": "rechazar",
    "despise": "despreciar", "honor": "honrar", "glorify": "glorificar",
    "exalt": "exaltar", "humble": "humillar", "afflict": "afligir",
    "oppress": "oprimir", "comfort": "consolar", "strengthen": "fortalecer",
    "fight": "pelear", "fought": "peleó", "war": "guerrear", "conquer": "conquistar",
    "capture": "capturar", "captive": "cautivo", "free": "libertar",
    "pregnant": "encinta", "conceive": "concebir",

    # --- Sustantivos teologicos / frecuentes ---
    "god": "Dios", "lord": "Señor", "yahweh": "Yahvé", "jehovah": "Jehová",
    "god(s)": "Dios", "gods": "dioses", "yhwh": "SEÑOR (Yahvé)",
    "[object marker]": "—", "[obj marker]": "—", "[direct object marker]": "—",
    "beginning": "principio", "emptiness": "vacío", "void": "vacío",
    "deep": "abismo", "primeval ocean": "abismo", "psalm": "salmo",
    "pierce": "traspasar", "pierced": "traspasado", "bruise": "moler",
    "crush": "moler", "chastening": "castigo", "chastisement": "castigo",
    "rebellion": "rebelión", "rebellions": "rebeliones", "iniquities": "iniquidades",
    "shake": "agitar", "hover": "aletear", "pasture": "pasto",
    "shepherd": "pastor", "diminish": "faltar", "lack": "faltar",
    "king": "rey", "queen": "reina", "prince": "príncipe", "ruler": "gobernante",
    "priest": "sacerdote", "prophet": "profeta", "prophetess": "profetisa",
    "servant": "siervo", "slave": "esclavo", "master": "amo", "messenger": "mensajero",
    "angel": "ángel", "spirit": "espíritu", "soul": "alma", "heart": "corazón",
    "mind": "mente", "flesh": "carne", "body": "cuerpo", "blood": "sangre",
    "bone": "hueso", "hand": "mano", "arm": "brazo",
    "foot": "pie", "eye": "ojo", "ear": "oído", "mouth": "boca", "lip": "labio",
    "tongue": "lengua", "face": "rostro", "head": "cabeza", "hair": "cabello",
    "voice": "voz", "word": "palabra", "name": "nombre", "covenant": "pacto",
    "law": "ley", "commandment": "mandamiento", "statute": "estatuto",
    "judgment": "juicio", "ordinance": "ordenanza", "testimony": "testimonio",
    "truth": "verdad", "righteousness": "justicia", "justice": "justicia",
    "mercy": "misericordia", "kindness": "bondad", "grace": "gracia",
    "favor": "favor", "compassion": "compasión",
    "faithfulness": "fidelidad", "glory": "gloria", "majesty": "majestad",
    "holiness": "santidad", "salvation": "salvación", "deliverance": "liberación",
    "redemption": "redención", "peace": "paz",
    "joy": "gozo", "gladness": "alegría", "sorrow": "tristeza", "grief": "dolor",
    "wrath": "ira", "anger": "ira", "fury": "furor", "jealousy": "celo",
    "iniquity": "iniquidad", "transgression": "transgresión",
    "guilt": "culpa", "evil": "mal", "wickedness": "maldad", "abomination": "abominación",
    "offering": "ofrenda",
    "altar": "altar", "temple": "templo", "tabernacle": "tabernáculo",
    "sanctuary": "santuario", "ark": "arca", "tent": "tienda",
    "house": "casa", "home": "hogar", "city": "ciudad", "town": "pueblo",
    "village": "aldea", "gate": "puerta", "wall": "muro", "tower": "torre",
    "field": "campo", "land": "tierra", "earth": "tierra", "ground": "suelo",
    "world": "mundo", "heaven": "cielo", "heavens": "cielos", "sky": "cielo",
    "sea": "mar", "river": "río", "water": "agua", "waters": "aguas",
    "fountain": "fuente", "well": "pozo", "spring": "manantial",
    "mountain": "monte", "hill": "collado", "rock": "roca", "stone": "piedra",
    "dust": "polvo", "ashes": "ceniza", "fire": "fuego", "flame": "llama",
    "light": "luz", "darkness": "tinieblas", "sun": "sol", "moon": "luna",
    "star": "estrella", "stars": "estrellas", "day": "día", "night": "noche",
    "morning": "mañana", "evening": "tarde", "year": "año", "month": "mes",
    "week": "semana", "sabbath": "sábado", "time": "tiempo", "age": "edad",
    "tree": "árbol", "wood": "madera", "branch": "rama", "fruit": "fruto",
    "seed": "semilla", "grass": "hierba", "flower": "flor", "vine": "vid",
    "vineyard": "viña", "garden": "huerto", "wilderness": "desierto",
    "desert": "desierto", "wind": "viento", "breath": "aliento", "cloud": "nube",
    "rain": "lluvia", "dew": "rocío", "snow": "nieve", "storm": "tormenta",
    "man": "hombre", "men": "hombres", "woman": "mujer", "women": "mujeres",
    "young woman": "joven/virgen", "young.woman": "joven/virgen",
    "virgin": "virgen", "maiden": "doncella",
    "wife": "esposa", "husband": "esposo", "father": "padre", "mother": "madre",
    "son": "hijo", "daughter": "hija", "child": "niño", "children": "hijos",
    "brother": "hermano", "sister": "hermana", "people": "pueblo",
    "nation": "nación", "nations": "naciones", "tribe": "tribu",
    "family": "familia", "generation": "generación",
    "elder": "anciano", "youth": "joven", "old man": "anciano",
    "enemy": "enemigo", "foe": "adversario", "adversary": "adversario",
    "friend": "amigo", "neighbor": "prójimo", "stranger": "extranjero",
    "sojourner": "forastero", "widow": "viuda", "orphan": "huérfano",
    "poor": "pobre", "rich": "rico", "wise": "sabio", "fool": "necio",
    "wisdom": "sabiduría", "folly": "necedad", "knowledge": "conocimiento",
    "counsel": "consejo", "way": "camino", "path": "senda", "road": "camino",
    "deed": "obra", "thing": "cosa", "matter": "asunto",
    "battle": "batalla", "sword": "espada", "bow": "arco",
    "spear": "lanza", "shield": "escudo", "army": "ejército", "host": "ejército",
    "strength": "fuerza", "power": "poder", "might": "poderío", "victory": "victoria",
    "gold": "oro", "silver": "plata", "bronze": "bronce", "iron": "hierro",
    "money": "dinero", "wealth": "riqueza", "treasure": "tesoro", "bread": "pan",
    "wine": "vino", "oil": "aceite", "milk": "leche", "honey": "miel",
    "salt": "sal", "grain": "grano", "wheat": "trigo", "flock": "rebaño",
    "herd": "ganado", "sheep": "oveja", "lamb": "cordero", "goat": "cabra",
    "ox": "buey", "bull": "toro", "cattle": "ganado", "horse": "caballo",
    "donkey": "asno", "camel": "camello", "lion": "león", "bird": "ave",
    "fish": "pez", "serpent": "serpiente", "beast": "bestia", "animal": "animal",

    # --- Adjetivos frecuentes ---
    "good": "bueno", "bad": "malo", "great": "grande", "small": "pequeño",
    "little": "pequeño", "big": "grande", "high": "alto", "low": "bajo",
    "long": "largo", "short": "corto", "wide": "ancho", "deep": "profundo",
    "strong": "fuerte", "weak": "débil", "new": "nuevo", "old": "viejo",
    "young": "joven", "first": "primero", "last": "último", "holy": "santo",
    "clean": "limpio", "unclean": "inmundo", "pure": "puro", "righteous": "justo",
    "wicked": "impío", "true": "verdadero", "false": "falso", "faithful": "fiel",
    "beautiful": "hermoso", "fair": "hermoso", "precious": "precioso",
    "mighty": "poderoso", "everlasting": "eterno", "eternal": "eterno",
    "living": "viviente", "whole": "entero", "full": "lleno",
    "one": "uno", "two": "dos", "three": "tres", "thousand": "mil",

    # --- Pronombres / frecuentes en interlineal ---
    "he": "él", "she": "ella", "it": "ello", "they": "ellos",
    "i": "yo", "you": "tú", "we": "nosotros", "the": "el/la",
    "a": "un/una", "his": "su", "her": "su", "their": "su",
    "my": "mi", "your": "tu", "our": "nuestro", "him": "le", "them": "los",
}


def _gloss_to_es(gloss_en):
    """Traduce el gloss ingles; si no esta, devuelve el original."""
    if not gloss_en:
        return ""
    key = gloss_en.strip().lower()
    if key in EN_ES:
        return EN_ES[key]
    dotted = key.replace(" ", ".")
    if dotted in EN_ES:
        return EN_ES[dotted]
    spaced = key.replace(".", " ")
    if spaced in EN_ES:
        return EN_ES[spaced]
    first = key.split(" ")[0]
    if first in EN_ES:
        return EN_ES[first]
    return gloss_en  # fallback: dejar el ingles


# ---------------------------------------------------------------------------
# 4) EXTRACCION — soporta DOS formatos de la DB
# ---------------------------------------------------------------------------
# (A) FLAT (proficy.sqlite actual): campos separados por U+200e (marca LTR):
#       HEBREO \u200e TRANSLIT \u200e LEMA \u200e GLOSS \u200e H####+lexicon
#     donde el ultimo campo (strong+lexicon) trae PEGADO el hebreo de la
#     palabra siguiente. Es el formato que produjo el importador de e-Sword.
# (B) HTML (modulo .bbli original): celdas <td> con <heb>/<blu>/<red>/<num>.
#     Se mantiene por compatibilidad si algun dia se reimporta el crudo.
# ---------------------------------------------------------------------------
_HE_LETTER_MIN = 0x05D0
_HE_LETTER_MAX = 0x05EA
_RE_TD = re.compile(r"<td\b[^>]*>(.*?)</td>", re.DOTALL | re.IGNORECASE)
_RE_HEB = re.compile(r"<heb>(.*?)</heb>", re.DOTALL | re.IGNORECASE)
_RE_BLU = re.compile(r"<blu>(.*?)</blu>", re.DOTALL | re.IGNORECASE)
_RE_RED = re.compile(r"<red>(.*?)</red>", re.DOTALL | re.IGNORECASE)
_RE_NUM = re.compile(r"<num>\s*([Hh]\d+)\s*</num>", re.IGNORECASE)
_RE_ANYTAG = re.compile(r"<[^>]+>")
_RE_STRONG_HEAD = re.compile(r"^(H\d+)")
# Parte 'H####<lexicon>GES####<hebreo siguiente>' -> (strong+lex, hebreo siguiente)
_RE_SPLIT_STRONG = re.compile(r"^(H\d+[A-Za-z0-9.]*?(?:GES\d+)?)([\u05D0-\u05EA].*)$")
_INVISIBLES = ("\u200e", "\u200f", "\u200b", "\u202a", "\u202b", "\u202c",
               "\u202d", "\u202e", "\ufeff")


def _is_hebrew_char(c):
    return _HE_LETTER_MIN <= ord(c) <= _HE_LETTER_MAX


def _strip_invisibles(s):
    for ch in _INVISIBLES:
        s = s.replace(ch, "")
    return s


def _clean_field(s):
    """Limpia un campo: quita tags, entidades HTML, invisibles y espacios."""
    if s is None:
        return ""
    s = _RE_ANYTAG.sub("", s)
    s = html.unescape(s)
    s = _strip_invisibles(s)
    return s.strip()


def _build_word(hebrew, translit, gloss_en, strong):
    """Arma el dict final de una palabra, derivando campos calculados."""
    return {
        "hebrew":       hebrew,
        "hebrew_clean": _clean_hebrew(hebrew),
        "translit":     translit,
        "strong":       strong,
        "es":           _gloss_to_es(gloss_en),
        "gloss_en":     gloss_en,
        "pronunc":      _to_pronunc(translit),
    }


def _parse_flat(raw):
    """
    Formato FLAT (proficy.sqlite): campos separados por U+200e.
    Delimita cada palabra por el campo que contiene el Strong (H####),
    SIN asumir un numero fijo de campos (evita el efecto domino si una
    palabra tiene mas/menos campos que las demas).
    """
    raw = raw.replace("\u200f", "")
    fields = raw.split("\u200e")

    # 1) Partir los campos 'H####<lex>GES####<hebreo-siguiente>' en pedazos.
    #    Se usa un bucle while porque un mismo field puede traer VARIOS campos
    #    pegados (el strong+lexicon de una palabra + el hebreo de la siguiente,
    #    y a veces un proclitico H0 que pega directo al GES anterior).
    split_fields = []
    for f in fields:
        rest = f
        while True:
            m = _RE_SPLIT_STRONG.match(rest)
            if m:
                split_fields.append(m.group(1))   # strong + lexicon
                rest = m.group(2)                  # lo que sigue (hebreo + posible resto)
            else:
                split_fields.append(rest)
                break
    fs = [f.strip() for f in split_fields if f.strip()]

    # 2) Agrupar: una palabra se cierra cuando aparece el campo Strong (H####)
    words = []
    cur = []
    for f in fs:
        cur.append(f)
        if _RE_STRONG_HEAD.match(f):
            # cur tipico: [hebreo, translit, lema, gloss, strong+lex]
            # (algunos campos pueden faltar en proclíticos)
            hebrew = cur[0]
            translit = cur[1] if len(cur) >= 2 else ""
            gloss_en = cur[-2] if len(cur) >= 3 else ""
            m = _RE_STRONG_HEAD.match(f)
            strong = m.group(1) if (m and m.group(1) != "H0") else ""
            if hebrew and _is_hebrew_char(hebrew[0]):
                words.append(_build_word(hebrew, translit, gloss_en, strong))
            cur = []

    # 3) Cola sin Strong de cierre (rara, pero por las dudas)
    if cur and cur[0] and _is_hebrew_char(cur[0][0]):
        hebrew = cur[0]
        translit = cur[1] if len(cur) >= 2 else ""
        gloss_en = cur[-2] if len(cur) >= 3 else (cur[-1] if cur else "")
        words.append(_build_word(hebrew, translit, gloss_en, ""))

    return words


def _parse_html(raw):
    """Formato HTML (.bbli original): celdas <td> con tags e-Sword."""
    cells = _RE_TD.findall(raw)
    if not cells:
        return []
    words = []
    for cell in cells:
        heb_matches = _RE_HEB.findall(cell)
        if not heb_matches:
            continue
        hebrew = _clean_field(heb_matches[0])
        if not hebrew:
            continue
        blu = _RE_BLU.search(cell)
        translit = _clean_field(blu.group(1)) if blu else ""
        red = _RE_RED.search(cell)
        gloss_en = _clean_field(red.group(1)) if red else ""
        num = _RE_NUM.search(cell)
        strong = ""
        if num:
            s = num.group(1).upper()
            if s != "H0":
                strong = s
        words.append(_build_word(hebrew, translit, gloss_en, strong))
    return words


# ---------------------------------------------------------------------------
# 5) FUNCION PRINCIPAL
# ---------------------------------------------------------------------------
def parse_bhs_interlinear(text):
    """
    Parsea el texto interlineal BHS y devuelve una lista de dicts (una por
    palabra), en orden de lectura.

    Detecta automaticamente el formato:
      - Si hay celdas <td> -> parser HTML (.bbli crudo)
      - Si hay separadores U+200e -> parser FLAT (proficy.sqlite)

    Cada dict:
        {hebrew, hebrew_clean, translit, strong, es, gloss_en, pronunc}

    NOTA: la DB no contiene morfologia (VERB.QAL...), por eso no hay 'morph'.

    Casos borde: text None / vacio -> []
    """
    if not text or not str(text).strip():
        return []
    raw = str(text)

    if "<td" in raw.lower():
        return _parse_html(raw)
    if "\u200e" in raw or "\u200f" in raw:
        return _parse_flat(raw)
    # Sin marcadores conocidos: intentar flat igual (puede venir sin invisibles)
    return _parse_flat(raw)


# ---------------------------------------------------------------------------
# 6) Auto-test al ejecutar directamente
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import json, sys
    if len(sys.argv) > 1:
        import sqlite3
        db = sys.argv[1]
        bk = int(sys.argv[2]) if len(sys.argv) > 2 else 23
        ch = int(sys.argv[3]) if len(sys.argv) > 3 else 7
        vs = int(sys.argv[4]) if len(sys.argv) > 4 else 14
        con = sqlite3.connect(db)
        # soporta tabla 'verses' (proficy) o 'Bible' (.bbli)
        row = None
        try:
            row = con.execute("SELECT Scripture FROM Bible WHERE Book=? AND Chapter=? AND Verse=?",
                              (bk, ch, vs)).fetchone()
        except Exception:
            row = None
        result = parse_bhs_interlinear(row[0] if row else "")
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(parse_bhs_interlinear(None), ensure_ascii=False))
