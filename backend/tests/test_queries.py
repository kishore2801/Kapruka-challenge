import asyncio
import sys
sys.path.append("e:/My Learning/My Projects/Portfolio Projects/Project Kappruka/backend")
from services.kapruka_mcp import KaprukaMCP

async def test():
    res = await KaprukaMCP.search_products("show me cakes")
    print("Result for 'show me cakes':", res)
    res2 = await KaprukaMCP.search_products("birthday cakes")
    print("Result for 'birthday cakes':", res2)

asyncio.run(test())
