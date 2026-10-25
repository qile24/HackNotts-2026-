"use strict";
// Frontend handoff: the HTML/CSS can change as long as these IDs stay the same.
// playerName: name input; addPlayer/startGame/rollDice: buttons (type="button").
// playerslist: names container — note the lowercase l in "list".
// dice1/dice2/total: dice results; currentTurn: whose turn is next.
// gameMessage: latest message; playerStats: balances and board positions.
// Board spaces need IDs tile0 to tile39, in the same order as data.js.
// Style .player-token in CSS and leave room for multiple players on one space.
// Button events are already connected below; don't add extra onclick handlers.
// One Roll click resolves the whole turn and then selects the next player.
// Buying uses confirm(), and cards/validation use alert(). Custom async popups
// need the turn flow to wait for the response before it updates or switches.
// Ownership labels aren't drawn yet; use board[index].owner to add them.

const dice1Display = document.getElementById("dice1");
const dice2Display = document.getElementById("dice2");
const totalDisplay = document.getElementById("total");

const rollButton = document.getElementById("rollDice");
const nameInput = document.getElementById("playerName");
const addButton = document.getElementById("addPlayer");
const playerList = document.getElementById("playerslist");

const startButton = document.getElementById("startGame");
const currentTurnDisplay = document.getElementById("currentTurn");

// These containers are optional, but they help players follow the game.
const messageDisplay = document.getElementById("gameMessage");
const playerStatsDisplay = document.getElementById("playerStats");


// Show the latest message. Append entries here if you want a game history.
function showMessage(message) {
    console.log(message);

    if (messageDisplay) {
        messageDisplay.textContent = message;
    }
}

function updateCurrentTurn() {
    if (currentTurnDisplay && gameStarted && !gameOver) {
        currentTurnDisplay.textContent =
            players[currentPlayer].name + "'s turn";
    }
}

function updatePlayerList() {
    if (playerList) {
        playerList.textContent =
            players.map(player => player.name).join(", ");
    }
}

// Rebuild the balance panel. Change the markup here if you want player cards.
// Keep permanent headings outside playerStats because this clears its contents.
function updatePlayerStats() {
    if (!playerStatsDisplay) {
        return;
    }

    playerStatsDisplay.replaceChildren();

    players.forEach(function(player) {
        const line = document.createElement("p");

        if (player.bankrupt) {
            line.textContent = player.name + " - BANKRUPT";
        } else {
            line.textContent =
                player.name +
                " | £" + player.money +
                " | Position: " + player.position;
        }

        playerStatsDisplay.appendChild(line);
    });
}

// Frontend: swap the dots here if you want custom player tokens.
// The board spaces must have IDs tile0 through tile39.
function updateTokens() {
    // Clear the old dots so players don't leave tokens behind.
    document.querySelectorAll(".player-token").forEach(function(token) {
        token.remove();
    });

    players.forEach(function(player, index) {
        if (player.bankrupt) {
            return;
        }

        const tile = document.getElementById(
            "tile" + player.position
        );

        if (!tile) {
            return;
        }

        const token = document.createElement("span");

        token.className = "player-token";
        token.textContent = "●";
        token.title = player.name;
        token.style.color = [
            "red", "blue", "green",
            "orange", "purple", "black"
        ][index];

        token.style.margin = "3px";

        tile.appendChild(token);
    });
}

// Add any extra ownership/board rendering here so it refreshes after a move.
function updateDisplay() {
    updatePlayerStats();
    updateTokens();
    updateCurrentTurn();
}


addButton.addEventListener("click", function() {

    if (gameStarted) {
        alert("The game has already started!");
        return;
    }

    const name = nameInput.value.trim();

    if (name === "") {
        alert("Please enter a name!");
        return;
    }

    if (players.length >= MAX_PLAYERS) {
        alert("Maximum 6 players!");
        return;
    }

    const duplicate = players.some(function(player) {
        return player.name.toLowerCase() === name.toLowerCase();
    });

    if (duplicate) {
        alert("This player name already exists!");
        return;
    }

    const player = {
        name: name,
        money: STARTING_MONEY,
        position: 0,
        properties: [],
        skipTurns: 0,
        bankrupt: false
    };

    players.push(player);

    updatePlayerList();
    updatePlayerStats();

    nameInput.value = "";

    console.log("Players:", players);
});


startButton.addEventListener("click", function() {

    if (gameStarted) {
        alert("Game already started!");
        return;
    }

    if (players.length < 2) {
        alert("You need at least 2 players!");
        return;
    }

    gameStarted = true;
    currentPlayer = 0;

    nameInput.disabled = true;
    addButton.disabled = true;
    startButton.disabled = true;

    updateDisplay();

    showMessage(
        "Game started! " + players[0].name + " goes first."
    );
});


rollButton.addEventListener("click", function() {

    if (!gameStarted) {
        alert("Start the game first!");
        return;
    }

    if (gameOver) {
        return;
    }

    const player = players[currentPlayer];

    // This click uses up their skipped turn, then play moves on.
    if (player.skipTurns > 0) {
        player.skipTurns--;

        showMessage(
            player.name + " misses this turn because of jail."
        );

        nextTurn();
        return;
    }

    // Pick two numbers from 1 to 6 and show the result.
    const roll1 = Math.floor(Math.random() * 6) + 1;
    const roll2 = Math.floor(Math.random() * 6) + 1;

    const sum = roll1 + roll2;

    dice1Display.textContent = "Dice 1: " + roll1;
    dice2Display.textContent = "Dice 2: " + roll2;
    totalDisplay.textContent = "Total: " + sum;

    console.log(
        player.name + " rolled " + roll1 +
        " + " + roll2 + " = " + sum
    );

    // Move first, then deal with the space they land on.
    movePlayer(player, sum);

    // This can open a buying prompt, charge rent, draw a card or send them to jail.
    handleTile(player, sum);

    // Refresh the tokens and balances once the move is resolved.
    updateDisplay();

    // Hand over automatically; this version has no separate End Turn button.
    if (!gameOver) {
        nextTurn();
    }
});


showMessage("Add 2–3 players to begin Monopoly!");
