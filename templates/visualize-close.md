# Prompt Template: /visualize-close

Stop the /visualize server and close the browser tab.

## Actions

1. **Check server status** — ping `localhost:7788`
   - If unreachable: do nothing (already stopped)
2. **Kill the server**
   - Find the `node server.js` process running on port 7788
   - `kill <pid>` or send SIGTERM
   - Wait for shutdown
3. **Close browser tab** (if open)
   - Send `window.close()` to the page (may fail due to browser security)
   - Or: just notify user that server is stopped; they can close manually
4. **Report success**
   - "Server stopped. Canvas is closed."

## Implementation

**Unix/macOS:**
```bash
# Kill process listening on port 7788
lsof -ti:7788 | xargs kill -TERM
```

**Alternative (portable):**
- Store the server PID in `~/.pi/agent/skills/visualize/.server.pid` when spawning
- On close, `kill $(cat .server.pid)` and clean up file

## Notes

- All panels are lost when server stops (ephemeral by design)
- Next `/visualize` call will spawn a fresh server with empty canvas
- This is the graceful shutdown command
