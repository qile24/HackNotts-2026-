"use strict";
// Game state and rules live here. ui.js handles the buttons and screen updates.
// These scripts share their top-level bindings; don't load them as modules.
// properties stores board indexes. A balance below £0 means bankruptcy.
// Rules are simplified: no houses, auctions, trades, mortgages or extra turns
// for doubles. Jail skips one turn; station and utility rent are supported.

let players = [];
let currentPlayer = 0;
let gameStarted = false;
let gameOver = false;

const STARTING_MONEY = 1500;
const GO_MONEY = 200;
const MAX_PLAYERS = 6;


function movePlayer(player, steps) {

    const oldPosition = player.position;
    const newPosition = oldPosition + steps;

    // Reaching or passing GO earns £200.
    if (newPosition >= board.length) {
        player.money += GO_MONEY;

        showMessage(
            player.name + " passed GO and collected £200!"
        );
    }

    // Wrap around the board: position 42 becomes tile2.
    player.position = newPosition % board.length;

    console.log(
        player.name + " moved from " +
        oldPosition + " to " + player.position
    );
}


function countOwnedType(player, type) {
    return player.properties.filter(function(index) {
        return board[index].type === type;
    }).length;
}

function calculateRent(tile, owner, diceTotal) {

    if (tile.type === "station") {
        const stations = countOwnedType(owner, "station");

        return 25 * Math.pow(2, stations - 1);
    }

    if (tile.type === "utility") {
        const utilities = countOwnedType(owner, "utility");

        return diceTotal * (utilities === 2 ? 10 : 4);
    }

    return tile.rent;
}

function handleProperty(player, tile, diceTotal) {

    // Nobody owns this space yet, so offer it to the player.
    if (tile.owner === null) {

        if (player.money < tile.price) {
            showMessage(
                player.name + " cannot afford " + tile.name
            );
            return;
        }

        const wantsToBuy = confirm(
            player.name + ", buy " + tile.name +
            " for £" + tile.price + "?"
        );

        if (wantsToBuy) {
            player.money -= tile.price;

            tile.owner = player;

            player.properties.push(player.position);

            showMessage(
                player.name + " bought " + tile.name +
                " for £" + tile.price
            );
        } else {
            showMessage(
                player.name + " decided not to buy " + tile.name
            );
        }

        return;
    }

    // Nothing to pay when they land on their own space.
    if (tile.owner === player) {
        showMessage(
            player.name + " owns " + tile.name
        );
        return;
    }

    // Move the rent from this player to the owner.
    const owner = tile.owner;

    const rent = calculateRent(tile, owner, diceTotal);

    player.money -= rent;
    owner.money += rent;

    showMessage(
        player.name + " paid £" + rent +
        " rent to " + owner.name
    );

    checkBankruptcy(player);
}


function checkBankruptcy(player) {

    if (player.money >= 0 || player.bankrupt) {
        return;
    }

    player.bankrupt = true;

    // Put their spaces back on sale when they go bankrupt.
    player.properties.forEach(function(index) {
        board[index].owner = null;
    });

    player.properties = [];

    showMessage(player.name + " is bankrupt!");

    checkWinner();
}

function checkWinner() {

    const remaining = players.filter(function(player) {
        return !player.bankrupt;
    });

    if (remaining.length === 1) {
        gameOver = true;

        rollButton.disabled = true;

        if (currentTurnDisplay) {
            currentTurnDisplay.textContent = "Game Over";
        }

        showMessage(
            remaining[0].name + " wins Monopoly!"
        );

        alert(remaining[0].name + " wins Monopoly!");
    }
}


// Both Chance and Community Chest use this small card pool.


function drawCard(player) {

    const randomIndex = Math.floor(
        Math.random() * cards.length
    );

    const card = cards[randomIndex];

    player.money += card.amount;

    showMessage(player.name + ": " + card.text);

    alert(card.text);

    checkBankruptcy(player);
}


function sendToJail(player) {

    player.position = 10;

    // We're keeping jail simple: just skip their next turn.
    player.skipTurns = 1;

    showMessage(
        player.name + " went to jail and will miss one turn!"
    );
}


function handleTile(player, diceTotal) {

    const tile = board[player.position];

    console.log(
        player.name + " landed on " + tile.name
    );

    if (
        tile.type === "property" ||
        tile.type === "station" ||
        tile.type === "utility"
    ) {
        handleProperty(player, tile, diceTotal);
    }

    else if (tile.type === "tax") {
        player.money -= tile.amount;

        showMessage(
            player.name + " paid £" +
            tile.amount + " tax!"
        );

        checkBankruptcy(player);
    }

    else if (
        tile.type === "chance" ||
        tile.type === "chest"
    ) {
        drawCard(player);
    }

    else if (tile.type === "goToJail") {
        sendToJail(player);
    }

    else {
        showMessage(
            player.name + " landed on " + tile.name
        );
    }
}


function nextTurn() {

    if (gameOver) {
        return;
    }

    // Skip bankrupt players and wrap back to player 0 when needed.
    do {
        currentPlayer =
            (currentPlayer + 1) % players.length;

    } while (players[currentPlayer].bankrupt);

    updateCurrentTurn();
}
