import asyncio
from services.kapruka_mcp import KaprukaMCP

async def test():
    res = await KaprukaMCP.search_products("cakes")
    print(res)

asyncio.run(test())
