import httpx
import json
import logging
import asyncio
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class KaprukaMCP:
    MCP_URL = "https://mcp.kapruka.com/mcp"
    TIMEOUT = 30
    _session_id: Optional[str] = None
    _session_lock: Optional[asyncio.Lock] = None  # created lazily inside event loop

    @classmethod
    async def _get_session(cls) -> str:
        if cls._session_lock is None:
            cls._session_lock = asyncio.Lock()
        async with cls._session_lock:
            if cls._session_id:
                return cls._session_id
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "clientInfo": {"name": "kapruka-agent", "version": "1.0.0"},
                },
            }
            async with httpx.AsyncClient(timeout=cls.TIMEOUT) as client:
                resp = await client.post(cls.MCP_URL, json=payload, headers=cls._base_headers())
            session_id = resp.headers.get("mcp-session-id")
            if not session_id:
                raise RuntimeError(f"MCP init failed ({resp.status_code}): {resp.text[:200]}")
            cls._session_id = session_id
            logger.info(f"MCP session initialized: {session_id}")
            return session_id

    @staticmethod
    def _base_headers(session_id: Optional[str] = None) -> Dict[str, str]:
        h = {
            "Accept": "application/json, text/event-stream",
            "Content-Type": "application/json",
        }
        if session_id:
            h["mcp-session-id"] = session_id
        return h

    @staticmethod
    def _parse_sse(body: str) -> Optional[Dict]:
        for line in body.splitlines():
            if line.startswith("data:"):
                try:
                    return json.loads(line[5:].strip())
                except json.JSONDecodeError:
                    pass
        return None

    @classmethod
    async def call_tool(cls, tool_name: str, params: Dict[str, Any]) -> str:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {"name": tool_name, "arguments": {"params": params}},
        }
        for attempt in range(3):
            try:
                session_id = await cls._get_session()
                async with httpx.AsyncClient(timeout=cls.TIMEOUT) as client:
                    resp = await client.post(
                        cls.MCP_URL, json=payload, headers=cls._base_headers(session_id)
                    )

                if resp.status_code != 200:
                    logger.error(f"MCP {tool_name} HTTP {resp.status_code}: {resp.text[:200]}")
                    if resp.status_code in (400, 401):
                        cls._session_id = None  # force re-init
                        if attempt < 2:
                            await asyncio.sleep(0.3)
                            continue
                    return ""

                data = cls._parse_sse(resp.text)
                if not data:
                    logger.error(f"MCP {tool_name}: could not parse SSE response")
                    return ""

                result = data.get("result", {})
                if result.get("isError"):
                    logger.error(f"MCP {tool_name} tool error: {result}")
                    cls._session_id = None # force re-init
                    return ""

                content = result.get("content", [])
                text = content[0].get("text", "") if content else ""
                logger.info(f"MCP {tool_name} response: {text[:150]}")
                return text

            except httpx.RemoteProtocolError as e:
                logger.warning(f"MCP {tool_name} connection dropped (attempt {attempt + 1}): {e}")
                cls._session_id = None
                if attempt < 2:
                    await asyncio.sleep(0.4 * (attempt + 1))
                    continue
                return ""
            except httpx.TimeoutException:
                logger.error(f"MCP timeout: {tool_name}")
                cls._session_id = None
                return ""
            except Exception as e:
                logger.error(f"MCP error {tool_name}: {e}")
                return ""
        return ""

    @classmethod
    async def search_products(cls, query: str, max_price=None, min_price=None,
                               category=None, limit: int = 10, sort=None,
                               currency: str = "LKR", cursor: Optional[str] = None) -> str:
        params: Dict[str, Any] = {"q": query, "limit": min(limit, 30), "currency": currency}
        if max_price is not None:
            params["max_price"] = max_price
        if min_price is not None:
            params["min_price"] = min_price
        if category is not None:
            params["category"] = category
        if sort is not None:
            params["sort"] = sort
        if cursor is not None:
            params["cursor"] = cursor
        return await cls.call_tool("kapruka_search_products", params)

    @classmethod
    async def get_product(cls, product_id: str, currency: str = "LKR") -> str:
        return await cls.call_tool("kapruka_get_product", {"product_id": product_id, "currency": currency})

    @classmethod
    async def list_categories(cls, depth: int = 1) -> str:
        return await cls.call_tool("kapruka_list_categories", {"depth": depth})

    @classmethod
    async def delivery_cities(cls, query: str, limit: int = 50) -> str:
        return await cls.call_tool("kapruka_list_delivery_cities", {"query": query, "limit": limit})

    @classmethod
    async def check_delivery(cls, city: str, delivery_date: str, product_id: str) -> str:
        return await cls.call_tool("kapruka_check_delivery", {
            "city": city, "delivery_date": delivery_date, "product_id": product_id
        })

    @classmethod
    async def create_order(cls, items, recipient, delivery, sender,
                           gift_message=None, currency: str = "LKR") -> str:
        params: Dict[str, Any] = {
            "cart": items, "recipient": recipient,
            "delivery": delivery, "sender": sender,
            "currency": currency,
        }
        if gift_message is not None:
            params["gift_message"] = gift_message
        return await cls.call_tool("kapruka_create_order", params)

    @classmethod
    async def track_order(cls, order_number: str) -> str:
        return await cls.call_tool("kapruka_track_order", {"order_number": order_number})
