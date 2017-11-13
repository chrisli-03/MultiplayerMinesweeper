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

/*
function isValidPosForMine(row, col) {
  if (row == 0) {
    if (col == 0) {
      if ((board[row+1][col] != "mine")
          ||(board[row+1][col+1] != "mine")
          ||(board[row][col+1] != "mine")) {
            return true;
          }
    } else if (col == 40) {
      if ((board[row+1][col] != "mine")
          ||(board[row+1][col-1] != "mine")
          ||(board[row][col-1] != "mine")) {
            return true;
          }
    } else {
      if ((board[row+1][col] != "mine")
          ||(board[row+1][col+1] != "mine")
          ||(board[row+1][col-1] != "mine")
          ||(board[row][col-1] != "mine")
          ||(board[row][col+1] != "mine")) {
            return true;
          }
    }
  }
  if (row == 40) {
    if (col == 0) {
      if (
          ||(board[row][col+1] != "mine")
          ||(board[row-1][col+1] != "mine")
          ||(board[row-1][col] != "mine")) {
            return true;
          }
    } else if (col == 40) {
      if ((board[row][col-1] != "mine")
          ||(board[row-1][col] != "mine")
          ||(board[row-1][col-1] != "mine")) {
            return true;
          }
    } else {
      if ((board[row][col-1] != "mine")
          ||(board[row][col+1] != "mine")
          ||(board[row-1][col+1] != "mine")
          ||(board[row-1][col] != "mine")
          ||(board[row-1][col-1] != "mine")) {
            return true;
          }
    }
  } else {
    if (col == 0) {
      if ((board[row+1][col] != "mine")
          ||(board[row+1][col+1] != "mine")
          ||(board[row][col+1] != "mine")
          ||(board[row-1][col+1] != "mine")
          ||(board[row-1][col] != "mine")) {
            return true;
          }
    } else if (col == 40) {
      if ((board[row][col-1] != "mine")
          ||(board[row+1][col-1] != "mine")
          ||(board[row+1][col] != "mine")
          ||(board[row-1][col] != "mine")
          ||(board[row-1][col-1] != "mine")) {
            return true;
          }
    } else {
      if ((board[row][col-1] != "mine")
          ||(board[row+1][col-1] != "mine")
          ||(board[row+1][col] != "mine")
          ||(board[row+1][col+1] != "mine")
          ||(board[row][col+1] != "mine")
          ||(board[row-1][col+1] != "mine")
          ||(board[row-1][col] != "mine")
          ||(board[row-1][col-1] != "mine")) {
            return true;
          }
    }
  }
  return false;
}*/

var board = [];
// setup board
function setupBoard() {
  board = [];
  // setup all cells
  for (var i = 0; i <= 41; i++) {
    var row = [];
    for (var j = 0; j <= 41; j++) {
      var cell = {};
      if ((i == 1)||(i == 40)||(j == 1)||(j == 40)) {
        if (((i == 1)||(i == 40))&&((j == 1)||(j == 40))) {
          cell = {
            player: "",
            tile: "none",
            breathe: 3
          }
        } else if ((i == 1)||(i == 40)) {
          cell = {
            player: "",
            tile: "none",
            breathe: 5
          }
        } else if ((j == 1)||(j == 40)) {
          cell = {
            player: "",
            tile: "none",
            breathe: 5
          }
        }
      } else {
        cell = {
          player: "",
          tile: "none",
          breathe: 8
        }
      }
      row.push(cell);
    }
    board.push(row);
  }

  // setup mines
  for (var i = 0; i < 300; i++) {
    var row = Math.floor((Math.random() * 40) +1);
    var col = Math.floor((Math.random() * 40) +1);
    if ((board[row][col].breathe > 0)
        &&(board[row][col+1].breathe > 1)
        &&(board[row][col-1].breathe > 1)
        &&(board[row-1][col+1].breathe > 1)
        &&(board[row-1][col].breathe > 1)
        &&(board[row-1][col-1].breathe > 1)
        &&(board[row+1][col+1].breathe > 1)
        &&(board[row+1][col].breathe > 1)
        &&(board[row+1][col-1].breathe > 1)) {
          board[row][col].tile = "mine";
          board[row][col+1].breathe--;
          board[row][col-1].breathe--;
          board[row-1][col+1].breathe--;
          board[row-1][col].breathe--;
          board[row-1][col-1].breathe--;
          board[row+1][col+1].breathe--;
          board[row+1][col].breathe--;
          board[row+1][col-1].breathe--;
        } else {
          i--;
        }
  }
}




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

  // attack handler
  socket.on('attack', function(id, fn) {
    if ((players[id-1].online)&&(clients[socket.id] == id-1)) {
      console.log("player " + (id-1) + " attacked!");
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

setupBoard();
// Send state of game to all clients
setInterval(function() {
  io.sockets.emit('state', players, board);
}, 1000 / 60);
