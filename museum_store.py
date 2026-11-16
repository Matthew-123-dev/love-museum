"""Shared storage and room configuration layer for The Museum of Us.

Supports:
  - Architecture B cloud persistence via Upstash Redis REST API
    (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN or KV_REST_API_*)
  - Local JSON file persistence (data/museums.json + data/artifacts.json)
  - Ephemeral /tmp fallback when deployed to Vercel before connecting Redis
"""

from __future__ import annotations

import copy
import json
import os
import secrets
import threading
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
ARTIFACTS_FILE = DATA_DIR / "artifacts.json"
MUSEUMS_FILE = DATA_DIR / "museums.json"
TMP_MUSEUMS_FILE = Path("/tmp/love_museum_rooms.json")

STORAGE_LOCK = threading.Lock()
PIN_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

FREE_MEMORY_LIMIT = 8
HEIRLOOM_PRICE_NGN = 5000
HEIRLOOM_PRICE_USD = 7
DEFAULT_PROPOSAL_PROMPT = (
    "Will you accept Our Love Museum and step inside every memory we have kept?"
)


class HeirloomRequiredError(ValueError):
    """Raised when a free museum exceeds the free memory limit."""

DEFAULT_FOYER_NOTES = [
    {
        "id": "note-1",
        "title": "Note I \u2022 Morning Light",
        "body": (
            "For every sleepy Sunday morning when you steal the warm side of the "
            "blanket and make me laugh before coffee."
        ),
    },
    {
        "id": "note-2",
        "title": "Note II \u2022 Under Glass",
        "body": (
            "Even our quietest ordinary Tuesdays deserve to be framed like rare "
            "museum pieces."
        ),
    },
    {
        "id": "note-3",
        "title": "Note III \u2022 Always Real",
        "body": (
            "Love is not perfect, but it is always real\u2014especially in the little "
            "artifacts we collect together."
        ),
    },
    {
        "id": "note-4",
        "title": "Note IV \u2022 Every Chapter",
        "body": (
            "Here is to every memory we have already made, and all the ones waiting "
            "for us to hang on our thread."
        ),
    },
]

PARTNER_PRESETS = {
    "public": {
        "partner1": {"id": "Him", "name": "Him", "nickname": ""},
        "partner2": {"id": "Her", "name": "Her", "nickname": ""},
        "shared": "Both of Us",
    },
}

BUILTIN_SEED_ARTIFACTS = [
    {
        "id": "art-01",
        "catalogNumber": "ARTIFACT #01",
        "title": "Golden Hour by the Tide",
        "date": "June 14, 2024",
        "curator": "Him",
        "wing": "First Chapters & Sparks",
        "frameStyle": "Rectangular Lace Frame",
        "featured": True,
        "slant": -3.6,
        "story": (
            "The evening we forgot what time it was because the waves kept erasing "
            "our footprints and you laughed every time the cold water caught your dress."
        ),
        "secretNote": (
            "I knew right there on the wet sand that I wanted a thousand more "
            "summers beside you."
        ),
        "tags": ["First Trip", "Ocean Air", "Golden Hour"],
        "imageUrl": (
            "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' "
            "viewBox='0 0 600 450'%3E%3Cdefs%3E%3ClinearGradient id='sky' x1='0' "
            "y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23f4dfc9'/%3E"
            "%3Cstop offset='55%25' stop-color='%23e8bfa0'/%3E%3Cstop offset='100%25' "
            "stop-color='%23920d25'/%3E%3C/linearGradient%3E%3CradialGradient id='sun' "
            "cx='50%25' cy='46%25' r='35%25'%3E%3Cstop offset='0%25' "
            "stop-color='%23ffffff' stop-opacity='0.95'/%3E%3Cstop offset='40%25' "
            "stop-color='%23f9eede' stop-opacity='0.7'/%3E%3Cstop offset='100%25' "
            "stop-color='%23920d25' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E"
            "%3Crect width='600' height='450' fill='url(%23sky)'/%3E%3Ccircle cx='300' "
            "cy='210' r='160' fill='url(%23sun)'/%3E%3Ccircle cx='300' cy='205' r='54' "
            "fill='%23ffffff' opacity='0.88'/%3E%3Cpath d='M0 265 Q150 250 300 266 "
            "T600 260 L600 450 L0 450 Z' fill='%23780b1f' opacity='0.85'/%3E%3Cpath "
            "d='M0 305 Q120 292 260 310 T600 300 L600 450 L0 450 Z' "
            "fill='%23590716'/%3E%3Cellipse cx='300' cy='312' rx='95' ry='10' "
            "fill='%23f9eede' opacity='0.45'/%3E%3Cellipse cx='300' cy='335' rx='65' "
            "ry='7' fill='%23f9eede' opacity='0.3'/%3E%3Cpath d='M275 300 C272 250 282 "
            "220 293 216 C302 214 308 232 305 256 L309 300 Z' fill='%233b040e'/%3E"
            "%3Cpath d='M322 300 C325 254 316 226 306 223 C297 221 294 240 298 262 "
            "L292 300 Z' fill='%234a0512'/%3E%3Ccircle cx='292' cy='202' r='13' "
            "fill='%233b040e'/%3E%3Ccircle cx='311' cy='208' r='12' "
            "fill='%234a0512'/%3E%3C/svg%3E"
        ),
    },
    {
        "id": "art-02",
        "catalogNumber": "ARTIFACT #02",
        "title": "Two Coffees & The Rainy Window",
        "date": "October 03, 2024",
        "curator": "Her",
        "wing": "Soft Days & Inside Jokes",
        "frameStyle": "Oval Lace Cameo",
        "featured": True,
        "slant": 3.4,
        "story": (
            "That Saturday storm trapped us at the corner booth for four hours. We drew "
            "constellations on napkins and ranked every terrible rom-com we ever watched."
        ),
        "secretNote": (
            "I kept the napkin with your handwriting in the back of my wallet until it "
            "tore at the folds."
        ),
        "tags": ["Rainy Café", "Napkin Notes", "Inside Jokes"],
        "imageUrl": (
            "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' "
            "viewBox='0 0 600 450'%3E%3Crect width='600' height='450' "
            "fill='%23630819'/%3E%3Crect x='50' y='35' width='500' height='260' rx='18' "
            "fill='%23f4dfc9' opacity='0.14' stroke='%23f9eede' stroke-opacity='0.35' "
            "stroke-width='2'/%3E%3Crect x='0' y='310' width='600' height='140' "
            "fill='%23f4dfc9'/%3E%3Ccircle cx='215' cy='335' r='34' fill='%23f9eede' "
            "stroke='%23920d25' stroke-width='2'/%3E%3Ccircle cx='385' cy='342' r='34' "
            "fill='%23f9eede' stroke='%23920d25' stroke-width='2'/%3E%3Ccircle "
            "cx='300' cy='382' r='28' fill='%23ffffff'/%3E%3Cpath d='M292 380 C292 "
            "373 300 374 300 381 C300 374 308 373 308 380 C308 389 300 394 300 394 "
            "C300 394 292 389 292 380 Z' fill='%23920d25'/%3E%3C/svg%3E"
        ),
    },
    {
        "id": "art-03",
        "catalogNumber": "ARTIFACT #03",
        "title": "The First Wax-Sealed Letter",
        "date": "December 21, 2024",
        "curator": "Both of Us",
        "wing": "Letters, Vows & Forever",
        "frameStyle": "Rectangular Lace Frame",
        "featured": True,
        "slant": -2.8,
        "story": (
            "Written by candlelight before we even exchanged gifts. Folded in heavy "
            "cream stationery, sealed in deep burgundy wax, and kept under lock until midnight."
        ),
        "secretNote": "Read paragraph three whenever you miss me\u2014every word still holds true.",
        "tags": ["Handwritten", "Wax Seal", "Winter Solstice"],
        "imageUrl": (
            "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' "
            "viewBox='0 0 600 450'%3E%3Crect width='600' height='450' "
            "fill='%23590716'/%3E%3Cg transform='translate(115 95) rotate(-3 185 130)'%3E"
            "%3Crect width='370' height='250' rx='10' fill='%23f9eede' stroke='%23f4dfc9' "
            "stroke-width='3'/%3E%3Cpath d='M0 0 L185 140 L370 0' fill='%23f4dfc9' "
            "stroke='%23920d25' stroke-opacity='0.2' stroke-width='2'/%3E%3Ccircle "
            "cx='185' cy='140' r='32' fill='%23920d25'/%3E%3Cpath d='M177 136 C177 "
            "130 185 131 185 137 C185 131 193 130 193 136 C193 144 185 149 185 149 "
            "C185 149 177 144 177 136 Z' fill='%23f9eede'/%3E%3C/g%3E%3C/svg%3E"
        ),
    },
    {
        "id": "art-04",
        "catalogNumber": "ARTIFACT #04",
        "title": "Midnight Kitchen Slow Dance",
        "date": "February 14, 2025",
        "curator": "Him",
        "wing": "Soft Days & Inside Jokes",
        "frameStyle": "Oval Lace Cameo",
        "featured": True,
        "slant": 4.1,
        "story": (
            "No fancy reservation, just one warm lamp over the stove, pasta simmering, "
            "and our favorite vinyl spinning softly while we danced in socks on the kitchen tile."
        ),
        "secretNote": "The kitchen floor is still my favorite ballroom on earth.",
        "tags": ["Vinyl Night", "Warm Lamp", "Slow Dance"],
        "imageUrl": (
            "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' "
            "viewBox='0 0 600 450'%3E%3Crect width='600' height='450' "
            "fill='%23630819'/%3E%3Ccircle cx='300' cy='85' r='22' fill='%23ffffff'/%3E"
            "%3Crect x='0' y='355' width='600' height='95' fill='%234a0512'/%3E%3Ccircle "
            "cx='120' cy='160' r='36' fill='%233b040e' stroke='%23f9eede' "
            "stroke-width='2'/%3E%3Ccircle cx='286' cy='182' r='18' fill='%23f9eede'/%3E"
            "%3Ccircle cx='316' cy='188' r='17' fill='%23f4dfc9'/%3E%3C/svg%3E"
        ),
    },
    {
        "id": "art-05",
        "catalogNumber": "ARTIFACT #05",
        "title": "Pressed Crimson Rose No. 1",
        "date": "May 19, 2025",
        "curator": "Her",
        "wing": "Letters, Vows & Forever",
        "frameStyle": "Slanted String Card",
        "featured": False,
        "slant": -4.2,
        "story": (
            "The first flower you tucked inside my hardcover book so it wouldn't wilt on "
            "the train home. Months later, its petals still hold the exact shade of your lipstick."
        ),
        "secretNote": "Open page 114 whenever you want to find its twin petal.",
        "tags": ["Pressed Flower", "Bookstore", "Keepsake"],
        "imageUrl": (
            "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' "
            "viewBox='0 0 600 450'%3E%3Crect width='600' height='450' "
            "fill='%23f4dfc9'/%3E%3Crect x='40' y='35' width='520' height='380' rx='14' "
            "fill='%23f9eede' stroke='%23920d25' stroke-opacity='0.22' "
            "stroke-width='2'/%3E%3Ccircle cx='300' cy='185' r='54' "
            "fill='%23920d25'/%3E%3Cpath d='M300 220 Q296 300 315 365' "
            "stroke='%2368081a' stroke-width='5' fill='none'/%3E%3C/svg%3E"
        ),
    },
    {
        "id": "art-06",
        "catalogNumber": "ARTIFACT #06",
        "title": "Rooftop Starlight & Polaroids",
        "date": "August 28, 2025",
        "curator": "Both of Us",
        "wing": "First Chapters & Sparks",
        "frameStyle": "Slanted String Card",
        "featured": False,
        "slant": 2.9,
        "story": (
            "Wrapped in one oversized cream blanket on the roof, counting satellites until "
            "2 AM and taking blurry flash selfies we refused to delete."
        ),
        "secretNote": (
            "This is the night we promised to build our own little museum someday\u2014and here it is."
        ),
        "tags": ["Stargazing", "Rooftop", "Anniversary Eve"],
        "imageUrl": (
            "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' "
            "viewBox='0 0 600 450'%3E%3Crect width='600' height='450' "
            "fill='%234a0512'/%3E%3Ccircle cx='120' cy='80' r='3' fill='%23ffffff'/%3E"
            "%3Ccircle cx='350' cy='70' r='3' fill='%23ffffff'/%3E%3Cpath d='M465 55 "
            "A36 36 0 1 0 505 110 A28 28 0 1 1 465 55 Z' fill='%23f9eede'/%3E%3Cpath "
            "d='M0 320 L600 340 L600 450 L0 450 Z' fill='%23920d25'/%3E%3C/svg%3E"
        ),
    },
]


def get_configured_edition() -> str:
    """Return active server edition ('public')."""
    return "public"


def normalize_pin(pin: str | None) -> str:
    """Normalize a museum room PIN (uppercase, strip spaces/hyphens)."""
    if not pin:
        return ""
    cleaned = "".join(ch for ch in str(pin).upper() if ch.isalnum())
    return cleaned


def format_pin_display(pin: str) -> str:
    """Format a 6-char public PIN as XXX-XXX while keeping SAMPLE intact."""
    norm = normalize_pin(pin)
    if norm in ("SAMPLE", ""):
        return norm
    if len(norm) == 6:
        return f"{norm[:3]}-{norm[3:]}"
    return norm


def _load_seed_from_disk() -> list[dict[str, Any]]:
    """Read seed exhibits from data/artifacts.json if present on disk."""
    if ARTIFACTS_FILE.exists():
        try:
            data = json.loads(ARTIFACTS_FILE.read_text(encoding="utf-8"))
            if isinstance(data, list) and data:
                return data
        except (OSError, json.JSONDecodeError):
            pass
    return copy.deepcopy(BUILTIN_SEED_ARTIFACTS)


def map_curator_for_edition(curator: str, edition: str = "public") -> str:
    """Map generic or legacy curator tags cleanly to Him/Her."""
    raw = (curator or "").strip()
    if raw in ("Me", "Him"):
        return "Him"
    if raw in ("My Girlfriend", "Her"):
        return "Her"
    return "Both of Us" if raw == "Both of Us" else (raw or "Both of Us")


def _normalize_artifacts_for_edition(
    artifacts: list[dict[str, Any]], edition: str = "public"
) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for item in artifacts:
        if not isinstance(item, dict):
            continue
        cloned = copy.deepcopy(item)
        cloned["curator"] = map_curator_for_edition(str(cloned.get("curator", "")), edition)
        normalized.append(cloned)
    return normalized


def _map_curator_for_room(curator: str, room: dict[str, Any]) -> str:
    """Map curator tags consistently for Free Public or Heirloom rooms."""
    raw = (curator or "").strip()
    if room.get("isHeirloom"):
        p1_id = str((room.get("partner1") or {}).get("id") or "Him")
        p2_id = str((room.get("partner2") or {}).get("id") or "Her")
        if raw in ("Me", "Him", p1_id):
            return p1_id
        if raw in ("My Girlfriend", "Her", p2_id):
            return p2_id
        return "Both of Us" if raw == "Both of Us" else (raw or "Both of Us")

    return map_curator_for_edition(raw, "public")


def _normalize_artifacts_for_room(
    artifacts: list[dict[str, Any]], room: dict[str, Any]
) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for item in artifacts:
        if not isinstance(item, dict):
            continue
        cloned = copy.deepcopy(item)
        cloned["curator"] = _map_curator_for_room(str(cloned.get("curator", "")), room)
        normalized.append(cloned)
    return normalized


def build_sample_room() -> dict[str, Any]:
    """Construct the default public Sample Exhibition (Him & Her)."""
    seed = _normalize_artifacts_for_edition(_load_seed_from_disk(), "public")
    return {
        "pin": "SAMPLE",
        "displayPin": "SAMPLE",
        "edition": "public",
        "isSample": True,
        "isHeirloom": False,
        **copy.deepcopy(PARTNER_PRESETS["public"]),
        "heroCameoUrl": "",
        "viewerPasscode": "",
        "proposalPrompt": DEFAULT_PROPOSAL_PROMPT,
        "proposalAccepted": False,
        "proposalRejections": 0,
        "paymentProvider": "",
        "paymentRef": "",
        "foyerNotes": copy.deepcopy(DEFAULT_FOYER_NOTES),
        "artifacts": seed,
    }


# ---------------------------------------------------------------------------
# Cloud Redis REST Backend (Upstash / Vercel Marketplace) + File Persistence
# ---------------------------------------------------------------------------

def _redis_credentials() -> tuple[str, str] | None:
    url = (
        os.environ.get("UPSTASH_REDIS_REST_URL")
        or os.environ.get("KV_REST_API_URL")
        or ""
    ).strip()
    token = (
        os.environ.get("UPSTASH_REDIS_REST_TOKEN")
        or os.environ.get("KV_REST_API_TOKEN")
        or ""
    ).strip()
    if url and token:
        return url.rstrip("/"), token
    return None


def is_cloud_configured() -> bool:
    """Return True when Upstash Redis REST credentials are available."""
    return _redis_credentials() is not None


def _redis_command(*args: str) -> Any:
    creds = _redis_credentials()
    if not creds:
        return None
    base_url, token = creds
    req = urllib.request.Request(
        base_url,
        data=json.dumps(list(args), ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=8) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        return body.get("result")


def _active_local_store_path() -> Path:
    """Pick data/museums.json locally, or /tmp fallback if filesystem is read-only."""
    if os.environ.get("VERCEL"):
        return TMP_MUSEUMS_FILE
    return MUSEUMS_FILE


def _read_local_rooms() -> dict[str, dict[str, Any]]:
    path = _active_local_store_path()
    if not path.exists():
        # Check bundled data/museums.json on cold start if running in /tmp mode
        if path != MUSEUMS_FILE and MUSEUMS_FILE.exists():
            try:
                data = json.loads(MUSEUMS_FILE.read_text(encoding="utf-8"))
                return data if isinstance(data, dict) else {}
            except (OSError, json.JSONDecodeError):
                return {}
        return {}
    try:
        parsed = json.loads(path.read_text(encoding="utf-8"))
        return parsed if isinstance(parsed, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def _write_local_rooms(rooms: dict[str, dict[str, Any]]) -> None:
    path = _active_local_store_path()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = path.with_suffix(".json.tmp")
        tmp_path.write_text(
            json.dumps(rooms, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        os.replace(tmp_path, path)
    except OSError:
        # Fallback to /tmp if project directory is read-only
        TMP_MUSEUMS_FILE.parent.mkdir(parents=True, exist_ok=True)
        TMP_MUSEUMS_FILE.write_text(
            json.dumps(rooms, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )


def _normalize_room_schema(room: dict[str, Any]) -> dict[str, Any]:
    """Ensure room dictionaries carry complete Heirloom/Proposal schema defaults."""
    norm = normalize_pin(room.get("pin")) or "SAMPLE"
    room["pin"] = norm
    room["displayPin"] = format_pin_display(norm)

    if norm == "SAMPLE":
        room["edition"] = "public"
        room["isSample"] = True
        room["isHeirloom"] = False
    else:
        room["edition"] = "public"
        room["isSample"] = bool(room.get("isSample", False))
        room["isHeirloom"] = bool(room.get("isHeirloom", False))

    preset = PARTNER_PRESETS["public"]
    for key in ("partner1", "partner2"):
        raw_partner = room.get(key)
        default_partner = copy.deepcopy(preset[key])
        if isinstance(raw_partner, dict):
            name = str(raw_partner.get("name") or default_partner["name"]).strip()
            pid = str(raw_partner.get("id") or name or default_partner["id"]).strip()
            raw_nick = raw_partner.get("nickname")
            nickname = (
                str(raw_nick).strip()
                if raw_nick is not None
                else default_partner["nickname"]
            )
            room[key] = {"id": pid, "name": name, "nickname": nickname}
        else:
            room[key] = default_partner

    room["shared"] = str(room.get("shared") or preset["shared"]).strip() or "Both of Us"
    room["heroCameoUrl"] = str(room.get("heroCameoUrl") or "").strip()
    room["viewerPasscode"] = str(room.get("viewerPasscode") or "").strip()
    room["proposalPrompt"] = (
        str(room.get("proposalPrompt") or "").strip() or DEFAULT_PROPOSAL_PROMPT
    )
    room["proposalAccepted"] = bool(room.get("proposalAccepted", False))
    try:
        room["proposalRejections"] = max(0, int(room.get("proposalRejections") or 0))
    except (TypeError, ValueError):
        room["proposalRejections"] = 0
    room["paymentProvider"] = str(room.get("paymentProvider") or "").strip()
    room["paymentRef"] = str(room.get("paymentRef") or "").strip()
    if not isinstance(room.get("foyerNotes"), list) or len(room["foyerNotes"]) != 4:
        room["foyerNotes"] = sanitize_foyer_notes(room.get("foyerNotes"))
    if not isinstance(room.get("artifacts"), list):
        room["artifacts"] = []
    return room


def sanitize_room_for_response(
    room: dict[str, Any],
    provided_passcode: str = "",
    enforce_passcode: bool = False,
) -> dict[str, Any]:
    """Return a JSON-safe room copy without raw viewerPasscode, enforcing lock state."""
    sanitized = _normalize_room_schema(copy.deepcopy(room))
    stored_passcode = str(sanitized.pop("viewerPasscode", "") or "")
    has_passcode = bool(stored_passcode)
    sanitized["hasPasscode"] = has_passcode

    pin = sanitized.get("pin")
    locked = bool(
        enforce_passcode
        and has_passcode
        and pin != "SAMPLE"
        and (provided_passcode or "") != stored_passcode
    )
    if locked:
        sanitized["passcodeRequired"] = True
        sanitized["artifacts"] = []
        sanitized["foyerNotes"] = []
        sanitized["heroCameoUrl"] = ""
    else:
        sanitized["passcodeRequired"] = False

    return sanitized


def _apply_heirloom_config(room: dict[str, Any], config: dict[str, Any]) -> None:
    """Apply Heirloom customization fields onto a room dict."""
    p1 = copy.deepcopy(room.get("partner1") or PARTNER_PRESETS["public"]["partner1"])
    p2 = copy.deepcopy(room.get("partner2") or PARTNER_PRESETS["public"]["partner2"])
    old_p1_id = str(p1.get("id") or "Him")
    old_p2_id = str(p2.get("id") or "Her")

    if "partner1Name" in config:
        name1 = str(config.get("partner1Name") or "").strip()[:48]
        if name1:
            p1["name"] = name1
            p1["id"] = name1
    if "partner1Nickname" in config:
        p1["nickname"] = str(config.get("partner1Nickname") or "").strip()[:48]

    if "partner2Name" in config:
        name2 = str(config.get("partner2Name") or "").strip()[:48]
        if name2:
            p2["name"] = name2
            p2["id"] = name2
    if "partner2Nickname" in config:
        p2["nickname"] = str(config.get("partner2Nickname") or "").strip()[:48]

    room["partner1"] = p1
    room["partner2"] = p2

    new_p1_id = str(p1.get("id") or old_p1_id)
    new_p2_id = str(p2.get("id") or old_p2_id)
    if (new_p1_id != old_p1_id or new_p2_id != old_p2_id) and isinstance(room.get("artifacts"), list):
        for artifact in room["artifacts"]:
            if not isinstance(artifact, dict):
                continue
            cur = str(artifact.get("curator") or "")
            if cur == old_p1_id:
                artifact["curator"] = new_p1_id
            elif cur == old_p2_id:
                artifact["curator"] = new_p2_id

    if "heroCameoUrl" in config:
        room["heroCameoUrl"] = str(config.get("heroCameoUrl") or "").strip()

    if "viewerPasscode" in config:
        room["viewerPasscode"] = str(config.get("viewerPasscode") or "").strip()[:32]

    if "proposalPrompt" in config:
        prompt = str(config.get("proposalPrompt") or "").strip()[:300]
        room["proposalPrompt"] = prompt or DEFAULT_PROPOSAL_PROMPT


def _fetch_json_get(
    url: str, bearer_token: str, provider_label: str
) -> tuple[dict[str, Any] | None, int, str]:
    """Fetch JSON from an upstream payment verification endpoint."""
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {bearer_token}",
            "Accept": "application/json",
            "User-Agent": "OurLoveMuseum/1.0",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        if not isinstance(body, dict):
            return None, 402, f"{provider_label} verification returned an invalid response."
        return body, 200, ""
    except urllib.error.HTTPError as exc:
        err_msg = f"{provider_label} payment verification failed."
        try:
            err_body = json.loads(exc.read().decode("utf-8"))
            if isinstance(err_body, dict) and err_body.get("message"):
                err_msg = str(err_body["message"])
        except Exception:
            pass
        return None, 402, err_msg
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        return None, 502, f"Unable to verify {provider_label} transaction: {exc}"


def _verify_payment_transaction(provider: str, reference: str) -> tuple[bool, int, str]:
    """Verify payment reference against Paystack/Flutterwave when secret keys exist."""
    if provider == "paystack":
        secret = os.environ.get("PAYSTACK_SECRET_KEY", "").strip()
        if not secret:
            return True, 200, ""
        url = (
            "https://api.paystack.co/transaction/verify/"
            f"{urllib.parse.quote(reference, safe='')}"
        )
        body, status, err = _fetch_json_get(url, secret, "Paystack")
        if body is None:
            return False, status, err
        tx_data = body.get("data")
        if not body.get("status") or not isinstance(tx_data, dict) or tx_data.get("status") != "success":
            return False, 402, "Paystack transaction was not marked successful."
        currency = str(tx_data.get("currency") or "").upper()
        amount = tx_data.get("amount")
        if amount is not None:
            try:
                numeric_amount = float(amount)
            except (TypeError, ValueError):
                numeric_amount = None
            if numeric_amount is not None:
                if currency == "NGN" and numeric_amount < HEIRLOOM_PRICE_NGN * 100:
                    return False, 402, "Paystack payment amount is below the Heirloom price."
                if currency == "USD" and numeric_amount < HEIRLOOM_PRICE_USD * 100:
                    return False, 402, "Paystack payment amount is below the Heirloom price."
        return True, 200, ""

    if provider == "flutterwave":
        secret = os.environ.get("FLUTTERWAVE_SECRET_KEY", "").strip()
        if not secret:
            return True, 200, ""
        url = (
            "https://api.flutterwave.com/v3/transactions/verify_by_reference"
            f"?tx_ref={urllib.parse.quote(reference, safe='')}"
        )
        body, status, err = _fetch_json_get(url, secret, "Flutterwave")
        if body is None:
            return False, status, err
        tx_data = body.get("data")
        if (
            body.get("status") != "success"
            or not isinstance(tx_data, dict)
            or tx_data.get("status") != "successful"
        ):
            return False, 402, "Flutterwave transaction was not marked successful."
        currency = str(tx_data.get("currency") or "").upper()
        amount = tx_data.get("amount")
        if amount is not None:
            try:
                numeric_amount = float(amount)
            except (TypeError, ValueError):
                numeric_amount = None
            if numeric_amount is not None:
                if currency == "NGN" and numeric_amount < HEIRLOOM_PRICE_NGN:
                    return False, 402, "Flutterwave payment amount is below the Heirloom price."
                if currency == "USD" and numeric_amount < HEIRLOOM_PRICE_USD:
                    return False, 402, "Flutterwave payment amount is below the Heirloom price."
        return True, 200, ""

    return True, 200, ""


def get_room(pin: str | None) -> dict[str, Any] | None:
    """Fetch a museum room by PIN (or return SAMPLE / FOUNDERS if requested)."""
    norm = normalize_pin(pin) or "SAMPLE"

    if norm == "SAMPLE":
        return build_sample_room()

    # Check cloud store first when configured
    if is_cloud_configured():
        try:
            raw = _redis_command("GET", f"museum:room:{norm}")
            if isinstance(raw, str) and raw:
                room = json.loads(raw)
                if isinstance(room, dict):
                    return _normalize_room_schema(room)
        except (urllib.error.URLError, json.JSONDecodeError, TimeoutError):
            pass

    with STORAGE_LOCK:
        rooms = _read_local_rooms()
        if norm in rooms and isinstance(rooms[norm], dict):
            return _normalize_room_schema(copy.deepcopy(rooms[norm]))

    return None


def save_room(room: dict[str, Any]) -> dict[str, Any]:
    """Persist a museum room to Cloud Redis (if configured) and local JSON."""
    norm = normalize_pin(room.get("pin"))
    if not norm:
        raise ValueError("Museum room requires a valid pin")

    room["pin"] = norm
    room["displayPin"] = format_pin_display(norm)
    _normalize_room_schema(room)

    if is_cloud_configured():
        try:
            _redis_command(
                "SET",
                f"museum:room:{norm}",
                json.dumps(room, ensure_ascii=False),
            )
        except (urllib.error.URLError, TimeoutError) as exc:
            raise RuntimeError(f"Cloud storage error: {exc}") from exc

    with STORAGE_LOCK:
        rooms = _read_local_rooms()
        rooms[norm] = room
        _write_local_rooms(rooms)

    return room


def generate_unique_pin() -> str:
    """Generate a unique 6-character PIN not colliding with existing rooms."""
    for _ in range(25):
        candidate = "".join(secrets.choice(PIN_ALPHABET) for _ in range(6))
        if candidate == "SAMPLE":
            continue
        if get_room(candidate) is None:
            return candidate
    raise RuntimeError("Could not allocate a unique museum PIN")


def sanitize_foyer_notes(raw_notes: Any) -> list[dict[str, str]]:
    """Build 4 validated Foyer notes, falling back per slot to defaults."""
    if not isinstance(raw_notes, list) or not raw_notes:
        return copy.deepcopy(DEFAULT_FOYER_NOTES)

    result: list[dict[str, str]] = []
    for idx, default_note in enumerate(DEFAULT_FOYER_NOTES):
        entry = raw_notes[idx] if idx < len(raw_notes) and isinstance(raw_notes[idx], dict) else {}
        title = str(entry.get("title") or "").strip() or default_note["title"]
        body = str(entry.get("body") or "").strip() or default_note["body"]
        result.append({
            "id": default_note["id"],
            "title": title[:80],
            "body": body[:320],
        })
    return result


def create_public_museum(payload: dict[str, Any]) -> dict[str, Any]:
    """Validate >= 3 compulsory memories, generate PIN, and store new public room."""
    raw_artifacts = payload.get("artifacts")
    if not isinstance(raw_artifacts, list) or len(raw_artifacts) < 3:
        raise ValueError(
            "Please curate at least 3 memories before generating your museum PIN."
        )

    cleaned_artifacts: list[dict[str, Any]] = []
    rest_slants = [-3.6, 3.3, -2.8, 4.0, -3.9, 2.9, -3.1, 3.7]
    for idx, raw_item in enumerate(raw_artifacts):
        if not isinstance(raw_item, dict):
            continue
        title = str(raw_item.get("title") or "").strip()
        date = str(raw_item.get("date") or "").strip()
        story = str(raw_item.get("story") or "").strip()
        if not title or not date or not story:
            continue
        cleaned_artifacts.append({
            "id": str(raw_item.get("id") or f"art-{idx + 1}-{secrets.token_hex(3)}"),
            "catalogNumber": f"ARTIFACT #{str(idx + 1).zfill(2)}",
            "title": title[:100],
            "date": date[:60],
            "curator": map_curator_for_edition(str(raw_item.get("curator") or "Both of Us"), "public"),
            "wing": str(raw_item.get("wing") or "First Chapters & Sparks"),
            "frameStyle": str(raw_item.get("frameStyle") or "Rectangular Lace Frame"),
            "featured": bool(raw_item.get("featured", idx < 4)),
            "slant": float(raw_item.get("slant", rest_slants[idx % len(rest_slants)])),
            "story": story[:1200],
            "secretNote": str(raw_item.get("secretNote") or "").strip()[:240],
            "tags": raw_item.get("tags") if isinstance(raw_item.get("tags"), list) else [],
            "imageUrl": str(raw_item.get("imageUrl") or "").strip(),
        })

    if len(cleaned_artifacts) < 3:
        raise ValueError(
            "At least 3 complete memories (with title, date, and story) are required."
        )

    if len(cleaned_artifacts) > FREE_MEMORY_LIMIT:
        raise HeirloomRequiredError(
            f"Free museums hold up to {FREE_MEMORY_LIMIT} memories. "
            "Unlock Heirloom to hang unlimited memories."
        )

    foyer_notes = sanitize_foyer_notes(payload.get("foyerNotes"))
    pin = generate_unique_pin()
    room = {
        "pin": pin,
        "displayPin": format_pin_display(pin),
        "edition": "public",
        "isSample": False,
        "isHeirloom": False,
        **copy.deepcopy(PARTNER_PRESETS["public"]),
        "heroCameoUrl": "",
        "viewerPasscode": "",
        "proposalPrompt": DEFAULT_PROPOSAL_PROMPT,
        "proposalAccepted": False,
        "proposalRejections": 0,
        "paymentProvider": "",
        "paymentRef": "",
        "foyerNotes": foyer_notes,
        "artifacts": cleaned_artifacts,
    }
    return save_room(room)


def _resolve_room_pin_param(qs: dict[str, list[str]]) -> str:
    raw_pin = qs.get("pin", [""])[0]
    norm = normalize_pin(raw_pin)
    return norm or "SAMPLE"


def handle_api_request(
    method: str,
    path: str,
    qs: dict[str, list[str]],
    payload: Any = None,
) -> tuple[int, Any]:
    """Unified router shared by local server.py and Vercel api/index.py."""
    clean_path = "/" + path.strip("/")

    if clean_path == "/api/config" and method == "GET":
        return 200, {
            "edition": get_configured_edition(),
            "cloudSynced": is_cloud_configured(),
            "freeMemoryLimit": FREE_MEMORY_LIMIT,
            "payments": {
                "paystackPublicKey": os.environ.get("PAYSTACK_PUBLIC_KEY", "").strip(),
                "flutterwavePublicKey": os.environ.get("FLUTTERWAVE_PUBLIC_KEY", "").strip(),
                "morCheckoutUrl": os.environ.get("MOR_CHECKOUT_URL", "").strip(),
                "heirloomPriceNgn": HEIRLOOM_PRICE_NGN,
                "heirloomPriceUsd": HEIRLOOM_PRICE_USD,
            },
        }

    if clean_path == "/api/museums":
        if method == "GET":
            raw_pin = qs.get("pin", [""])[0]
            norm = normalize_pin(raw_pin) or "SAMPLE"
            room = get_room(norm)
            if not room:
                return 404, {"error": "No museum found with that PIN. Please check the code and try again."}
            provided_passcode = (qs.get("passcode", [""])[0] or "").strip()
            return 200, sanitize_room_for_response(
                room,
                provided_passcode=provided_passcode,
                enforce_passcode=True,
            )

        if method == "POST":
            if not isinstance(payload, dict):
                return 400, {"error": "Expected a JSON object for museum setup."}
            try:
                room = create_public_museum(payload)
            except HeirloomRequiredError as exc:
                return 402, {"error": str(exc), "code": "HEIRLOOM_REQUIRED"}
            except ValueError as exc:
                return 400, {"error": str(exc)}
            except RuntimeError as exc:
                return 502, {"error": str(exc)}
            return 201, {
                "ok": True,
                "pin": room["pin"],
                "displayPin": room["displayPin"],
                "museum": sanitize_room_for_response(room),
            }

        if method == "PUT":
            pin = _resolve_room_pin_param(qs)
            if pin == "SAMPLE":
                return 403, {"error": "The sample exhibition is read-only."}
            room = get_room(pin)
            if not room:
                return 404, {"error": "Museum room not found."}
            if not isinstance(payload, dict):
                return 400, {"error": "Expected a JSON object."}
            if "foyerNotes" in payload:
                room["foyerNotes"] = sanitize_foyer_notes(payload["foyerNotes"])
            if room.get("isHeirloom"):
                _apply_heirloom_config(room, payload)
            try:
                saved = save_room(room)
            except RuntimeError as exc:
                return 502, {"error": str(exc)}
            return 200, {"ok": True, "museum": sanitize_room_for_response(saved)}

        return 405, {"error": "Method not allowed"}

    if clean_path == "/api/payment":
        if method != "POST":
            return 405, {"error": "Method not allowed"}
        if not isinstance(payload, dict):
            return 400, {"error": "Expected a JSON object for payment."}

        pin = normalize_pin(payload.get("pin") or qs.get("pin", [""])[0])
        if not pin:
            return 400, {"error": "Museum PIN is required for payment."}
        if pin == "SAMPLE":
            return 403, {"error": "The sample exhibition cannot be upgraded."}

        room = get_room(pin)
        if not room:
            return 404, {"error": "Museum room not found."}

        provider = str(payload.get("provider") or "").strip().lower()
        if provider not in ("paystack", "flutterwave", "mor", "sandbox"):
            return 400, {"error": "Unsupported payment provider."}

        reference = str(payload.get("reference") or "").strip()
        if not reference:
            return 400, {"error": "Payment reference is required."}

        ok, err_status, err_msg = _verify_payment_transaction(provider, reference)
        if not ok:
            return err_status, {"error": err_msg}

        room["isHeirloom"] = True
        room["paymentProvider"] = provider
        room["paymentRef"] = reference
        heirloom_config = payload.get("heirloomConfig")
        if isinstance(heirloom_config, dict):
            _apply_heirloom_config(room, heirloom_config)

        try:
            saved = save_room(room)
        except RuntimeError as exc:
            return 502, {"error": str(exc)}
        return 200, {"ok": True, "museum": sanitize_room_for_response(saved)}

    if clean_path == "/api/proposal":
        if method != "POST":
            return 405, {"error": "Method not allowed"}
        if not isinstance(payload, dict):
            return 400, {"error": "Expected a JSON object for proposal response."}

        pin = normalize_pin(payload.get("pin") or qs.get("pin", [""])[0])
        if not pin:
            return 400, {"error": "Museum PIN is required."}

        accepted = bool(payload.get("accepted"))
        if pin == "SAMPLE":
            return 200, {"ok": True, "ephemeral": True, "proposalAccepted": accepted}

        room = get_room(pin)
        if not room:
            return 404, {"error": "Museum room not found."}

        try:
            rejections_count = max(0, int(payload.get("rejectionsCount") or 0))
        except (TypeError, ValueError):
            return 400, {"error": "rejectionsCount must be an integer."}

        room["proposalAccepted"] = accepted
        room["proposalRejections"] = rejections_count

        try:
            save_room(room)
        except RuntimeError as exc:
            return 502, {"error": str(exc)}
        return 200, {"ok": True, "proposalAccepted": room["proposalAccepted"]}

    if clean_path == "/api/artifacts" or clean_path.startswith("/api/artifacts/"):
        pin = _resolve_room_pin_param(qs)
        room = get_room(pin)
        if not room:
            return 404, {"error": "Museum room not found."}

        if method == "GET":
            stored_passcode = str(room.get("viewerPasscode") or "").strip()
            provided_passcode = (qs.get("passcode", [""])[0] or "").strip()
            if (
                stored_passcode
                and pin != "SAMPLE"
                and provided_passcode != stored_passcode
            ):
                return 403, {
                    "error": "Passcode required to view memories.",
                    "code": "PASSCODE_REQUIRED",
                }
            return 200, room.get("artifacts", [])

        if method == "POST":
            artifacts = room.get("artifacts", [])
            if isinstance(payload, list):
                updated = _normalize_artifacts_for_room(payload, room)
            elif isinstance(payload, dict):
                item = copy.deepcopy(payload)
                item["curator"] = _map_curator_for_room(str(item.get("curator", "")), room)
                artifact_id = item.get("id")
                if artifact_id and any(a.get("id") == artifact_id for a in artifacts):
                    updated = [item if a.get("id") == artifact_id else a for a in artifacts]
                else:
                    updated = [*artifacts, item]
            else:
                return 400, {"error": "Payload must be an artifact object or array."}

            if (
                pin != "SAMPLE"
                and not room.get("isHeirloom")
                and len(updated) > FREE_MEMORY_LIMIT
            ):
                return 402, {
                    "error": (
                        "Free museums hold up to 8 memories. "
                        "Unlock Heirloom to hang unlimited memories."
                    ),
                    "code": "HEIRLOOM_REQUIRED",
                }

            if pin == "SAMPLE":
                return 200, {"ok": True, "ephemeral": True, "artifacts": updated}

            room["artifacts"] = updated
            try:
                save_room(room)
            except RuntimeError as exc:
                return 502, {"error": str(exc)}
            return 200, {"ok": True, "artifacts": updated}

        if method == "DELETE":
            artifact_id = ""
            if clean_path.startswith("/api/artifacts/"):
                artifact_id = clean_path.split("/api/artifacts/", 1)[1]
            else:
                artifact_id = qs.get("id", [""])[0]
            if not artifact_id:
                return 400, {"error": "Missing artifact id."}

            updated = [a for a in room.get("artifacts", []) if a.get("id") != artifact_id]
            if pin == "SAMPLE":
                return 200, {"ok": True, "ephemeral": True, "artifacts": updated}

            room["artifacts"] = updated
            try:
                save_room(room)
            except RuntimeError as exc:
                return 502, {"error": str(exc)}
            return 200, {"ok": True, "artifacts": updated}

        return 405, {"error": "Method not allowed"}

    return 404, {"error": "Endpoint not found"}

