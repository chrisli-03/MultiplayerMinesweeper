
<script src="/socket.io/socket.io.js"></script>
<script src="/static/login.js"></script>
<script src="/static/game.js"></script>

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

var colors = ["#FF0000", "#00FF00", "#0000FF", "FF00FF"]
var players = {}; // All created characters
for (var i = 0; i < 4; i++) {
  players[data.playerId] = {
    HP: 100,
    x: 0,
    y: 0,
    color: colors[i],
    status: 'idle',
    online: true
  };
}

// Add the WebSocket handlers
io.on('connection', function(socket) {
  // initiation handler
  socket.on('init', function(data) {
    console.log(data.message);
  });

  // login handler
  socket.on('login', function(data, fn) {
    console.log(socket.id + " wants to login as: " + data.playerId);
    if (players[data.playerId] == null) { // character doesn't exist yet

      fn(true);
      console.log("Player " + data.playerId + " has logged in");
    } else { // character already exist
      if (players[data.playerId].online) { // character already online
        fn(false);
        console.log("Player " + data.playerId + " already logged in");
      } else { // character offline
        players[data.playerId].online = true; // put character under client control
        fn(true);
        console.log("Player " + data.playerId + " has logged in");
      }
    }
  });

  // movement handler
  socket.on('movement', function(data) {
    var player = players[data.id] || {};
    if (data.left) { player.x = (player.x-3 < 3)? 3 : player.x - 3; } // left
    if (data.up) { player.y = (player.y-3 < 3)? 3 : player.y - 3; } // up
    if (data.right) { player.x = (player.x+3 > 797)? 797 : player.x + 3; } // right
    if (data.down) { player.y = (player.y+3 > 597)? 597 : player.y + 3; } // down
  });

  // attack handler
  socket.on('attack', function(player, pos) {
    if (players[player].status == 'idle') {
      players[player].status = 'attack';
      players[player].clickX = pos.x;
      players[player].clickY = pos.y;
      players[player].pClickX = players[player].x;
      players[player].pClickY = players[player].y;
      attackCollisionCheck(player, pos);
      var attackInterval = setInterval(function() {
        if (players[player].attackDuration < 100) {
          players[player].attackDuration+=5;
        } else {
          players[player].attackDuration = 100;
        }
      }, 400/100);
      setTimeout(function() { players[player].status = 'idle';
                              players[player].attackDuration = 0;
                              clearInterval(attackInterval); }, 400);
    }
  });

  // shoot handler
  socket.on('shoot', function(player, pos, type) {
    if (players[player].status == 'idle') {
      players[player].status = 'shoot';
      players[player].clickX = pos.x;
      players[player].clickY = pos.y;
      var diffX = pos.x - players[player].x;
      var diffY = pos.y - players[player].y;
      var dirX = diffX/(Math.abs(diffX) + Math.abs(diffY));
      var dirY = diffY/(Math.abs(diffX) + Math.abs(diffY));
      if (type == 0) {
        projectiles.push({type: type,
                          x: players[player].x + 20*dirX, y: players[player].y + 20*dirY,
                          dirX: dirX, dirY: dirY,
                          bounce: 0,
                          owner: player});
        setTimeout(function() { players[player].status = 'idle';}, 300);
      }
      if (type == 1) {
        projectiles.push({type: type,
                          x1: players[player].x + 20*dirX, y1: players[player].y + 20*dirY,
                          x: players[player].x + 20*dirX, y: players[player].y + 20*dirY,
                          dirX: dirX, dirY: dirY,
                          owner: player});
        setTimeout(function() { players[player].status = 'idle';}, 1000);
      }
    }
  });

  // logout handler
  socket.on('logout', function(data) {
    if (players[onlineUsers[socket.id]] != null) {
      players[onlineUsers[socket.id]].online = false; // log character off
      console.log(socket.id + " as player: " + onlineUsers[socket.id] + " has logged out");
      delete onlineUsers[socket.id];
    }
  });

  // disconnect handler
  socket.on('disconnect', function() {
    if (onlineUsers[socket.id] != null) { // check if a character is under client control
      players[onlineUsers[socket.id]].online = false; // log character off
      console.log(socket.id + " as player: " + onlineUsers[socket.id] + " has disconnected");
      delete onlineUsers[socket.id];
    }
  });
});

// check for attack collision
function attackCollisionCheck(player, pos) {
  var x = players[player].clickX - players[player].pClickX;
  var y = players[player].pClickY - players[player].clickY;
  var h = 0;
  var arcstart = 0;
  if ((x > 0)&&(y < 0)) {
    h = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    var arcstart = Math.acos(x/h);
  } else if ((x < 0)&&(y < 0)) {
    h = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    var arcstart = Math.acos(x/h);
  } else if ((x < 0)&&(y > 0)) {
    h = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    var arcstart = Math.PI * 2 - Math.acos(x/h);
  } else if ((x > 0)&&(y > 0)) {
    h = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    var arcstart = Math.PI * 2 - Math.acos(x/h);
  }
  arcstart -= 1;
  var arcend = arcstart + 2;
  for (var otherPlayer in players) {
    if (otherPlayer != player) {
      var x2 = players[otherPlayer].x - players[player].x;
      var y2 = players[player].y - players[otherPlayer].y;
      var h2 = Math.sqrt(Math.pow(x2, 2) + Math.pow(y2, 2));;
      var angle = 0;
      if ((x2 > 0)&&(y2 < 0)) {
        angle = Math.acos(x2/h2);
      } else if ((x2 < 0)&&(y2 < 0)) {
        angle = Math.acos(x2/h2);
      } else if ((x2 < 0)&&(y2 > 0)) {
        angle = Math.PI * 2 - Math.acos(x2/h2);
      } else if ((x2 > 0)&&(y2 > 0)) {
        angle = Math.PI * 2 - Math.acos(x2/h2);
      }
      if (((angle > arcstart-0.4)&&(angle < arcend+0.4))
            &&((h2 > 7)&&(h2 < 45))) {
        players[otherPlayer].curHP -= 5;
        players[otherPlayer].curHP = (players[otherPlayer].curHP<0)?0:players[otherPlayer].curHP;
      }
    }
  }

  for (var i = 0; i < projectiles.length; i++) {
    var x2 = projectiles[i].x - players[player].x;
    var y2 = players[player].y - projectiles[i].y;
    var h2 = Math.sqrt(Math.pow(x2, 2) + Math.pow(y2, 2));;
    var angle = 0;
    if ((x2 > 0)&&(y2 < 0)) {
      angle = Math.acos(x2/h2);
    } else if ((x2 < 0)&&(y2 < 0)) {
      angle = Math.acos(x2/h2);
    } else if ((x2 < 0)&&(y2 > 0)) {
      angle = Math.PI * 2 - Math.acos(x2/h2);
    } else if ((x2 > 0)&&(y2 > 0)) {
      angle = Math.PI * 2 - Math.acos(x2/h2);
    }
    if (((angle > arcstart-0.4)&&(angle < arcend+0.4))
          &&((h2 > 0)&&(h2 < 50))) {
      projectiles[i].dirX *= -1;
      projectiles[i].dirY *= -1;
    }
  }
}

// Send state of game to all clients
setInterval(function() {
  for (var i = 0; i < projectiles.length; i++) {
    var projectile = projectiles[i];
    switch (projectile.type) {
      case 0:
            var spd = projectileSpeed[projectile.type];
            projectile.x += spd*projectile.dirX;
            projectile.y += spd*projectile.dirY;

            if ((projectile.x > 800-projectileSpeed)||(projectile.x < 0)
                ||(projectile.y > 600-projectileSpeed)||(projectile.y < 0)) {
                if (((projectile.x > 800-projectileSpeed)||(projectile.x < 0))&&(projectile.bounce < 3)) {
                  projectile.dirX*=-1;
                  projectile.bounce++;
                } else if (((projectile.y > 600-projectileSpeed)||(projectile.y < 0))&&(projectile.bounce < 3)) {
                  projectile.dirY*=-1;
                  projectile.bounce++;
                } else {
                  projectiles.splice(i, 1);
                  i--;
                }
            }
            for (var playerId in players) {
              var x = projectile.x - players[playerId].x;
              var y = players[playerId].y - projectile.y;
              var h = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
              if (h < 7) {
                players[playerId].curHP -= 2;
                players[playerId].curHP = (players[playerId].curHP<0)?0:players[playerId].curHP;
                projectiles.splice(i, 1);
                i--;
              }
            }
            break;
      case 1:
            var spd = projectileSpeed[projectile.type];
            var des = false;
            for (var j = 0; j < 5; j++) {
              projectile.x += spd/5*projectile.dirX;
              projectile.y += spd/5*projectile.dirY;
              if ((projectile.x - spd*projectile.dirX > 1000)||(projectile.x + spd*projectile.dirX < -200)
                  ||(projectile.y - spd*projectile.dirY > 800)||(projectile.y + spd*projectile.dirY < -200)) {
                    des = true;
              }
              for (var playerId in players) {
                var x = projectile.x - players[playerId].x;
                var y = players[playerId].y - projectile.y;
                var h = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                if (h < 7) {
                  players[playerId].curHP -= 2;
                  players[playerId].curHP = (players[playerId].curHP<0)?0:players[playerId].curHP;
                  des = true;
                }
              }
            }
            if (des) {
              projectiles.splice(i, 1);
              i--;
            }
            break;
    }
  }
  io.sockets.emit('state', players, projectiles);
}, 1000 / 60);
