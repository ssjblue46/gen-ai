# Running the study

## Start
    npm install
    set GEMINI_API_KEY=your_key      (Windows)   |   export GEMINI_API_KEY=your_key   (Mac/Linux)
    npm start
    npm test          # 13 unit tests, no API key needed

## Conditions (one URL per condition)
| Condition | URL | Merchant |
|---|---|---|
| A | http://localhost:3000/?condition=A&pid=P01 | Scripted, no AI (baseline) |
| B | http://localhost:3000/?condition=B&pid=P01 | AI, current-session history only |
| C | http://localhost:3000/?condition=C&pid=P01 | AI + persistent memory across sessions |

Use a different `pid` per participant (P01, P02, ...). Never use real names.
Add `&debug=1` to show condition/participant/session in the console.

## Testing memory (Condition C)
1. Open `?condition=C&pid=P01`, buy a sword, say "My name is Raj, can I get a discount?"
2. Close the tab, open the same URL again (new session = new visit).
3. Ask "Do you remember me?" and "What did I buy?"; type `memory` to see the record.
4. Type `forget` to erase the record.

## Participant commands
`rate 1-5` rates the merchant's last reply, `memory` shows what he remembers, `forget` erases it.

## Data
- `data/interaction_log.jsonl` (raw), `data/memory.json` (memory): both are git-ignored. Do NOT upload them to GitHub.
- Export CSV on the same computer: http://localhost:3000/api/export.csv
  (online: set ADMIN_KEY and use /api/export.csv?key=YOUR_KEY).
- CSV columns: Player_Message, NPC_Response, NPC_Personality, Game_Situation, Player_Attitude,
  Conversation_Turn, Response_Time_ms, Response_Rating (plus Condition, Participant_ID, Fallback_Used...).
- Rows with Fallback_Used = true mean the AI failed and the scripted reply was used. Exclude or report them.

## Art assets (public/images)
Built from your shopkeeper GIF, all on one 128px pixel grid so pixels stay the same size.
- `background_shop.png` (128x128), `table.png` (128x44), `normal.png`, `happy_merchant.png`,
  `angry_merchant.png`, `suspicious_merchant.png` (55x44 each), `potion.png`, `sword.png`, `shield.png` (32x32).
- File names match what `game.js` already loads, so moods switch automatically.
- Layer order: background < merchant < table < item cards. Edit PNGs in any pixel editor; keep canvas sizes.
