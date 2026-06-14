import os
import time
import pytest
from fastapi.testclient import TestClient
from main import app
from services.session_manager import session_manager

client = TestClient(app)


# ── Unit tests: session manager (no API key needed) ───────────────────────

def test_session_creation():
    session_id = "test-session-create-1"
    session = session_manager.get_session(session_id)
    assert session["session_id"] == session_id
    assert session["language"] == "english"
    assert session["currency"] == "LKR"
    assert "latest_search" in session
    assert isinstance(session["latest_search"]["product_ids"], list)
    # Cleanup
    session_manager.delete_session(session_id)


def test_session_deletion():
    session_id = "test-session-delete-2"
    session_manager.get_session(session_id)
    assert session_id in session_manager.sessions
    session_manager.delete_session(session_id)
    assert session_id not in session_manager.sessions


def test_session_ttl_expiry():
    session_id = "test-session-ttl-3"
    session = session_manager.get_session(session_id)
    session["last_seen_at"] = time.time() - 4000
    session_manager.ttl_seconds = 3600
    session_manager.cleanup_stale_sessions()
    assert session_id not in session_manager.sessions


def test_session_update_keeps_latest_search():
    session_id = "test-session-update-4"
    session_manager.get_session(session_id)
    session_manager.update_session(session_id, {
        "latest_search": {
            "query": "birthday cake",
            "product_ids": ["p1", "p2", "p3"],
            "current_page": 1,
            "items_per_page": 3,
            "cursor": None,
            "result_set_id": None,
            "category": None
        }
    })
    updated = session_manager.get_session(session_id)
    assert updated["latest_search"]["query"] == "birthday cake"
    assert updated["latest_search"]["product_ids"] == ["p1", "p2", "p3"]
    # Cleanup
    session_manager.delete_session(session_id)


def test_different_sessions_are_isolated():
    sid_a = "iso-session-A"
    sid_b = "iso-session-B"
    session_manager.get_session(sid_a)
    session_manager.update_session(sid_a, {"latest_search": {"query": "cakes", "product_ids": ["cake1"], "current_page": 1, "items_per_page": 3, "cursor": None, "result_set_id": None, "category": None}})
    session_manager.get_session(sid_b)
    # Session B should not have session A's search
    session_b = session_manager.get_session(sid_b)
    assert session_b["latest_search"]["query"] == ""
    assert session_b["latest_search"]["product_ids"] == []
    # Cleanup
    session_manager.delete_session(sid_a)
    session_manager.delete_session(sid_b)


# ── HTTP endpoint tests (no Gemini call needed) ────────────────────────────

def test_delete_session_endpoint():
    session_id = "test-http-delete-5"
    session_manager.get_session(session_id)
    assert session_id in session_manager.sessions
    resp = client.delete(f"/api/session/{session_id}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"
    assert session_id not in session_manager.sessions


def test_cleanup_session_endpoint():
    session_id = "test-http-cleanup-6"
    session_manager.get_session(session_id)
    assert session_id in session_manager.sessions
    resp = client.post("/api/session/cleanup", json={"session_id": session_id})
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"
    assert session_id not in session_manager.sessions


def test_delete_nonexistent_session_does_not_crash():
    resp = client.delete("/api/session/nonexistent-session-xyz")
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"


def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "timestamp" in data


# ── Integration tests: require GEMINI_API_KEY ──────────────────────────────

HAVE_KEY = bool(os.getenv("GEMINI_API_KEY"))

@pytest.mark.skipif(not HAVE_KEY, reason="GEMINI_API_KEY not set")
def test_chat_request_with_session():
    response = client.post("/api/chat", json={
        "message": "hello",
        "session_id": "integ-session-4",
        "language": "english",
        "currency": "LKR",
        "cart": []
    })
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == "integ-session-4"
    assert "carousel" in data
    assert data["carousel"]["items_per_page"] == 3
    assert "product_ids" in data
    assert isinstance(data["product_ids"], list)


@pytest.mark.skipif(not HAVE_KEY, reason="GEMINI_API_KEY not set")
def test_cart_state_not_shared_between_sessions():
    """Cart is passed per-request from frontend; backend must never mix session carts."""
    resp1 = client.post("/api/chat", json={
        "message": "hello",
        "session_id": "cart-iso-A",
        "cart": [{"id": "p1", "name": "Test", "price": "LKR 100", "quantity": 1, "image_url": "http://img"}]
    })
    resp2 = client.post("/api/chat", json={
        "message": "hello",
        "session_id": "cart-iso-B",
        "cart": []
    })
    assert resp1.status_code == 200
    assert resp2.status_code == 200

    # Session B must not receive Session A's cart items
    cart_b = resp2.json().get("cart") or []
    cart_b_ids = [item.get("id") or item.get("product_id") for item in cart_b]
    assert "p1" not in cart_b_ids


@pytest.mark.skipif(not HAVE_KEY, reason="GEMINI_API_KEY not set")
def test_carousel_metadata_returned():
    response = client.post("/api/chat", json={
        "message": "show me birthday cakes",
        "session_id": "carousel-test-session",
        "language": "english",
        "currency": "LKR",
        "cart": []
    })
    assert response.status_code == 200
    data = response.json()
    carousel = data.get("carousel", {})
    assert carousel.get("items_per_page") == 3
    assert "has_next" in carousel
    assert "has_previous" in carousel
    assert "search_query" in carousel
