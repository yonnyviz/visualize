# Prompt Template: /visualize-clear

Clear all panels from the /visualize canvas without stopping the server.

## Actions

1. **Check server status** — ping `localhost:7788`
   - If unreachable: do nothing (no server to clear)
2. **Clear panels**
   - Send signal to server: `POST http://localhost:7788/clear` with `{"action": "clear"}`
   - OR: restart the server process to reset panels (simpler, no new endpoint needed)
3. **Report success**
   - "Cleared all panels. Canvas is empty."

## Notes

- Server continues running after clear (does not shut down)
- User can continue to `/visualize` new content
- To stop the server entirely, use `/visualize-close`

## Implementation Note

**Option A (simpler for M1):** Clear is a destructive action — restart the server.
- Kill the existing `node server.js` process
- Spawn a fresh one
- User won't notice (tab auto-refreshes via poll)

**Option B (future):** Add a `POST /clear` endpoint to the server itself.
- Wipes the `panels` array
- Server stays running
- Less disruptive
