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

function drawBoard(b) {
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
            cell.innerHTML = 8-(b[i][j].breathe);
            cell.style.boxShadow = b[i][j].player.color + " 0px 0px 0px 1px inset";
          }
        }
      }
    }
  }
}

socket.on('newGame', function(b) {
  clearText();
  clearSelection();
  drawBoard(b);
  moved = false;
});

socket.on('players', function(p) {
  for (var id in p) {
    document.getElementById(parseInt(id)+1).disabled = (p[id].online)?true:false;
    if (p[id].x > -1) {
      var cell = document.getElementById("" + p[id].x + " " + p[id].y);
      cell.style.backgroundColor = p[id].color;
      for (var key in p[id].safe) {
        document.getElementById(key).style.backgroundColor = "yellow";
      }
    }
    var x = parseInt(id)+1;
    document.getElementById("Player"+x).innerHTML = "Player: " + "</br>"
                                                    + "HP: " + p[id].HP + "</br>"
                                                    + "Upgrade: " + "</br>"
                                                    + "&nbsp&nbspSword: x0" + "</br>"
                                                    + "&nbsp&nbspSpear: x0" + "</br>"
                                                    + "&nbsp&nbspBow: x0" + "</br>"
                                                    + "&nbsp&nbspBoots: x0" + "</br>"
                                                    + "&nbsp&nbspSpike: x0" + "</br>";
  }
});

socket.on('board', function(b) {
  clearSelection();
  drawBoard(b);
});

socket.on('newTurn', function() {
  clearSelection();
  moved = false;
  moveSelected = false;
});
