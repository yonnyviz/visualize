# `/visualize` Skill — Live Web Visualization Canvas

**Status:** v1.1 Complete (server + skill wiring + Mermaid + theming + forge metadata card)  
**Version:** 1.1.0

---

## Overview

A Pi skill that renders explanations as live visual artifacts on a self-contained web canvas.

Commands:
- `/visualize <thing>` — append a panel (title + prose + Mermaid diagram, LLM-inferred)
- `/visualize-forge [path]` — render a forge initiative's metadata.json as a diagram (deterministic)
- `/visualize-clear` — clear all panels
- `/visualize-close` — shut down server and close tab

---

## How It Works

### Server Process
- Minimal Node.js HTTP server (`server.js`)
- Runs on `localhost:7788`
- Endpoints:
  - `GET /` — serves the canvas page
  - `POST /panel` — accept `{title, prose, mermaid}` JSON, append to panel list
  - `GET /panels` — return current panels as JSON
- Auto-exits after 30min idle

### Client Page
- Plain HTML with 1s poll loop
- Fetches `/panels` every 1s, renders new panels as they arrive
- Auto-scrolls to newest panel
- No styling yet (M3); bare divs for M1

### Skill Wiring
- Three prompt templates: `/visualize`, `/visualize-clear`, `/visualize-close`
- Each checks if server is running; starts it if needed
- `/visualize` opens browser on first call only
- POSTs to `/panel` with agent-generated content

---

## Commands

### `/visualize <thing>`
Appends a new panel to the canvas (LLM-generated).

**Prompt:** Generates `{title, prose, mermaid}` and POSTs to `/panel`.

Example:
```
/visualize OmniSense data pipeline
→ Creates panel: title="OmniSense Data Pipeline"
               prose="Describes flow..."
               mermaid="flowchart LR A→B→C..."
```

### `/visualize-forge [path]`
Renders a forge initiative's metadata as a live **summary card** (fully deterministic, no LLM).

**Syntax:** 
```
/visualize-forge                    # reads .forge/metadata.json in cwd
/visualize-forge path/to/metadata.json  # explicit path
```

**Output:** Summary card with:
- **Stat tiles** — Stage, DoD progress (with bar), Active Blockers, Open Questions, Decisions
  - Tone-colored left borders: 🟢 ok (done), 🔴 bad (blocked), 🟠 warn (paused), 🔵 info (planning/review)
  - DoD shows percentage + progress bar
- **Sections** (only if non-empty):
  - Next Action (current focus)
  - Definition of Done (full checklist with ✓/○ markers)
  - Active Blockers (⚠ markers if any)
  - Open Questions (? markers if any)
  - Recent Progress (last 5 of N entries with timestamps)

**Example:**
```
/visualize-forge .forge/metadata.json
→ Renders card: DONE | 5/5 DoD (100%) | 0 blockers | 2 questions | 6 decisions
              + Next Action, DoD checklist, recent progress (5 entries)
```

**Technical:**
- **Deterministic mapping** — schema is hardcoded, no LLM. Same metadata always produces identical card.
- **Structured data** — mapper emits plain objects, canvas escapes every string (XSS-safe).
- **Reusable** — call multiple times to track initiative evolution
- **Error handling** — malformed JSON shows inline error banner in the card
- **Theming support** — inherits the canvas theme (dark/light toggle applies); stat tile colors adapt

### `/visualize-clear`
Clears all panels from the canvas (without stopping server).

**Prompt:** Deterministic only — kills and restarts the server to wipe memory.

### `/visualize-close`
Stops the server and closes the browser tab (if open).

**Prompt:** Deterministic only — kills process on port 7788.

---

## Configuration

| Setting | Default | Notes |
|---|---|---|
| Port | 7788 | Auto-fallback to next port if taken (future: make configurable) |
| Idle timeout | 30 min | Auto-exit if no requests received |
| Poll interval | 1s | Client-side fetch frequency |

---

## v1 & v1+ Status

**v1.0 (Complete):**
- [x] Server skeleton (`server.js`) with GET /panels, POST /panel endpoints
- [x] Canvas page with 1s polling, Mermaid rendering, dark/light theming (`public/index.html`)
- [x] SKILL.md (this file)
- [x] Three executable prompt templates at `~/.pi/agent/prompts/` (/visualize, /visualize-clear, /visualize-close)
- [x] End-to-end testing (M1-M4: OmniSense ETL, Jenkins deployment, QA timeline)
- [x] GitHub repo published (https://github.com/yonnyviz/visualize) with README

**v1.1 (Current):**
- [x] `/visualize-forge` deterministic metadata visualization (summary card + stats tiles + checklist)
- [x] Card rendering path in canvas (renderCard + scoped CSS + tone colors)
- [x] Full test suite (33 assertions) for metadata-mapper

**v2 (Future):**
- [ ] Port conflict auto-fallback (instead of fixed 7788)
- [ ] Smoke test automation with artifact capture (Playwright)
- [ ] Export/share panels (PNG, SVG, markdown)
- [ ] Expanded diagram types (C4, quadrant, pie charts)
- [x] Prompt templates (`/visualize`, `/visualize-clear`, `/visualize-close`)
- [x] End-to-end testing (M1-M4 complete, published to GitHub)
- [x] `/visualize-forge` deterministic metadata visualization (M5+ feature)

**Status:** v1.0 complete. v1+ features rolling out (deterministic visualization, edge case handling).

---

## Notes

- **No dependencies** — uses Node.js built-in `http` module only
- **Ephemeral by design** — panels live only in memory; gone on server exit
- **Dual output modes** — `/visualize` posts Mermaid diagrams (LLM-inferred), `/visualize-forge` posts structured cards (deterministic schema mapping)
- **Reusable mappers** — `lib/metadata-mapper.js` exported functions (`metadataToCard`) for standalone use
- **Mermaid support** — renders all 6 diagram types (flowchart, sequence, mindmap, ER, state, timeline) with error handling
- **Card UI** — stat tiles with tone colors, checklist markers (✓/○/⚠), progress bars, timestamps
- **Dark/light themes** — CSS variables + localStorage for sticky user choice, system prefers-color-scheme on first load
