"use strict";

// Rule-based detection of the player's attitude.
// Deterministic on purpose: the same input always gives the same label,
// so the "Player_Attitude" column in the dataset is reproducible.

const PATTERNS = {
    rude: /\b(stupid|idiot|dumb|hate|scam|scammer|useless|shut up|liar|thief|cheat|robber|ugly)\b/i,
    threat: /\b(kill|attack|steal|rob you|burn (this|your) shop|destroy)\b/i,
    friendly: /\b(thanks|thank you|please|nice|great|wonderful|appreciate|friend|kind|lovely|pleasure)\b/i,
    bargain: /\b(discount|cheaper|cheap|lower|bargain|haggle|too expensive|too much|reduce|half price|deal)\b/i
};

function analyzeAttitude(text) {
    const t = String(text || "");
    const flags = {
        rude: PATTERNS.rude.test(t) || PATTERNS.threat.test(t),
        friendly: PATTERNS.friendly.test(t),
        bargain: PATTERNS.bargain.test(t)
    };

    let attitude = "neutral";
    if (flags.rude) attitude = "rude";
    else if (flags.bargain) attitude = "bargaining";
    else if (flags.friendly) attitude = "friendly";

    return { attitude, flags };
}

function extractName(text) {
    const STOP = new Set([
        "maybe", "later", "back", "when", "if", "please",
        "now", "again", "crazy", "sometime", "soon", "so"
    ]);

    const m = /\b(?:my name is|i am called|call me)\s+([A-Za-z]{2,20})\b/i.exec(String(text || ""));
    if (!m) return null;

    const word = m[1];
    if (STOP.has(word.toLowerCase())) return null;

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

module.exports = { analyzeAttitude, extractName };
