"use strict";

// CONDITION A: traditional scripted merchant (keyword -> fixed reply).
// This is the research baseline, so it must be a fair one:
// word-boundary matching (the old version matched "hi" inside "this"),
// and a rule for each topic the test scenarios cover.

const RULES = [
    {
        re: /\b(hello|hi|hey|greetings|good (morning|evening|day))\b/i,
        replies: [
            "Ah, traveler! Welcome to my humble shop. Looking for something special?"
        ]
    },
    {
        re: /\b(discount|cheaper|cheap|lower|bargain|haggle|too expensive|price|prices)\b/i,
        replies: [
            "A discount? Ha! My prices are already generous. Perhaps become a better customer first."
        ]
    },
    {
        re: /\b(remember|earlier|last time|before|previous)\b/i,
        replies: [
            "I don't understand. Can you help me?"
        ]
    },
    {
        re: /\b(hint|help|advice|quest|objective|what should i do)\b/i,
        replies: [
            "Type 'look' to see my wares. Gold opens most doors, traveler."
        ]
    },
    {
        re: /\b(sell|buy|items|wares|potion|sword|shield)\b/i,
        replies: [
            "I sell potions, swords and shields. Type 'look' to see my wares."
        ]
    },
    {
        re: /\b(name|who are you)\b/i,
        replies: [
            "Names have power, traveler. For now, you may simply call me the Merchant."
        ]
    },
    {
        re: /\b(thanks|thank you)\b/i,
        replies: [
            "Gratitude is appreciated. Gold is appreciated even more."
        ]
    },
    {
        re: /\b(stupid|idiot|hate|scam|useless|liar|thief)\b/i,
        replies: [
            "Watch your tongue, traveler. I have thrown out customers for less."
        ]
    }
];

const DEFAULTS = [
    "Interesting words, traveler. Tell me more.",
    "Hmm... I've heard stranger things in this shop.",
    "Perhaps there is more to your story than you reveal.",
    "Every traveler has a secret. What is yours?",
    "Ah, fascinating. But tell me, are you here to talk or trade?"
];

function getScriptedReply(message, rand = Math.random) {
    const text = String(message || "");

    for (const rule of RULES) {
        if (rule.re.test(text)) {
            return rule.replies[Math.floor(rand() * rule.replies.length)];
        }
    }

    return DEFAULTS[Math.floor(rand() * DEFAULTS.length)];
}

module.exports = { getScriptedReply };
