const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess(); // Chess engine Rules
let players = {};
let currentPlayer = "w"; // W for white side player

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
  console.log("New client connected");

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("PlayerRole", "w");
    console.log("Assigned white to", uniquesocket.id);
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("PlayerRole", "b");
    console.log("Assigned black to", uniquesocket.id);
  } else {
    uniquesocket.emit("spectatorRole");
    console.log("Assigned spectator role to", uniquesocket.id);
  }

  uniquesocket.on("disconnet", function () {
    if (uniquesocket.id === players.white) {
      delete players.white;
    } else if (uniquesocket.id === players.black) {
      delete players.black;
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
      if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move : ", move);
        uniquesocket.emit("invalidMove", move);
      }
    } catch (err) {
      console.log(err);
      console.log("Invadid move: ", move);
      uniquesocket.emit("invalidMove", move);
    }
  });
});

server.listen(3000, function () {
  console.log("listening on port 3000");
});
