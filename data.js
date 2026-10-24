"use strict";
// Board and card data. Frontend: use board[index] for space labels and prices.
// Load data.js, engine.js, then ui.js, all with defer in the HTML.
// This is a local shared-screen game; refreshing resets everything.

// Each entry is one board space. Keep this order in sync with the HTML.
// Index 0 goes with tile0, index 1 with tile1, and so on up to tile39.
// owner is a player object, or null when the space is still available.

const board = [
    { name: "GO", type: "go" },
    { name: "Old Kent Road", type: "property", price: 60, rent: 2, owner: null },
    { name: "Community Chest", type: "chest" },
    { name: "Whitechapel Road", type: "property", price: 60, rent: 4, owner: null },
    { name: "Income Tax", type: "tax", amount: 200 },
    { name: "King's Cross Station", type: "station", price: 200, rent: 25, owner: null },
    { name: "The Angel Islington", type: "property", price: 100, rent: 6, owner: null },
    { name: "Chance", type: "chance" },
    { name: "Euston Road", type: "property", price: 100, rent: 6, owner: null },
    { name: "Pentonville Road", type: "property", price: 120, rent: 8, owner: null },

    { name: "Jail / Just Visiting", type: "jail" },
    { name: "Pall Mall", type: "property", price: 140, rent: 10, owner: null },
    { name: "Electric Company", type: "utility", price: 150, owner: null },
    { name: "Whitehall", type: "property", price: 140, rent: 10, owner: null },
    { name: "Northumberland Avenue", type: "property", price: 160, rent: 12, owner: null },
    { name: "Marylebone Station", type: "station", price: 200, rent: 25, owner: null },
    { name: "Bow Street", type: "property", price: 180, rent: 14, owner: null },
    { name: "Community Chest", type: "chest" },
    { name: "Marlborough Street", type: "property", price: 180, rent: 14, owner: null },
    { name: "Vine Street", type: "property", price: 200, rent: 16, owner: null },

    { name: "Free Parking", type: "parking" },
    { name: "Strand", type: "property", price: 220, rent: 18, owner: null },
    { name: "Chance", type: "chance" },
    { name: "Fleet Street", type: "property", price: 220, rent: 18, owner: null },
    { name: "Trafalgar Square", type: "property", price: 240, rent: 20, owner: null },
    { name: "Fenchurch St Station", type: "station", price: 200, rent: 25, owner: null },
    { name: "Leicester Square", type: "property", price: 260, rent: 22, owner: null },
    { name: "Coventry Street", type: "property", price: 260, rent: 22, owner: null },
    { name: "Water Works", type: "utility", price: 150, owner: null },
    { name: "Piccadilly", type: "property", price: 280, rent: 24, owner: null },

    { name: "Go To Jail", type: "goToJail" },
    { name: "Regent Street", type: "property", price: 300, rent: 26, owner: null },
    { name: "Oxford Street", type: "property", price: 300, rent: 26, owner: null },
    { name: "Community Chest", type: "chest" },
    { name: "Bond Street", type: "property", price: 320, rent: 28, owner: null },
    { name: "Liverpool St Station", type: "station", price: 200, rent: 25, owner: null },
    { name: "Chance", type: "chance" },
    { name: "Park Lane", type: "property", price: 350, rent: 35, owner: null },
    { name: "Super Tax", type: "tax", amount: 100 },
    { name: "Mayfair", type: "property", price: 400, rent: 50, owner: null }
];

// Shared card pool for Chance and Community Chest.
const cards = [
    { text: "Bank pays you £100!", amount: 100 },
    { text: "Pay a £50 fine!", amount: -50 },
    { text: "You receive a £200 bonus!", amount: 200 },
    { text: "Pay £100 in repairs!", amount: -100 },
    { text: "Collect £50!", amount: 50 },
    { text: "Pay £25 in fees!", amount: -25 }
];
