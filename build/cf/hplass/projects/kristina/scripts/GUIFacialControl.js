//@Facial GUI
// Globals
if (!LS.Globals)
  LS.Globals = {};

//LS.Globals.showGUI = true;

this.onStart = function(){
  //this.lipsyncHTML();
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
  
  // Whissel Wheel
  // Mouse
  var dist = Math.sqrt((-gl.mouse.x + width - 130)*(-gl.mouse.x + width - 130) + (-gl.mouse.y + height - 130)*(-gl.mouse.y + height - 130));

  if (dist<100){
    gl.fillStyle = "rgba(255,0,0,0.8)";
    
    if (gl.mouse.dragging){
    	this._targetValAro[0] = (gl.mouse.x - width + 130)/100;
    	this._targetValAro[1] = (gl.mouse.y - height + 130)/100;
      
      faceObj = {"valaro": this._targetValAro};
      
      LS.Globals.faceShift(faceObj);
      this.changingFace = true;
    }
  }
  else
  	gl.fillStyle = "rgba(255,0,0,0.5)";
  
  gl.strokeStyle = "rgba(255,255,255,0.8)";
  gl.lineWidth = 2;
  
  gl.beginPath();
	gl.arc(width-130,130,100,0,2*Math.PI);
  gl.fill();
	gl.stroke();
  

  // Show val-aro text
  gl.font = "15px Arial";
  gl.fillStyle = "rgba(255,255,255,0.8)";
  gl.textAlign = "center";
  var FEText = "";
  if(this._targetValAro)
  	FEText = "Arousal "+ this._targetValAro[1].toFixed(2) +"\nValence "+ this._targetValAro[0].toFixed(2);
  gl.fillText(FEText, width-130, 145);

  
  
  
  // ---------- BML ----------
  var comp = this._composition[this._selComposition];
  // Blink button
  var rect={x:width-200,y:250,w:150,h:30};
  
  if (gl.mouse.x < rect.x + rect.w && gl.mouse.x > rect.x &&
      height-gl.mouse.y < rect.y + rect.h && height-gl.mouse.y > rect.y){
    gl.fillStyle = "rgba(255,255,255,0.5)";
    
    if (gl.mouse.left_button  && !this._clicked){
      this._clicked = true;
      if (LS.Globals.BMLManager)
        LS.Globals.BMLManager.newBlock({"id": "blink","blink":true, composition: comp});
      else
      	LS.Globals.blink({"blink":"true"});
      gl.fillStyle = "rgba(127,255,127,0.8)";
    }
  } else
    gl.fillStyle = "rgba(255,255,255,0.3)";
  
  gl.fillRect(rect.x,rect.y,rect.w,rect.h);
  gl.fillStyle = "rgba(255,255,255,0.9)";
  gl.fillText("Blink", rect.x + rect.w/2, rect.y +3*rect.h/4);
  
  
  // LipSync Play button
  rect={x:width-200,y:290,w:150,h:30};
  
  if (gl.mouse.x < rect.x + rect.w && gl.mouse.x > rect.x &&
      height-gl.mouse.y < rect.y + rect.h && height-gl.mouse.y > rect.y){
    gl.fillStyle = "rgba(255,255,255,0.5)";
    
    if (gl.mouse.left_button  && !this._clicked){
      this._clicked = true;
      if (LS.Globals.BMLManager)
        LS.Globals.BMLManager.newBlock({"id": "lg","lg":this.newLG(), composition: comp, });
      else
      	LS.Globals.lipsync(this._lipSyncMsg);
      gl.fillStyle = "rgba(127,255,127,0.8)";
    }
  } else
    gl.fillStyle = "rgba(255,255,255,0.3)";
  
  gl.fillRect(rect.x,rect.y,rect.w,rect.h);
  gl.fillStyle = "rgba(255,255,255,0.9)";
  gl.fillText("Lip sync", rect.x + rect.w/2, rect.y +3*rect.h/4);
  
  
  // Random face
  rect={x:width-220,y:330,w:190,h:30};
  
  if (gl.mouse.x < rect.x + rect.w && gl.mouse.x > rect.x &&
      height-gl.mouse.y < rect.y + rect.h && height-gl.mouse.y > rect.y){
    gl.fillStyle = "rgba(255,255,255,0.5)";
    
    if (gl.mouse.left_button  && !this._clicked){
      this._clicked = true;
      
      var val1 = Math.random()*2 -1;
      var val2 = Math.random()*2 -1;
      this._targetValAro[0] = val1;
      this._targetValAro[1] = val2;
      var obj = {"attackPeak": 0.5, relax: 1, end: 1.5, "valaro": this._targetValAro}
      if (LS.Globals.BMLManager)
        LS.Globals.BMLManager.newBlock({"id": "face","face":obj, composition: comp});
      else
      	LS.Globals.face(obj);
      gl.fillStyle = "rgba(127,255,127,0.8)";
    }
  } else
    gl.fillStyle = "rgba(255,255,255,0.3)";
  
  gl.fillRect(rect.x,rect.y,rect.w,rect.h);
  gl.fillStyle = "rgba(255,255,255,0.9)";
  gl.fillText("Random face (" + this._targetValAro[0].toFixed(2) + ", " + this._targetValAro[1].toFixed(2) + ")"
              , rect.x + rect.w/2, rect.y +3*rect.h/4);
  
  
  
  // Random gaze
  rect={x:width-200,y:370,w:150,h:30};
  
  if (gl.mouse.x < rect.x + rect.w && gl.mouse.x > rect.x &&
      height-gl.mouse.y < rect.y + rect.h && height-gl.mouse.y > rect.y){
    gl.fillStyle = "rgba(255,255,255,0.5)";
    
    if (gl.mouse.left_button && !this._clicked){
      this._clicked = true;
      

      var opts = ["RIGHT", "LEFT", "UP", "DOWN", "UPRIGHT", "UPLEFT", "DOWNRIGHT", "DOWNLEFT"];
      var opts2 =  ["HEAD", "EYES"];
      
      var val = opts[Math.floor(Math.random()*8)];
      var val2 = Math.random()*45;
      var val3 = opts2[Math.floor(Math.random()*2)];

      // TODO -> IF APP RUNNING
      var obj = {"influence":val3, "offsetDirection":val, "offsetAngle": val2};
      if (LS.Globals.BMLManager)
        LS.Globals.BMLManager.newBlock({"id": "gaze","gaze":obj, composition: comp});
      else
      	LS.Globals.gaze(obj);
      
      gl.fillStyle = "rgba(127,255,127,0.8)";
    }
    
  } else
    gl.fillStyle = "rgba(255,255,255,0.3)";
  
  
  
  gl.fillRect(rect.x,rect.y,rect.w,rect.h);
  gl.fillStyle = "rgba(255,255,255,0.9)";
  
 
  
  gl.fillText("Gaze", rect.x + rect.w/2, rect.y + 0.75*rect.h);/*   (" + this.gaze.influence + ", " 
              + this.gaze.offsetAngle.toFixed(2) + ", " 
              + this.gaze.offsetDirection + ")"
              , rect.x + rect.w/2, rect.y +3*rect.h/4);*/
  
  
  // Random gaze shift
  rect={x:width-200,y:410,w:150,h:30};
  
  if (gl.mouse.x < rect.x + rect.w && gl.mouse.x > rect.x &&
      height-gl.mouse.y < rect.y + rect.h && height-gl.mouse.y > rect.y){
    gl.fillStyle = "rgba(255,255,255,0.5)";
    
    if (gl.mouse.left_button && !this._clicked){

      this._clicked = true;

      var opts = ["RIGHT", "LEFT", "UP", "DOWN", "UPRIGHT", "UPLEFT", "DOWNRIGHT", "DOWNLEFT"];
      var opts2 =  ["HEAD", "EYES"];
      
      var val = opts[Math.floor(Math.random()*8)];
      var val2 = Math.random()*45;
      var val3 = opts2[Math.floor(Math.random()*2)];
			
      // TODO--> ONLY WHEN APP IS RUNNING - why? problem fixed?
      var obj = {"influence":val3, "offsetDirection":val, "offsetAngle": val2};
      if (LS.Globals.BMLManager)
        LS.Globals.BMLManager.newBlock({"id": "gazeShift","gazeShift":obj, composition: comp});
      else
      	LS.Globals.gazeShift(obj);
      
      gl.fillStyle = "rgba(127,255,127,0.8)";
    }

  } else
    gl.fillStyle = "rgba(255,255,255,0.3)";
  
  gl.fillRect(rect.x,rect.y,rect.w,rect.h);
  gl.fillStyle = "rgba(255,255,255,0.9)";
  
  gl.fillText("GazeShift" , rect.x + rect.w/2, rect.y + 0.75*rect.h);/*   (" + this.gaze.influence + ", " 
              + this.gaze.offsetAngle.toFixed(2) + ", " 
              + this.gaze.offsetDirection + ")"
              , rect.x + rect.w/2, rect.y +3*rect.h/4);*/
  
  
  
  
  // Head
  rect={x:width-200,y:450,w:150,h:30};
  if (gl.mouse.x < rect.x + rect.w && gl.mouse.x > rect.x &&
      height-gl.mouse.y < rect.y + rect.h && height-gl.mouse.y > rect.y){
    gl.fillStyle = "rgba(255,255,255,0.5)";
    
    if (gl.mouse.left_button&& !this._clicked){
      
      this._clicked = true;

			var opts =  ["NOD", "SHAKE", "TILT"];
      var val = opts[Math.floor(Math.random()*opts.length)];
      
      if (LS.Globals.BMLManager)
        LS.Globals.BMLManager.newBlock({"id": "head","head":{"lexeme": val}, composition: comp});
      else
      	LS.Globals.head({"lexeme": val});
      
      gl.fillStyle = "rgba(127,255,127,0.8)";
    }

  } else
    gl.fillStyle = "rgba(255,255,255,0.3)";
  
  gl.fillRect(rect.x,rect.y,rect.w,rect.h);
  gl.fillStyle = "rgba(255,255,255,0.9)";
  
  gl.fillText("Head nod/shake/tilt" , rect.x + rect.w/2, rect.y + 0.75*rect.h);
  
  
  
  // Face lexeme
  rect={x:width-200,y:490,w:150,h:30};
  if (gl.mouse.x < rect.x + rect.w && gl.mouse.x > rect.x &&
      height-gl.mouse.y < rect.y + rect.h && height-gl.mouse.y > rect.y){
    gl.fillStyle = "rgba(255,255,255,0.5)";
    
    if (gl.mouse.left_button && !this._clicked){
      
      this._clicked = true;

      var opts =  ["RAISE_BROWS", "RAISE_MOUTH_CORNERS", "LOWER_MOUTH_CORNERS", "OPEN_LIPS",
                  "OPEN_MOUTH", "LOWER_BROWS", "CLOSE_EYES", "OBLIQUE_BROWS", "WIDEN_EYES"];
      var val = opts[Math.floor(Math.random()*opts.length)];

      var obj = {"lexeme": val, amount: 1, end: 2}
      if (LS.Globals.BMLManager)
        LS.Globals.BMLManager.newBlock({"id": "face", "face":obj, composition: comp});
      else
      	LS.Globals.face(obj);
      
      gl.fillStyle = "rgba(127,255,127,0.8)";
    }

  } else
    gl.fillStyle = "rgba(255,255,255,0.3)";
  
  gl.fillRect(rect.x,rect.y,rect.w,rect.h);
  gl.fillStyle = "rgba(255,255,255,0.9)";
  
  gl.fillText("Face lexeme" , rect.x + rect.w/2, rect.y + 0.75*rect.h);
  
  
  
  // Composition mode
  if (LS.Globals.BMLManager){
    rect={x:width-270,y:530,w:60,h:30};
    gl.font = "10px Arial";
    for (var i = 0; i<this._composition.length; i++){
      // Selected
      if (this._selComposition == i) // ii
        gl.fillStyle = "rgba(255,255,255,0.7)";
      // Mouse click
      else if (gl.mouse.x < rect.x + rect.w + (i*rect.w) && gl.mouse.x > rect.x + (i*rect.w) &&
          height-gl.mouse.y < rect.y + rect.h && height-gl.mouse.y > rect.y){

        if (gl.mouse.left_button && !this._clicked){
          this._clicked = true;
          this._selComposition = i;
          gl.fillStyle = "rgba(127,255,127,0.8)";
        }

      } else
        gl.fillStyle = "rgba(255,255,255,0.3)";


      gl.fillRect(rect.x + (i*rect.w),rect.y,rect.w,rect.h);
      gl.fillStyle = "rgba(255,255,255,0.9)";

      gl.fillText(this._composition[i] , rect.x + rect.w/2 + (i*rect.w), rect.y + 0.75*rect.h);
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
//this.gaze.influence = "NECK";
//this.gaze.offsetAngle = 0.0;
//this.gaze.offsetDirection = "RIGHT";

LS.Globals.valaro = this._targetValAro = [0,0];
this._lipSyncMsg = {"text":"Guten Tag Claudia! ","externalURL":"","audioURL":"http://ms-abstractive.upf.edu/resources/voice/greet_gesture_test.0.wav","duration":1.4179999828338623,"valence":1,"arousal":0.32,"metadata":{"hasExpressivity":"medium","FacialExpression":"joyful","hasProximity":"distant","hasStyle":"formal","hasAttitude":"joyful","hasSocial":"heartly","hasPersonality":"extroverted"},"sequence":[[0.0377812497317791,0.03,0.09,0,0.318,0,0],[0.11446874961256981,0.12,0.05,0,0.99,0,0],[0.1811458319425583,0.072,0.24,0,0,0.06,0],[0.22558332979679108,0.2,0.47,0,0,0,0],[0.27002082765102386,0.108,0.15,0,0,0.24,0],[0.3310520797967911,0.072,0.24,0,0,0.06,0],[0.44623957574367523,0.18,0.65,0,0,0,0],[0.5893749892711639,0.066,0.09,0,0,0.36,0],[0.7089374959468842,0.066,0.09,0,0,0.36,0],[0.8176354169845581,0.066,0.18,0,0,0,0],[0.9509062767028809,0.18,0.65,0,0,0,0],[1.0620104670524597,0.072,0.27,0,0.12,0.12,0],[1.1339375376701355,0.1,0.55,0,0.4,0.05,0],[1.2968437671661377,0.22,0.65,0,0,0,0],[1.4169999957084656,0,0,0,0,0,0],[1.4179999828338623,0,0,0,0,0,0]],"textTiming":[["guten","tag","claudia"],[0,0.29779165983200073,0.6505833268165588],[0.29779165983200073,0.6505833268165588,1.4160000085830688]],"words":[{"word":"guten","start":0,"end":0.29779165983200073,"metadata":null},{"word":"tag","start":0.29779165983200073,"end":0.6505833268165588,"metadata":null},{"word":"claudia","start":0.6505833268165588,"end":1.4160000085830688,"metadata":null}],"id":"speech0","start":"0.0","end":"1.4179999828338623"}
this._composition = ["MERGE", "REPLACE", "APPEND", "OVERWRITE"];
this._selComposition = 0;

this.newLG = function(){
  var lg = {"text":"Guten Tag Claudia! ","externalURL":"","audioURL":"http://ms-abstractive.upf.edu/resources/voice/greet_gesture_test.0.wav","duration":1.4179999828338623,"valence":1,"arousal":0.32,"metadata":{"hasExpressivity":"medium","FacialExpression":"joyful","hasProximity":"distant","hasStyle":"formal","hasAttitude":"joyful","hasSocial":"heartly","hasPersonality":"extroverted"},"sequence":[[0.0377812497317791,0.03,0.09,0,0.318,0,0],[0.11446874961256981,0.12,0.05,0,0.99,0,0],[0.1811458319425583,0.072,0.24,0,0,0.06,0],[0.22558332979679108,0.2,0.47,0,0,0,0],[0.27002082765102386,0.108,0.15,0,0,0.24,0],[0.3310520797967911,0.072,0.24,0,0,0.06,0],[0.44623957574367523,0.18,0.65,0,0,0,0],[0.5893749892711639,0.066,0.09,0,0,0.36,0],[0.7089374959468842,0.066,0.09,0,0,0.36,0],[0.8176354169845581,0.066,0.18,0,0,0,0],[0.9509062767028809,0.18,0.65,0,0,0,0],[1.0620104670524597,0.072,0.27,0,0.12,0.12,0],[1.1339375376701355,0.1,0.55,0,0.4,0.05,0],[1.2968437671661377,0.22,0.65,0,0,0,0],[1.4169999957084656,0,0,0,0,0,0],[1.4179999828338623,0,0,0,0,0,0]],"textTiming":[["guten","tag","claudia"],[0,0.29779165983200073,0.6505833268165588],[0.29779165983200073,0.6505833268165588,1.4160000085830688]],"words":[{"word":"guten","start":0,"end":0.29779165983200073,"metadata":null},{"word":"tag","start":0.29779165983200073,"end":0.6505833268165588,"metadata":null},{"word":"claudia","start":0.6505833268165588,"end":1.4160000085830688,"metadata":null}],"id":"speech0","start":"0.0","end":"1.4179999828338623"};
  return lg;
}






this.lipsyncHTML = function(){
  
  var htmlGUI = LS.GUI.getRoot();
  var lipsyncDiv = "<div id='lipsyncDiv' style='position: fixed; top: 50px; margin-left: 30px'><input id='textLipsync' type='text'><button id='sendLipsync' type='button'>Language Generation</button></div>";

  var div = document.createElement("div");
  div.innerHTML = lipsyncDiv;
  htmlGUI.appendChild(div); 
  
  inputText = htmlGUI.querySelector("#textLipsync");
  sendButton = htmlGUI.querySelector("#sendLipsync");
  
  
  foo = this;
  // Press enter
  console.log(inputText);
  inputText.onkeypress = function(e){
    if (e.keyCode == '13'){
      valueFixed = this.value.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
      if (valueFixed != ''){
        foo.callLGService(valueFixed, "test");
      	//that.ws.send(valueFixed);
        //htmlGUI.querySelector('#lipsyncDiv').remove();
      }
    }
  }
  
  // Click send
  sendButton.onclick = function(){
    valueFixed = inputText.value.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
    if (valueFixed != ''){
      foo.callLGService(valueFixed, "test");
      //that.ws.send(valueFixed);
      //htmlGUI.querySelector('#lipsyncDiv').remove();
    }
  }

}

this.callLGService = function(sentence, filename){
  filename += Math.round(Math.random()*1000);
  
  req = new XMLHttpRequest();
  sentence = encodeURIComponent(sentence);
	req.open('GET', 'https://kristina.taln.upf.edu/synthesizer-service/process?sentence='+ sentence + '&name='+ filename, true);
	//req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
	req.send();


  req.onreadystatechange = function () { //Call a function when the state changes.
      if (req.readyState == 4 && req.status == 200) {
        LS.Globals.lipsync(JSON.parse(req.responseText));
        console.log(JSON.parse(req.responseText));
      }
  }
  
}


