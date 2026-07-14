"""FX rates proxy — Frankfurter (ECB) with in-memory cache and static fallback."""

from __future__ import annotations

import logging
import time
from datetime import date
from typing import Any, Dict, Optional, Set

import httpx
from fastapi import APIRouter, Query

logger = logging.getLogger("saas_engine")

router = APIRouter(prefix="/api/fx", tags=["FX"])

ALLOWED_CURRENCIES: Set[str] = {"USD", "EUR", "GBP", "TRY"}
DEFAULT_BASE = "USD"
CACHE_TTL_SECONDS = 3600
FRANKFURTER_URL = "https://api.frankfurter.app/latest"
REQUEST_TIMEOUT = 8.0

# Approximate USD cross rates used when live FX is unavailable.
FALLBACK_RATES: Dict[str, float] = {
    "USD": 1.0,
    "EUR": 0.88,
    "GBP": 0.75,
    "TRY": 47.0,
}

_cache: Dict[str, Any] = {
    "expires_at": 0.0,
    "payload": None,
}


def _fallback_payload(base: str, symbols: Set[str]) -> Dict[str, Any]:
    rates = {"USD": 1.0}
    for code in symbols:
        rates[code] = FALLBACK_RATES.get(code, 1.0)
    # If base is not USD, convert cross rates via USD intermediates.
    if base != "USD":
        base_per_usd = FALLBACK_RATES.get(base, 1.0)
        if base_per_usd <= 0:
            base_per_usd = 1.0
        converted = {base: 1.0}
        for code, usd_rate in rates.items():
            if code == base:
                continue
            converted[code] = usd_rate / base_per_usd
        rates = converted
    return {
        "base": base,
        "date": date.today().isoformat(),
        "rates": rates,
        "source": "fallback",
    }


def _normalize_symbols(symbols: Optional[str]) -> Set[str]:
    if not symbols:
        return set(ALLOWED_CURRENCIES) - {"USD"}
    parsed = {s.strip().upper() for s in symbols.split(",") if s.strip()}
    return {s for s in parsed if s in ALLOWED_CURRENCIES}


def _fetch_live_rates(base: str, symbols: Set[str]) -> Optional[Dict[str, Any]]:
    to_list = sorted(s for s in symbols if s != base)
    if not to_list and base == "USD":
        return {
            "base": base,
            "date": date.today().isoformat(),
            "rates": {"USD": 1.0},
            "source": "live",
        }

    params = {"from": base}
    if to_list:
        params["to"] = ",".join(to_list)

    try:
        with httpx.Client(
            timeout=REQUEST_TIMEOUT, follow_redirects=True
        ) as client:
            response = client.get(FRANKFURTER_URL, params=params)
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        logger.warning("Frankfurter FX fetch failed: %s", exc)
        return None

    rates: Dict[str, float] = {"USD": 1.0} if base == "USD" else {}
    rates[base] = 1.0
    raw_rates = data.get("rates") or {}
    for code, value in raw_rates.items():
        code_upper = str(code).upper()
        if code_upper in ALLOWED_CURRENCIES:
            try:
                rates[code_upper] = float(value)
            except (TypeError, ValueError):
                continue

    return {
        "base": data.get("base", base),
        "date": data.get("date", date.today().isoformat()),
        "rates": rates,
        "source": "live",
    }


@router.get("/rates")
def get_fx_rates(
    base: str = Query(DEFAULT_BASE, description="Base currency (default USD)"),
    symbols: Optional[str] = Query(
        None, description="Comma-separated quote currencies, e.g. EUR,GBP,TRY"
    ),
):
    base_upper = (base or DEFAULT_BASE).strip().upper()
    if base_upper not in ALLOWED_CURRENCIES:
        base_upper = DEFAULT_BASE

    symbol_set = _normalize_symbols(symbols)
    # Always include base and USD for convenient client conversion.
    symbol_set |= {base_upper, "USD"}

    cache_key_symbols = ",".join(sorted(symbol_set))
    now = time.time()
    cached = _cache.get("payload")
    if (
        cached
        and _cache.get("expires_at", 0) > now
        and cached.get("base") == base_upper
        and cached.get("_cache_symbols") == cache_key_symbols
    ):
        return {k: v for k, v in cached.items() if k != "_cache_symbols"}

    live = _fetch_live_rates(base_upper, symbol_set)
    if live is None:
        return _fallback_payload(base_upper, symbol_set)

    # Ensure requested symbols present; fill gaps from fallback.
    for code in symbol_set:
        if code not in live["rates"]:
            if base_upper == "USD":
                live["rates"][code] = FALLBACK_RATES.get(code, 1.0)
            else:
                # Cross via USD fallback if live miss
                usd_base = FALLBACK_RATES.get(base_upper, 1.0) or 1.0
                live["rates"][code] = FALLBACK_RATES.get(code, 1.0) / usd_base

    live["_cache_symbols"] = cache_key_symbols
    _cache["payload"] = live
    _cache["expires_at"] = now + CACHE_TTL_SECONDS

    return {k: v for k, v in live.items() if k != "_cache_symbols"}
