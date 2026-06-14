import asyncio
import sys
sys.path.append("e:/My Learning/My Projects/Portfolio Projects/Project Kappruka/backend")
from services.kapruka_mcp import KaprukaMCP

async def test():
    res = await KaprukaMCP.search_products("birthday cake")
    print(res)

asyncio.run(test())
