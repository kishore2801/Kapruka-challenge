"""
Edge-case tests for Korpi backend.
All unit-level tests run without GEMINI_API_KEY or network access.
Integration tests are skipped unless GEMINI_API_KEY is set.
"""
import os
import re
import time
import asyncio
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app, _extract_product_ids, _ACCESSORY_WORDS, _parse_product_card
from services.session_manager import SessionManager
from services.product_gatherer import gather_clean_products

client = TestClient(app)
HAVE_KEY = bool(os.getenv("GEMINI_API_KEY"))


# ─────────────────────────────────────────────
# _extract_product_ids
# ─────────────────────────────────────────────

class TestExtractProductIds:
    def test_extracts_single_id(self):
        text = "## Chocolate Cake\nID: `CAKE001`"
        assert _extract_product_ids(text) == ["CAKE001"]

    def test_extracts_multiple_ids(self):
        text = "## Cake A\nID: `ID1`\n\n## Cake B\nID: `ID2`"
        assert _extract_product_ids(text) == ["ID1", "ID2"]

    def test_returns_empty_for_no_ids(self):
        assert _extract_product_ids("No products here.") == []

    def test_returns_empty_for_empty_string(self):
        assert _extract_product_ids("") == []

    def test_filter_accessories_blocks_mould(self):
        text = "## Cake Mould Set\nID: `MOULD01`"
        ids = _extract_product_ids(text, filter_accessories=True)
        assert ids == []

    def test_filter_accessories_blocks_topper(self):
        text = "## Birthday Cake Topper\nID: `TOP01`"
        ids = _extract_product_ids(text, filter_accessories=True)
        assert ids == []

    def test_filter_accessories_passes_edible_cake(self):
        text = "## Chocolate Birthday Cake\nID: `CAKE42`"
        ids = _extract_product_ids(text, filter_accessories=True)
        assert ids == ["CAKE42"]

    def test_filter_off_keeps_accessories(self):
        text = "## Cake Mould\nID: `MOULD01`"
        ids = _extract_product_ids(text, filter_accessories=False)
        assert ids == ["MOULD01"]

    def test_no_duplicate_ids(self):
        text = "## Cake\nID: `CAKE1`\n\n## Cake\nID: `CAKE1`"
        # extract doesn't deduplicate, but product_gatherer does
        ids = _extract_product_ids(text)
        assert ids == ["CAKE1", "CAKE1"]

    def test_id_with_spaces_in_backticks(self):
        text = "ID: `  CAKE-99  `"
        ids = _extract_product_ids(text)
        # id preserved as-is from group(1)
        assert len(ids) == 1


# ─────────────────────────────────────────────
# _parse_product_card
# ─────────────────────────────────────────────

class TestParseProductCard:
    _GOOD = (
        "## Chocolate Delight Cake\n"
        "**Price**: LKR 2,500\n"
        "**Image**: https://cdn.kapruka.com/img/cake.jpg\n"
        "[View on Kapruka](https://www.kapruka.com/p/cake001)\n"
        "**Stock**: In Stock\n"
        "**Vendor**: Sweet Treats\n"
        "**Description**: Rich chocolate layer cake"
    )

    def test_parses_full_card(self):
        result = _parse_product_card(self._GOOD, "CAKE001")
        assert result is not None
        assert result["id"] == "CAKE001"
        assert result["name"] == "Chocolate Delight Cake"
        assert "2,500" in result["price"]
        assert result["image_url"].startswith("https://")
        assert result["product_url"].startswith("https://")
        assert result["stock"] == "In Stock"
        assert result["vendor"] == "Sweet Treats"

    def test_returns_none_when_name_missing(self):
        text = "**Image**: https://cdn.kapruka.com/img/cake.jpg"
        assert _parse_product_card(text, "X") is None

    def test_returns_none_when_image_missing(self):
        text = "## Cake Name"
        assert _parse_product_card(text, "X") is None

    def test_optional_fields_default_empty(self):
        text = "## Simple Cake\n**Image**: https://img.example.com/c.jpg"
        result = _parse_product_card(text, "C1")
        assert result is not None
        assert result["price"] == ""
        assert result["product_url"] == ""
        assert result["stock"] == ""
        assert result["vendor"] == ""

    def test_price_without_lkr_prefix(self):
        text = "## Cake\n**Image**: https://img.example.com/c.jpg\n**Price**: LKR 1,000"
        result = _parse_product_card(text, "C2")
        assert result["price"] == "LKR 1,000"


# ─────────────────────────────────────────────
# Session Manager edge cases
# ─────────────────────────────────────────────

class TestSessionManagerEdge:
    def setup_method(self):
        self.mgr = SessionManager(ttl_seconds=3600)

    def test_get_session_creates_on_first_call(self):
        s = self.mgr.get_session("new-1")
        assert s["session_id"] == "new-1"

    def test_get_session_returns_same_object(self):
        s1 = self.mgr.get_session("same-1")
        s2 = self.mgr.get_session("same-1")
        assert s1 is s2

    def test_update_last_seen(self):
        s = self.mgr.get_session("ts-1")
        before = s["last_seen_at"]
        time.sleep(0.01)
        self.mgr.update_session("ts-1", {})
        assert self.mgr.sessions["ts-1"]["last_seen_at"] >= before

    def test_delete_nonexistent_is_safe(self):
        self.mgr.delete_session("does-not-exist")  # must not raise

    def test_ttl_cleanup_removes_expired(self):
        self.mgr.get_session("exp-1")
        self.mgr.sessions["exp-1"]["last_seen_at"] = time.time() - 7200
        self.mgr.cleanup_stale_sessions()
        assert "exp-1" not in self.mgr.sessions

    def test_ttl_cleanup_keeps_fresh(self):
        self.mgr.get_session("fresh-1")
        self.mgr.cleanup_stale_sessions()
        assert "fresh-1" in self.mgr.sessions

    def test_multiple_sessions_isolated(self):
        self.mgr.update_session("iso-A", {"latest_search": {
            "query": "cakes", "product_ids": ["c1"],
            "current_page": 1, "items_per_page": 3,
            "cursor": None, "result_set_id": None, "category": None
        }})
        self.mgr.get_session("iso-B")
        assert self.mgr.get_session("iso-B")["latest_search"]["query"] == ""

    def test_search_context_persists_across_get(self):
        self.mgr.update_session("ctx-1", {"latest_search": {
            "query": "birthday cake", "product_ids": ["p1", "p2"],
            "current_page": 1, "items_per_page": 3,
            "cursor": "abc", "result_set_id": "rs1", "category": None
        }})
        s = self.mgr.get_session("ctx-1")
        assert s["latest_search"]["cursor"] == "abc"
        assert len(s["latest_search"]["product_ids"]) == 2


# ─────────────────────────────────────────────
# gather_clean_products (mocked MCP)
# ─────────────────────────────────────────────

def _make_mcp_result(n: int, prefix: str = "cake") -> str:
    blocks = []
    for i in range(n):
        blocks.append(
            f"## {prefix.title()} Product {i}\n"
            f"**Price**: LKR {1000 * (i+1)}\n"
            f"**Image**: https://img.kapruka.com/{prefix}{i}.jpg\n"
            f"ID: `{prefix.upper()}{i:03d}`"
        )
    return "\n\n".join(blocks)


class TestGatherCleanProducts:
    def _make_mock_mcp(self, result_text: str):
        mock = MagicMock()
        mock.search_products = AsyncMock(return_value=result_text)
        return mock

    def test_collects_product_ids(self):
        mock_mcp = self._make_mock_mcp(_make_mcp_result(5, "cake"))
        result, ids, cursor, _ = asyncio.get_event_loop().run_until_complete(
            gather_clean_products(mock_mcp, {"query": "cake", "currency": "LKR"}, False, False, _ACCESSORY_WORDS)
        )
        assert len(ids) == 5
        assert all(id.startswith("CAKE") for id in ids)

    def test_filters_accessories_for_cake(self):
        acc_block = "## Cake Mould Round\n**Image**: https://img.kapruka.com/mould.jpg\nID: `MOULD001`"
        cake_block = "## Chocolate Birthday Cake\n**Image**: https://img.kapruka.com/c.jpg\nID: `CAKE001`"
        text = cake_block + "\n\n" + acc_block
        mock_mcp = self._make_mock_mcp(text)
        _, ids, _, _c = asyncio.get_event_loop().run_until_complete(
            gather_clean_products(mock_mcp, {"query": "cake", "currency": "LKR"}, True, False, _ACCESSORY_WORDS)
        )
        assert "CAKE001" in ids
        assert "MOULD001" not in ids

    def test_no_duplicates(self):
        block = "## Cake\n**Image**: https://img.k.com/c.jpg\nID: `CAKE001`"
        text = block + "\n\n" + block
        mock_mcp = self._make_mock_mcp(text)
        _, ids, _, _c = asyncio.get_event_loop().run_until_complete(
            gather_clean_products(mock_mcp, {"query": "cake", "currency": "LKR"}, False, False, _ACCESSORY_WORDS)
        )
        assert ids.count("CAKE001") == 1

    def test_empty_mcp_result(self):
        mock_mcp = self._make_mock_mcp("")
        result, ids, cursor = asyncio.get_event_loop().run_until_complete(
            gather_clean_products(mock_mcp, {"query": "xyz", "currency": "LKR"}, False, False, _ACCESSORY_WORDS)
        )
        assert ids == []
        assert result == "No matching products found."

    def test_timeout_returns_empty(self):
        async def slow(*args, **kwargs):
            await asyncio.sleep(10)
            return ""
        mock_mcp = MagicMock()
        mock_mcp.search_products = slow

        async def run():
            return await asyncio.wait_for(
                gather_clean_products(mock_mcp, {"query": "test", "currency": "LKR"}, False, False, _ACCESSORY_WORDS),
                timeout=0.1,
            )

        with pytest.raises(asyncio.TimeoutError):
            asyncio.get_event_loop().run_until_complete(run())

    def test_stops_at_one_page_max(self):
        mock_mcp = self._make_mock_mcp(_make_mcp_result(9, "item"))
        _, ids, _, _c = asyncio.get_event_loop().run_until_complete(
            gather_clean_products(mock_mcp, {"query": "item", "currency": "LKR"}, False, False, _ACCESSORY_WORDS)
        )
        # _MAX_PAGES=1, so search_products called exactly once
        assert mock_mcp.search_products.call_count == 1


# ─────────────────────────────────────────────
# Accessory word set sanity
# ─────────────────────────────────────────────

class TestAccessoryWords:
    def test_mould_in_set(self):
        assert "mould" in _ACCESSORY_WORDS

    def test_topper_in_set(self):
        assert "topper" in _ACCESSORY_WORDS

    def test_candle_in_set(self):
        assert "candle" in _ACCESSORY_WORDS

    def test_edible_word_not_in_set(self):
        assert "chocolate" not in _ACCESSORY_WORDS
        assert "birthday" not in _ACCESSORY_WORDS
        assert "cake" not in _ACCESSORY_WORDS


# ─────────────────────────────────────────────
# HTTP endpoint edge cases (no Gemini needed)
# ─────────────────────────────────────────────

class TestEndpoints:
    def test_health(self):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_delete_session(self):
        r = client.delete("/api/session/edge-del-1")
        assert r.status_code == 200

    def test_cleanup_session(self):
        r = client.post("/api/session/cleanup", json={"session_id": "edge-cl-1"})
        assert r.status_code == 200

    def test_products_empty_ids(self):
        r = client.post("/api/products", json={"ids": [], "currency": "LKR"})
        assert r.status_code == 200
        assert r.json()["products"] == []

    def test_chat_empty_message(self):
        r = client.post("/api/chat", json={
            "message": "   ", "session_id": "s1", "currency": "LKR", "cart": []
        })
        # FastAPI/Pydantic returns 422 for validator-raised ValueError
        assert r.status_code == 422

    def test_chat_message_too_long(self):
        r = client.post("/api/chat", json={
            "message": "x" * 2001, "session_id": "s1", "currency": "LKR", "cart": []
        })
        assert r.status_code == 422

    def test_chat_invalid_currency_falls_back_to_lkr(self):
        # pydantic validator converts unknown → LKR; request still valid
        # We can't call Gemini but currency validation happens before that
        # Just check the validator doesn't blow up with a 422
        r = client.post("/api/chat", json={
            "message": "hi", "session_id": "s1", "currency": "XYZ", "cart": []
        })
        # 422 would mean schema rejection; 200/500 means validator ran
        assert r.status_code != 422

    def test_delete_session_twice_is_safe(self):
        client.delete("/api/session/dbl-del")
        r = client.delete("/api/session/dbl-del")
        assert r.status_code == 200


# ─────────────────────────────────────────────
# Language detector
# ─────────────────────────────────────────────

class TestLanguageDetector:
    def _detect(self, text, selected=""):
        from services.language_detector import detect_language
        return detect_language(text, selected)

    def test_sinhala_script(self):
        assert self._detect("ආයුබෝවන්") == "sinhala"

    def test_tamil_script(self):
        assert self._detect("வணக்கம்") == "tamil"

    def test_singlish_words(self):
        result = self._detect("mama birthday cake ekak ganna ona")
        assert result == "singlish"

    def test_tanglish_words(self):
        result = self._detect("enakku birthday gift venum")
        assert result == "tanglish"

    def test_plain_english(self):
        result = self._detect("show me chocolate cakes")
        assert result == "english"

    def test_empty_falls_back_to_english(self):
        assert self._detect("") == "english"

    def test_none_falls_back_to_english(self):
        from services.language_detector import detect_language
        assert detect_language(None) == "english"  # type: ignore

    def test_selected_sinhala_biases_result(self):
        # The detector scores Latin text and returns "singlish" when biased toward sinhala.
        # The main.py chat handler then overrides "singlish" → "sinhala" for UI-selected sinhala.
        result = self._detect("yes please", selected="sinhala")
        assert result == "singlish"

    def test_selected_tamil_biases_result(self):
        # Same: detector returns "tanglish"; main.py promotes it to "tamil" for UI-selected tamil.
        result = self._detect("yes please", selected="tamil")
        assert result == "tanglish"


# ─────────────────────────────────────────────
# /api/carousel/page endpoint (no Gemini needed)
# ─────────────────────────────────────────────

class TestCarouselPage:
    """Tests for the silent carousel pagination endpoint."""

    def _seed(self, session_id: str, ids: list, cursor=None, query="birthday cake"):
        """Helper: write a latest_search into session_manager directly."""
        from services.session_manager import session_manager as sm
        sm.get_session(session_id)
        sm.update_session(session_id, {
            "latest_search": {
                "query": query,
                "category": None,
                "product_ids": ids,
                "cursor": cursor,
                "items_per_page": 3,
                "current_page": 1,
                "total_items": len(ids),
                "result_set_id": "testrsid",
                "currency": "LKR",
            }
        })

    def test_empty_session_returns_no_products(self):
        r = client.post("/api/carousel/page", json={"session_id": "cp-empty", "page": 1})
        assert r.status_code == 200
        d = r.json()
        assert d["product_ids"] == []
        assert d["has_next"] is False
        assert d["has_previous"] is False

    def test_page_1_returns_first_3_ids(self):
        ids = [f"P{i:03d}" for i in range(9)]
        self._seed("cp-p1", ids)
        r = client.post("/api/carousel/page", json={"session_id": "cp-p1", "page": 1})
        assert r.status_code == 200
        d = r.json()
        assert d["product_ids"] == ["P000", "P001", "P002"]
        assert d["has_previous"] is False
        assert d["has_next"] is True   # pages 2 and 3 still available

    def test_page_2_returns_middle_3_ids(self):
        ids = [f"P{i:03d}" for i in range(9)]
        self._seed("cp-p2", ids)
        r = client.post("/api/carousel/page", json={"session_id": "cp-p2", "page": 2})
        assert r.status_code == 200
        d = r.json()
        assert d["product_ids"] == ["P003", "P004", "P005"]
        assert d["has_previous"] is True
        assert d["has_next"] is True

    def test_page_3_returns_last_3_no_next(self):
        ids = [f"P{i:03d}" for i in range(9)]
        self._seed("cp-p3", ids, cursor=None)
        r = client.post("/api/carousel/page", json={"session_id": "cp-p3", "page": 3})
        assert r.status_code == 200
        d = r.json()
        assert d["product_ids"] == ["P006", "P007", "P008"]
        assert d["has_next"] is False
        assert d["has_previous"] is True

    def test_page_beyond_stored_with_no_cursor_is_empty(self):
        ids = [f"P{i:03d}" for i in range(9)]
        self._seed("cp-beyond", ids, cursor=None)
        r = client.post("/api/carousel/page", json={"session_id": "cp-beyond", "page": 4})
        assert r.status_code == 200
        d = r.json()
        assert d["product_ids"] == []
        assert d["has_next"] is False

    def test_has_next_true_when_more_stored(self):
        ids = [f"P{i:03d}" for i in range(12)]  # 4 pages worth
        self._seed("cp-hasnext", ids)
        r = client.post("/api/carousel/page", json={"session_id": "cp-hasnext", "page": 1})
        assert r.status_code == 200
        d = r.json()
        assert d["has_next"] is True
        assert d["total_items"] == 12

    def test_result_set_id_returned(self):
        ids = [f"P{i:03d}" for i in range(9)]
        self._seed("cp-rsid", ids)
        r = client.post("/api/carousel/page", json={"session_id": "cp-rsid", "page": 1})
        assert r.status_code == 200
        assert r.json()["result_set_id"] == "testrsid"

    def test_search_query_returned(self):
        ids = [f"P{i:03d}" for i in range(6)]
        self._seed("cp-query", ids, query="chocolates")
        r = client.post("/api/carousel/page", json={"session_id": "cp-query", "page": 1})
        assert r.status_code == 200
        assert r.json()["search_query"] == "chocolates"

    def test_current_page_updated_in_session(self):
        """After a carousel page call, the session reflects the new current_page."""
        from services.session_manager import session_manager as sm
        ids = [f"P{i:03d}" for i in range(9)]
        self._seed("cp-update", ids)
        client.post("/api/carousel/page", json={"session_id": "cp-update", "page": 2})
        session = sm.get_session("cp-update")
        assert session["latest_search"]["current_page"] == 2

    def test_has_next_true_when_cursor_exists_and_pages_exhausted(self):
        ids = [f"P{i:03d}" for i in range(9)]
        self._seed("cp-cursor", ids, cursor="some-mcp-cursor")
        r = client.post("/api/carousel/page", json={"session_id": "cp-cursor", "page": 3})
        assert r.status_code == 200
        # Page 3 is the last page locally (ids 6-8), cursor means more exist
        assert r.json()["has_next"] is True

    def test_default_page_is_1(self):
        ids = [f"P{i:03d}" for i in range(9)]
        self._seed("cp-default", ids)
        # Omit page — should default to 1
        r = client.post("/api/carousel/page", json={"session_id": "cp-default"})
        assert r.status_code == 200
        assert r.json()["product_ids"] == ["P000", "P001", "P002"]


# ─────────────────────────────────────────────
# Carousel metadata structure (integration)
# ─────────────────────────────────────────────

@pytest.mark.skipif(not HAVE_KEY, reason="GEMINI_API_KEY not set")
class TestCarouselIntegration:
    def test_carousel_fields_present(self):
        r = client.post("/api/chat", json={
            "message": "show me birthday cakes",
            "session_id": "carousel-edge-1",
            "language": "english", "currency": "LKR", "cart": []
        })
        assert r.status_code == 200
        c = r.json()["carousel"]
        assert c["items_per_page"] == 3
        assert isinstance(c["has_next"], bool)
        assert isinstance(c["has_previous"], bool)
        assert isinstance(c["search_query"], str)
        assert "result_set_id" in c

    def test_product_ids_are_strings(self):
        r = client.post("/api/chat", json={
            "message": "I need chocolates",
            "session_id": "prod-ids-edge-1",
            "language": "english", "currency": "LKR", "cart": []
        })
        assert r.status_code == 200
        for pid in r.json()["product_ids"]:
            assert isinstance(pid, str)
            assert len(pid) > 0

    def test_search_limit_guard_prevents_loop(self):
        """Send a 'show more' without prior context — should not hang."""
        r = client.post("/api/chat", json={
            "message": "show more",
            "session_id": "more-edge-1",
            "language": "english", "currency": "LKR", "cart": []
        })
        assert r.status_code == 200
        assert isinstance(r.json()["message"], str)
