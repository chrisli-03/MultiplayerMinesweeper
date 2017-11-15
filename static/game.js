var socket = io();
var playerId = -1;
var action = "";
socket.emit('init', {message: 'New socket request'});

function login(id) {
  socket.emit('login', id, function(rs) {
    if (rs) {
      //console.log("success");
      playerId = id;
    } else {
      //console.log("failed");
    }
  });
}

function sendAttack() {
  if (playerId != -1) {
    socket.emit('attack', playerId, function(rs) {
      if (rs) {
        console.log('attack success');
      } else {
        console.log('attack failed');
      }
    });
  }
}

function sendMove(pos) {
  socket.emit("move", playerId, pos, function(rs) {
    if (rs) {
      clearSelection();
      moved = true;
      moveSelected = false;
    } else {
      alert("you cant move there");
    }
  });
}

socket.on('players', function(p) {
  for (var id in p) {
    document.getElementById(parseInt(id)+1).disabled = (p[id].online)?true:false;
    if (p[id].x > -1) {
      var cell = document.getElementById("" + p[id].x + " " + p[id].y);
      cell.style.backgroundColor = p[id].color;
    }
  }
});

socket.on('board', function(b) {
  clearSelection();
  for (var i = 1; i < 41; i++) {
    for (var j = 1; j < 41; j++) {
      var cell = document.getElementById("" + i + " " +j);
      cell.style.fontSize = 11;
      if (b[i][j].tile == "mine") {
        if (b[i][j].open) {
          cell.innerHTML = "*";
          cell.style.boxShadow = b[i][j].player.color + " 0px 0px 0px 1px inset";
        }
      } else {
        if ((i == 1)||(i == 40)||(j == 1)||(j == 40)) {
          if (((i == 1)||(i == 40))&&((j == 1)||(j == 40))) {
            if (b[i][j].open) {
              cell.innerHTML = 3-(b[i][j].breathe);
              cell.style.boxShadow = b[i][j].player.color + " 0px 0px 0px 1px inset";
            }
          } else if ((i == 1)||(i == 40)) {
            if (b[i][j].open) {
              cell.innerHTML = 5-(b[i][j].breathe);
              cell.style.boxShadow = b[i][j].player.color + " 0px 0px 0px 1px inset";
            }
          } else if ((j == 1)||(j == 40)) {
            if (b[i][j].open) {
              cell.innerHTML = 5-(b[i][j].breathe);
              cell.style.boxShadow = b[i][j].player.color + " 0px 0px 0px 1px inset";
            }
          }
        } else {
          if (b[i][j].open) {
            console.log(b[i][j].breathe);
            cell.innerHTML = 8-(b[i][j].breathe);
            cell.style.boxShadow = b[i][j].player.color + " 0px 0px 0px 1px inset";
          }
        }
      }
    }
  }
});

socket.on('newTurn', function() {
  clearSelection();
  moved = false;
  moveSelected = false;
});
