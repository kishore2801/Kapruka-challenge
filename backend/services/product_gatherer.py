import re
import asyncio
import logging
from typing import Tuple, List, Dict, Any

logger = logging.getLogger(__name__)

_PAGE_TIMEOUT = 4    # seconds per MCP search call
_MAX_PAGES = 1       # limit=30 per page; one call is enough for 9 results


def _parse_block(block: str, product_id: str) -> dict | None:
    """Parse a single markdown product block from a search result into a card dict."""
    name_m = re.search(r'^##\s+(.+)$', block, re.MULTILINE)
    price_m = re.search(r'\*\*Price\*\*:\s+LKR\s+([\d,]+)', block)
    image_m = re.search(r'\*\*Image\*\*:\s+(https?://\S+)', block)
    url_m = re.search(r'\[View on Kapruka\]\((https?://[^)]+)\)', block)
    stock_m = re.search(r'\*\*Stock\*\*:\s+(.+)$', block, re.MULTILINE)
    vendor_m = re.search(r'\*\*Vendor\*\*:\s+(.+)$', block, re.MULTILINE)
    desc_m = re.search(r'\*\*Description\*\*:\s*(.+)$', block, re.MULTILINE)

    if not (name_m and image_m):
        return None
    return {
        'id': product_id,
        'name': name_m.group(1).strip(),
        'price': f"LKR {price_m.group(1)}" if price_m else '',
        'image_url': image_m.group(1),
        'product_url': url_m.group(1) if url_m else '',
        'stock': stock_m.group(1).strip() if stock_m else '',
        'vendor': vendor_m.group(1).strip() if vendor_m else '',
        'description': desc_m.group(1).strip() if desc_m else '',
    }


async def gather_clean_products(
    KaprukaMCP,
    tool_args: dict,
    is_cake_intent: bool,
    is_acc_intent: bool,
    _ACCESSORY_WORDS: set,
) -> Tuple[str, List[str], str | None, Dict[str, Any]]:
    """
    Returns (result_text, product_ids, next_cursor, product_cards).
    product_cards is a {pid: card_dict} map built directly from search blocks,
    so callers don't need to make individual get_product calls for the carousel.
    """
    collected_blocks: List[str] = []
    collected_ids: List[str] = []
    product_cards: Dict[str, Any] = {}
    cursor = tool_args.get("cursor")
    next_cursor: str | None = None

    for page in range(_MAX_PAGES):
        try:
            result = await asyncio.wait_for(
                KaprukaMCP.search_products(
                    query=tool_args.get("query"),
                    max_price=tool_args.get("max_price"),
                    min_price=tool_args.get("min_price"),
                    category=tool_args.get("category"),
                    sort=tool_args.get("sort"),
                    limit=tool_args.get("limit", 30),
                    currency=tool_args.get("currency", "LKR"),
                    cursor=cursor,
                ),
                timeout=_PAGE_TIMEOUT,
            )
        except asyncio.TimeoutError:
            logger.warning(f"gather_clean_products: page {page + 1} timed out after {_PAGE_TIMEOUT}s")
            break

        if not isinstance(result, str) or not result.strip():
            break

        # Extract cursor for next page
        next_cursor = None
        cursor_match = re.search(r'cursor="([^"]+)"', result)
        if cursor_match:
            next_cursor = cursor_match.group(1)
            result = re.sub(r'\*More results available.*?\*', '', result).strip()

        # Filter and collect product blocks
        clean_blocks: List[str] = []
        for block in result.split('\n\n'):
            if "ID: `" in block:
                if is_cake_intent and not is_acc_intent:
                    block_words = set(re.findall(r'\b\w+\b', block.lower()))
                    if block_words & _ACCESSORY_WORDS:
                        continue
                id_match = re.search(r'ID:\s*`([^`]+)`', block)
                if id_match:
                    pid = id_match.group(1)
                    if pid not in collected_ids:
                        collected_ids.append(pid)
                        clean_blocks.append(block)
                        # Parse the card directly from the search block
                        card = _parse_block(block, pid)
                        if card:
                            product_cards[pid] = card
            elif "Kapruka search:" in block and not collected_blocks:
                clean_blocks.append(block)

        collected_blocks.extend(clean_blocks)
        cursor = next_cursor

        if len(collected_ids) >= 9 or not cursor:
            break

    final_result = '\n\n'.join(collected_blocks)
    if "ID: `" not in final_result:
        final_result = "No matching products found."

    logger.info(f"gather_clean_products: {len(collected_ids)} products, {len(product_cards)} cards parsed")
    return final_result, collected_ids, next_cursor, product_cards
