import re
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Singlish — Sinhala written in Latin/English letters
# ---------------------------------------------------------------------------
_SINGLISH_WORDS = [
    # Pronouns
    "mama", "oya", "oyala", "eya", "eyala", "api", "apita", "oyata", "mata",
    "mage", "oge", "ape", "meka", "oka", "eka", "mewa", "owa", "ewa",
    # Greetings / expressions
    "ayubowan", "bohoma", "sthuthi", "isthuthy", "subha", "kamak", "nehe",
    "honda", "naraka", "lassana", "wadiya", "tikak", "podi", "periya",
    # Common verbs (base & inflections)
    "karanna", "karanawa", "karanawada", "karapan", "kala", "kala",
    "ganna", "gaththey", "gaanawa", "genahapan",
    "denna", "denawa", "denapan", "dunnada",
    "balanna", "balanawa", "balapan",
    "kanna", "kanawa", "kaapan",
    "bonawa", "bonna", "biccada",
    "yanna", "yanawa", "gihilla",
    "enna", "enawa", "aawa",
    "innawa", "hitinnawa", "innawada",
    "hadanna", "hadanawa", "hadapan",
    "thiyanawa", "thiyenawa", "thibbe",
    "dannawa", "danna", "dannawada",
    "hithanawa", "hithanna", "hithuwa",
    "arinna", "arinawa",
    "kiyanawa", "kiyanna", "kiwwa",
    "ahanawa", "ahanna",
    "pennawa", "penna",
    "adanna", "adanawa",
    "gahanawa", "gahanna",
    "wenna", "wenawa", "wuna",
    "kanawada", "yanawada", "enawada",
    # Question words
    "mokakda", "mokakd", "monawada", "mokadd",
    "koheda", "kohedada", "kohomada", "kohoma",
    "kawda", "kavuda", "kavuruda",
    "kiyada", "kiyadda", "kaada",
    "ayi", "ayida", "aeyi",
    "witage", "witharada",
    # Common nouns
    "gedara", "gedarata", "gedarakin",
    "amma", "thaaththa", "akka", "malli", "nangi", "ayya", "loku",
    "kade", "kadeta",
    "bath", "paan", "watura", "kiri",
    "dora", "jaala", "pata",
    "handiya", "patha", "mawatha",
    "waradiya", "welaawa",
    # Particles / connectors
    "neda", "newada", "nehe",
    "kiyala", "kiyanna",
    "wage", "wagei", "waggei",
    "witha", "nisa", "nisan",
    "athin", "athar", "ethin",
    "passe", "issella", "thama",
    "thanama", "therama",
    "ehema", "oyata", "methanin",
    # Intensifiers / misc
    "hari", "ahala", "daen", "ithin", "ohe", "oya",
]

_SINGLISH_SUFFIXES = re.compile(
    r'[a-z]+(nawa|nna|kala|kapan|wida|neda|nawada|pela)\b'
)

# ---------------------------------------------------------------------------
# Tanglish — Tamil written in Latin/English letters
# ---------------------------------------------------------------------------
_TANGLISH_WORDS = [
    # Pronouns
    "naan", "nee", "avan", "aval", "naanga", "neenga", "avanga",
    "enakku", "unnakku", "avanukkku", "avanukku", "avalukku", "engalukku", "ungalukku",
    "ennoda", "unnoda", "engaloda",
    # Greetings / expressions
    "vanakkam", "nandri", "manni", "mannichuko", "saapdingala",
    "epdi", "eppadi", "epdirukkinga", "nallairukinga",
    "seri", "serida", "okay", "aama", "aamaa",
    # Common verbs (base & inflections — polite/neutral forms only)
    "pannuven", "pannurom", "pannala", "pannunga", "panniten",
    "solren", "solluven", "solluvom", "sollunga", "sonna", "sonnen",
    "paarkuren", "patten", "paakka", "parunga", "parken",
    "vaaren", "vandhen", "varinga", "vango", "varuvom",
    "pogiren", "ponen", "pogalam", "pongo",
    "tharuven", "thaa", "kudupom", "kuduthen",
    "vaanguren", "vaangi", "vaangiten",
    "saapiduven", "saapithen", "saapidunga", "saapiduvom",
    "kudikuren", "kudichen", "kudiuinga",
    "padikuren", "padichen", "padiuinga",
    "theduven", "theduren", "thedunga",
    "ketukuven", "kelu", "ketten",
    "parkuren", "paarom", "paarten",
    "odi", "oduven", "oditen",
    "iruku", "irukku", "irukken", "irundhen",
    "illa", "illai", "illadhu",
    "irukkinga", "irukkeengala",
    # Question words
    "enna", "ennanu", "ennanda",
    "enga", "engey", "engeda",
    "yaaru", "yaar", "yaaruda",
    "eppadi", "epdi", "eppadida",
    "eppo", "eppoda",
    "yen", "yenda", "yenda",
    "evlo", "evalavo", "evlovida",
    "edhuku", "edhukkaga",
    # Common nouns
    "veedu", "veetu", "veetukku",
    "kadai", "kadaikku",
    "tanni", "thanni",
    "paal", "saapadu", "sapadu",
    "paazham", "pazham",
    # Particles / connectors / intensifiers
    "romba", "rombave",
    "konjam", "konjame",
    "nalla", "nallaa",
    "ketta",
    "periya", "periyaa",
    "chinna", "sinna",
    "vera", "veraya",
    "ingey", "inga", "ingeda",
    "anga", "angey",
    "appuram", "approm", "appromda",
    "indha", "itha", "ithuvum",
    "antha", "atha", "athuvum",
    "inniku", "inniki", "innikku",
    "naalaiku", "naaliku", "naalaikkku",
    "nethu", "nethukku",
    "ippo", "ippove", "ippovum",
    "appo", "appovum",
    "theriyum", "theriyuthu", "theriyuma",
    "theriyala", "theriyathu",
    "mudiyum", "mudiyuma",
    "mudiyathu", "mudiyaathu",
    "vendam", "venda",
    "venum", "venumo", "venumaa",
    "kedaikkuthu", "kedaikkum", "kedaikuthu",
    "kedaiyathu", "kedaikaathu",
    # Misc common (only neutral/polite address terms)
    "machan", "macha",
    "thambi", "akka", "anna", "amma", "appa",
]

_TANGLISH_SUFFIXES = re.compile(
    r'[a-z]+(ukku|ingala|ingen|unga|inga|kku|nga)\b'
)

# Build compiled patterns from word lists
def _build_pattern(words):
    escaped = [re.escape(w) for w in sorted(set(words), key=len, reverse=True)]
    return re.compile(r'\b(' + '|'.join(escaped) + r')\b', re.IGNORECASE)

_SINGLISH_PATTERN = _build_pattern(_SINGLISH_WORDS)
_TANGLISH_PATTERN = _build_pattern(_TANGLISH_WORDS)


def _score(text: str) -> tuple[int, int]:
    """Return (singlish_score, tanglish_score) for a Latin-script message."""
    singlish = len(_SINGLISH_PATTERN.findall(text)) + len(_SINGLISH_SUFFIXES.findall(text))
    tanglish = len(_TANGLISH_PATTERN.findall(text)) + len(_TANGLISH_SUFFIXES.findall(text))
    return singlish, tanglish


def detect_language(text: str, selected: str = "") -> str:
    """
    Detect language of input text.

    Returns one of: english, sinhala, tamil, singlish, tanglish

    Args:
        text:     The user's message.
        selected: Language the user chose in the UI (english/sinhala/tamil/singlish/tanglish).
                  Used to bias detection when script is ambiguous.
    """
    if not text or not isinstance(text, str):
        return selected or "english"

    # ── Native script detection (highest priority) ──────────────────────────
    sinhala_chars = len(re.findall(r'[඀-෴]', text))
    tamil_chars   = len(re.findall(r'[஀-௿]', text))

    if sinhala_chars > 0 or tamil_chars > 0:
        lang = "sinhala" if sinhala_chars >= tamil_chars else "tamil"
        logger.debug(f"Native script detected: {lang} (S={sinhala_chars} T={tamil_chars})")
        return lang

    # ── Latin script — score against both word lists ────────────────────────
    sin_score, tan_score = _score(text)

    # If user selected a South Asian language, bias toward its romanised form
    # even when score is 0 (they might type in casual short phrases not in list)
    if selected in ("sinhala", "singlish"):
        sin_score += 1
    elif selected in ("tamil", "tanglish"):
        tan_score += 1

    if sin_score == 0 and tan_score == 0:
        result = "english"
    elif sin_score >= tan_score:
        result = "singlish"
    else:
        result = "tanglish"

    logger.debug(
        f"Language detected: {result} "
        f"(selected={selected!r}, sin={sin_score}, tan={tan_score})"
    )
    return result
