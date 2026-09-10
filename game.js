// ======================================================
// GEMINI CONFIGURATION
// ======================================================

// Put your Gemini API key here for local testing.
//
// IMPORTANT:
// Do not publish a real API key in a public GitHub repository.
// For a real deployment, put the Gemini request behind a backend.
//
// Example:
// const GEMINI_API_KEY = "AIzaSy........";

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";


// Current Gemini model.
// The current Gemini documentation uses models such as
// gemini-3.8-flash for the Interactions API.

const GEMINI_MODEL = "gemini-3.8-flash";


// Gemini API endpoint

const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/interactions";


// ======================================================
// GAME STATE
// ======================================================

const gameState = {

    playerName: "Traveler",

    gold: 100,

    reputation: 0,

    inventory: [],

    merchantMood: "normal",

    interactionId: null,

    gameStarted: false
};


// ======================================================
// DOM ELEMENTS
// ======================================================

const commandForm =
    document.getElementById("commandForm");

const commandInput =
    document.getElementById("commandInput");

const consoleOutput =
    document.getElementById("consoleOutput");

const merchantImage =
    document.getElementById("merchantImage");

const merchantMood =
    document.getElementById("merchantMood");

const goldDisplay =
    document.getElementById("goldDisplay");

const reputationDisplay =
    document.getElementById("reputationDisplay");

const connectionStatus =
    document.getElementById("connectionStatus");


// ======================================================
// MERCHANT IMAGES
// ======================================================

const merchantImages = {

    normal: {
        src: "images/normal.png",
        alt: "Normal merchant standing inside the shop"
    },

    happy: {
        src: "images/happy_merchant.png",
        alt: "Happy merchant smiling inside the shop"
    },

    angry: {
        src: "images/angry_merchant.png",
        alt: "Angry merchant shouting inside the shop"
    },

    suspicious: {
        src: "images/suspicious_merchant.png",
        alt: "Suspicious merchant looking carefully at the player"
    }
};


// ======================================================
// UPDATE VISUAL SCREEN
// ======================================================

function updateVisuals() {

    goldDisplay.textContent =
        gameState.gold;

    reputationDisplay.textContent =
        gameState.reputation;


    merchantMood.textContent =
        gameState.merchantMood.toUpperCase();


    const mood =
        merchantImages[gameState.merchantMood];


    merchantImage.src =
        mood.src;

    merchantImage.alt =
        mood.alt;
}


// ======================================================
// CONSOLE FUNCTIONS
// ======================================================

function addUserMessage(text) {

    const element =
        document.createElement("div");

    element.className =
        "user-message";

    element.textContent =
        "You: " + text;

    consoleOutput.appendChild(element);

    scrollConsole();
}


function addMerchantMessage(text) {

    const element =
        document.createElement("div");

    element.className =
        "merchant-message";

    element.textContent =
        "Merchant: " + text;

    consoleOutput.appendChild(element);

    scrollConsole();
}


function addSystemMessage(text) {

    const element =
        document.createElement("div");

    element.className =
        "system-message";

    element.textContent =
        text;

    consoleOutput.appendChild(element);

    scrollConsole();
}


function addSuccessMessage(text) {

    const element =
        document.createElement("div");

    element.className =
        "success-message";

    element.textContent =
        text;

    consoleOutput.appendChild(element);

    scrollConsole();
}


function addErrorMessage(text) {

    const element =
        document.createElement("div");

    element.className =
        "error-message";

    element.textContent =
        text;

    consoleOutput.appendChild(element);

    scrollConsole();
}


function scrollConsole() {

    consoleOutput.scrollTop =
        consoleOutput.scrollHeight;
}


// ======================================================
// HELP COMMAND
// ======================================================

function showHelp() {

    addSystemMessage("");
    addSystemMessage("AVAILABLE COMMANDS");
    addSystemMessage("-------------------------");

    addSystemMessage("help");
    addSystemMessage("look");
    addSystemMessage("inventory");
    addSystemMessage("gold");

    addSystemMessage("buy potion");
    addSystemMessage("buy sword");
    addSystemMessage("buy shield");

    addSystemMessage("sell potion");
    addSystemMessage("sell sword");
    addSystemMessage("sell shield");

    addSystemMessage("talk");

    addSystemMessage("");
    addSystemMessage("You can also type natural dialogue.");
    addSystemMessage("Example: \"Can you lower the price?\"");
}


// ======================================================
// INVENTORY
// ======================================================

function showInventory() {

    if (gameState.inventory.length === 0) {

        addSystemMessage(
            "Your inventory is empty."
        );

        return;
    }

    addSystemMessage(
        "Inventory: " +
        gameState.inventory.join(", ")
    );
}


// ======================================================
// SHOP LOOK
// ======================================================

function lookAround() {

    addSystemMessage("");
    addSystemMessage("MERCHANT'S SHOP");
    addSystemMessage("-------------------------");

    addSystemMessage(
        "Potion - 20 gold"
    );

    addSystemMessage(
        "Sword - 60 gold"
    );

    addSystemMessage(
        "Shield - 40 gold"
    );

    addSystemMessage(
        "The merchant watches you carefully."
    );
}


// ======================================================
// BUY ITEM
// ======================================================

function buyItem(item) {

    const prices = {

        potion: 20,

        sword: 60,

        shield: 40
    };


    if (!prices[item]) {

        addErrorMessage(
            "That item does not exist."
        );

        return;
    }


    const price =
        prices[item];


    if (gameState.gold < price) {

        gameState.merchantMood =
            "suspicious";

        updateVisuals();

        addErrorMessage(
            "You do not have enough gold."
        );

        return;
    }


    gameState.gold -= price;

    gameState.inventory.push(item);

    gameState.reputation += 1;

    gameState.merchantMood =
        "happy";

    updateVisuals();


    addSuccessMessage(
        "You bought a " +
        item +
        " for " +
        price +
        " gold."
    );
}


// ======================================================
// SELL ITEM
// ======================================================

function sellItem(item) {

    const index =
        gameState.inventory.indexOf(item);


    if (index === -1) {

        addErrorMessage(
            "You don't have that item."
        );

        return;
    }


    const sellPrices = {

        potion: 10,

        sword: 30,

        shield: 20
    };


    gameState.inventory.splice(
        index,
        1
    );


    gameState.gold +=
        sellPrices[item];


    gameState.reputation += 1;

    gameState.merchantMood =
        "happy";

    updateVisuals();


    addSuccessMessage(
        "You sold your " +
        item +
        " for " +
        sellPrices[item] +
        " gold."
    );
}


// ======================================================
// LOCAL COMMAND PROCESSING
// ======================================================

async function processCommand(command) {

    const text =
        command.toLowerCase().trim();


    if (text === "help") {

        showHelp();

        return true;
    }


    if (text === "look") {

        lookAround();

        return true;
    }


    if (text === "inventory") {

        showInventory();

        return true;
    }


    if (text === "gold") {

        addSystemMessage(
            "You have " +
            gameState.gold +
            " gold."
        );

        return true;
    }


    if (text === "talk") {

        await talkToMerchant(
            "The player wants to talk to you."
        );

        return true;
    }


    if (text.startsWith("buy ")) {

        const item =
            text.substring(4).trim();

        buyItem(item);

        return true;
    }


    if (text.startsWith("sell ")) {

        const item =
            text.substring(5).trim();

        sellItem(item);

        return true;
    }


    return false;
}


// ======================================================
// BUILD AI GAME STATE
// ======================================================

function getGameStateForAI() {

    return `
GAME STATE:

Player:
Name: ${gameState.playerName}
Gold: ${gameState.gold}
Reputation: ${gameState.reputation}
Inventory: ${gameState.inventory.join(", ") || "Empty"}

Merchant:
Mood: ${gameState.merchantMood}

Shop items:
Potion: 20 gold
Sword: 60 gold
Shield: 40 gold

The merchant is the ONLY important NPC.
`;
}


// ======================================================
// TALK TO GEMINI MERCHANT
// ======================================================

async function talkToMerchant(playerMessage) {

    if (
        !GEMINI_API_KEY ||
        GEMINI_API_KEY === "YOUR_GEMINI_API_KEY"
    ) {

        addErrorMessage(
            "Gemini API key has not been configured."
        );

        addSystemMessage(
            "Open game.js and enter your Gemini API key."
        );

        return;
    }


    connectionStatus.textContent =
        "THINKING...";


    const systemInstruction = `
You are the merchant in a small fantasy shop game.

You are NOT a generic AI assistant.

You are a character.

Your entire purpose is to roleplay as the merchant.

Merchant personality:
- Clever
- Slightly mysterious
- Greedy but entertaining
- Sometimes friendly
- Sometimes suspicious
- Gets angry if the player insults, cheats, steals or repeatedly tries to scam you
- Becomes happy when the player buys something
- Can negotiate prices
- Can tell stories about objects in the shop
- Never break character

The player interacts with you through a console.

Keep responses short enough for a game dialogue box.

Usually respond in 1 to 4 sentences.

You may react to the player's actions.

Do NOT pretend to perform an action that the game itself must perform.

The JavaScript game controls:
- gold
- inventory
- reputation
- item purchases
- item sales

The player can ask questions naturally.

${getGameStateForAI()}
`;


    try {

        const requestBody = {

            model: GEMINI_MODEL,

            input: playerMessage,

            system_instruction: systemInstruction
        };


        if (gameState.interactionId) {

            requestBody.previous_interaction_id =
                gameState.interactionId;
        }


        const response =
            await fetch(
                GEMINI_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": GEMINI_API_KEY
                    },

                    body: JSON.stringify(requestBody)
                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText
            );
        }


        const data =
            await response.json();


        gameState.interactionId =
            data.id;


        let reply =
            data.output_text;


        // Fallback for responses where output_text
        // isn't available.

        if (!reply && data.steps) {

            const modelStep =
                [...data.steps]
                    .reverse()
                    .find(
                        step =>
                            step.type === "model_output"
                    );


            if (
                modelStep &&
                modelStep.content
            ) {

                const textPart =
                    modelStep.content.find(
                        part =>
                            part.type === "text"
                    );


                if (textPart) {

                    reply =
                        textPart.text;
                }
            }
        }


        if (!reply) {

            reply =
                "The merchant stares at you silently.";
        }


        addMerchantMessage(reply);


        connectionStatus.textContent =
            "ONLINE";


        updateMerchantMoodFromText(
            reply
        );

    }

    catch (error) {

        console.error(error);


        connectionStatus.textContent =
            "ERROR";


        addErrorMessage(
            "Gemini connection failed."
        );


        addErrorMessage(
            error.message
        );
    }
}


// ======================================================
// DETECT MERCHANT MOOD
// ======================================================

function updateMerchantMoodFromText(text) {

    const message =
        text.toLowerCase();


    if (
        message.includes("angry") ||
        message.includes("furious") ||
        message.includes("get out") ||
        message.includes("insult")
    ) {

        gameState.merchantMood =
            "angry";
    }

    else if (
        message.includes("suspicious") ||
        message.includes("watching you") ||
        message.includes("don't trust")
    ) {

        gameState.merchantMood =
            "suspicious";
    }

    else if (
        message.includes("pleased") ||
        message.includes("happy") ||
        message.includes("good customer") ||
        message.includes("thank you")
    ) {

        gameState.merchantMood =
            "happy";
    }

    else {

        gameState.merchantMood =
            "normal";
    }


    updateVisuals();
}


// ======================================================
// FORM SUBMISSION
// ======================================================

commandForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const command =
            commandInput.value.trim();


        if (!command) {
            return;
        }


        addUserMessage(
            command
        );


        commandInput.value = "";


        // First try to process it as a game command.

        const wasLocalCommand =
            await processCommand(command);


        // If it wasn't a local command,
        // send it to the merchant AI.

        if (!wasLocalCommand) {

            await talkToMerchant(
                command
            );
        }

    }
);


// ======================================================
// START GAME
// ======================================================

function startGame() {

    updateVisuals();


    connectionStatus.textContent =
        "READY";


    addSystemMessage("");

    addSystemMessage(
        "The merchant looks up from his desk."
    );

    addMerchantMessage(
        "Ah... a customer. Don't touch anything unless you're planning to pay for it."
    );

    addSystemMessage("");

    addSystemMessage(
        "Type 'help' for commands."
    );
}


// Start

startGame();
