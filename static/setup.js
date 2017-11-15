var board = document.getElementsByClassName("board")[0];
var actionHUD = document.getElementsByClassName("action")[0];
var inventory = document.getElementsByClassName("inventory")[0];
var playerHUD = document.getElementsByClassName("status")[0];

var moved = false;
var moveSelected = false;

function clearSelection() {
  for (var i = 0; i < cells.length; i++) {
    for (var j = 0; j < cells[i].length; j++) {
      cells[i][j].style.backgroundColor = "white";
    }
  }

  for (var i = 0; i < actions.length; i++) {
    actions[i].style.backgroundColor = "white";
  }
}

var cells = []; // cell[i][j] = ith row, jth column
for (var i = 1; i <= 40; i++) {
  var row = [];
  for (var j = 1; j <= 40; j++) {
    var cell = document.createElement("DIV");
    cell.setAttribute("style", "box-shadow: 0px 0px 0px 1px grey inset;"
                                + "grid-column-start: " + j + ";"
                                + "grid-column-end: " + (j+1) + ";"
                                + "grid-row-start: " + i + ";"
                                + "grid-row-end: " + (i+1) + ";");


    cell.id = "" + i + " " + j;
    cell.className = "cell";
    cell.addEventListener("click", function() {
      if (moveSelected) {
        sendMove(this.id);
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
  var player = document.createElement("DIV");
  player.setAttribute("style", "box-shadow: 0px 0px 0px 1px " + playerColors[i-1] + " inset;"
                              + "grid-row-start: " + i + ";"
                              + "grid-row-end: " + (i+1) + ";");
  player.innerHTML = "Player: " + "</br>"
                      + "HP: 100" + "</br>"
                      + "Upgrade: " + "</br>"
                      + "&nbsp&nbspSword: x0" + "</br>"
                      + "&nbsp&nbspSpear: x0" + "</br>"
                      + "&nbsp&nbspBow: x0" + "</br>"
                      + "&nbsp&nbspBoots: x0" + "</br>"
                      + "&nbsp&nbspSpike: x0" + "</br>";
  var loginBtn = document.createElement("BUTTON");
  var btnHolder = document.createElement("DIV");
  btnHolder.setAttribute("style", "text-align: center; padding-top: 5px");
  loginBtn.innerHTML = "Login";
  loginBtn.id = i;
  loginBtn.addEventListener("click", function() { login(parseInt(this.id)); });
  btnHolder.appendChild(loginBtn);
  player.appendChild(btnHolder);

  players.push(player);
  playerHUD.appendChild(player);
}

var actions = [];
var texts = ["Attack", "Move"];
for (var i = 1; i <= 2; i++) {
  var action = document.createElement("DIV");
  action.setAttribute("style", "box-shadow: 0px 0px 0px 1px grey inset;"
                              + "grid-row-start: " + i + ";"
                              + "grid-row-end: " + (i+1) + ";"
                              + "display: flex;align-items:center;justify-content:center;");
  var text = document.createElement("P");
  text.innerHTML = texts[i-1];
  action.appendChild(text);
  if (i == 1) {
    action.addEventListener("click", function() {
      if (!moved) {
        clearSelection();
        moved = true;
        sendAttack();
        this.style.backgroundColor = "red";
        moveSelected = false;
      }
    });
  } else if (i == 2) {
    action.addEventListener("click", function() {
      if (!moved) {
        moveSelected = true;
        this.style.backgroundColor = "red";
      }
    });
  }
  actions.push(action);
  actionHUD.appendChild(action);
}

document.getElementById('Game').addEventListener("click", function() {
  socket.emit('game', function(rs) {
    if (rs == 1) {
      alert("At least 1 player should login to start a game");
    } else if (rs == 2) {
      alert("Game already started");
    }
  });
});
