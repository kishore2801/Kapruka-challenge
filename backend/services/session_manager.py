import os
import time
import asyncio
from typing import Dict, Any

_SESSION_TTL = max(1800, int(os.getenv("SESSION_TTL_SECONDS", "1800")))

class SessionManager:
    def __init__(self, ttl_seconds: int = _SESSION_TTL):
        self.sessions: Dict[str, Any] = {}
        self.ttl_seconds = ttl_seconds
        
    def get_session(self, session_id: str) -> dict:
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "session_id": session_id,
                "created_at": time.time(),
                "last_seen_at": time.time(),
                "language": "english",
                "currency": "LKR",
                "cart": [],
                "latest_intent": "",
                "latest_search": {
                    "query": "",
                    "category": None,
                    "product_ids": [],
                    "current_page": 1,
                    "items_per_page": 3,
                    "cursor": None,
                    "result_set_id": None
                }
            }
        else:
            self.sessions[session_id]["last_seen_at"] = time.time()
        return self.sessions[session_id]

    def update_session(self, session_id: str, updates: dict):
        session = self.get_session(session_id)
        session.update(updates)
        session["last_seen_at"] = time.time()

    def delete_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]

    def cleanup_stale_sessions(self):
        now = time.time()
        stale = [sid for sid, s in self.sessions.items() if now - s["last_seen_at"] > self.ttl_seconds]
        for sid in stale:
            del self.sessions[sid]

session_manager = SessionManager()
