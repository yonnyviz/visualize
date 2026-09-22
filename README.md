# /visualize Skill — Live Web Visualization Canvas

A Pi skill that renders explanations as live visual artifacts on a self-contained web canvas. Create beautiful, interactive diagrams (Mermaid) in real-time without leaving your workflow.

## ✨ Features

- **6 Diagram Types** — flowchart, sequence, mindmap, ER, state, timeline
- **Live Canvas** — Server auto-starts; real-time polling updates
- **Dark & Light Themes** — CSS variables, localStorage persistence
- **Minimal Infrastructure** — 40-line server, no websockets, no heavy frameworks
- **Error Handling** — Shows syntax errors + raw code, not blank panels
- **Beautiful UX** — Responsive cards, auto-scroll, polished typography

## 🚀 Quick Start

### Installation

Copy the skill to your Pi agent directory:

```bash
cp -r visualize ~/.pi/agent/skills/
cp visualize/templates/visualize.md ~/.pi/agent/prompts/visualize.md
cp visualize/templates/visualize-clear.md ~/.pi/agent/prompts/visualize-clear.md
cp visualize/templates/visualize-close.md ~/.pi/agent/prompts/visualize-close.md
```

### Usage

In any Pi session, use:

```
/visualize OmniSense data pipeline architecture
```

The server auto-starts (first call only), opens your browser to `http://localhost:7788`, and renders the diagram live.

### Commands

| Command | Purpose |
|---------|---------|
| `/visualize <thing>` | Add a visualization panel for *thing* |
| `/visualize-clear` | Clear all panels (restart server) |
| `/visualize-close` | Stop server and close browser tab |

## 📋 Diagram Types & Styling

Each Mermaid diagram type has different capabilities:

| Type | Best For | Styling |
|------|----------|---------|
| **flowchart** | Hierarchies, architectures, workflows | ✅ Full `style NODE fill:#color` |
| **sequenceDiagram** | Actor interactions, message flows | ❌ No style directive |
| **mindmap** | Concept trees, hierarchies | ✅ Basic styling |
| **stateDiagram** | State machines, workflows | ✅ State styling |
| **erDiagram** | Entity relationships | ⚠️ Minimal styling |
| **timeline** | Timelines, phase sequences | ✅ Basic styling |

**Rule:** Only use `style` commands with `flowchart`, `mindmap`, and `stateDiagram`. Other types will parse error if you add style directives.

## 🎨 Theming

### Dark & Light Modes

The canvas respects your OS color scheme on first load (`prefers-color-scheme`) and allows manual toggle via the header button (🌙/☀️). Your choice is saved to localStorage.

**Dark Theme** (dark-technical)
- Primary: `#1e2d42` (deep blue)
- Text: `#e0e6ed` (light gray)
- Accents: Technical, high contrast

**Light Theme** (light-editorial)
- Primary: `#f8f9fb` (warm white)
- Text: `#2c3e50` (dark gray)
- Accents: Warm, editorial

Mermaid diagrams use theme-appropriate `themeVariables` automatically.

## 🏗️ Architecture

### Server (`server.js`)

Minimal HTTP server with:
- `POST /panel` — Accept `{title, prose, mermaid}` JSON payload
- `GET /panels` — Return all panels as JSON array
- `GET /` — Serve the canvas HTML
- 30-minute idle auto-exit (safety net)
- No dependencies, ~40 lines

### Client (`public/index.html`)

Single-page HTML with:
- 1-second polling loop to fetch new panels
- Mermaid.js (CDN) diagram rendering
- Error handling: shows error box + raw code for invalid syntax
- Auto-scroll to newest panel
- Dark/light theme toggle with localStorage persistence

### Prompt Templates

LLM-powered panel generation:
- `visualize.md` — Main command, LLM generates `{title, prose, mermaid}`
- `visualize-clear.md` — Restart server
- `visualize-close.md` — Kill server + close browser

**Critical:** Templates include diagram-type constraints so the LLM knows which diagram types support styling.

## 🔧 Configuration

### Port

Default: **7788**

If port is busy, stop the server first:

```bash
/visualize-close
# Then retry /visualize
```

### Idle Timeout

Default: **30 minutes**

Server auto-exits if no requests for 30 minutes. No explicit shutdown needed (though `/visualize-close` is cleaner).

## 📊 Real-World Examples

### Example 1: OmniSense Data Pipeline

```
/visualize the OmniCollect data pipeline: Orchestrator → Collector → Promoter 
workers, SQS queues, S3 buckets (staging/prod), Glue, SPICE refresh
```

Generates a complex flowchart with subgraphs showing the distributed ETL architecture.

### Example 2: Jenkins Deployment Flow

```
/visualize the OmniSense Jenkins deployment as a sequence diagram with actors:
Jenkins, Parameter Store, S3, CloudFormation, CodePipeline. Show the two-stage 
deployment: OmniCollect first, then OmniAccess with cross-stack imports.
```

Generates a sequence diagram showing parameter flow and deployment order.

### Example 3: QA Test Phases

```
/visualize the OmniSense QA phases as a timeline: 6 phases from Bring-Up 
(done) through Production (WIP), with status indicators.
```

Generates a timeline showing phase progression and completion status.

## 🚫 Known Limitations (v1)

- **Ephemeral** — Panels are stored in-memory only; no persistence. Refresh loses data. *(v2: add persistence)*
- **No Export** — Can't save/share panels as images yet. *(v2: PNG/SVG export)*
- **No Multi-Panel Grid** — Vertical card stack only. *(v2: optional tabs/groups)*
- **Fixed Port** — No auto-selection if 7788 is busy. *(v2: port negotiation)*

## 🛠️ Development

### Project Structure

```
visualize/
├── server.js              # HTTP server (POST /panel, GET /panels)
├── public/
│   └── index.html         # Single-page canvas UI
├── SKILL.md               # Skill definition
├── templates/
│   ├── visualize.md       # /visualize prompt template
│   ├── visualize-clear.md # /visualize-clear template
│   └── visualize-close.md # /visualize-close template
└── README.md              # This file
```

### Running Locally (Manual)

```bash
# Start server
node ~/.pi/agent/skills/visualize/server.js

# In another terminal, post a panel
curl -X POST http://localhost:7788/panel \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Example",
    "prose": "A simple diagram",
    "mermaid": "flowchart LR\n  A --> B --> C"
  }'

# Open browser
open http://localhost:7788
```

### Mermaid Syntax

Refer to [Mermaid.js Docs](https://mermaid.js.org) for diagram syntax.

Quick reference:
- **Flowchart:** `flowchart LR\n  A[Node] --> B`
- **Sequence:** `sequenceDiagram\n  actor A\n  A->>B: message`
- **Timeline:** `timeline\n  Phase 1 : done\n  Phase 2 : active`
- **Mindmap:** `mindmap\n  root\n    child1\n    child2`

## 📦 Dependencies

- **Mermaid.js** (CDN: jsDelivr)
- **Node.js** (for server)
- **Pi agent** (for `/visualize` commands)

No npm packages, no build step.

## 📜 License

MIT

## 🤝 Contributing

This is a Pi skill. To extend:
1. Fork this repo
2. Modify `server.js`, `public/index.html`, or prompt templates
3. Test locally with manual server + `/visualize` commands
4. Submit a PR

## 🚀 Roadmap

**v2**
- Persistence: panel list, rename, archive
- Export: PNG, SVG, markdown
- Port negotiation: auto-select if busy
- Smoke tests: Playwright automation

**v3**
- New diagram types: C4, quadrant, git, pie charts
- Collaboration: share/embed panels
- History: undo/redo, revert to previous panel
- Advanced themes: custom color schemes

## 📞 Support

For issues, questions, or feedback:
- Open an issue on GitHub
- Check [Mermaid.js Docs](https://mermaid.js.org) for diagram syntax errors

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** 2026-09-23
