# The Museum of Us

A romantic digital love museum crafted in **crimson velvet (`#920d25`)**, **warm champagne (`#f4dfc9`)**, **parchment ivory (`#f9eede`)**, and **crisp white (`#ffffff`)**—designed as a keepsake space for couples to curate memories, heirloom lace frames, and love letters.

---

## Key Features

### 1. Tactile Museum Architecture
- **The Foyer:** Oversized display typography featuring an oval `"O"` cameo frame (`images/love1.jpg` or a custom couple portrait), an illuminated glass cloche holding an eternal rose and vow scroll, and four orbiting wax-sealed floating love letters.
- **Unified Museum Gallery:**
  - **Heirloom Lace Display Cases:** Scalloped rectangular (`border-image`) and oval cameo SVG-masked lace frames arranged collage-style over a crimson backdrop.
  - **Wavy String Memory Wall:** Slanted memory cards hung from punched top eyelets (`card-eyelet`) along a dynamic SVG Bézier thread with foreground thread-through overlays and scroll-velocity pendulum sway.
  - **Unsealable Secret Notes & Lace Lightbox:** Every artifact opens inside a large lace display lightbox with an optional hidden note drawer on the back.
- **The Curatorial Vault:** Hand-drawn border frame for adding new memories, downloading JSON archive backups, or importing saved collections.

### 2. Couple Setup, PIN Sharing & Heirloom Unlock
- **Sample Exhibition (`/`):** Visitors first explore the live sample gallery (`Him` & `Her`) with clear buttons to **Create Your Own Museum** (`/setup`) or **Enter PIN** (`/setup#join`).
- **Guided Setup Flow (`/setup`):** Write 4 custom Foyer love letters upfront (or fill defaults with one click), curate **at least 3 compulsory memories**, and receive a **unique 6-character PIN** + shareable partner link (`/?pin=XXXXXX`).
- **Heirloom Unlock Tier (`POST /api/payment`):** Optional one-time unlock (`₦5,000` / `$7`) supporting **Paystack** (Card, Bank Transfer, USSD, OPay), **Flutterwave**, and an external **Merchant of Record** URL (`MOR_CHECKOUT_URL`), with instant sandbox demo mode when keys are unset:
  - Custom partner names with subtle hover/tap nickname reveals
  - Custom oval Hero `"O"` cameo photo upload
  - Unlimited memories (lifts the 8-memory free tier cap)
  - Optional 4-digit viewer passcode gate (`viewerPasscode`)
  - **Interactive Proposal Link (`/proposal?pin=XXXXXX`):** The `"No"` button playfully dodges on tries 1 and 2 with creative *"Are you sure?"* prompts while scaling up `"Yes"`, and allows rejection on the 3rd attempt.

---

## Project Structure

```text
.
├── api/
│   └── index.py        # Vercel Python Serverless Function entrypoint (/api/*)
├── data/
│   └── artifacts.json  # Initial curated sample artifacts
├── images/
│   └── love1.jpg       # Default oval "O" cameo illustration
├── index.html          # Main Museum exhibition (Foyer, Gallery, Vault, Modals)
├── styles.css          # Full design system, lace frames, animations & mobile layout
├── app.js              # Exhibition state, lace SVG builder, wavy string physics, Heirloom UI
├── setup.html          # Museum Creation Wizard & PIN Login page
├── setup.js            # Foyer editor, 3-memory queue, PIN generator & Heirloom checkout
├── proposal.html       # Interactive Heirloom proposal landing page
├── proposal.js         # 2-dodge + 3rd-try rejection logic & heart celebration
├── museum_store.py     # Shared cloud Redis REST + local JSON store & API router
├── server.py           # Zero-dependency local HTTP + API dev server (ports 3000 / 8080)
├── vercel.json         # Clean URL rewrites & serverless file includes
├── publish.ps1         # Optional PowerShell helper for GitHub push & Vercel deploy
├── README.md
└── .gitignore
```

---

## Running Locally

Requires **Python 3.10+** (uses only the Python standard library; no `npm` or `pip` installation needed).

```powershell
python server.py
```

Then open in your browser:
- **Sample Exhibition:** `http://localhost:3000/`
- **Create Museum / PIN Login:** `http://localhost:3000/setup`
- **Proposal Preview:** `http://localhost:3000/proposal?pin=SAMPLE`

Local rooms created during development are stored in `data/museums.json` (git-ignored).

---

## Cloud Deployment (GitHub + Vercel)

### Environment Variables (Set in Vercel Project Settings)
| Variable | Purpose | Required? |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST credentials (or `KV_REST_API_URL` / `KV_REST_API_TOKEN`) for persistent cloud rooms across devices | Recommended |
| `PAYSTACK_PUBLIC_KEY` / `PAYSTACK_SECRET_KEY` | Live Paystack verification for Heirloom Unlock (Nigerian payments) | Optional (uses sandbox mode if unset) |
| `FLUTTERWAVE_PUBLIC_KEY` / `FLUTTERWAVE_SECRET_KEY` | Live Flutterwave verification for Heirloom Unlock | Optional |
| `MOR_CHECKOUT_URL` | External Merchant of Record checkout link (e.g. Lemon Squeezy / Polar) for international couples | Optional |

