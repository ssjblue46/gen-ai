"use strict";

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { MemoryStore } = require("../lib/memory");
const { InteractionLog } = require("../lib/logger");
const { createMerchantService } = require("../lib/merchant");
const { analyzeAttitude, extractName } = require("../lib/attitude");
const { getScriptedReply } = require("../lib/scripted");

function setup(fetchImpl, apiKey = "test-key") {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "npc-"));
    const memory = new MemoryStore(path.join(dir, "memory.json"));
    const log = new InteractionLog(path.join(dir, "log.jsonl"));
    const service = createMerchantService({ memory, log, apiKey, fetchImpl });
    return { dir, memory, log, service };
}

// Fake Gemini that records the system prompt it received.
function fakeGemini(calls) {
    return async (url, opts) => {
        const body = JSON.parse(opts.body);
        calls.push(body.systemInstruction.parts[0].text);
        return {
            ok: true,
            json: async () => ({ candidates: [{ content: { parts: [{ text: "Hmm, traveler." }] } }] })
        };
    };
}

const base = { playerId: "P01", message: "Hello merchant, how are you today?", systemInstruction: "Gold: 100\nMood: normal" };

test("attitude detection uses word boundaries", () => {
    assert.strictEqual(analyzeAttitude("this is which within").attitude, "neutral");
    assert.strictEqual(analyzeAttitude("you are a thief").attitude, "rude");
    assert.strictEqual(analyzeAttitude("can you give a discount").attitude, "bargaining");
    assert.strictEqual(analyzeAttitude("thank you friend").attitude, "friendly");
});

test("name extraction", () => {
    assert.strictEqual(extractName("my name is raj"), "Raj");
    assert.strictEqual(extractName("call me maybe"), null);
    assert.strictEqual(extractName("nothing here"), null);
});

test("scripted baseline does not match 'hi' inside other words", () => {
    const reply = getScriptedReply("this thing", () => 0);
    assert.ok(!reply.startsWith("Ah, traveler! Welcome"));
});

test("Condition A never calls Gemini", async () => {
    const calls = [];
    const { service } = setup(fakeGemini(calls));
    const r = await service.handleMerchant({ ...base, condition: "A", sessionId: "S1" });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.json.source, "scripted");
    assert.strictEqual(r.json.fallbackUsed, false);
    assert.strictEqual(calls.length, 0);
});

test("Condition B calls Gemini without any memory block", async () => {
    const calls = [];
    const { service, memory } = setup(fakeGemini(calls));
    await service.handleEvent({ condition: "B", playerId: "P01", sessionId: "S1", type: "buy", item: "sword" });
    const r = await service.handleMerchant({ ...base, condition: "B", sessionId: "S1", message: "my name is Raj, remember me" });
    assert.strictEqual(r.json.source, "gemini");
    assert.ok(!calls[0].includes("PERSISTENT MEMORY"));
    assert.strictEqual(memory.get("P01"), null);
});

test("Condition C remembers purchases and name across sessions", async () => {
    const calls = [];
    const { service } = setup(fakeGemini(calls));

    // Visit 1
    await service.handleSession({ condition: "C", playerId: "P01", sessionId: "S1" });
    await service.handleEvent({ condition: "C", playerId: "P01", sessionId: "S1", type: "buy", item: "sword" });
    await service.handleMerchant({ ...base, condition: "C", sessionId: "S1", message: "My name is Raj and I want a discount please" });

    // Visit 2 (new session)
    await service.handleSession({ condition: "C", playerId: "P01", sessionId: "S2" });
    const r = await service.handleMerchant({ ...base, condition: "C", sessionId: "S2", message: "Do you remember me?" });

    const prompt = calls[calls.length - 1];
    assert.ok(prompt.includes("PERSISTENT MEMORY"));
    assert.ok(prompt.includes("visit 2"));
    assert.ok(prompt.includes("Raj"));
    assert.ok(prompt.includes("sword x1"));
    assert.ok(prompt.includes("bargain"));
    assert.ok(prompt.includes("only past events") || prompt.includes("ONLY past events"));
    assert.ok(r.json.logId > 0);
});

test("memory does not store free text from the current session as 'earlier'", async () => {
    const calls = [];
    const { service } = setup(fakeGemini(calls));
    await service.handleMerchant({ ...base, condition: "C", sessionId: "S1", message: "Tell me about the old castle" });
    await service.handleMerchant({ ...base, condition: "C", sessionId: "S1", message: "Is the castle dangerous at night?" });
    assert.ok(!calls[1].includes("In earlier visits"));
    await service.handleMerchant({ ...base, condition: "C", sessionId: "S2", message: "Hello again merchant" });
    assert.ok(calls[2].includes("In earlier visits"));
    assert.ok(calls[2].includes("old castle"));
});

test("forget erases memory", async () => {
    const { service, memory } = setup(fakeGemini([]));
    await service.handleEvent({ condition: "C", playerId: "P01", sessionId: "S1", type: "buy", item: "potion" });
    assert.ok(memory.get("P01"));
    assert.strictEqual(service.handleForget({ playerId: "P01" }).json.forgotten, true);
    assert.strictEqual(memory.get("P01"), null);
});

test("Gemini failure falls back to scripted and is flagged", async () => {
    const failing = async () => ({ ok: false, status: 500, json: async () => ({ error: { message: "boom" } }) });
    const { service } = setup(failing);
    const r = await service.handleMerchant({ ...base, condition: "B", sessionId: "S1" });
    assert.strictEqual(r.json.source, "scripted");
    assert.strictEqual(r.json.fallbackUsed, true);
});

test("invalid input is rejected", async () => {
    const { service } = setup(fakeGemini([]));
    assert.strictEqual((await service.handleMerchant({ message: "" })).status, 400);
    assert.strictEqual(service.handleEvent({ type: "steal", item: "sword" }).status, 400);
    assert.strictEqual(service.handleEvent({ type: "buy", item: "dragon" }).status, 400);
    assert.strictEqual(service.handleForget({ playerId: "../etc" }).status, 400);
});

test("rating only works on your own rows, 1-5 only", async () => {
    const { service } = setup(fakeGemini([]));
    const r = await service.handleMerchant({ ...base, condition: "B", sessionId: "S1" });
    const id = r.json.logId;
    assert.strictEqual(service.handleRate({ logId: id, playerId: "P02", rating: 5 }).status, 400);
    assert.strictEqual(service.handleRate({ logId: id, playerId: "P01", rating: 9 }).status, 400);
    assert.strictEqual(service.handleRate({ logId: id, playerId: "P01", rating: 4 }).status, 200);
});

test("CSV export has paper columns, escapes quotes and formulas", async () => {
    const { service } = setup(fakeGemini([]));
    const r = await service.handleMerchant({ ...base, condition: "A", sessionId: "S1", message: '=SUM(1,2) "quoted", text' });
    service.handleRate({ logId: r.json.logId, playerId: "P01", rating: 3 });
    const csv = service.exportCSV();
    const [header, row] = csv.split("\n");
    for (const col of ["Player_Message", "NPC_Response", "NPC_Personality", "Game_Situation",
                       "Player_Attitude", "Conversation_Turn", "Response_Time_ms", "Response_Rating"]) {
        assert.ok(header.includes(col), col);
    }
    assert.ok(row.includes(`"'=SUM(1,2) ""quoted"", text"`));
    assert.ok(row.trim().endsWith(",3"));
});

test("memory persists to disk and reloads", async () => {
    const { dir, service } = setup(fakeGemini([]));
    await service.handleEvent({ condition: "C", playerId: "P01", sessionId: "S1", type: "sell", item: "shield" });
    const reloaded = new MemoryStore(path.join(dir, "memory.json"));
    assert.strictEqual(reloaded.get("P01").sales.shield, 1);
});
