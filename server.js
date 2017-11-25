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
app.use('/icons', express.static(__dirname + '/icons'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(8000, function() {
  console.log('Starting server on port 8000');
});

var game = false;
var boardW = 45;
var boardH = 50;
var numOfMines = 350;
var numOfOpenCells = 0;

var playerColors = ["#FF0000", "#00FF00", "#00FFFF", "#FF00FF"];
var players = [];
var clients = {};
for (var i = 0; i < 4; i++) {
  var player = {
    Id: "",
    HP: 2,
    score: 0,
    x: -1,
    y: -1,
    safe: {},
    color: playerColors[i],
    online: false
  };
  players.push(player);
}

var board = [];
var sendBoard = [];
// setup board
function setupBoard() {
  board = [];
  sendBoard = [];
  // setup all cells
  for (var i = 0; i <= (boardW+1); i++) {
    var row = [];
    var sendRow = [];
    for (var j = 0; j <= (boardH+1); j++) {
      var cell = {
        player: "",
        tile: "none",
        breathe: 8,
        flag: false,
        open: false
      };
      var sendCell = {};
      if ((i == 1)||(i == boardW)||(j == 1)||(j == boardH)) {
        if (((i == 1)||(i == boardW))&&((j == 1)||(j == boardH))) {
          cell.breathe = 3;
        } else if ((i == 1)||(i == boardW)) {
          cell.breathe = 5;
        } else if ((j == 1)||(j == boardH)) {
          cell.breathe = 5;
        }
      }
      row.push(cell);
      sendRow.push(sendCell);
    }
    board.push(row);
    sendBoard.push(sendRow);
  }

  // setup mines
  for (var i = 0; i < numOfMines; i++) {
    var row = Math.floor((Math.random() * boardW) +1);
    var col = Math.floor((Math.random() * boardH) +1);
    if ((board[row][col].breathe > 0)
        &&(board[row][col+1].breathe > 1)
        &&(board[row][col-1].breathe > 1)
        &&(board[row-1][col+1].breathe > 1)
        &&(board[row-1][col].breathe > 1)
        &&(board[row-1][col-1].breathe > 1)
        &&(board[row+1][col+1].breathe > 1)
        &&(board[row+1][col].breathe > 1)
        &&(board[row+1][col-1].breathe > 1)
        &&(board[row][col].tile != "mine")) {
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
    var row = parseInt(surround[i].x);
    var col = parseInt(surround[i].y);
    var key = "" + row + " " + col;
    if ((row > 0)&&(row <= boardW)&&(col > 0)&&(col <= boardH)) {
      if ((row == 1)||(row == boardW)||(col == 1)||(col == boardH)) {
        if (((row == 1)||(row == boardW))&&((col == 1)||(col == boardH))) {
          if ((board[row][col].breathe == 3)&&(board[row][col].tile != "mine")&&(!board[row][col].open)) {
            if (player.safe[key] == null) {
              player.safe[key] = surround[i];
            }
          }
        } else if ((row == 1)||(row == boardW)) {
          if ((board[row][col].breathe == 5)&&(board[row][col].tile != "mine")&&(!board[row][col].open)) {
            if (player.safe[key] == null) {
              player.safe[key] = surround[i];
            }
          }
        } else if ((col == 1)||(col == boardH)) {
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
      console.log(players[data-1].online, clients[socket.id]);
      fn(false);
    }
  });

  socket.on('move', function(id, pos, fn) {
    if (!game) {
      return false;
    }
    var row = parseInt((pos.split(" "))[0]);
    var col = parseInt((pos.split(" "))[1]);
    var player = players[clients[socket.id]];
    /*if (((Math.abs(row-player.x) <= 1)&&(Math.abs(col-player.y) <= 1)&&(!((Math.abs(row-player.x) == 0)&&(Math.abs(col-player.y) == 0))))
        &&(players.every(p => ((p.color == player.color)||((p.x != row)||(p.y != col)))))
        &&(player.HP > 0)) {*/

    if ((player.HP > 0)&&(!board[row][col].open)&&(!board[row][col].flag)) {
      board[row][col].player = player;
      board[row][col].open = true;
      if (board[row][col].tile == 'mine') {
        player.HP = player.HP - 1;

        var count = 0;
        for (var playerId in players) {
          if ((players[playerId].HP > 0)&&(players[playerId].online)) {
            count++;
          }
        }
        if (count == 0) {
          game = false;
        }
      } else {
        if ((row == 1)||(row == boardW)||(col == 1)||(col == boardH)) {
          if (((row == 1)||(row == boardW))&&((col == 1)||(col == boardH))) {
            player.score += (3-board[row][col].breathe);
          } else if ((row == 1)||(row == boardW)) {
            player.score += (5-board[row][col].breathe);
          } else if ((col == 1)||(col == boardH)) {
            player.score += (5-board[row][col].breathe);
          }
        } else {
          player.score += (8-board[row][col].breathe);
        }
      }
      sendBoard[row][col] = board[row][col];
      player.x = row;
      player.y = col;
      io.sockets.emit('board', sendBoard);
      for (var i = 0; i < 4; i++) {
        if (players[i].online&&(players[i].x > 0)&&(players[i].y > 0)) {
          calcSafePoints(i);
        }
      }
      if (numOfOpenCells == (boardH*boardW-numOfMines)) {
        game == false;
      }
      fn(true);
    } else {
      fn(false);
    }
  });

  socket.on('flag', function(id, pos, fn) {
    if (!game) {
      return false;
    }
    var row = parseInt((pos.split(" "))[0]);
    var col = parseInt((pos.split(" "))[1]);
    var player = players[clients[socket.id]];

    if ((player.HP > 0)&&(!board[row][col].open)) {
      board[row][col].flag = !board[row][col].flag;
      if (board[row][col].flag) {
        sendBoard[row][col] = board[row][col];
      } else {
        var sendCell = {};
        sendBoard[row][col] = sendCell;
      }
      io.sockets.emit('board', sendBoard);
      fn(true);
    } else {
      fn(false);
    }
  });

  socket.on('game', function(fn) {
    if (!game&&(Object.keys(clients).length > 0)) {
      game = true;
      setupBoard();
      numOfOpenCells = 0;
      for (var playerId in players) {
        players[playerId].safe = {};
        players[playerId].x = -1;
        players[playerId].y = -1;
        players[playerId].HP = 2;
        players[playerId].score = 0;
        if (players[playerId].online) {
          players[playerId].x = Math.floor((Math.random() * boardW) +1);
          players[playerId].y = Math.floor((Math.random() * boardH) +1);
          while (board[players[playerId].x][players[playerId].y].tile == "mine") {
            players[playerId].x = Math.floor((Math.random() * boardW) +1);
            players[playerId].y = Math.floor((Math.random() * boardH) +1);
          }
          board[players[playerId].x][players[playerId].y].player = players[playerId];
          board[players[playerId].x][players[playerId].y].open = true;
          sendBoard[players[playerId].x][players[playerId].y] = board[players[playerId].x][players[playerId].y];
          numOfOpenCells++;
        }
      }
      for (var i = 0; i < 4; i++) {
        if (players[i].online&&(players[i].x > 0)&&(players[i].y > 0)) {
          calcSafePoints(i);
        }
      }
      fn(0);
      io.sockets.emit('newGame', sendBoard);
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
  if (players.every(p => (!p.online))) {
    game = false;
  }
}, 1000 / 2);

function randomEvent(playerId) {
  var score = Math.floor((Math.random() * 20) -10);
  players[playerId].score += score;
  sockets.emit("randomEvent", playerId, score);
}
