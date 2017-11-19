var board = document.getElementsByClassName("board")[0];
var actionHUD = document.getElementsByClassName("action")[0];
var inventory = document.getElementsByClassName("inventory")[0];
var playerHUD = document.getElementsByClassName("status")[0];

var boardW = 45;
var boardH = 50;

function clearSelection() {
  for (var i = 0; i < cells.length; i++) {
    for (var j = 0; j < cells[i].length; j++) {
      cells[i][j].style.backgroundColor = "white";
    }
  }
}

function clearText() {
  for (var i = 0; i < cells.length; i++) {
    for (var j = 0; j < cells[i].length; j++) {
      cells[i][j].style.boxShadow = "0px 0px 0px 1px grey inset";
      cells[i][j].innerHTML = "";
    }
  }
}

var cells = []; // cell[i][j] = ith row, jth column
for (var i = 1; i <= boardW; i++) {
  var row = [];
  for (var j = 1; j <= boardH; j++) {
    var cell = document.createElement("DIV");
    cell.setAttribute("style", "box-shadow: 0px 0px 0px 1px grey inset;"
                                + "grid-column-start: " + j + ";"
                                + "grid-column-end: " + (j+1) + ";"
                                + "grid-row-start: " + i + ";"
                                + "grid-row-end: " + (i+1) + ";");


    cell.id = "" + i + " " + j;
    cell.className = "cell";
    cell.addEventListener("mousedown", function(event) {
      switch (event.which) {
        case 1: // left click
              sendMove(this.id);
              break;
        case 3: // right click
              sendFlag(this.id);
              break;
      }
    });
    row.push(cell);
    board.appendChild(cell);
  }
  cells.push(row);
}

var players = [];
var playerColors = ["#FF0000", "#00FF00", "#00FFFF", "#FF00FF"];
for (var i = 1; i <= 4; i++) {
  var playerWrapper = document.createElement("DIV");
  var player = document.createElement("DIV");
  playerWrapper.setAttribute("style", "box-shadow: 0px 0px 0px 1px " + playerColors[i-1] + " inset;"
                              + "grid-row-start: " + i + ";"
                              + "grid-row-end: " + (i+1) + ";");
  player.innerHTML = "Player: " + "</br>"
                      + "HP: 100" + "</br>"
                      + "&nbsp&nbspScore: x0" + "</br>";
  player.id = "Player"+i;
  var loginBtn = document.createElement("BUTTON");
  var btnHolder = document.createElement("DIV");
  btnHolder.setAttribute("style", "text-align: center; padding-top: 5px");
  loginBtn.innerHTML = "Login";
  loginBtn.id = i;
  loginBtn.addEventListener("click", function() { login(parseInt(this.id)); });
  btnHolder.appendChild(loginBtn);
  playerWrapper.appendChild(player);
  playerWrapper.appendChild(btnHolder);

  players.push(player);
  playerHUD.appendChild(playerWrapper);
}

document.getElementById('Game').addEventListener("click", function() {
  socket.emit('game', function(rs) {
    if (rs == 1) {
      alert("At least 1 player should login to start a game");
    } else if (rs == 2) {
      alert("Game already started");
    } else if (rs == 0){
      clearSelection();
      clearText();
    }
  });
});
