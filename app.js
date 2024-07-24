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
let currentPlayer = "W"; // W for white side player

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
  console.log("Connected");

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit();
  } else if (players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("PlayerRole", "b");
  } else {
    uniquesocket.emit("spectaterRole");
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
      if (chess.turn() === "w" && socket.id !== players.white) return;
      if (chess.turn() === "b" && socket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move : ", move);
        uniquesocket.emit("Invalid Move ", move);
      }
    } catch (err) {
      console.log(err);
      console.log("Invadid move: ", move);
      uniquesocket.emit("Invalid move: ", move);
    }
  });
});

server.listen(3000, function () {
  console.log("listening on port 3000");
});
