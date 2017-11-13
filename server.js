// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', 8000);
app.use('/static', express.static(__dirname + '/static'));
app.use('/StyleSheets/css', express.static(__dirname + '/StyleSheets/css'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(8000, function() {
  console.log('Starting server on port 8000');
});

var playerColors = ["#FF0000", "#00FF00", "#0000FF", "#FF00FF"];
var players = {}; // All created characters
for (var i = 0; i < 4; i++) {
  players[i] = {
    Id: "",
    HP: 100,
    x: 0,
    y: 0,
    color: playerColors[i],
    status: 'idle',
    online: false
  };
}

var board = [];
var clients = {};
// Add the WebSocket handlers
io.on('connection', function(socket) {
  // initiation handler
  socket.on('init', function(data) {
    console.log(data.message);
  });

  // login handler
  socket.on('login', function(data, fn) {
    if ((!players[data-1].online)&&(clients[socket.id] == null)) { // character not logged in
      console.log("player " + (data-1) + " logged in");
      players[data-1].online = true;
      clients[socket.id] = parseInt(data)-1;
      fn(true);
    } else { // character already logged in
      fn(false);
    }
  });

  // disconnect handler
  socket.on('disconnect', function() {
    if (clients[socket.id] != null) {
      console.log("player " + clients[socket.id] + " logged out");
      players[clients[socket.id]].online = false;
      delete clients[socket.id];
    }
  });
});

// Send state of game to all clients
setInterval(function() {
  io.sockets.emit('state', players, board);
}, 1000 / 60);
