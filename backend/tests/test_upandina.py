import asyncio
import sys
sys.path.append("e:/My Learning/My Projects/Portfolio Projects/Project Kappruka/backend")
from services.kapruka_mcp import KaprukaMCP

async def test():
    print(await KaprukaMCP.search_products("upandina cake"))

asyncio.run(test())
