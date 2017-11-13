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

socket.on('state', function(p, b) {
  for (var id in p) {
    document.getElementById(parseInt(id)+1).disabled = (p[id].online)?true:false;
  }
});

/*
mInterval = setInterval(function() {
  if (playerId > -1) {
    //socket.emit('movement', movement);
  }
}, 1000 / 60);
*/
