"""
Quick test to inspect the raw MCP server response.
Run with: python test_mcp.py
"""
import asyncio
import json
import httpx

MCP_URL = "https://mcp.kapruka.com/mcp"

HEADERS = {
    "Accept": "application/json, text/event-stream",
    "Content-Type": "application/json",
}

async def test_call(method: str, tool_name: str, args: dict):
    print(f"\n{'='*60}")
    print(f"METHOD: {method}  TOOL: {tool_name}")
    print(f"{'='*60}")

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": {
            "name": tool_name,
            "arguments": args
        }
    }

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(MCP_URL, json=payload, headers=HEADERS)
            print(f"HTTP Status: {resp.status_code}")
            print(f"Content-Type: {resp.headers.get('content-type')}")
            print(f"\nRaw body:\n{resp.text[:3000]}")
            try:
                data = resp.json()
                print(f"\nParsed JSON:\n{json.dumps(data, indent=2)[:3000]}")
            except Exception:
                print("(body is not JSON — likely SSE stream)")
        except Exception as e:
            print(f"Request failed: {e}")

async def initialize_session() -> str | None:
    """Initialize MCP session and return the session ID."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "kapruka-agent", "version": "1.0.0"}
        }
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(MCP_URL, json=payload, headers=HEADERS)
        print(f"Initialize status: {resp.status_code}")
        print(f"Initialize body: {resp.text[:500]}")
        session_id = resp.headers.get("mcp-session-id")
        print(f"Session ID: {session_id}")
        return session_id

def parse_sse(body: str) -> dict | None:
    """Extract JSON from SSE event stream body."""
    for line in body.splitlines():
        if line.startswith("data:"):
            try:
                return json.loads(line[5:].strip())
            except json.JSONDecodeError:
                pass
    return None

async def list_tools(session_id: str):
    payload = {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(MCP_URL, json=payload, headers=HEADERS)
        data = parse_sse(resp.text) or {}
        tools = data.get("result", {}).get("tools", [])
        for t in tools:
            print(f"\nTOOL: {t['name']}")
            schema = t.get("inputSchema", {})
            print(f"  Required: {schema.get('required', [])}")
            props = schema.get("properties", {})
            for k, v in props.items():
                print(f"  {k}: {v.get('type', '?')} — {v.get('description', '')[:60]}")

async def main():
    session_id = await initialize_session()
    if session_id:
        HEADERS["mcp-session-id"] = session_id

    print("\n--- Tool schemas ---")
    await list_tools(session_id)

    print("\n--- Search test ---")
    await test_call("tools/call", "kapruka_search_products", {"params": {"q": "birthday gifts", "limit": 3}})

asyncio.run(main())
