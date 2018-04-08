var socket = io();
var simulation;

const sizeScale = d3.scaleLinear()
  .domain([0, 1500])
  .range([24, 90])
  .clamp(true)

const fontFamilies = ["Helvetica", '"Comic Sans MS"', "Garamond", "Arial", "Courier", "Times New Roman"]

var fontFamily = fontFamilies[Math.floor(fontFamilies.length * Math.random())]
var fontColor = `hsl(${Math.floor(Math.random()*360)}, 70%, 50%)`
var cursor = [
  Math.random() * innerWidth,
  Math.random() * innerHeight,
  0,
]
var velocity = 0

// var canvas = document.querySelector("canvas")
// canvas.width = innerWidth
// canvas.height = innerHeight
// ctx = canvas.getContext('2d');

var messages = d3.select("#messages")
var currentDiv = d3.select("#current")
var caret = d3.select("#caret")
  .style("background", fontColor)

var currentKey = null
var nodes = []

document.addEventListener('keydown', (event) => {
  console.log(event.which)
  if(event.which === 37) cursor[2] -= Math.PI/4 //left
  if(event.which === 39) cursor[2] += Math.PI/4 // right
  if(event.which === 38) velocity += 10 // up
  if(event.which === 40) velocity -= 10 // down
  if(event.which === 13) advanceCursorVertically() // enter
})

document.addEventListener('keypress', (event) => {
  if(event.repeat) return
  if(currentKey && event.key.length === 1) {
    emitKey()
  }
  if(!currentKey && event.key.length === 1) {
    currentKey = newKey(event.key, Date.now())
  }
});

document.addEventListener('keyup', (event) => {
  if(currentKey && currentKey.key === event.key) {
    emitKey()
  }
});

socket.on('chat message', function(msg){
  nodes.push(msg)

  // nodes.filter((d,i) => i == 0 || (d.x >= 0 && d.x <= innerWidth && d.y >= 0 && d.y <= innerHeight))

  var msgs = messages.selectAll("div")
    // .data(nodes, d => d.start)
    .data(nodes)
  msgs.exit().remove()
  msgs.enter().append("div")
    .style("font-size", `${msg.size}px`)
    .style("font-family", msg.fontFamily)
    .style("color", msg.fontColor)
    .style("transform", `translate(0, ${-msg.size/2}px) rotate(${msg.theta}rad)`)
    .text(d => d.key)

  simulation = d3.forceSimulation(nodes)
    // .velocityDecay(0.1)
    // .force("charge", d3.forceManyBody().strength(d => d.key === "?" ? 1 : 0))
    .force("collide", d3.forceCollide(d => d.key === "!" ? d.size : d.size * .4).strength(1))
    .on("tick", ticked);
});

function ticked() {
  messages.selectAll("div")
    .style("left", d => `${d.x}px`)
    .style("top", d => `${d.y}px`)

  // ctx.clearRect(0,0,innerWidth,innerHeight)
  // nodes.forEach(d => {
  //   ctx.font = `${d.size}px ${d.fontFamily}`
  //   ctx.fillStyle = d.fontColor
  //   ctx.fillText(d.key, d.x, d.y)
  // })
}

d3.timer(() => {
  caret
    .style("top", `${cursor[1]}px`)
    .style("left", `${cursor[0]}px`)
    .style("transform", `translate(0, -12px) rotate(${cursor[2]}rad)`)

  if(currentKey) {
    let size = sizeScale(Date.now() - currentKey.start)
    currentDiv
      .style("left", `${currentKey.x}px`)
      .style("top", `${currentKey.y}px`)
      .style("font-size", `${size}px`)
      .style("font-family", currentKey.fontFamily)
      .style("color", currentKey.fontColor)
      .style("transform", `translate(0, ${-size/2}px) rotate(${currentKey.theta}rad)`)
      .text(currentKey.key)
  } else {
    currentDiv.text('')
  }
})

function newKey(key, start) {
  var v = velocity
  velocity = 0
  return {
    key,
    start,
    fontFamily,
    fontColor,
    x: cursor[0],
    y: cursor[1],
    theta: cursor[2],
    vx: v * Math.sin(cursor[2]),
    vy: -v * Math.cos(cursor[2])
  }
}

function emitKey() {
  currentKey.end = Date.now()
  currentKey.size = sizeScale(Date.now() - currentKey.start)
  socket.emit('chat message', currentKey)
  advanceCursor(currentKey.size * .8)
  currentKey = null
}

function advanceCursor(amount = 14) {
  var newCursor = [
    cursor[0] + amount * Math.cos(cursor[2]),
    cursor[1] + amount * Math.sin(cursor[2]),
    cursor[2]
  ]
  if(newCursor[0] < 0) {
    newCursor[0] = innerWidth
    newCursor[1] -= 20
  }
  if(newCursor[0] > innerWidth) {
    newCursor[0] = 0
    newCursor[1] += 20
  }
  if(newCursor[1] < 0) {
    newCursor[1] = innerHeight
    newCursor[0] += 20
  }
  if(newCursor[1] > innerHeight) {
    newCursor[1] = 0
    newCursor[0] -= 20
  }
  if(!(newCursor[0] >= 0 && newCursor[0] <= innerWidth) || !(newCursor[1] >= 0 && newCursor[1] <= innerHeight)) {
    newCursor[0] = 20
    newCursor[1] = 20
  }
  cursor = newCursor
}

function advanceCursorVertically(amount = 32) {
  var newCursor = [
    cursor[0] + amount * -Math.sin(cursor[2]),
    cursor[1] + amount * Math.cos(cursor[2]),
    cursor[2]
  ]
  if(newCursor[0] < 0) {
    newCursor[0] = innerWidth
    newCursor[1] -= 20
  }
  if(newCursor[0] > innerWidth) {
    newCursor[0] = 0
    newCursor[1] += 20
  }
  if(newCursor[1] < 0) {
    newCursor[1] = innerHeight
    newCursor[0] += 20
  }
  if(newCursor[1] > innerHeight) {
    newCursor[1] = 0
    newCursor[0] -= 20
  }
  if(!(newCursor[0] >= 0 && newCursor[0] <= innerWidth) || !(newCursor[1] >= 0 && newCursor[1] <= innerHeight)) {
    newCursor[0] = 20
    newCursor[1] = 20
  }
  cursor = newCursor
}
