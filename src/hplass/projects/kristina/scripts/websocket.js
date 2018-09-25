//@Websocket
// Force http (as we use ws, not wss)
//if (window.location.protocol != "https:")
//    window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);


// Globals
if (!LS.Globals)
  LS.Globals = {};

LS.infoText = "";
  
if (!LS.Globals.hostname){
  LS.Globals.hostname = "webglstudio.org";
  LS.Globals.port = 8000;
  LS.Globals.characterName = "KRISTINA";
}


this.onStart = function(){

  // If websockets not supported
  if (!"WebSocket" in window)
    alert("WebSockets are not supported in this browser");
  else
    this.connectWS();
  
}




this.onUpdate = function(dt)
{
  // If Websocket
  if (this.ws)
    // If connection is closed or couldn't be opened, retry
    if (this.ws.readyState == 3)
      // Retry connection
      this.connectWS();
      
}



this.onFinish = function(){
  
  this.hideHTML();
  // Disconnect websocket
  if (this.ws)
    this.ws.close();
}





this.connectWS = function(){
  // Host string ("wss://.." if https)
var hostString = "wss://" + LS.Globals.hostname + ":" + LS.Globals.port;  
  that = this;
  // Create new WS
  this.ws = new WebSocket(hostString);
  console.log("Connecting to " + hostString + "...");
  LS.infoText = "Connecting to " + hostString + "...";
  // Events
  // onopen
  this.ws.onopen = function(){
  	// Assign to LS.Globals
    LS.Globals.ws = this;
    
    // Show GUI
    that.showHTML();
    
    console.log("Connected to "+ hostString);
    LS.infoText = "Connected to "+ hostString;
this.send(LS.Globals.characterName.toLowerCase());  }
  
  // onmessage
  this.ws.onmessage = function(e){
    //console.log("Received message: ", e.data);
    // Process message
    if (LS.Globals.processMsg)
      LS.Globals.processMsg(e.data, true);
  }
  
  // onerror
  this.ws.onerror = function (e){
    console.log("WS error: ", e); 
  }
  
  // onclose
  this.ws.onclose = function(){
    // Remove from LS.Globals
    LS.Globals.ws = null;
    
    // Show GUI
    if (LS.GlobalScene._state == LS.RUNNING)
    	that.showHTML();
    
    console.log("Disconnected from " + hostString);
  	LS.infoText = "Disconnected from " + hostString
  }
  
}


this.onRenderGUI = function(){
	
  //width = gl.viewport_data[2];
  //height = gl.viewport_data[3];
  
  gl.start2D();
  
  gl.font = "15px Arial";
  gl.fillStyle = "rgba(255,255,255,0.7)";
  gl.textAlign = "left";
  gl.fillText(LS.infoText, 40, 40);
  
  gl.finish2D();
}

this.showHTML = function(){
  
  return;
  
  var htmlGUI = LS.GUI.getRoot();
  var loginDiv = "<div id='loginDiv' style='position: fixed; margin-left: 40px; margin-top: 70px;'><input id='textBox' type='text'><button id='login' type='button'>Login</button><button id='randomID' type='button'>Random ID</button></div>";

  var div = document.createElement("div");
  div.innerHTML = loginDiv;
  htmlGUI.appendChild(div);  
  
  inputCont = htmlGUI.querySelector("#textBox");
  logButton = htmlGUI.querySelector("#login");
  randButton = htmlGUI.querySelector("#randomID");
  
  that = this;
  // Press enter
  inputCont.onkeypress = function(e){
    if (e.keyCode == '13'){
      valueFixed = this.value.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
      if (valueFixed != ''){
      	that.ws.send(valueFixed);
        htmlGUI.querySelector('#loginDiv').remove();
      }
    }
  }
  
  // Click login
  logButton.onclick = function(){
    valueFixed = inputCont.value.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
    if (valueFixed != ''){
      that.ws.send(valueFixed);
      htmlGUI.querySelector('#loginDiv').remove();
    }
  }
  
  // Click random
  randButton.onclick = function(){
    that.ws.send("--random--");
    htmlGUI.querySelector('#loginDiv').remove();
  }

}

this.hideHTML = function(){
  var htmlGUI = LS.GUI.getRoot();
  console.log("Hiding all html");
  htmlGUI.innerHTML = "";
}






/*
var msg = {
	"id": Math.floor(Math.random()*1000),
  "face": {
  	"start": 0,
    "end": 1,
    "valaro": [0.5, 0.5]
  },
  "blink": true
}


req = new XMLHttpRequest();
req.open('POST', 'https://webglstudio.org:8080/idle?id=myID', true);
req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
req.send(JSON.stringify(msg));

req.onreadystatechange = function () { //Call a function when the state changes.
    if (req.readyState == 4 && req.status == 200) {
        console.log(req.responseText);
    }
}

// http://kristina.taln.upf.edu/services/language_generation?data=Hello

*/
