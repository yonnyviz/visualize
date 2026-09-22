# `/visualize` Skill — Live Web Visualization Canvas

**Status:** M1 Implementation (server + skill wiring)  
**Version:** 0.1.0

---

## Overview

A Pi skill that renders explanations as live visual artifacts on a self-contained web canvas.

Commands:
- `/visualize <thing>` — append a panel (title + prose + Mermaid diagram)
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
Appends a new panel to the canvas.

**Prompt:** Generates `{title, prose, mermaid}` and POSTs to `/panel`.

Example:
```
/visualize OmniSense data pipeline
→ Creates panel: title="OmniSense Data Pipeline"
               prose="Describes flow..."
               mermaid="flowchart LR A→B→C..."
```

### `/visualize-clear`
Clears all panels from the canvas (without stopping server).

### `/visualize-close`
Stops the server and closes the browser tab (if open).

---

## Configuration

| Setting | Default | Notes |
|---|---|---|
| Port | 7788 | Auto-fallback to next port if taken (future: make configurable) |
| Idle timeout | 30 min | Auto-exit if no requests received |
| Poll interval | 1s | Client-side fetch frequency |

---

## M1 Status

- [x] Server skeleton (`server.js`)
- [x] Plain page with polling (`public/index.html`)
- [x] SKILL.md (this file)
- [ ] Prompt templates (`/visualize`, `/visualize-clear`, `/visualize-close`)
- [ ] End-to-end testing

**Next:** Wire the prompt templates and test locally.

---

## Notes

- **No dependencies** — uses Node.js built-in `http` module only
- **Ephemeral by design** — panels live only in memory; gone on server exit
- **Unstyled for M1** — CSS/theming deferred to M3
- **Mermaid rendering** — deferred to M2
