import asyncio
import sys
import re
sys.path.append("e:/My Learning/My Projects/Portfolio Projects/Project Kappruka/backend")
from services.kapruka_mcp import KaprukaMCP
from main import _ACCESSORY_WORDS

async def test():
    tool_args = {"query": "cake", "category": "Cakes"}
    q = tool_args.get("query", "")
    q_lower = q.lower()
    q_words = set(re.findall(r'\b\w+\b', q_lower))
    is_cake_intent = "cake" in q_words or "cakes" in q_words
    is_acc_intent = bool(q_words & _ACCESSORY_WORDS)
    
    print(f"is_cake_intent: {is_cake_intent}")
    print(f"is_acc_intent: {is_acc_intent}")
    
    if is_cake_intent and not is_acc_intent:
        if q_lower in ["cake", "cakes"]:
            tool_args["query"] = "birthday cake"
        if "category" in tool_args:
            del tool_args["category"]

    print(f"Final tool args: {tool_args}")
    result = await KaprukaMCP.search_products(
        query=tool_args.get("query"),
        category=tool_args.get("category")
    )
    
    print("Raw result length:", len(result) if result else 0)
    
    if is_cake_intent and not is_acc_intent and isinstance(result, str):
        clean_blocks = []
        for block in result.split('\n\n'):
            if "ID: `" in block:
                block_words = set(re.findall(r'\b\w+\b', block.lower()))
                if block_words & _ACCESSORY_WORDS:
                    print(f"Blocked accessory: {block[:30]}")
                    continue
            clean_blocks.append(block)
        result = '\n\n'.join(clean_blocks)
        
        if "ID: `" not in result:
            result = "No edible cakes found. All results were bakeware/accessories which have been blocked."
            
    print("Clean result:", result)

asyncio.run(test())
