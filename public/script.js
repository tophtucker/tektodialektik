var socket = io();
var simulation;

const sizeScale = d3.scaleLinear()
  .domain([0, 3000])
  .range([9, 90])
  .clamp(true)

const fontFamilies = ["Helvetica", '"Comic Sans MS"', "Garamond", "Arial", "Courier", "Times New Roman"]

var fontFamily = fontFamilies[Math.floor(fontFamilies.length * Math.random())]
var fontColor = `hsl(${Math.floor(Math.random()*360)}, 70%, 50%)`
var cursor = [
  Math.random() * innerWidth,
  Math.random() * innerHeight,
  0,
]

var messages = d3.select("#messages")
var currentDiv = d3.select("#current")
var caret = d3.select("#caret")
  .style("background", fontColor)

var currentKey = null
var nodes = []

document.addEventListener('keydown', (event) => {
  if(event.which === 37) cursor[2] -= Math.PI/4
  if(event.which === 39) cursor[2] += Math.PI/4
  if(event.which === 13) advanceCursorVertically()
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

  var msgs = messages.selectAll("div")
    .data(nodes)

  msgs.exit().remove()

  msgs.enter().append("div")
    .style("font-size", `${msg.size}px`)
    .style("font-family", msg.fontFamily)
    .style("color", msg.fontColor)
    .style("transform", `translate(0, ${-msg.size/2}px) rotate(${msg.theta}rad)`)
    .text(d => d.key)
  // .merge(msgs)

  simulation = d3.forceSimulation(nodes)
    // .force("charge", d3.forceManyBody().strength(-1))
    .force("collide", d3.forceCollide(d => d.size/2).strength(1))
    .on("tick", ticked);

  // messages.append("div")
  //   .style("left", `${msg.x}px`)
  //   .style("top", `${msg.y}px`)
  //   .style("font-size", `${msg.size}px`)
  //   .style("font-family", msg.fontFamily)
  //   .style("color", msg.fontColor)
  //   .style("transform", `translate(0, ${-msg.size/2}px) rotate(${msg.theta}rad)`)
  //   .text(msg.key)
});

function ticked() {
  messages.selectAll("div")
    .style("left", d => `${d.x}px`)
    .style("top", d => `${d.y}px`)
}

d3.timer(() => {
  caret
    .style("top", `${cursor[1]}px`)
    .style("left", `${cursor[0]}px`)
    .style("transform", `translate(0, -5px) rotate(${cursor[2]}rad)`)

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
  return {
    key,
    start,
    fontFamily,
    fontColor,
    x: cursor[0],
    y: cursor[1],
    theta: cursor[2],
  }
}

function emitKey() {
  currentKey.end = Date.now()
  currentKey.size = sizeScale(Date.now() - currentKey.start)
  socket.emit('chat message', currentKey)
  advanceCursor(currentKey.size * 1)
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

function advanceCursorVertically(amount = 14) {
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
