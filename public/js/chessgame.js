const socket = io();

socket.emit("hey");
socket.on("Good Morning", function () {
  console.log("Good Morning received");
});
