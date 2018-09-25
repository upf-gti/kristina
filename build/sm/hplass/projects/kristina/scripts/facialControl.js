//@Facial control
// Globals
if (!LS.Globals)
  LS.Globals = {};

LS.Globals.Facial = this;

this.headNodeName = "omarHead";
this.jawNodeName = "jaw";
this._jawInitRot = null;
this._jawRot = quat.create();

this.headBoneNodeName = "head";
this.lookAtEyesName = "lookAtEyes";
this.lookAtHeadName = "lookAtHead";
this.lookAtNeckName = "lookAtNeck";


// Blend shapes index
this.smileBSIndex = 0;
this.sadBSIndex = 1;
this.kissBSIndex = 2;
this.lipsClosedBSIndex = 3;
this.mouthAirBSIndex = 4;

this.browsDownBSIndex = 5;
this.browsInnerUpBSIndex = 6;
this.browsUpBSIndex = 7;
this.eyeLidsBSIndex = 8;

this.jawBSIndex = -1;

//this["@eyeLidsBSIndex"] = {type: "number"};


// Blend shapes factor
this.sadFactor = 1;
this.smileFactor = 1;
this.lipsClosedFactor = 1;
this.kissFactor = 1;
this.browsDownFactor = 1;
this.browsInnerUpFactor = 1;
this.browsUpFactor = 1;
this.jawFactor = 1;

this['@sadFactor'] = {type: "slider", max: 4, min: 0.1};
this['@smileFactor'] = {type: "slider", max: 4, min: 0.1};
this['@lipsClosedFactor'] = {type: "slider", max: 4, min: 0.1};
this['@kissFactor'] = {type: "slider", max: 4, min: 0.1};
this['@browsDownFactor'] = {type: "slider", max: 4, min: 0.1};
this['@browsInnerUpFactor'] = {type: "slider", max: 4, min: 0.1};
this['@browsUpFactor'] = {type: "slider", max: 4, min: 0.1};
this['@jawFactor'] = {type: "slider", max: 4, min: 0.1};

this._facialBSW = [0,0,0,0,0,0,0,0,0];
this._FacialLexemes = [];
this._blendshapes = null;
this.valAro = vec2.create();

//this.activation_evaluation = [this.valence, this.arousal]
//this['@activation_evaluation'] = {type:"vec2", widget: "pad", min:-1, max: 1};

// Lipsync
this._audio = new Audio();
this._audio.addEventListener("canplaythrough", function(){
  console.log("Audio loaded: ", this.src, ". Duration: ", this.duration, "sec.");
  LS.Globals.Facial.playSequence();
}, false);
this._lipsyncBSW = [0,0,0,0,0,0];
// Visemes parameters
this._visSeq = {};
this._visSeq.sequence = [];
this._visSeq.duration;
this._lastInd = 0;


// Blink timings and variables
this.Blink = null;
this._blinking = false;


// Gaze Actions
this._clicked = false;

// Head behavior
this._lookAtHeadComponent = null;



// Temp vectors
this._tempV = vec3.create();
this._tempQ = quat.create();

   
  
this.onStart = function(){
  
  // Initilize audio player
  console.log("Initializing audio engine to avoid synchronization issues");
  this._audio.src = "https://webglstudio.org/latest/fileserver/files//gerard/audios/empty.wav";
  
  // Get head node
  head = node.scene.getNodeByName (this.headNodeName);
  if(!head){
    console.error("Head node not found");
    return; 
  }
  
  // Get morph targets
  morphTargets = head.getComponent(LS.Components.MorphDeformer);
  
  if (!morphTargets){
    console.error("Morph deformer not found in: ", head.name);
    return; 
  }
  morphTargets = morphTargets.morph_targets;
  this._blendshapes = morphTargets;
  
  // Get eyeLidsBS
  if (this.eyeLidsBSIndex > morphTargets.length-1){
    console.error("Eye lid index", this.eyeLidsBSIndex ," is not found in: ", morphTargets);
    return; 
  }
	
  this.eyeLidsBS = morphTargets[this.eyeLidsBSIndex];
  
  
  // Get jaw node and initial rotation
  this.jaw = node.scene.getNodeByName (this.jawNodeName);
  
  if (!this.jaw){
    console.error("Jaw node not found with name: ", this.jawNodeName);
    return;
  }
  // Initial rotation
  this._jawInitRotation = vec4.copy(vec4.create(), this.jaw.transform.rotation);
  
  
  // Gaze
  // Get head bone node
  this.headBone = node.scene.getNodeByName(this.headBoneNodeName);
  
  if (!this.headBone)
    console.error("Head bone node not found with name: ", this.headBoneNodeName);
  else
		this.gazePositions["HEAD"] = this.headBone.transform.globalPosition;
  LS.GlobalScene.getActiveCameras(true);
  if (LS.GlobalScene._cameras[0])
  	this.gazePositions["CAMERA"] = LS.GlobalScene.getCamera().getEye();
  else
    console.error("Camera position not found for gaze.");
  
  // Get lookAt nodes
  this.lookAtEyes = node.scene.getNodeByName (this.lookAtEyesName);
  this.lookAtHead = node.scene.getNodeByName (this.lookAtHeadName);
  this.lookAtNeck = node.scene.getNodeByName (this.lookAtNeckName);
  if (!this.lookAtEyes) console.error("LookAt Eyes not found with name: ", this.lookAtEyesName);
  else this.gazePositions["EYESTARGET"] = this.lookAtEyes.transform.position;
  if (!this.lookAtHead) console.error("LookAt Head not found with name: ", this.lookAtHeadName);
  else this.gazePositions["HEADARGET"] = this.lookAtHead.transform.position;
  if (!this.lookAtNeck) console.error("LookAt Neck not found with name: ", this.lookAtNeckName);
  else this.gazePositions["NECKTARGET"] = this.lookAtNeck.transform.position;

  
  // Gaze manager
  this.gazeManager = new GazeManager(this.lookAtNeck, this.lookAtHead, this.lookAtEyes, this.gazePositions);

  
  // Head behavior
  // Get lookAt head component
  this._lookAtHeadComponent = this.headBone.getComponents(LS.Components.LookAt)[0];
  if (!this._lookAtHeadComponent)
    console.error("LookAt component not found in head bone. ", this._lookAtHeadComponent, this.headBone);
  
  this.headBML = null;
  
  
  // Initialize blendshape interpolation
  //LS.Globals.face({valaro: [0.5,0.5], start: 0, end: 0.05});
}
  
  
 



this.onUpdate = function(dt)
{

  // Update blendshapes
  if (!this._blendshapes || !this.jaw)
    return;
  
  // Update facial expression
  this.faceUpdate(dt);
  
  // Face blend (blink, facial expressions, lipsync)
  this.facialBlend(dt);
  
  // Gaze
  if (this.gazeManager)
  	this.gazeManager.update(dt);
  
  // Head behavior
  this.headBMLUpdate(dt);

  
	node.scene.refresh();
}


this.onFinish = function(){
  if (!this._audio.paused)
  	this._audio.pause();
}




// --------------------- BLINK ---------------------
// BML
// <blink start attackPeak relax end amount>

LS.Globals.blink = function(blinkData, cmdId){

  blinkData.end = blinkData.end || blinkData.attackPeak * 2 || 0.5;
  
  LS.Globals.Facial.newBlink(blinkData);
  LS.Globals.Facial._blinking = true;
  
  // Server response
  if (cmdId) 
    setTimeout(LS.Globals.ws.send.bind(LS.Globals.ws), blinkData.end * 1000, cmdId + ": true");
}

// Create blink object
this.newBlink = function(blinkData){
  this.Blink = new Blink(blinkData, this.eyeLidsBS.weight);
}




// --------------------- FACIAL EXPRESSIONS ---------------------
// BML
// <face or faceShift start attackPeak relax* end* valaro
// <faceLexeme start attackPeak relax* end* lexeme amount
// <faceFacs not implemented>
// lexeme  [OBLIQUE_BROWS, RAISE_BROWS,
//      RAISE_LEFT_BROW, RAISE_RIGHT_BROW,LOWER_BROWS, LOWER_LEFT_BROW,
//      LOWER_RIGHT_BROW, LOWER_MOUTH_CORNERS,
//      LOWER_LEFT_MOUTH_CORNER,
//      LOWER_RIGHT_MOUTH_CORNER,
//      RAISE_MOUTH_CORNERS,
//      RAISE_RIGHT_MOUTH_CORNER,
//      RAISE_LEFT_MOUTH_CORNER, OPEN_MOUTH,
//      OPEN_LIPS, WIDEN_EYES, CLOSE_EYES]
//
// face/faceShift can contain several sons of type faceLexeme without sync attr
// valaro Range [-1, 1]


LS.Globals.face = function (faceData, cmdId){

  faceData.end = faceData.end || faceData.attackPeak*2 || 0.0;

  LS.Globals.Facial.newFA(faceData, false);

    // Server response
  if (cmdId) 
    setTimeout(LS.Globals.ws.send.bind(LS.Globals.ws), faceData.end * 1000, cmdId + ": true");
}

LS.Globals.faceShift = function (faceData, cmdId){

  faceData.end = faceData.end || faceData.attackPeak*2 || 0.0;

  LS.Globals.Facial.newFA(faceData, true);

    // Server response
  if (cmdId) 
    setTimeout(LS.Globals.ws.send.bind(LS.Globals.ws), faceData.end * 1000, cmdId + ": true");
}

// Declare new facial expression
this.newFA = function(faceData, shift){
  // Use BSW of the agent
  this._facialBSW[0] = this._blendshapes[this.sadBSIndex].weight / this.sadFactor; // sad
  this._facialBSW[1] = this._blendshapes[this.smileBSIndex].weight / this.smileFactor; // smile
  this._facialBSW[2] = this._blendshapes[this.lipsClosedBSIndex].weight / this.lipsClosedFactor; // lipsClosed
  this._facialBSW[3] = this._blendshapes[this.kissBSIndex].weight / this.kissFactor; // kiss
  this._facialBSW[5] = this._blendshapes[this.browsDownBSIndex].weight / this.browsDownFactor; // browsDown
  this._facialBSW[6] = this._blendshapes[this.browsInnerUpBSIndex].weight / this.browsInnerUpFactor; // browsInnerUp
  this._facialBSW[7] = this._blendshapes[this.browsUpBSIndex].weight / this.browsUpFactor; // browsUp
  //this._facialBSW[8] = this._blendshapes[this.eyeLidsBSIndex].weight; // eyeLids
  if(this.jawBSIndex != -1)
  	this._facialBSW[4] = this._blendshapes[this.jawBSIndex].weight / this.jawFactor; // jaw

  
	if (faceData.valaro)
  	this.FA = new FacialExpr (faceData, shift, this._facialBSW);
  else if (faceData.lexeme)
    this._FacialLexemes.push(new FacialExpr (faceData, shift, this._facialBSW));
}

// Update facial expressions
this.faceUpdate = function(dt){
  
  if (this.FA){
    // Update FA with Val Aro
    this.FA.updateVABSW( this._facialBSW , dt);

    // Remove object if transition finished
    if (!this.FA.transition){
      this.FA = null;
    }
  }
  
  // Update facial lexemes
  for (var i = 0; i < this._FacialLexemes.length; i++){
  	if (this._FacialLexemes[i].transition)
    	this._FacialLexemes[i].updateLexemesBSW(this._facialBSW, dt);
  }
  
  // Clean facial lexemes
  for (var i = 0; i < this._FacialLexemes.length; i++){
    if (!this._FacialLexemes[i].transition){
       this._FacialLexemes.splice(i, 1);
    }
  }
  
  
  // Check for NaN errors
  for (var i = 0; i<this._facialBSW.length; i++){
    if (isNaN(this._facialBSW[i])){
      console.error("Updating facial expressions create NaN values! <this.faceUpdate>");
      this._facialBSW[i] = 0;
    }
  }
  
}








// --------------------- LIPSYNC ---------------------

LS.Globals.lipsync = function(lipData){
  
  LS.Globals.Facial._visSeq.sequence = lipData.sequence;
  LS.Globals.Facial._audio.src = lipData.audioURL;
  duration = lipData.duration || 4;
  
  if (lipData.cmdId) 
    setTimeout(LS.Globals.ws.send.bind(LS.Globals.ws), duration * 1000, lipData.cmdId + ": true");
}


this.playSequence = function()
{
  
	if (this._audio || this._visSeq){
		if (this._audio.paused){
      //console.log("Playing sequence", this._audio, this._visSeq);
			this._audio.play();
			this._visSeq.startTime = getTime();
			this._lastInd = 0;
		}
	}
}

this.updateLipsync = function(){
  
 	var lastInd = this._lastInd;
  
  // Lip-Sync sequence
  if (this._audio && this._visSeq.sequence.length){ // Both files are loaded

  	var speech = this._audio;
  	var visSeq = this._visSeq;

    
    if (!speech.paused){ // Audio is playing
  		
      var tmstmp = (getTime() - visSeq.startTime)/1000;
      
      
      // Index
      var condition = true;

      while (condition){
        
        if (visSeq.sequence[lastInd+1]){ // Audio is longer than visemes seq
          if (tmstmp >= visSeq.sequence[lastInd+1][0]){ // tmstmp is bigger than previous sample
            
            lastInd += 1;
            
            condition = !(tmstmp >= visSeq.sequence[lastInd][0] && tmstmp <= visSeq.sequence[lastInd-1][0]);
          } else
            condition = false;
          
        } else
          condition = false;
        
        
        // If there is no viseme seq at time 0
        if (tmstmp <= visSeq.sequence[0][0] && lastInd == 0){
          tmstmp = visSeq.sequence[0][0];
          condition = false;
        }
        
        
        // Timestamp is going backwards
        if (lastInd != 0){
          if (tmstmp < visSeq.sequence[lastInd][0]){
            lastInd-=1;
            condition = !(tmstmp >= visSeq.sequence[lastInd][0] && tmstmp <= visSeq.sequence[lastInd-1][0]);
          }
        }
        
        
      }
      
      var ind = lastInd;
				
      var prev;	
      var next; 
      
      
      if (visSeq.sequence[ind+1]) {
        prev = visSeq.sequence[ind];
        next = visSeq.sequence[ind+1];
      }
      // Audio is longer than visemes seq
      else {
        prev = visSeq.sequence[ind-1];
        next = visSeq.sequence[ind];
        tmstmp = next[0];
      }
      
      
      // Interpolation between samples
      var mixFactor = (tmstmp - prev[0]) / (next[0]- prev[0]);
      if (next[0] == prev[0])
        mixFactor = 1;
      
      for (var i = 0; i < this._lipsyncBSW.length; i++){
        seqWeight = prev[i+1]*(1-mixFactor) + next[i+1]*mixFactor;
        
        //if (seqWeight > 1 || seqWeight < 0 || isNaN(seqWeight)){
        if (isNaN(seqWeight)){
          console.log('Something is wrong!! -- Weight: ', seqWeight, ", Num: ", i , ",Time: ", tmstmp, ", VisSeqID: ", lastInd);
        	seqWeight = 0;
        }
        
        this._lipsyncBSW[i] = seqWeight;
      }
      

    } else
      lastInd = 0;
  }
  
}


// --------------------- FACIAL BLEND ---------------------
this.facialBlend = function(dt){
  
  
  // Facial interpolation (low face) if audio is not playing
  if (this._audio.paused && (this.FA || this._FacialLexemes.length != 0) ){
    this._blendshapes[this.sadBSIndex].weight = this._facialBSW[0] * this.sadFactor; // sad
    this._blendshapes[this.smileBSIndex].weight = this._facialBSW[1] * this.smileFactor; // smile
    this._blendshapes[this.lipsClosedBSIndex].weight = this._facialBSW[2] * this.lipsClosedFactor; // lipsClosed
    this._blendshapes[this.kissBSIndex].weight = this._facialBSW[3] * this.kissFactor; // kiss
		
    if(this.jawBSIndex == -1){
   		quat.copy (this._jawRot, this._jawInitRotation);
    	this._jawRot[3] += -this._facialBSW[4] * 0.3 * this.jawFactor; // jaw
    	this.jaw.transform.rotation = quat.normalize(this._jawRot, this._jawRot);
    }
    else
      this._blendshapes[this.jawBSIndex].weight = this._facialBSW[4] * this.jawFactor;

  } 
  // Lipsync
  else if (!this._audio.paused){
    this.updateLipsync();
    
    this._blendshapes[this.smileBSIndex].weight = this._lipsyncBSW[1];
    this._blendshapes[this.mouthAirBSIndex].weight = this._lipsyncBSW[2];
    this._blendshapes[this.lipsClosedBSIndex].weight = this._lipsyncBSW[3];
    this._blendshapes[this.kissBSIndex].weight = this._lipsyncBSW[4] * 2.5;
    this._blendshapes[this.sadBSIndex].weight = this._lipsyncBSW[5];
		
    
    if(this.jawBSIndex == -1){
    	quat.copy (this._jawRot, this._jawInitRotation);
    	this._jawRot[3] += -this._lipsyncBSW[0] * 0.3; // jaw
    	this.jaw.transform.rotation = quat.normalize(this._jawRot, this._jawRot);
    }
    else
      this._blendshapes[this.jawBSIndex].weight = this._lipsyncBSW[0] * 3.0;
    

  }
  // Facial interpolation (high face)
  if (this.FA || this._FacialLexemes.length != 0){
  	this._blendshapes[this.browsDownBSIndex].weight = this._facialBSW[5] * this.browsDownFactor; // browsDown
  	this._blendshapes[this.browsInnerUpBSIndex].weight = this._facialBSW[6] * this.browsInnerUpFactor; // browsInnerUp
  	this._blendshapes[this.browsUpBSIndex].weight = this._facialBSW[7] * this.browsUpFactor; // browsUp
  	this._blendshapes[this.eyeLidsBSIndex].weight = this._facialBSW[8]; // eyeLids
  }
  
  // Eye blink
  if (this._blinking && this.eyeLidsBS){
    weight = this.Blink.update(dt, this._facialBSW[8]);
    if (weight !== undefined)
    	this._blendshapes[this.eyeLidsBSIndex].weight = weight;
    if (!this.Blink.transition)
      this._blinking = false;
  }
}











// --------------------- GAZE ---------------------
// BML
// <gaze or gazeShift start ready* relax* end influence target influence offsetAngle offsetDirection>
// influence [EYES, HEAD, NECK, SHOULDER, WAIST, WHOLE, ...]
// offsetAngle relative to target
// offsetDirection (of offsetAngle) [RIGHT, LEFT, UP, DOWN, UPRIGHT, UPLEFT, DOWNLEFT, DOWNRIGHT]
// target [CAMERA, RIGHT, LEFT, UP, DOWN, UPRIGHT, UPLEFT, DOWNLEFT, DOWNRIGHT]

// "HEAD" position is added onStart
this.gazePositions = {"RIGHT": [70, 150, 70], "LEFT": [-70, 150, 70],
                      "UP": [0, 210, 70], "DOWN": [0, 70, 70],
                      "UPRIGHT": [70, 210, 70], "UPLEFT": [-70, 210, 70],
                      "DOWNRIGHT": [70, 70, 70], "DOWNLEFT": [-70, 70, 70]};



LS.Globals.gaze = function(gazeData, cmdId){

  gazeData.end = gazeData.end || 2.0;

  LS.Globals.Facial.newGaze(gazeData, false);
  
  // Server response
  if (cmdId) 
    setTimeout(LS.Globals.ws.send.bind(LS.Globals.ws), gazeData.end * 1000, cmdId + ": true");
}

LS.Globals.gazeShift = function(gazeData, cmdId){

  gazeData.end = gazeData.end || 1.0;

  LS.Globals.Facial.newGaze(gazeData, true);
  
  // Server response
  if (cmdId) 
    setTimeout(LS.Globals.ws.send.bind(LS.Globals.ws), gazeData.end * 1000, cmdId + ": true");
}


this.newGaze = function(gazeData, shift, gazePositions, headOnly){

  // TODO: recicle gaze in gazeManager
  this.gazeManager.newGaze(gazeData, shift, gazePositions, headOnly);
  
}













// --------------------- HEAD ---------------------
// BML
// <head start ready strokeStart stroke strokeEnd relax end lexeme repetition amount>
// lexeme [NOD, SHAKE]
// repetition cancels stroke attr
// amount how intense is the head nod? 0 to 1
LS.Globals.head = function(headData, cmdId){

	headData.end = headData.end || 2.0;

  LS.Globals.Facial.newHeadBML(headData);

  // Server response
  if (cmdId) 
    setTimeout(LS.Globals.ws.send.bind(LS.Globals.ws), headData.end * 1000, cmdId + ": true");
}

// New head behavior
this.newHeadBML = function(headData){
  var lookAt = this._lookAtHeadComponent;
  if (lookAt){
    this.headBML = new HeadBML(headData, this.headBone, 
                               lookAt._initRot, lookAt._finalRotation, 
                               lookAt.limit_vertical[0], lookAt.limit_horizontal[0]);
  }
}
// Update
this.headBMLUpdate = function(dt){
  
  if (this.headBML){
    if (this.headBML.transition){
      this._lookAtHeadComponent.applyRotation = false;
      this.headBML.update(dt);
    } else
      this._lookAtHeadComponent.applyRotation = true;
  }
}

// BML
// <headDirectionShift start end target>
// Uses gazeBML
LS.Globals.headDirectionShift = function(headData, cmdId){
  headData.end = headData.end || 2.0;
  
  headData.influence = "HEAD";
  LS.Globals.Facial.newGaze(headData, true, null, true);
  
  // Server response
  if (cmdId) 
    setTimeout(LS.Globals.ws.send.bind(LS.Globals.ws), headData.end * 1000, cmdId + ": true");
}













// --------------------- SPEECH ---------------------
this.newSpeech = function(speechData){
  if (speechData["_"])
    speechData.text = speechData["_"];
  this.callLGService(speechData.text, "test", undefined); 
}

this.callLGService = function(sentence, filename, language){
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
































/*
//@BMLRealizer

// --------------------- BLINK ---------------------
// BML
// <blink start attackPeak relax end amount>
// Scene inputs: eyeLidsBSW and facial expression eyeLidsBSW during updates

function Blink (blinkData, eyeLidsBSW){
  // Sync attributes
  this.start = blinkData.start || 0;
  this.end = blinkData.end || 0.5;
  this.attackPeak = blinkData.attackPeak || (this.end - this.start)*0.4 + this.start;
  this.relax = blinkData.relax || this.attackPeak;
  
  // Initial eyeLidsBSW
  this.initialWeight = eyeLidsBSW || 0;
  this.targetWeight = blinkData.amount || 1.0;
  
  // Transition
  this.transition = true;
  this.time = 0;
}

Blink.prototype.update = function(dt, facialEyeLidsBSW){
  
  this.time += dt;
  
  // Waiting to reach start
  if (this.time < this.start)
    return;
  
  // Transition 1 (closing eyes)
  if (this.time < this.attackPeak){
    inter = (this.time-this.start)/(this.attackPeak-this.start);
    // Cosine interpolation
    inter = Math.cos(Math.PI*inter+Math.PI)*0.5 + 0.5;
    // Return value
    return this.initialWeight*(1-inter) + this.targetWeight * inter;
  }
  
  // Stay still during attackPeak to relax
  if (this.time > this.attackPeak && this.time < this.relax)
    return this.targetWeight;
  
  
  // Transition 2 (opening back)
  if (this.time < this.end){
    inter = (this.time-this.relax)/(this.end-this.relax);
    // Cosine interpolation
    inter = Math.cos(Math.PI*inter)*0.5 + 0.5;
    // Interpolate with scene eyeLidsBSW
    return facialEyeLidsBSW*(1-inter) + this.targetWeight * inter;
  }
  
  // End 
  if (this.time >= this.end){
    this.transition = false;
    return facialEyeLidsBSW;
  }
  
}









// --------------------- FACIAL EXPRESSIONS ---------------------
// BML
// <face or faceShift start attackPeak relax* end* valaro
// <faceLexeme start attackPeak relax* end* lexeme amount
// <faceFacs not implemented>
// lexeme  [OBLIQUE_BROWS, RAISE_BROWS,
//      RAISE_LEFT_BROW, RAISE_RIGHT_BROW,LOWER_BROWS, LOWER_LEFT_BROW,
//      LOWER_RIGHT_BROW, LOWER_MOUTH_CORNERS,
//      LOWER_LEFT_MOUTH_CORNER,
//      LOWER_RIGHT_MOUTH_CORNER,
//      RAISE_MOUTH_CORNERS,
//      RAISE_RIGHT_MOUTH_CORNER,
//      RAISE_LEFT_MOUTH_CORNER, OPEN_MOUTH,
//      OPEN_LIPS, WIDEN_EYES, CLOSE_EYES]
//
// face/faceShift can contain several sons of type faceLexeme without sync attr
// valaro Range [-1, 1]
// Scene inputs: sceneBSW

FacialExpr.prototype.sceneBSW;


// Variables for Valence Arousal
FacialExpr.prototype.initialVABSW = [];
FacialExpr.prototype.targetVABSW = [];

// Variables for Lexemes
FacialExpr.prototype.initialLexBSW = [];
FacialExpr.prototype.targetLexBSW = [];

// Psyche Interpolation Table
FacialExpr.prototype._pit = [0.000, 0.000,  0.000,  0.000,  0.000,  0.000,  0.000,  0.000,  0.000,  0.000,  0.000,
                            0.000,  1.000,  0.138,  0.075,  0.000,  0.675,  0.300,  0.056,  0.200,  0.216,  0.300,
                            0.500,  0.866,  0.000,  0.700,  0.000,  0.000,  0.000,  0.530,  0.000,  0.763,  0.000,
                            0.866,  0.500,  0.000,  1.000,  0.000,  0.000,  0.600,  0.346,  0.732,  0.779,  0.000,
                            1.000,  0.000,  0.065,  0.000,  0.344,  0.344,  0.700,  0.000,  0.000,  1.000,  -0.300,
                            0.866,  -0.500, 0.391,  0.570,  0.591,  0.462,  1.000,  0.000,  0.981,  0.077,  0.000,
                            0.500,  -0.866, 0.920,  0.527,  0.000,  0.757,  0.250,  0.989,  0.000,  0.366,  -0.600,
                            0.000,  -1.000, 0.527,  0.000,  0.441,  0.531,  0.000,  0.000,  1.000,  0.000,  0.600,
                            -0.707, -0.707, 1.000,  0.000,  0.000,  0.000,  0.500,  1.000,  0.000,  0.000,  0.600,
                            -1.000, 0.000,  0.995,  0.000,  0.225,  0.000,  0.000,  0.996,  0.000,  0.996,  0.200,
                            -0.707, 0.707,  0.138,  0.075,  0.000,  0.675,  0.300,  0.380,  0.050,  0.216,  0.300];

FacialExpr.prototype._p = vec3.create();
FacialExpr.prototype._pA = vec3.create();


FacialExpr.prototype.lexemes = {"OBLIQUE_BROWS": 0, "RAISE_BROWS": 0, "RAISE_LEFT_BROW": 0, "RAISE_RIGHT_BROW": 0,
                                "LOWER_BROWS": 0, "LOWER_LEFT_BROW": 0, "LOWER_RIGHT_BROW": 0,
                                "LOWER_MOUTH_CORNERS": 0, "LOWER_LEFT_MOUTH_CORNER": 0, "LOWER_RIGHT_MOUTH_CORNER": 0,
                                "RAISE_MOUTH_CORNERS": 0, "RAISE_LEFT_MOUTH_CORNER": 0, "RAISE_RIGHT_MOUTH_CORNER": 0,
                                "OPEN_MOUTH": 0, "OPEN_LIPS": 0, "WIDEN_EYES": 0, "CLOSE_EYES": 0};


// Blend shapes indices
FacialExpr.prototype.LOWER_MOUTH_CORNERS = 0; // sad
FacialExpr.prototype.RAISE_MOUTH_CORNERS = 1; // happy
FacialExpr.prototype.OPEN_LIPS = 2; // kiss? or small open jaw?
FacialExpr.prototype.OPEN_MOUTH = 4; // jaw

FacialExpr.prototype.LOWER_BROWS = 5; // brows down
FacialExpr.prototype.OBLIQUE_BROWS = 7; // brows rotate outwards
FacialExpr.prototype.RAISE_BROWS = 6; // brows up
FacialExpr.prototype.WIDEN_EYES = 8; // negative eyelids closed
FacialExpr.prototype.CLOSE_EYES = 8; // eyelids closed



// Constructor
function FacialExpr (faceData, shift, sceneBSW){
 
  // Scene variables
  if (sceneBSW)
    this.sceneBSW = sceneBSW;

  // Init face valaro
  if (faceData.valaro){
    this.initFaceValAro(faceData, shift);
    return;
  }

  // Init face lexemes 
  if (faceData.lexeme){
    // faceLexeme
    if (typeof(faceData.lexeme) == "string") //(lexeme = "STRING")
      this.initFaceLexeme(faceData, shift, [faceData])
    // One lexeme object inside face/faceShift (faceData.lexeme = {lexeme:"RAISE_BROWS"; amount: 0.1})
    else if (typeof(faceData.lexeme) == "object" && faceData.lexeme.length === undefined)
      this.initFaceLexeme(faceData, shift,  [faceData.lexeme]);
    // Several lexemes inside face/faceShift (faceData.lexeme = [{}, {}]...)
    else if (typeof(faceData.lexeme) == "object" && faceData.lexeme.length !== undefined)
      this.initFaceLexeme(faceData, shift, faceData.lexeme);
       
    return;
  }
  


}




FacialExpr.prototype.initFaceValAro = function(faceData, shift){
  // Sync
  this.start = faceData.start || 0.0;
  this.end = faceData.end;
  
  if (!shift){
    this.attackPeak = faceData.attackPeak || (this.end-this.start)*0.25 + this.start;
    this.relax = faceData.relax || (this.end - this.attackPeak)/2 + this.attackPeak;
  } else {
    this.end = faceData.end || faceData.attackPeak || 0.0;
    this.attackPeak = faceData.attackPeak || this.end;
    this.relax = 0;
  }

  // Valence and arousal
  this.valaro = faceData.valaro || [0.1, 0.1];
  // Normalize
  var magn = vec2.length(this.valaro);
  if (magn > 1){
    this.valaro[0]/= magn;
    this.valaro[1]/= magn;
  }


  // Initial blend shapes
  if (this.sceneBSW)
    for (var i = 0; i< this.sceneBSW.length; i++)
      this.initialVABSW[i] = this.sceneBSW[i];
  // Target blend shapes
  this.VA2BSW(this.valaro, this.targetVABSW);
  

  
  // Start
  this.transition = true;
  this.time = 0;

}


// There can be several facelexemes working at the same time then? lexemes is an array of lexeme objects
FacialExpr.prototype.initFaceLexeme = function(faceData, shift, lexemes){
  // Sync
  this.start = faceData.start || 0.0;
  this.end = faceData.end;
  
  if (!shift){
    this.attackPeak = faceData.attackPeak || (this.end-this.start)*0.25 + this.start;
    this.relax = faceData.relax || (this.end - this.attackPeak)/2 + this.attackPeak;
  } else {
    this.end = faceData.end || faceData.attackPeak || 0.0;
    this.attackPeak = faceData.attackPeak || this.end;
    this.relax = 0;
  }

  // Initial blend shapes and targets
  if (this.sceneBSW){
    // Choose the ones to interpolate
    this.indicesLex = [];
    this.initialLexBSW = [];
    this.targetLexBSW = [];

    var j = 0;
    for (var i = 0; i<lexemes.length; i++){
      var index = this[lexemes[i].lexeme]; // "this.RAISE_BROWS = 1" for example
      // WIDEN_EYES correction
      if (lexemes[i].lexeme == "WIDEN_EYES")
        lexemes[i].amount *= -0.3;
      
      // If lexeme string is not defined or wrong, do not add
      if (index !== undefined){
        // Indices
        this.indicesLex[j] = index;
        // Initial
        this.initialLexBSW[j] = this.sceneBSW[index];
        // Target
        this.targetLexBSW[j] = (lexemes[i].amount !== undefined) ? lexemes[i].amount : 0;

        j++;
      }
    }
  }


  // Start
  this.transition = true;
  this.time = 0;

}




FacialExpr.prototype.updateVABSW = function(interVABSW, dt){

  // Immediate change
  if (this.attackPeak == 0 && this.end == 0 && this.time == 0){
    for (var i = 0; i < this.sceneBSW.length; i++)
      interVABSW[i] = this.targetVABSW[i];
    // Increase time and exit
    this.time +=dt;
    return;
  }
  // Immediate change (second iteration)
  if (this.attackPeak == 0 && this.end == 0){
    this.transition = false;
    return;
  }

  // Time increase
  this.time += dt;

  // Wait for to reach start time
  if (this.time < this.start)
    return;

  // Stay still during attackPeak to relax
  if (this.time > this.attackPeak && this.time < this.relax)
    return;
  
  
  // Trans 1
  if (this.time < this.attackPeak){
    inter = (this.time-this.start)/(this.attackPeak-this.start);
    // Cosine interpolation
    inter = Math.cos(Math.PI*inter+Math.PI)*0.5 + 0.5;
    //inter = Math.cos(Math.PI*inter+Math.PI)*0.5 + 0.5; // to increase curve, keep adding cosines
    // Interpolation
    for (var i = 0; i < this.sceneBSW.length; i++)
      interVABSW[i] = this.initialVABSW[i]*(1-inter) + this.targetVABSW[i]*inter;
    
  }
  
  // Trans 2
  if (this.time > this.relax && this.relax >= this.attackPeak){
    inter = (this.time-this.relax)/(this.end-this.relax);
    // Cosine interpolation
    inter = Math.cos(Math.PI*inter)*0.5 + 0.5;
    // Interpolation
    for (var i = 0; i < this.sceneBSW.length; i++)
      interVABSW[i] = this.initialVABSW[i]*(1-inter) + this.targetVABSW[i]*inter;
  }
  
  
  // End
  if (this.time > this.end)
    this.transition = false;

  
}




FacialExpr.prototype.updateLexemesBSW = function(interLexBSW, dt){

  // Immediate change
  if (this.attackPeak == 0 && this.end == 0 && this.time == 0){
    for (var i = 0; i < this.indicesLex.length; i++)
      interLexBSW[this.indicesLex[i]] = this.targetLexBSW[i];
    // Increase time and exit
    this.time +=dt;
    return;
  }
  

  // Time increase
  this.time += dt;

  // Wait for to reach start time
  if (this.time < this.start)
    return;

  // Stay still during attackPeak to relax
  if (this.time > this.attackPeak && this.time < this.relax){
    for (var i = 0; i < this.indicesLex.length; i++)
      interLexBSW[this.indicesLex[i]] = this.targetLexBSW[i];
    return;
  }
  
  
  // Trans 1
  if (this.time < this.attackPeak){
    inter = (this.time-this.start)/(this.attackPeak-this.start);
    // Cosine interpolation
    inter = Math.cos(Math.PI*inter+Math.PI)*0.5 + 0.5;
    //inter = Math.cos(Math.PI*inter+Math.PI)*0.5 + 0.5; // to increase curve, keep adding cosines
    // Interpolation
    for (var i = 0; i < this.indicesLex.length; i++)
      interLexBSW[this.indicesLex[i]] = this.initialLexBSW[i]*(1-inter) + this.targetLexBSW[i]*inter;
    
  }

  
  // Trans 2
  if (this.time > this.relax && this.relax >= this.attackPeak){
    inter = (this.time-this.relax)/(this.end-this.relax);
    // Cosine interpolation
    inter = Math.cos(Math.PI*inter)*0.5 + 0.5;
    // Interpolation
    for (var i = 0; i < this.indicesLex.length; i++)
      interLexBSW[this.indicesLex[i]] = this.initialLexBSW[i]*(1-inter) + this.targetLexBSW[i]*inter;
    
  }
  
  
  // End
  if (this.time > this.end)
    this.transition = false;
  

}








FacialExpr.prototype.VA2BSW = function(valAro, facialBSW){
  
  maxDist = 0.8;
  
  var blendValues = [0,0,0,0,0,0,0,0,0]; // Memory leak, could use facialBSW and set to 0 with a for loop
  var bNumber = 11;
  
  this._p[0] = valAro[0];
  this._p[1] = valAro[1];
  this._p[2] = 0; // why vec3, if z component is always 0, like pA?

  this._pA[2] = 0;

  for (var count = 0; count < this._pit.length/bNumber; count++){
    this._pA[1] = this._pit[count*bNumber];
    this._pA[0] = this._pit[count*bNumber+1];

    var dist = vec3.dist(this._pA, this._p);
    dist = maxDist - dist;

    // If the emotion (each row is an emotion in pit) is too far away from the act-eval point, discard
    if (dist > 0){
      for (var i = 0; i < bNumber-2; i++){
        blendValues[i] += this._pit[count*bNumber +i+2] * dist;
      }
    }
  }


  // Store blend values
  facialBSW [ 0 ] = blendValues[0]; // sad
  facialBSW [ 1 ] = blendValues[1]; // smile
  facialBSW [ 2 ] = blendValues[2]; // lips closed pressed
  facialBSW [ 3 ] = blendValues[3]; // kiss
  
  facialBSW [4]  = blendValues[4]; // jaw

  facialBSW [5] = blendValues[5]; // eyebrow down
  facialBSW [6] = blendValues[6]; // eyebrow rotate outwards
  facialBSW [7] = blendValues[7]; // eyebrow up
  facialBSW [8] = blendValues[8]; // eyelids closed

}













// --------------------- GAZE (AND HEAD SHIFT DIRECTION) ---------------------
// BML
// <gaze or gazeShift start ready* relax* end influence target influence offsetAngle offsetDirection>
// influence [EYES, HEAD, NECK, SHOULDER, WAIST, WHOLE, ...]
// offsetAngle relative to target
// offsetDirection (of offsetAngle) [RIGHT, LEFT, UP, DOWN, UPRIGHT, UPLEFT, DOWNLEFT, DOWNRIGHT]
// target [CAMERA, RIGHT, LEFT, UP, DOWN, UPRIGHT, UPLEFT, DOWNLEFT, DOWNRIGHT]
// Scene inputs: gazePositions (head and camera), lookAt objects


// Gaze manager (replace BML)
GazeManager.prototype.gazePositions = {
  "RIGHT": [70, 150, 70], "LEFT": [-70, 150, 70],
  "UP": [0, 210, 70], "DOWN": [0, 70, 70],
  "UPRIGHT": [70, 210, 70], "UPLEFT": [-70, 210, 70],
  "DOWNRIGHT": [70, 70, 70], "DOWNLEFT": [-70, 70, 70],
  "CAMERA": [0, 210, 70]
};


// Constructor (lookAt objects and gazePositions)
function GazeManager (lookAtNeck, lookAtHead, lookAtEyes, gazePositions){
  // Gaze Actions (could create here inital gazes and then recycle for memory efficiency)
  this.gazeActions = [3];

  // Gaze positions
  this.gazePositions = gazePositions || this.gazePositions;

  // LookAt objects
  this.lookAtNeck = lookAtNeck;
  this.lookAtHead = lookAtHead;
  this.lookAtEyes = lookAtEyes;
}

// gazeData with influence, sync attr, target, offsets...
GazeManager.prototype.newGaze = function(gazeData, shift, gazePositions, headOnly){

  // Gaze positions
  this.gazePositions = gazePositions || this.gazePositions;
  
  // Overwrite gaze actions
  switch (gazeData.influence){
    case "NECK":
      this.gazeActions[2] = new Gaze(gazeData, shift, this.lookAtNeck, this.gazePositions);
    case "HEAD":
      this.gazeActions[1] = new Gaze(gazeData, shift, this.lookAtHead, this.gazePositions);
    case "EYES":
      if (!headOnly)
      	this.gazeActions[0] = new Gaze(gazeData, shift, this.lookAtEyes, this.gazePositions);
    }
  

}

GazeManager.prototype.update = function(dt){

  // Gaze actions update
  for (var i = 0; i<this.gazeActions.length; i++)
    // If gaze exists (could inizialize empty gazes)
    if (this.gazeActions[i])
      if (this.gazeActions[i].transition)
        this.gazeActions[i].update(dt);

}







// Memory allocation
Gaze.prototype._tempV = vec3.create();
Gaze.prototype._tempQ = quat.create();
Gaze.prototype.targetP = vec3.create();



// Constructor
function Gaze (gazeData, shift, lookAt, gazePositions){

  // Init gazeData
  this.initGazeData(gazeData, shift);

  // Gaze positions
  if (gazePositions)
  	this.gazePositions = gazePositions;

  // Scene variables
  this.cameraEye = gazePositions["CAMERA"] || vec3.create();
  this.headPos = gazePositions["HEAD"] || vec3.create();
  this.lookAt = lookAt;
  //this.lookAtNeck = lookAtNeck;
  //this.lookAtHead = lookAtHead;
  //this.lookAtEyes = lookAtEyes;
  
}




Gaze.prototype.initGazeData = function(gazeData, shift){
  // Sync
  this.start = gazeData.start || 0.0;
  this.end = gazeData.end || 2.0;
  if (!shift){
    this.ready = gazeData.ready || this.start + (this.end - this.start)/3;
    this.relax = gazeData.relax || this.start + 2*(this.end - this.start)/3;
  } else {
    this.ready = this.end;
    this.relax = 0;
  }

  // Angle
  this.offsetAngle = gazeData.offsetAngle || 0.0;
  this.offsetDirection = gazeData.offsetDirection || "RIGHT";
  // Target
  this.target = gazeData.target || "CAMERA";
  
  // Start
  this.transition = true;
  this.time = 0;

}





Gaze.prototype.update = function(dt){
  
  // Define initial values
  if (this.time == 0)
    this.initGazeValues();
  
  // Time increase
  this.time +=dt;
  // Wait for to reach start time
  if (this.time < this.start)
    return;
  // Stay still during ready to relax
  if (this.time > this.ready && this.time < this.relax)
    return;
  
  
  //console.log(this.influence, this.neckInP, this.neckEndP, this.headInP, this.headEndP, this.eyesInP, this.eyesEndP);
  
  // Trans 1
  if (this.time < this.ready){
    inter = (this.time-this.start)/(this.ready-this.start);
    // Cosine interpolation
    inter = Math.cos(Math.PI*inter+Math.PI)*0.5 + 0.5;
    //inter = Math.cos(Math.PI*inter+Math.PI)*0.5 + 0.5; // to increase curve, keep adding cosines
    // lookAt pos change
    vec3.lerp( this.lookAt.transform.position , this.InP, this.EndP, inter);
    this.lookAt.transform.mustUpdate = true;
  }
  
  // Trans 2
  if (this.time > this.relax && this.relax >= this.ready){
    inter = 1 - (this.time-this.relax)/(this.end-this.relax);
    // Cosine interpolation
    inter = Math.cos(Math.PI*inter + Math.PI)*0.5 + 0.5;

    // lookAt pos change
    vec3.lerp( this.lookAt.transform.position , this.InP, this.EndP, inter);
    this.lookAt.transform.mustUpdate = true;

  }
  

  // End
  if (this.time > this.end)
    this.transition = false;
  
  
}


Gaze.prototype.initGazeValues = function(){
  
  
  // Find target position (copy? for following object? if following object and offsetangle, need to recalculate all the time!)
  if (this.gazePositions)
    if (this.gazePositions[this.target])
  		vec3.copy(this.targetP, this.gazePositions[this.target]);
  else
    vec3.set(this.targetP, 0, 210, 70);
  
  
  // Angle offset
  // Define offset angles (respective to head position?)
  // Move to origin
  v = this._tempV;
  q = this._tempQ;
  vec3.subtract(v, this.targetP, this.headPos);
  magn = vec3.length(v);
  vec3.normalize(v,v);
  
  // Rotate vector and reposition
  switch (this.offsetDirection){
    case "UPRIGHT":
      quat.setAxisAngle(q, v, -45*DEG2RAD);
      vec3.rotateY(v,v, this.offsetAngle*DEG2RAD);
      vec3.transformQuat(v,v,q);
      break;
    case "UPLEFT":
      quat.setAxisAngle(q, v, -135*DEG2RAD);
      vec3.rotateY(v,v, this.offsetAngle*DEG2RAD);
      vec3.transformQuat(v,v,q);
      break;
    case "DOWNRIGHT":
      quat.setAxisAngle(q, v, 45*DEG2RAD);
      vec3.rotateY(v,v, this.offsetAngle*DEG2RAD);
      vec3.transformQuat(v,v,q);
      break;
    case "DOWNLEFT":
      quat.setAxisAngle(q, v, 135*DEG2RAD);
      vec3.rotateY(v,v, this.offsetAngle*DEG2RAD);
      vec3.transformQuat(v,v,q);
      break; 
    case "RIGHT":
      vec3.rotateY(v,v,this.offsetAngle*DEG2RAD);
      break;
    case "LEFT":
      vec3.rotateY(v,v,-this.offsetAngle*DEG2RAD);
      break;
    case "UP":
      quat.setAxisAngle(q, v, -90*DEG2RAD);
      vec3.rotateY(v,v, this.offsetAngle*DEG2RAD);
      vec3.transformQuat(v,v,q);
      break;
    case "DOWN":
      quat.setAxisAngle(q, v, 90*DEG2RAD);
      vec3.rotateY(v,v, this.offsetAngle*DEG2RAD);
      vec3.transformQuat(v,v,q);
      break;
  }
  // Move to head position and save modified target position
  
  vec3.scale(v,v,magn);
  vec3.add(v,v,this.headPos);
  vec3.copy(this.targetP,v);
  
  if (!this.lookAt || !this.lookAt.transform)
    return console.log("ERROR: lookAt not defined ", this.lookAt);
  
  // Define initial and end positions
  this.InP = vec3.copy(vec3.create(), this.lookAt.transform.position);
  this.EndP = vec3.copy(vec3.create(), this.targetP); // why copy? targetP shared with several?
  
}













// --------------------- HEAD ---------------------
// BML
// <head start ready strokeStart stroke strokeEnd relax end lexeme repetition amount>
// lexeme [NOD, SHAKE]
// repetition cancels stroke attr
// amount how intense is the head nod? 0 to 1

// head nods will go slightly up -> position = ready&stroke_start and  stroke_end&relax
// Should work together with gaze. Check how far is from the top-bottom angle limits or right-left angle limits
// Scene inputs: head bone node, neutral rotation and lookAtComponent rotation
// Combination of gaze and lookAtComponent:
//if (this.headBML.transition){
//  this._lookAtHeadComponent.applyRotation = false;
//  this.headBML.update(dt);
//} else
//  this._lookAtHeadComponent.applyRotation = true;


// Constructor
// headNode is to combine gaze rotations and head behavior
function HeadBML(headData, headNode, neutralRotation, lookAtRot, limVert, limHor){

  // Rotation limits (from lookAt component for example)
  this.limVert = Math.abs(limVert) || 20;
  this.limHor = Math.abs(limHor) || 30;
  
	// Init variables
	this.initHeadData(headData);

	// Scene variables
	this.headNode = headNode;
	this.neutralRotation = neutralRotation;
  this.lookAtRot = lookAtRot;
  
}


// Init variables
HeadBML.prototype.initHeadData = function(headData){
  
  // Lexeme, repetition and amount
	this.lexeme = headData.lexeme || "NOD";
	this.amount = headData.amount || 0.5;

	// Maximum rotation amplitude
  if (this.lexeme == "NOD")
		this.maxDeg = this.limVert * 2;
  else
    this.maxDeg = this.limHor * 2;



	// Sync start ready strokeStart stroke strokeEnd relax end
	this.start = headData.start || 0;
	this.end = headData.end || 2.0;


	this.ready = headData.ready || this.strokeStart || (this.stroke-this.start)/2 || this.end/4;

	this.strokeStart = headData.strokeStart || this.ready;

	// No repetition
	if (!headData.repetition){
		this.stroke = headData.stroke || (this.strokeStart + this.strokeEnd)/2 || this.end/2;
		this.strokeEnd = headData.strokeEnd || headData.relax || (this.stroke + this.end)/2 || this.end*3/4;
		this.relax = headData.relax || this.strokeEnd;
	}
	// Repetition (stroke and strokeEnd will be redefined when updating)
	else {
		this.strokeEnd = headData.strokeEnd || headData.relax || this.end*3/4;
		this.relax = headData.relax || this.strokeEnd;
		// Repetition count
		this.repetition = headData.repetition;
		this.repeatedIndx = 0;
		
		// Modify stroke and strokeEnd
		this.strokeEnd = this.strokeStart + (this.strokeEnd - this.strokeStart)/(1 + this.repetition)
		this.stroke = (this.strokeStart + this.strokeEnd)/2;
	}



	// Start
	this.transition = true;
	this.phase = 0;
	this.time = 0;
	
	

}



HeadBML.prototype.update = function (dt){

  // Define initial values
	if (this.time == 0)
		this.initHeadValues();
  
	// Time increase
	this.time +=dt;
  var headRotation = this.headNode.transform.rotation;

	// Wait for to reach start time
	if (this.time < this.start)
		return;

	// Ready
	else if (this.time < this.ready){
    inter = (this.time-this.start)/(this.ready-this.start);
    // Cosine interpolation
    inter = Math.cos(Math.PI*inter+Math.PI)*0.5 + 0.5;

    // Should store previous rotation applied, so it is not additive
    if (!this.prevDeg)
      this.prevDeg = 0;
    var angle = inter*this.readyDeg - this.prevDeg;
    this.prevDeg = inter*this.readyDeg;
    // Apply rotation
    if (this.lexeme == "NOD")
    	quat.rotateX(headRotation, headRotation,  -angle*DEG2RAD); // neg is up?
    else if (this.lexeme == "SHAKE")
      quat.rotateY(headRotation, headRotation,  -angle*DEG2RAD);
    else if (this.lexeme == "TILT")
      quat.rotateZ(headRotation, headRotation,  -angle*DEG2RAD);
  }

	// StrokeStart
	else if (this.time > this.ready && this.time < this.strokeStart)
		return;
	


	// Stroke (phase 1)
	else if (this.time > this.strokeStart && this.time < this.stroke){
		inter = (this.time-this.strokeStart)/(this.stroke-this.strokeStart);
    // Cosine interpolation
    inter = Math.cos(Math.PI*inter+Math.PI)*0.5 + 0.5;

    // Should store previous rotation applied, so it is not additive
    if (this.phase == 0){
      this.prevDeg = 0;
      this.phase = 1;
    }

    var angle = inter*this.strokeDeg - this.prevDeg;
    this.prevDeg = inter*this.strokeDeg;
    // Apply rotation
    if (this.lexeme == "NOD")
    	quat.rotateX(headRotation, headRotation,  angle*DEG2RAD); // neg is up?
    else if (this.lexeme == "SHAKE")
      quat.rotateY(headRotation, headRotation,  angle*DEG2RAD);
    else if (this.lexeme == "TILT")
      quat.rotateZ(headRotation, headRotation,  angle*DEG2RAD);
	}



	// Stroke (phase 2)
	else if (this.time > this.stroke && this.time < this.strokeEnd){
		inter = (this.time-this.stroke)/(this.strokeEnd-this.stroke);
    // Cosine interpolation
    inter = Math.cos(Math.PI*inter+Math.PI)*0.5 + 0.5;

    // Should store previous rotation applied, so it is not additive
    if (this.phase == 1){
      this.prevDeg = 0;
      this.phase = 2;
    }

    var angle = inter*this.strokeDeg - this.prevDeg;
    this.prevDeg = inter*this.strokeDeg;
    // Apply rotation
    if (this.lexeme == "NOD")
    	quat.rotateX(headRotation, headRotation,  -angle*DEG2RAD); // neg is up?
    else if (this.lexeme == "SHAKE")
      quat.rotateY(headRotation, headRotation,  -angle*DEG2RAD);
    else if (this.lexeme == "TILT")
      quat.rotateZ(headRotation, headRotation,  -angle*DEG2RAD);
	}


	// Repetition -> Redefine strokeStart, stroke and strokeEnd
	else if (this.time > this.strokeEnd && this.repeatedIndx != this.repetition){
		this.repeatedIndx++;
		var timeRep = (this.strokeEnd - this.strokeStart);

		this.strokeStart = this.strokeEnd;
		this.strokeEnd += timeRep;
		this.stroke = (this.strokeEnd + this.strokeStart)/2;

		this.phase = 0;
		return;
	}


	// StrokeEnd (no repetition)
	else if (this.time > this.strokeEnd && this.time < this.relax)
		return;
	


	// Relax -> Move towards lookAt final rotation
	else if (this.time > this.relax && this.time < this.end){
		inter = (this.time-this.relax)/(this.end-this.relax);
    // Cosine interpolation
    inter = Math.cos(Math.PI*inter+Math.PI)*0.5 + 0.5;

    quat.slerp(headRotation, headRotation, this.lookAtRot, inter*0.1); // Why 0.1?
    
	    // Should store previous rotation applied, so it is not additive
	    //if (this.phase == 2){
	    //	this.prevDeg = 0;
	    //	this.phase = 3;
	    //}

	    //var angle = inter*this.readyDeg - this.prevDeg;
	    //this.prevDeg = inter*this.readyDeg;
	    // Apply rotation
	    //quat.rotateX(this.headNode.transform.rotation, this.headNode.transform.rotation,  angle*DEG2RAD); // neg is up?
	
  }

  // End
  else if (this.time > this.end)
    this.transition = false;
	
	
  // Progressive lookAt effect
  inter = (this.time-this.start)/(this.end-this.start);
  // Cosine interpolation
  inter = Math.cos(Math.PI*inter+Math.PI)*0.5 + 0.5;
  quat.slerp(headRotation, headRotation, this.lookAtRot, inter*0.1);


}




HeadBML.prototype.initHeadValues = function(){
	
	// Head initial rotation
	this.inQ = quat.copy(quat.create(), this.headNode.transform.rotation);

	// Compare rotations to know which side to rotate
	// Amount of rotation
	var neutralInv = quat.invert(quat.create(), this.neutralRotation);
	var rotAmount = quat.mul(quat.create(), neutralInv, this.inQ);
	var eulerRot = quat.toEuler(vec3.create(), rotAmount);
	// X -> right(neg) left(pos)
	// Z -> up(neg) down(pos)

	// in here we choose which side to rotate and how much according to limits
	// the lookAt component should be stopped here (or set to not modify node, only final lookAt quat output)

	// NOD
  if (this.lexeme == "NOD"){
    // nod will always be downwards

    // a final quaternion slerping between initial rotation and final rotation (with lookAt)
		// apply directly to the slerp lookAt. limits will be passed, but it doesn't make sense that the head looks downward when making a nod? Maybe add hard limits? or something similar?
  
    // get ready/strokeStart position
    this.strokeDeg = this.amount * this.maxDeg;
    // Define rot init
    this.readyDeg = Math.abs(Math.log10(this.amount*10)) * this.maxDeg * 0.2; // 20% of rotation approx

    // If the stroke rotation passes the limit, change readyDeg
    if (eulerRot[2]*RAD2DEG + this.strokeDeg > this.limVert)
      this.readyDeg = this.strokeDeg - this.limVert + eulerRot[2]*RAD2DEG;
  }
  // SHAKE
  else if (this.lexeme == "SHAKE"){
    // Defina ready/strokeStart position
    this.strokeDeg = this.amount * this.maxDeg;
    this.readyDeg = Math.abs(Math.log10(this.amount*10)) * this.maxDeg * 0.3;
    
    // Sign (left rigth)
    this.RorL = Math.sign(eulerRot[1]);
    this.readyDeg *= -this.RorL;
    this.strokeDeg *= -this.RorL;
  }
  // TILT?
  else if (this.lexeme == "TILT"){
    this.strokeDeg = this.amount * 20;
    this.readyDeg = Math.abs(Math.log10(this.amount*10)) * 10 * 0.3;
  }

  
}*/
