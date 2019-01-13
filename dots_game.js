let canvas = document.getElementById('game');
let ctx = canvas.getContext("2d");
let scoreCanvas = document.getElementById('score');

// rows: n, columns: m
let rows = 5,
  cols = 6;
let radius = Math.floor(Math.max(canvas.width, canvas.height) / Math.max(rows, cols) / 20);
let activeMouseOverSrc = null;
let activeMouseOverDst = null;
let activeColors = ['green', 'blue'];
let player = 0;
let completedBoxes = [];

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
}

function getIndex(row, col){
  return row * cols + col;
}

function getPoint(ind){
  let row = Math.floor(ind / cols);
  let col = ind % row;
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
  console.log("clicked");
  if (activeMouseOverSrc != null && dots.getEdge(activeMouseOverSrc, activeMouseOverDst).active == -1){
    dots.getEdge(activeMouseOverSrc, activeMouseOverDst).active = player;
    dots.getEdge(activeMouseOverDst, activeMouseOverSrc).active = player;
    activeMouseOverSrc = null;
    activeMouseOverDst = null;
    player++;
    player %= 2;
    redraw();
  }
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
