# Prompt Template: /visualize

Append a new panel to the /visualize canvas.

## Input

- `input` — the thing to visualize (e.g., "OmniSense data pipeline", "Jenkins CI/CD flow")

## Actions

1. **Check server status** — ping `localhost:7788`
   - If unreachable: spawn `node ~/.pi/agent/skills/visualize/server.js &` (detached)
   - Wait up to 5s for server to come up
2. **Open browser** (first call only in this session)
   - Launch `open http://localhost:7788` (macOS) or `xdg-open` (Linux) or `start` (Windows)
3. **Generate panel content**
   - `title` — concise, descriptive (1–3 words)
   - `prose` — short explanation (1–2 sentences)
   - `mermaid` — Mermaid diagram (empty string OK for M1, will be rendered in M2)
4. **POST to `/panel`**
   - Endpoint: `POST http://localhost:7788/panel`
   - Body: `{"title": "...", "prose": "...", "mermaid": "..."}`
   - Success: 201 response

## Example

**Input:** "OmniSense data ingestion flow"

**Generated:**
```json
{
  "title": "OmniSense Data Ingestion",
  "prose": "Events flow from collectors → Kafka topics → processing pipeline → database writes.",
  "mermaid": "flowchart LR\n  A[Collectors]\n  B[Kafka]\n  C[Pipeline]\n  D[DB]\n  A --> B --> C --> D"
}
```

**POST:** `curl -X POST http://localhost:7788/panel -H "Content-Type: application/json" -d '{...}'`

## Diagram-Type Constraints

**Critical:** Each Mermaid diagram type has different syntax capabilities. Follow these rules:

| Type | Styling | Use Case | Notes |
|------|---------|----------|-------|
| **flowchart** | ✅ `style NODE fill:#color` | Hierarchies, architectures, workflows | Full styling support |
| **sequenceDiagram** | ❌ NO style directive | Actor interactions, message flows | Do NOT add style lines (parse error) |
| **mindmap** | ✅ Basic styling | Concept trees, hierarchies | Limited custom styling |
| **stateDiagram** | ✅ State styling | State machines, workflows | State-aware styling |
| **erDiagram** | ⚠️ Minimal | Entity relationships | Avoid custom styling |
| **timeline** | ✅ Basic styling | Timelines, phase sequences | Limited custom styling |

**Rule:** If using `sequenceDiagram`, `erDiagram`, or `timeline`, do NOT generate `style` commands. Only `flowchart`, `mindmap`, and `stateDiagram` fully support custom styling.

## Notes

- Mermaid diagram can be empty in M1 (server accepts it, client will render placeholder)
- No persistence — panels are ephemeral; refresh/restart loses them
- Title should be short and scannable
- Prose should be 1–2 sentences max (keep the canvas readable)
- **Always check diagram type before adding style directives** — use constraints table above
