//@GUI BML Planner
// Globals
if (!LS.Globals)
  LS.Globals = {};

//LS.Globals.showGUI = true;

this.onStart = function(){

}

// --------------------- GUI ---------------------

this.onRenderGUI = function(){
	
  if (!LS.Globals.showGUI)
    return;
  
  width = gl.viewport_data[2];
  height = gl.viewport_data[3];
  
  
  if (!gl.mouse.left_button){
		this._clicked = false;
  }
  gl.start2D();
    
  
  // ---------- BML PLANNER ----------
  var state = this._state[this._selState];
 
  // State
  if (LS.Globals.BMLPlanner){
    var rect={x:60,y:100,w:100,h:30};
    gl.font = "15px Arial";
    gl.textAlign = "center";
    for (var i = 0; i<this._state.length; i++){
      // Selected
      if (this._selState == i) // ii
        gl.fillStyle = "rgba(255,255,255,0.7)";
      // Mouse click
      else if (gl.mouse.x < rect.x + rect.w && gl.mouse.x > rect.x &&
          height-gl.mouse.y < rect.y + rect.h + i*rect.h*1.5 && 
               height-gl.mouse.y > rect.y + i*rect.h*1.5){

        if (gl.mouse.left_button && !this._clicked){
          this._clicked = true;
          this._selState = i;
          LS.Globals.processMsg(JSON.stringify({control: this._state[this._selState]}));
          gl.fillStyle = "rgba(127,255,127,0.8)";
        } else
          gl.fillStyle = "rgba(255,255,255,0.9)";

      } else
        gl.fillStyle = "rgba(255,255,255,0.3)";


      gl.fillRect(rect.x ,rect.y + i*rect.h*1.5,rect.w,rect.h);
      gl.fillStyle = "rgba(255,255,255,0.9)";

      gl.fillText(this._state[i] , rect.x + rect.w/2, rect.y + 0.75*rect.h + i*rect.h*1.5);
    }
  }
  
  /*
  // Show transcript
  if (LS.Globals.transcript){
    gl.font = "20px Arial";
    gl.fillStyle = "white";
    gl.textAlign = "left";
    var posX = 50;
    var posY = height- 50;
    var maxWidth = width;
    var lineHeight = 25;
    var words = LS.Globals.transcript.split(" ");
    var line = "";
    for (var n = 0; n < words.length; n++){
      var testLine = line + words[n] + " ";
      var metrics = gl.measureText(testLine);
      if (metrics.width > maxWidth){
        gl.fillText (line, posX, posY);
        line = words[n] + " ";
        posY += lineHeight;
      } else
        line = testLine;
    }

  	gl.fillText(line, posX, posY);

  }
  */
  
  
  gl.finish2D();
}
this._clicked = false;

this._state = ["WAITING", "LISTENING", "PLANNING", "SPEAKING"];
this._selState = 0;










