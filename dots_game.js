let canvas = document.getElementById('game');
let ctx = canvas.getContext("2d");
let scoreCanvas = document.getElementById('score');

// rows: n, columns: m
let rows = 5,
  cols = 6;
let nPlayers = 2;
let radius = Math.floor(Math.max(canvas.width, canvas.height) / Math.max(rows, cols) / 20);
let activeMouseOverSrc = null;
let activeMouseOverDst = null;
let activeColors = ['green', 'blue'];
let player = 0;
let completedBoxes = new Map();
for (let i = 0; i < nPlayers; i++){
  completedBoxes.set(i, []);
}

class Dots {
  constructor(){
    this.adjList = new Map();
    this.meta = new Map();
  }

  addNode(n, meta){
    this.adjList.set(n, []);
    this.meta.set(n, meta);
  }

  addEdge(src, dst){
    this.adjList.get(src).push({node: dst, active: -1});
    this.adjList.get(dst).push({node: src, active: -1});
  }

  getEdge(src, dst){
    let nodes = this.adjList.get(src);
    for (let i = 0; i < nodes.length; i++){
      if(nodes[i].node == dst){
        return nodes[i];
      }
    }
    return null;
  }
}

let dots = new Dots();

for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    let centerX = Math.floor(canvas.width / cols * (col + 1 / 2));
    let centerY = Math.floor(canvas.height / rows * (row + 1 / 2));
    let index = getIndex(row,col)
    dots.addNode(index, {centerX: centerX, centerY: centerY});
    if (row > 0)
      dots.addEdge(index, getIndex(row-1, col));
    if (col > 0)
      dots.addEdge(index, getIndex(row, col-1));
    drawDot(centerX, centerY);
  }
}

function drawDot(centerX, centerY){
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
  ctx.fillStyle = 'red';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#003300';
  ctx.stroke();
}

function redraw(){
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (let [k, v] of dots.meta){
    drawDot(v.centerX, v.centerY);
  }
  for (let [k, v] of dots.adjList){
    for (let i = 0 ; i < v.length; i ++){
      if(v[i].active != -1){
        let centerSrc = dots.meta.get(k);
        let centerDst = dots.meta.get(v[i].node);
        ctx.beginPath();
        ctx.strokeStyle = activeColors[v[i].active];
        ctx.moveTo(centerSrc.centerX, centerSrc.centerY);
        ctx.lineTo(centerDst.centerX, centerDst.centerY);
        ctx.stroke();
      }
    }
  }
  for (let [k, v] of completedBoxes){
    ctx.fillStyle = activeColors[k];
    for (let i = 0 ; i < v.length; i ++){
      let src = dots.meta.get(v[i].start);
      let dst = dots.meta.get(v[i].end);

      ctx.fillRect(Math.min(src.centerX, dst.centerX),
                   Math.min(src.centerY, dst.centerY),
                   Math.abs(dst.centerX - src.centerX),
                   Math.abs(dst.centerY - src.centerY));
    }
  }
}

function getIndex(row, col){
  return row * cols + col;
}

function getPoint(ind){
  let row = Math.floor(ind / cols);
  let col = ind % cols;
  return {row:row, col:col}
}

function writeMessage(canvas, message) {
  let context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '18pt Calibri';
  context.fillStyle = 'black';
  context.fillText(message, 10, 25);
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function drawLine(mousePos) {
  let src = null, dst = null;
  for (let row = 0; row < rows; row++) {
    let centerY = Math.floor(canvas.height / rows * (row + 1 / 2));
    if (mousePos.y > centerY - radius && mousePos.y < centerY + radius){
      for (let col = 0; col < cols - 1; col++) {
        let centerX = Math.floor(canvas.width / cols * (col + 1 / 2));
        let centerX2 = Math.floor(canvas.width / cols * (col + 1 + 1 / 2));
        if(mousePos.x >= centerX && mousePos.x <= centerX2){
            src = getIndex(row, col);
            dst = getIndex(row, col+1);
        }
      }
    }
  }
  for (let col = 0; col < cols; col++) {
    let centerX = Math.floor(canvas.width / cols * (col + 1 / 2));
    if (mousePos.x > centerX - radius && mousePos.x < centerX + radius){
      for (let row = 0; row < rows - 1; row++) {
        let centerY = Math.floor(canvas.height / rows * (row + 1 / 2));
        let centerY2 = Math.floor(canvas.height / rows * (row + 1 + 1 / 2));
        if(mousePos.y >= centerY && mousePos.y <= centerY2){
            src = getIndex(row, col);
            dst = getIndex(row+1, col);
        }
      }
    }
  }
  if (src == null){
    if (activeMouseOverSrc != null){
      activeMouseOverSrc = null;
      activeMouseOverDst = null;
      redraw();
    }
    return;
  }
  if (dots.getEdge(src, dst).active != -1){
    return;
  }
  if (activeMouseOverSrc != src || activeMouseOverDst != dst) {
    redraw()
    ctx.beginPath();
    ctx.strokeStyle = activeColors[player];
    ctx.moveTo(dots.meta.get(src).centerX, dots.meta.get(src).centerY);
    ctx.lineTo(dots.meta.get(dst).centerX, dots.meta.get(dst).centerY);
    ctx.stroke();
    activeMouseOverSrc = src;
    activeMouseOverDst = dst;
  }
}

function addLine(){
  if (activeMouseOverSrc != null && dots.getEdge(activeMouseOverSrc, activeMouseOverDst).active == -1){
    dots.getEdge(activeMouseOverSrc, activeMouseOverDst).active = player;
    dots.getEdge(activeMouseOverDst, activeMouseOverSrc).active = player;
    if (!checkCompletedBox(activeMouseOverSrc, activeMouseOverDst)){
      player++;
      player %= 2;
    }
    activeMouseOverSrc = null;
    activeMouseOverDst = null;
    redraw();
  }
}

function checkCompletedBox(index1, index2){
  let complete = false;
  point1 = getPoint(index1);
  point2 = getPoint(index2);
  console.log(point1)
  console.log(point2)
  console.log(index1);
  console.log(index2);
  if (point1.row == point2.row){
    // Check top and bottom
    if (point1.row > 0){
      if(dots.getEdge(index1, getIndex(point1.row-1, point1.col)).active != -1 &&
         dots.getEdge(index2, getIndex(point2.row-1, point2.col)).active != -1 &&
         dots.getEdge(getIndex(point1.row-1, point1.col),
          getIndex(point2.row-1, point2.col)).active != -1){
          completedBoxes.get(player).push({start: index1, end: getIndex(point2.row-1, point2.col)});
          complete = true;
       }
    }
    if (point1.row < rows-1){
      if(dots.getEdge(index1, getIndex(point1.row+1, point1.col)).active != -1 &&
         dots.getEdge(index2, getIndex(point2.row+1, point2.col)).active != -1 &&
         dots.getEdge(getIndex(point1.row+1, point1.col),
          getIndex(point2.row+1, point2.col)).active != -1){
          completedBoxes.get(player).push({start: index1, end: getIndex(point2.row+1, point2.col)});
          complete = true;
       }
    }
  }
  else {
    // Check left and right
    if (point1.col > 0){
      if(dots.getEdge(index1, getIndex(point1.row, point1.col-1)).active != -1 &&
         dots.getEdge(index2, getIndex(point2.row, point2.col-1)).active != -1 &&
         dots.getEdge(getIndex(point1.row, point1.col-1),
          getIndex(point2.row, point2.col-1)).active != -1){
          completedBoxes.get(player).push({start: index1, end: getIndex(point2.row, point2.col-1)});
          complete = true;
       }
    }
    if (point1.col < cols-1){
      if(dots.getEdge(index1, getIndex(point1.row, point1.col+1)).active != -1 &&
         dots.getEdge(index2, getIndex(point2.row, point2.col+1)).active != -1 &&
         dots.getEdge(getIndex(point1.row, point1.col+1),
          getIndex(point2.row, point2.col+1)).active != -1){
          completedBoxes.get(player).push({start: index1, end: getIndex(point2.row, point2.col+1)});
          complete = true;
       }
    }
  }
  return complete;
}
canvas.addEventListener('mousemove', function(evt) {
  var mousePos = getMousePos(canvas, evt);
  var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y;
  writeMessage(scoreCanvas, message);
  drawLine(mousePos);
}, false);

canvas.addEventListener('click', function(evt) {
  addLine();
}, false);
