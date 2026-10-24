const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const path = require('path');

let engine;
try {
  engine = require('./engine.js');
} catch (e) {
  console.log("ℹ️ Engine.js not found — using default server-side fallback rules.");
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static(path.join(__dirname, '/')));
const PYTHON_ML_URL = process.env.PYTHON_ML_URL || "http://localhost:8000";
const rooms = {};

async function getAIDecision(player, tile) {
  try {
    const response = await axios.post(`${PYTHON_ML_URL}/ai/decision`, {
      cash: player.cash,
      position: player.pos,
      ownedPropertiesCount: player.props.length,
      tilePrice: tile.price || 200,
      tileRent: tile.rent || 30
    }, { timeout: 1000 });
    return response.data;
  } catch (error) {
    const tilePrice = tile.price || 200;
    const affordabilityRatio = player.cash / tilePrice;
    let buyProbability = 0.5;
    if (affordabilityRatio > 3.0) buyProbability += 0.4;
    else if (affordabilityRatio > 1.5) buyProbability += 0.2;
    else if (affordabilityRatio < 1.0) buyProbability -= 0.5;
    if (player.props.length < 3) buyProbability += 0.2;

    const shouldBuy = Math.random() < buyProbability;
    return {
      shouldBuy: shouldBuy,
      confidence: parseFloat(buyProbability.toFixed(2)),
      reason: shouldBuy ? "High financial viability / property ROI" : "Risk aversion / low liquidity buffer"
    };
  }
}

function generateAIGlitchCard(player) {
  const y2kEvents = [
    { title: "Y2K Bug Patch Purchased", effect: -50, desc: "System upgrade costs $50." },
    { title: "Dot-Com Stock Surge", effect: 150, desc: "Your startup stock gained $150." },
    { title: "Viral MP3 Downloaded", effect: 50, desc: "Earned $50 in peer-to-peer royalties." },
    { title: "Dial-Up Connection Dropped", effect: -30, desc: "Lost $30 in ISP service fees." }
  ];
  const selectedEvent = y2kEvents[Math.floor(Math.random() * y2kEvents.length)];
  player.cash += selectedEvent.effect;
  return selectedEvent;
}

io.on('connection', (socket) => {
  console.log(`🔌 Player Connected: ${socket.id}`);

  socket.on('joinRoom', ({ roomId, playerName, playerEmoji, isBot = false }) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = { id: roomId, players: [], currentTurn: 0, round: 1, started: false };
    }
    const room = rooms[roomId];
    if (room.players.length < 4 && !room.started) {
      const newPlayer = {
        id: socket.id,
        name: playerName || `PLAYER_0${room.players.length + 1}`,
        emoji: playerEmoji || "👾",
        isBot: isBot,
        cash: 1500,
        pos: 0,
        props: [],
        isBankrupt: false
      };
      room.players.push(newPlayer);
      io.to(roomId).emit('roomUpdated', room);
      console.log(`👤 [${newPlayer.name}] joined Room [${roomId}]`);
    } else {
      socket.emit('errorMessage', 'Room is full or game has already started.');
    }
  });

  socket.on('rollDice', async ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    const player = room.players[room.currentTurn];
    if (player.id !== socket.id && !player.isBot) {
      return socket.emit('errorMessage', 'Not your turn!');
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const steps = d1 + d2;
    const oldPos = player.pos;

    player.pos = (player.pos + steps) % 12;
    if (player.pos < oldPos) player.cash += 200;

    const moveResult = { die1: d1, die2: d2, totalSteps: steps, newPos: player.pos };

    io.to(roomId).emit('diceRolled', {
      playerId: player.id,
      playerName: player.name,
      moveResult,
      roomState: room
    });

    if (player.isBot) {
      setTimeout(async () => {
        const mockTile = { price: 200, rent: 30 };
        const decision = await getAIDecision(player, mockTile);

        if (decision.shouldBuy && player.cash >= mockTile.price) {
          player.cash -= mockTile.price;
          player.props.push(player.pos);
          io.to(roomId).emit('propertyBought', {
            playerName: player.name,
            tileId: player.pos,
            decisionReason: decision.reason,
            confidence: decision.confidence,
            roomState: room
          });
        }

        if (Math.random() > 0.6) {
          const glitchEvent = generateAIGlitchCard(player);
          io.to(roomId).emit('glitchCardDrawn', {
            playerName: player.name,
            glitchEvent,
            roomState: room
          });
        }

        switchNextTurn(roomId);
      }, 1200);
    }
  });

  socket.on('buyProperty', ({ roomId, tileId, price = 200 }) => {
    const room = rooms[roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.cash < price) return;
    player.cash -= price;
    player.props.push(tileId);
    io.to(roomId).emit('propertyBought', { playerName: player.name, tileId, roomState: room });
  });

  socket.on('endTurn', ({ roomId }) => {
    switchNextTurn(roomId);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Player Disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length === 0) delete rooms[roomId];
      else io.to(roomId).emit('roomUpdated', room);
    }
  });
});

function switchNextTurn(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  room.currentTurn = (room.currentTurn + 1) % room.players.length;
  if (room.currentTurn === 0) room.round++;
  io.to(roomId).emit('turnChanged', room);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Y2Kopoly Server Online!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🤖 Machine Learning Bridge: Active`);
  console.log(`==================================================`);
});
