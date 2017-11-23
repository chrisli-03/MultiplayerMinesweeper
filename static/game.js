var socket = io();
var playerId = -1;
var action = "";
socket.emit('init', {message: 'New socket request'});

function login(id) {
  var rtn = false;
  socket.emit('login', id, function(rs) {
    if (rs) {
      //console.log("success");
      playerId = id;
      document.getElementById("Player"+id).classList.remove("notloggedin");
      document.getElementById(id).style.border = "2px solid " + playerColors[id-1];
      document.getElementById(id).parentNode.classList.add("shine");
      document.getElementById(id).classList.add("loggedin");
    } else {
      //console.log("failed");
    }
  });
  return rtn;
}

// hex to rgb function
function hexToRGBA(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}

function sendMove(pos) {
  socket.emit("move", playerId, pos, function(rs) {
    if (rs) {
      clearSelection();
    } else {

    }
  });
}

function sendFlag(pos) {
  socket.emit("flag", playerId, pos, function(rs) {
    if (rs) {
      clearSelection();
    } else {

    }
  });
}

function drawBoard(b) {
  for (var i = 1; i <= boardW; i++) {
    for (var j = 1; j <= boardH; j++) {
      var cell = document.getElementById("" + i + " " +j);
      if (b[i][j].flag) {
        cell.innerHTML = "F";
      } else {
        cell.innerHTML = "";
      }
      if (b[i][j].tile == "mine") {
        if (b[i][j].open) {
          cell.innerHTML = "*";
          cell.classList.remove('shine');
          cell.classList.add('open');
          cell.style.boxShadow = hexToRGBA(b[i][j].player.color, 0.5) + " 0px 0px 0px 2px inset";
        }
      } else {
        if ((i == 1)||(i == boardW)||(j == 1)||(j == boardH)) {
          if (((i == 1)||(i == boardW))&&((j == 1)||(j == boardH))) {
            if (b[i][j].open) {
              cell.innerHTML = 3-(b[i][j].breathe);
              cell.classList.remove('shine');
              cell.classList.add('open');
              cell.style.boxShadow = hexToRGBA(b[i][j].player.color, 0.5) + " 0px 0px 0px 2px inset";
            }
          } else if ((i == 1)||(i == boardW)) {
            if (b[i][j].open) {
              cell.innerHTML = 5-(b[i][j].breathe);
              cell.classList.remove('shine');
              cell.classList.add('open');
              cell.style.boxShadow = hexToRGBA(b[i][j].player.color, 0.5) + " 0px 0px 0px 2px inset";
            }
          } else if ((j == 1)||(j == boardH)) {
            if (b[i][j].open) {
              cell.innerHTML = 5-(b[i][j].breathe);
              cell.classList.remove('shine');
              cell.classList.add('open');
              cell.style.boxShadow = hexToRGBA(b[i][j].player.color, 0.5) + " 0px 0px 0px 2px inset";
            }
          }
        } else {
          if (b[i][j].open) {
            cell.innerHTML = 8-(b[i][j].breathe);
            cell.classList.remove('shine');
            cell.classList.add('open');
            cell.style.boxShadow = hexToRGBA(b[i][j].player.color, 0.5) + " 0px 0px 0px 2px inset";
          }
        }
      }
    }
  }
}

socket.on('newGame', function(b) {
  clearText();
  clearSelection();
  setTimeout(function() {
    drawBoard(b);
  }, 600);
});

socket.on('players', function(p) {
  for (var id in p) {
    document.getElementById(parseInt(id)+1).disabled = (p[id].online)?true:false;
    if (p[id].online) {
      document.getElementById("Player"+(parseInt(id)+1)).classList.remove("notloggedin");
    }
    if (p[id].x > -1) {
      var cell = document.getElementById("" + p[id].x + " " + p[id].y);
      cell.style.backgroundColor = hexToRGBA(p[id].color, 0.5);
      for (var key in p[id].safe) {
        document.getElementById(key).style.backgroundColor = "yellow";
      }
    }
    var x = parseInt(id)+1;
    document.getElementById("Player"+x).innerHTML = "Player: " + "</br>"
                                                    + "HP: " + p[id].HP + "</br>"
                                                    + "&nbsp&nbspScore: " + p[id].score + "</br>";
  }
});

socket.on('board', function(b) {
  clearSelection();
  drawBoard(b);
});
