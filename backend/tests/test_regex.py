import re

_ACCESSORY_WORDS = {
    'mould', 'mold', 'turntable', 'turner', 'turning', 'tray', 'tin', 'pan',
    'bakeware', 'cookware', 'cutter', 'dispenser', 'rack', 'board', 'tool',
    'equipment', 'machine', 'maker', 'utensil', 'spatula', 'whisk',
    'blender', 'mixer', 'grinder', 'accessories', 'accessory',
    'topper', 'toppers', 'decoration', 'decorations', 'figurine', 'figurines',
    'candle', 'candles', 'pick', 'picks', 'tag', 'tags', 'insert', 'label',
    'wrapper', 'wrappers', 'case', 'cases', 'liner', 'liners', 'stand',
    'tier', 'pedestal', 'server', 'serving', 'box', 'boxes', 'packaging',
    'bag', 'bags', 'ribbon', 'ribbons', 'twine', 'tie', 'ties', 'sticker',
    'stickers', 'seal', 'seals', 'sprinkles', 'sprinkle', 'confetti',
    'glitter', 'dust', 'powder', 'color', 'colour', 'dye', 'paste', 'gel',
    'pen', 'pens', 'marker', 'markers', 'brush', 'brushes', 'airbrush',
    'piping', 'bag', 'bags', 'nozzle', 'nozzles', 'tip', 'tips', 'coupler',
    'nail', 'flower', 'scissors', 'lifter', 'smoother', 'scraper', 'comb',
    'spatula', 'palette', 'knife', 'knives', 'cutter', 'cutters', 'plunger',
    'plungers', 'veiner', 'veiners', 'former', 'formers', 'dummy', 'dummies',
    'board', 'boards', 'drum', 'drums', 'pillar', 'pillars', 'dowel',
    'dowels', 'support', 'supports', 'separator', 'separators', 'plate',
    'plates', 'stand', 'stands', 'tier', 'tiers', 'tree', 'trees', 'tower',
    'towers', 'box', 'boxes', 'bag', 'bags', 'wrapper', 'wrappers', 'case',
    'cases', 'cup', 'cups', 'liner', 'liners',
    'vase', 'pot', 'artificial', 'plastic', 'foam', 'wire', 'fountain',
    'bowl', 'plate', 'jar', 'bottle', 'container', 'storage', 'wrap',
}

def _extract_product_ids(search_text: str, filter_accessories: bool = False) -> list[str]:
    if not filter_accessories:
        return re.findall(r'ID:\s*`([^`]+)`', search_text, re.IGNORECASE)
    pairs = re.findall(r'\*\*\d+\.\s+([^*]+)\*\*\s*[\s\S]*?ID:\s*`([^`]+)`', search_text, re.IGNORECASE)
    if pairs:
        ids = []
        for name, pid in pairs:
            name_words = set(re.findall(r'\b\w+\b', name.lower()))
            print("Name Words:", name_words)
            if name_words & _ACCESSORY_WORDS:
                print(f"Filtered accessory: {name.strip()}")
                continue
            ids.append(pid)
        return ids
    return re.findall(r'ID:\s*`([^`]+)`', search_text, re.IGNORECASE)

text = """
**1. Cake Turning Table**
   ID: `HOME0V23POD0022`

**2. Mr And Mrs Cake Topper  Gold**
   ID: `PART0V1601POD0016`

**3. Tefal Bakeware Floral Geometrics Cake Mould TFBW3030104**
   ID: `MOLD123`
"""

print("Extracted IDs:", _extract_product_ids(text, filter_accessories=True))
