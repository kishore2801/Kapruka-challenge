import re
import logging

logger = logging.getLogger(__name__)

def detect_language(text: str) -> str:
    """
    Detect the language of input text.
    
    Supports:
    - Sinhala (Native script)
    - Tamil (Native script)
    - Shinglish (Sinhala transliterated in Latin script)
    - Tanglish (Tamil transliterated in Latin script)
    - English (Default fallback)
    """
    if not text or not isinstance(text, str):
        return "english"

    text_lower = text.lower()
    
    # 1. Native Script Detection (Highest Priority)
    sinhala_unicode = len(re.findall(r'[\u0D80-\u0DF4]', text))
    tamil_unicode = len(re.findall(r'[\u0B80-\u0BFF]', text))
    
    if sinhala_unicode > 0 or tamil_unicode > 0:
        return "sinhala" if sinhala_unicode >= tamil_unicode else "tamil"
        
    # 2. Transliteration Detection (Latin Script)
    # Common Shinglish keywords/markers
    shinglish_words = [
        r'\b(oy[aa]|m[aa]m[aa]|oy[aa]l[aa]|ey[aa]|mey[aa])\b',  # Pronouns (oya, mama, oyala, eya)
        r'\b(kohom[aa]d[aa]|mokadd[aa]|monaw[aa]d[aa])\b',       # Questions (kohomada, mokadda)
        r'\b(karann[aa]|kann[aa]|bonn[aa]|yann[aa])\b',           # Verbs (karanna, kanna)
        r'\b(n[ae]h[ae]|n[ae]|ow|puluw[aa]n|b[ae]h[ae])\b',      # Basics (neha, ow, puluwan, behe)
        r'\b(sthuthiy|subh[aa])\b',                             # Greetings (sthuthiy, subha)
        r'[aeiou]nn[aa]\b|[aeiou]ll[aa]\b'                     # Common suffixes (-nna, -lla)
    ]
    
    # Common Tanglish keywords/markers
    tanglish_words = [
        r'\b(en[aa]|un[aa]|avargal|naan|nee|avan|aval)\b',      # Pronouns (naan, nee)
        r'\b(eppadi|enna|yen|edhuku|yepdi)\b',                  # Questions (eppadi, enna, yen)
        r'\b(poda|vaada|vango|pongo|iruku|illai|illa)\b',       # Verbs/Basics (poda, iruku, illa)
        r'\b(vanakkam|nandri)\b',                               # Greetings (vanakkam, nandri)
        r'ukk[au]g[aa]\b|g[aa]l\b'                              # Common suffixes (-ukkaga, -gal)
    ]

    shinglish_pattern = re.compile('|'.join(shinglish_words))
    tanglish_pattern = re.compile('|'.join(tanglish_words))
    
    shinglish_matches = len(shinglish_pattern.findall(text_lower))
    tanglish_matches = len(tanglish_pattern.findall(text_lower))
    
    # Determine dominant Latin-based language
    if shinglish_matches > 0 or tanglish_matches > 0:
        if shinglish_matches >= tanglish_matches:
            language = "shinglish"
        else:
            language = "tanglish"
    else:
        # Default fallback if no transliteration markers are found
        language = "english"
        
    logger.debug(
        f"Detection: {language} "
        f"(Native S:{sinhala_unicode} T:{tamil_unicode}) "
        f"(Latin Sh:{shinglish_matches} Ta:{tanglish_matches})"
    )
    
    return language