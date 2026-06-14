import asyncio
import sys
import re
sys.path.append("e:/My Learning/My Projects/Portfolio Projects/Project Kappruka/backend")
from services.kapruka_mcp import KaprukaMCP
from main import _ACCESSORY_WORDS

async def test():
    res = await KaprukaMCP.search_products("upandina cake")
    clean_blocks = []
    for block in res.split('\n\n'):
        if "ID: `" in block:
            block_words = set(re.findall(r'\b\w+\b', block.lower()))
            if block_words & _ACCESSORY_WORDS:
                print("BLOCKED:", block[:50].replace('\n', ' '))
                continue
        clean_blocks.append(block)
    print("SURVIVED:")
    print('\n\n'.join(clean_blocks))

asyncio.run(test())
