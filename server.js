#!/usr/bin/env node

/**
 * /visualize skill server
 * Minimal HTTP server: POST /panel, GET /panels, 1s client poll
 * No dependencies. ~40 lines.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

let panels = [];
let lastActivityTime = Date.now();
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 min idle auto-exit
const PORT = 7788;

const server = http.createServer((req, res) => {
  lastActivityTime = Date.now();

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    // Serve index.html
    const indexPath = path.join(__dirname, "public", "index.html");
    fs.readFile(indexPath, "utf8", (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end("Error loading page");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  } else if (req.method === "GET" && req.url === "/panels") {
    // Return current panels as JSON
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ panels }));
  } else if (req.method === "POST" && req.url === "/panel") {
    // Append new panel
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const panel = JSON.parse(body);
        panels.push({ ...panel, id: Date.now() });
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, panelCount: panels.length }));
      } catch (e) {
        res.writeHead(400);
        res.end("Invalid JSON");
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`[visualize] Server listening on http://localhost:${PORT}`);
});

// Auto-exit on idle
setInterval(() => {
  if (Date.now() - lastActivityTime > IDLE_TIMEOUT_MS) {
    console.log("[visualize] Idle timeout reached. Exiting.");
    process.exit(0);
  }
}, 60000); // Check every minute

process.on("SIGTERM", () => {
  console.log("[visualize] Received SIGTERM. Shutting down.");
  server.close(() => process.exit(0));
});
