"""Sentinel Python SDK placeholder (Phase 15).

Install (future): pip install sentinel-sdk
"""

from __future__ import annotations

from typing import Any


class Sentinel:
    """Client stub — does not silently bypass the gateway."""

    def __init__(self, api_key: str, base_url: str = "http://localhost:3000", timeout_ms: int = 30_000) -> None:
        if not api_key:
            raise ValueError("Sentinel API key is required")
        self.api_key = api_key
        self.base_url = base_url
        self.timeout_ms = timeout_ms

    def execute(self, tool_name: str, arguments: dict[str, Any], request_id: str | None = None) -> Any:
        raise NotImplementedError(
            "Sentinel SDK execute() is not implemented yet. Gateway lands in Phase 4; full SDK in Phase 15."
        )

    def untrusted(self, content: str, source: str | None = None) -> dict[str, Any]:
        return {"content": content, "trust": "untrusted", "source": source}
