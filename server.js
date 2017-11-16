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

var game = false;

var playerColors = ["#FF0000", "#00FF00", "#00FFFF", "#FF00FF"];
var players = [];
var clients = {};
for (var i = 0; i < 4; i++) {
  var player = {
    Id: "",
    HP: 100,
    x: -1,
    y: -1,
    safe: {},
    color: playerColors[i],
    status: 'idle',
    online: false
  };
  players.push(player);
}

var board = [];
var sendBoard = [];
// setup board
function setupBoard() {
  board = [];
  // setup all cells
  for (var i = 0; i <= 41; i++) {
    var row = [];
    var sendRow = [];
    for (var j = 0; j <= 41; j++) {
      var cell = {};
      var sendCell = {};
      if ((i == 1)||(i == 40)||(j == 1)||(j == 40)) {
        if (((i == 1)||(i == 40))&&((j == 1)||(j == 40))) {
          cell = {
            player: "",
            tile: "none",
            breathe: 3,
            open: false
          }
        } else if ((i == 1)||(i == 40)) {
          cell = {
            player: "",
            tile: "none",
            breathe: 5,
            open: false
          }
        } else if ((j == 1)||(j == 40)) {
          cell = {
            player: "",
            tile: "none",
            breathe: 5,
            open: false
          }
        }
      } else {
        cell = {
          player: "",
          tile: "none",
          breathe: 8,
          open: false
        }
      }
      row.push(cell);
      sendRow.push(sendCell);
    }
    board.push(row);
    sendBoard.push(sendRow);
  }

  // setup mines
  for (var i = 0; i < 250; i++) {
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

function calcSafePoints(playerId) {
  var player = players[playerId];
  console.log(player.safe);
  for (var key in player.safe) {
    var arr = key.split(" ");
    var row = arr[0];
    var col = arr[1];
    if (board[row][col].open) {
      delete player.safe[key];
    }
  }

  safePoints = [];
  var surround = [];
  surround.push( { x: player.x, y: player.y-1 } );
  surround.push( { x: player.x, y: player.y+1 } );
  surround.push( { x: player.x-1, y: player.y-1 } );
  surround.push( { x: player.x-1, y: player.y } );
  surround.push( { x: player.x-1, y: player.y+1 } );
  surround.push( { x: player.x+1, y: player.y-1 } );
  surround.push( { x: player.x+1, y: player.y } );
  surround.push( { x: player.x+1, y: player.y+1 } );

  for (var i = 0; i < 8; i++) {
    var row = surround[i].x;
    var col = surround[i].y;
    var key = "" + row + " " + col;
    if ((row == 1)||(row == 40)||(col == 1)||(col == 40)) {
      if (((row == 1)||(row == 40))&&((col == 1)||(col == 40))) {
        if ((board[row][col].breathe == 3)&&(board[row][col].tile != "mine")&&(!board[row][col].open)) {
          if (player.safe[key] == null) {
            player.safe[key] = surround[i];
          }
        }
      } else if ((row == 1)||(row == 40)) {
        if ((board[row][col].breathe == 5)&&(board[row][col].tile != "mine")&&(!board[row][col].open)) {
          if (player.safe[key] == null) {
            player.safe[key] = surround[i];
          }
        }
      } else if ((col == 1)||(col == 40)) {
        if ((board[row][col].breathe == 5)&&(board[row][col].tile != "mine")&&(!board[row][col].open)) {
          if (player.safe[key] == null) {
            player.safe[key] = surround[i];
          }
        }
      }
    } else {
      if ((board[row][col].breathe == 8)&&(board[row][col].tile != "mine")&&(!board[row][col].open)) {
        if (player.safe[key] == null) {
          player.safe[key] = surround[i];
        }
      }
    }
  }
}

// Add the WebSocket handlers
io.on('connection', function(socket) {
  // initiation handler
  socket.on('init', function(data) {
    if (game) {
      socket.emit('board', board);
    }
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

  socket.on('move', function(id, pos, fn) {
    var row = parseInt((pos.split(" "))[0]);
    var col = parseInt((pos.split(" "))[1]);
    var player = players[clients[socket.id]];
    if (((Math.abs(row-player.x) <= 1)&&(Math.abs(col-player.y) <= 1)&&(!((Math.abs(row-player.x) == 0)&&(Math.abs(col-player.y) == 0))))
        &&(players.every(p => ((p.color == player.color)||((p.x != row)||(p.y != col)))))) {
      board[row][col].player = player;
      board[row][col].open = true;
      sendBoard[row][col] = board[row][col];
      player.x = row;
      player.y = col;
      player.status = 'moved';
      io.sockets.emit('board', sendBoard);
      for (var i = 0; i < 4; i++) {
        if (players[i].online&&(players[i].x > 0)&&(players[i].y > 0)) {
          calcSafePoints(i);
        }
      }
      fn(true);
    } else {
      fn(false);
    }
  });

  socket.on('game', function(fn) {
    if (!game&&(Object.keys(clients).length > 0)) {
      game = true;
      setupBoard();
      for (var playerId in players) {
        if (players[playerId].online) {
          players[playerId].x = Math.floor((Math.random() * 40) +1);
          players[playerId].y = Math.floor((Math.random() * 40) +1);
          while (board[players[playerId].x][players[playerId].y].tile == "mine") {
            players[playerId].x = Math.floor((Math.random() * 40) +1);
            players[playerId].y = Math.floor((Math.random() * 40) +1);
          }
          board[players[playerId].x][players[playerId].y].player = players[playerId];
          board[players[playerId].x][players[playerId].y].open = true;
          sendBoard[players[playerId].x][players[playerId].y] = board[players[playerId].x][players[playerId].y];
        }
      }
      io.sockets.emit('board', sendBoard);
      for (var i = 0; i < 4; i++) {
        if (players[i].online&&(players[i].x > 0)&&(players[i].y > 0)) {
          calcSafePoints(i);
        }
      }
    } else if (game) {
      fn(2);
    } else if (Object.keys(clients).length == 0){
      fn(1);
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
  io.sockets.emit('players', players);
  if (game) {
    if (players.every((p) => { return (!p.online)||(p.status == 'moved') })) {
      players.map((p) => p.status = 'idle');
      io.sockets.emit('newTurn');
    }
  }
}, 1000 / 200);
