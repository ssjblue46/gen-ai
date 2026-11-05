"use strict";

const express = require("express");
const path = require("path");

const { MemoryStore } = require("./lib/memory");
const { InteractionLog } = require("./lib/logger");
const { createMerchantService } = require("./lib/merchant");

const app = express();

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ADMIN_KEY = process.env.ADMIN_KEY;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");

const service = createMerchantService({
    memory: new MemoryStore(path.join(DATA_DIR, "memory.json")),
    log: new InteractionLog(path.join(DATA_DIR, "interaction_log.jsonl")),
    apiKey: GEMINI_API_KEY
});

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname, "public")));

function send(res, result) {
    res.status(result.status).json(result.json);
}

// ======================================================
// API
// ======================================================

app.post("/api/merchant", async (req, res) => {
    try {
        send(res, await service.handleMerchant(req.body));
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

app.post("/api/event", (req, res) => send(res, service.handleEvent(req.body)));
app.post("/api/session", (req, res) => send(res, service.handleSession(req.body)));
app.post("/api/forget", (req, res) => send(res, service.handleForget(req.body)));
app.post("/api/rate", (req, res) => send(res, service.handleRate(req.body)));

app.get("/api/memory", (req, res) =>
    send(res, service.handleMemoryView(req.query.playerId, req.query.sessionId))
);

// ======================================================
// RESEARCHER-ONLY CSV EXPORT
// The log contains participant messages, so it is protected:
// with ADMIN_KEY set, ?key=... is required; otherwise only
// requests from the same computer (localhost) are allowed.
// ======================================================

app.get("/api/export.csv", (req, res) => {
    const local = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);
    const allowed = ADMIN_KEY ? req.query.key === ADMIN_KEY : local;

    if (!allowed) {
        return res.status(403).json({ error: "Forbidden." });
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=interaction_log.csv");
    res.send(service.exportCSV());
});

app.listen(PORT, () => {
    console.log(`Merchant NPC server running on port ${PORT}`);
    console.log(`Gemini configured: ${Boolean(GEMINI_API_KEY)}`);
});
