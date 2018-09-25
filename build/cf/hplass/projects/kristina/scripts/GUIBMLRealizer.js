//@GUI BML Realizer
// Globals
if (!LS.Globals)
  LS.Globals = {};

//LS.Globals.showGUI = true;


// Stacks (should concide with BMLManager.BMLStacks order)
var stacks = ["blink", "gaze", "face", "head", "headDir",
              "speech", "lg"]; //gesture, poiting

// Colors
var colors = ["(0,255,0,", "(255,132,0,", "(0,0,255,",
              "(255,255,0, 0.5)", "(255,0,0,0.5)", "(0,255,255,",
              "(0,133,0,", "(255,0,255,","(255,63,0,",
              "(255, 255, 127"];

// Time scale
  var timescale = 20;


this.onRenderGUI = function(){
  
  if (!LS.Globals.showGUI)
    return;

  // Blocks
  var blockStack = null;
  var bmlStacks = null;
  if (LS.Globals)
    if (LS.Globals.BMLManager){
      blockStack = LS.Globals.BMLManager.stack;
      bmlStacks = LS.Globals.BMLManager.BMLStacks;
    }
  
	
  // Viewport
  var w = gl.viewport_data[2];
  var h = gl.viewport_data[3];
  
  gl.start2D();
  
  // Base rectangle
  var psize = 0.3;
  var r={x:0,y:h*(1-psize),w:w,h:h*psize};
  gl.fillStyle = "rgba(255,255,255,0.5)";
  gl.fillRect(r.x,r.y,r.w,r.h);
  
  // Row lines
  var maxTextWidth = 0;
  var numRows = stacks.length +1;
  gl.font= 14 * Math.max(h/600, 0.5) + "px Arial"; // Compensated
  for (var i = 0; i < numRows; i++){
    // Lines
    gl.strokeStyle = "rgba(0,0,0,0.3)";
    var height = i/numRows * (h - r.y) + r.y;
    gl.beginPath(); gl.moveTo(0, height); gl.lineTo(w, height); gl.stroke();
    height = (i+1.8)/numRows * (h - r.y) + r.y;
    gl.fillStyle = "rgba(0,0,0,0.5)";
    gl.fillText(stacks[i], w*0.01, height);
    // Adaptive line
    var text = toString(stacks[i]);
    maxTextWidth = Math.max(gl.measureText(text).width, maxTextWidth);
  }
  
  // BMLPLANNER STATE
  if (LS.Globals.BMLPlanner){
    gl.font= 10 * Math.max(h/600, 0.5) + "px Arial";
    gl.fillStyle = "rgba(0,0,0,0.5)";
    height = (-1+1.8)/numRows * (h - r.y) + r.y;
    gl.fillText(LS.Globals.BMLPlanner.state, w*0.01, height);
  }
  
  
  // Column line
  var firstColW = maxTextWidth * 0.5;
  gl.beginPath(); gl.moveTo(firstColW, r.y); gl.lineTo(firstColW, h); gl.stroke();
  
  // Blocks
  if (!blockStack)
    return;
  if (blockStack.length == 0)
    return;
  // Get global timestamp
	var time = LS.GlobalScene.time;
  // Block rectangle
  var rr = {x: 0, y:0, w: 0, h: 0};
  for (var i = 0; i<blockStack.length; i++){
    var block = blockStack[i];
    var xB = firstColW + timescale * 10 * (block.startGlobalTime - time);
    var wB = timescale * 10 * Math.min((block.endGlobalTime - time), block.end);
    rr.x = Math.max(firstColW,xB);
    rr.y = r.y;
    rr.w = wB;
    rr.h = r.h;
    gl.strokeStyle = "rgba(0,0,0,0.6)";
    gl.lineWidth = 4;
    gl.strokeRect(rr.x,rr.y, rr.w, rr.h);
    // Add block id on top
    gl.font= 12 * Math.max(h/600, 0.5) + "px Arial"; // Compensated
    gl.fillStyle = "rgba(0,0,0,0.5)";
    gl.fillText(block.id, rr.x, 0.8/numRows * (h - r.y) + r.y);
  }
  // BML instruction rectangles
  for (var i = 0; i < stacks.length; i++){ // bmlStacks.length
    var bmlStack = bmlStacks[i];
    // Select color
    gl.fillStyle = "rgba" + colors[i] + "0.3)";
    for (var j = 0; j < bmlStack.length; j++){
      var bmlIns = bmlStack[j];
      if (bmlIns === undefined){
        console.log("Error in: ", stacks[i], bmlStack);
        return;
      }
      // Paint rectangle
      xB = firstColW + timescale * 10 * (bmlIns.startGlobalTime - time);
      wB = timescale * 10 * Math.min((bmlIns.endGlobalTime - time), bmlIns.end);
      rr.x = Math.max(firstColW,xB);
      rr.y = (i+1)/numRows * (h - r.y) + r.y;
      rr.w = Math.max(wB,0);
      rr.h = 1/numRows * (h - r.y);
      gl.fillRect(rr.x, rr.y, rr.w, rr.h);
      gl.lineWidth = 2;
      gl.strokeRect(rr.x, rr.y, rr.w, rr.h);
    }
  }
  
  gl.finish2D();
}