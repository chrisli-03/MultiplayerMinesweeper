var socket = io();
var playerId = -1;
var action = "";
socket.emit('init', {message: 'New socket request'});

function login(id) {
  socket.emit('login', id, function(rs) {
    if (rs) {
      console.log("success");
      playerId = id;
    } else {
      console.log("failed");
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

socket.on('state', function(p, b) {
  for (var id in p) {
    document.getElementById(parseInt(id)+1).disabled = (p[id].online)?true:false;
    for (var i = 1; i < 41; i++) {
      for (var j = 1; j < 41; j++) {
        var cell = document.getElementById("" + i + " " +j);
        cell.style.fontSize = 11;
        if (b[i][j].tile == "mine") {
          cell.style.backgroundColor = "green";
        } else {
          if ((i == 1)||(i == 40)||(j == 1)||(j == 40)) {
            if (((i == 1)||(i == 40))&&((j == 1)||(j == 40))) {
              cell.innerHTML = 3-(b[i][j].breathe);
            } else if ((i == 1)||(i == 40)) {
              cell.innerHTML = 5-(b[i][j].breathe);
            } else if ((j == 1)||(j == 40)) {
              cell.innerHTML = 5-(b[i][j].breathe);
            }
          } else {
            cell.innerHTML = 8-(b[i][j].breathe);
          }
        }
      }
    }
  }
});

/*
mInterval = setInterval(function() {
  if (playerId > -1) {
    //socket.emit('movement', movement);
  }
}, 1000 / 60);
*/
