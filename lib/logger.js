"use strict";

// Interaction log (JSON Lines on disk, exported as CSV).
// Columns follow the dataset structure in the research paper.

const fs = require("fs");
const path = require("path");

const COLUMNS = [
    "Log_ID", "Timestamp", "Participant_ID", "Session_ID", "Condition",
    "Conversation_Turn", "Player_Message", "NPC_Response", "NPC_Personality",
    "Game_Situation", "Player_Attitude", "Response_Time_ms", "Source",
    "Model", "Fallback_Used", "Memory_Items_Injected", "Response_Rating"
];

function csvCell(value) {
    let s = value === null || value === undefined ? "" : String(value);

    // Stop spreadsheet formula injection from participant-typed text.
    if (/^[=+\-@]/.test(s)) s = "'" + s;

    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

class InteractionLog {
    constructor(filePath) {
        this.filePath = filePath;
        this.nextId = this.readAll().reduce((m, r) => Math.max(m, r.Log_ID), 0) + 1;
    }

    readAll() {
        try {
            return fs.readFileSync(this.filePath, "utf8")
                .split("\n")
                .filter(Boolean)
                .map(line => JSON.parse(line));
        } catch {
            return [];
        }
    }

    append(entry) {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        const row = {
            Log_ID: this.nextId++,
            Timestamp: new Date().toISOString(),
            Response_Rating: "",
            ...entry
        };
        fs.appendFileSync(this.filePath, JSON.stringify(row) + "\n");
        return row.Log_ID;
    }

    // A participant may only rate rows that belong to their own ID.
    rate(logId, participantId, rating) {
        const rows = this.readAll();
        const row = rows.find(r => r.Log_ID === logId);

        if (!row || row.Participant_ID !== participantId) return false;
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return false;

        row.Response_Rating = rating;
        const tmp = this.filePath + ".tmp";
        fs.writeFileSync(tmp, rows.map(r => JSON.stringify(r)).join("\n") + "\n");
        fs.renameSync(tmp, this.filePath);
        return true;
    }

    toCSV() {
        const lines = [COLUMNS.join(",")];
        for (const row of this.readAll()) {
            lines.push(COLUMNS.map(c => csvCell(row[c])).join(","));
        }
        return lines.join("\n") + "\n";
    }
}

module.exports = { InteractionLog, COLUMNS, csvCell };
