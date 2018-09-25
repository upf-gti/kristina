//@Agent controller
// Globals
if (!LS.Globals)
    LS.Globals = {};

this.onStart = function
() 
{
    if (window.BMLPlanner !== undefined)
        LS.Globals.BMLPlanner = new BMLPlanner();
    else
        console.log("BML Planner not included");
  
    if (window.BMLTimeManager !== undefined)
        LS.Globals.BMLManager = new BMLTimeManager();
    else
        console.log("BML Manager not included");

    LS.Globals.ws = {};
    LS.Globals.ws.send = function(e) {
        console.log("WS should send ", e)
    };

    // Resources
    // Pre-load audio files. Contains blocks with lg content
    LS.Globals.pendingResources = [];
}


this.onUpdate = function(dt) {
  
    var newBlock = null;
  
    if (LS.Globals.BMLPlanner)
        newBlock = LS.Globals.BMLPlanner.update(dt);

    if (LS.Globals.BMLManager)
        LS.Globals.BMLManager.update(LS.Globals.processBML, LS.GlobalScene.time);

    if (newBlock !== null) 
        LS.Globals.BMLManager.newBlock(newBlock, LS.GlobalScene.time);
  
  
    // Check pending audio resources to load
    if ( LS.Globals.pendingResources.length != 0 )
    {
        var sendPendingLG = true;
        var audioError = false;

        for ( var i = 0; i < LS.Globals.pendingResources.length; i++ )
        {
            sendPendingLG = false;
            audioError = false;

            var block = LS.Globals.pendingResources[i];
            var bml = block.lg;

            if ( !Array.isArray(bml) )
                bml = [bml];

            for ( var j in bml )
            {
                // Audio error
                if ( bml[j].audio.error != null )
                    audioError = true;
                    
                // Audio is not loaded yet
                else if ( bml[j].audio.readyState == 4 )
                    sendPendingLG = true;
            }
          

            // Remove blocks with audio errors
            if ( audioError )
            {
                // Send post response
                LS.Globals.ws.send( block.id + ": true" );

                // Remove from pending stack
                LS.Globals.pendingResources.splice( i, 1 );
                i--;
            }

            // Send block
            else if ( sendPendingLG )
            {
                LS.Globals.processMsg( JSON.stringify( block ), block.fromWS );
                LS.Globals.pendingResources.splice( i, 1 );
                i--;
            }
        }
    }
}


LS.Globals.changeVolume = function(vol) {
    var thatFacial = LS.Globals.Facial;
    if (thatFacial)
        if (thatFacial._audio)
            thatFacial._audio.volume = vol;
}

// Process message
// Messages can come from inner processes. "fromWS" indicates if a reply to the server is required in BMLManager.js
LS.Globals.processMsg = function(msg, fromWS) {

    msg = JSON.parse(msg);

    if (fromWS)
        msg.fromWS = fromWS;

    console.log("Processing message: ", msg);

    // Input msg KRISTINA
    LS.Globals.inputMSG = msg;

    // This is here for the KRISTINA Web GUI
    if (typeof LS.Globals.msgCallback == "function") {
        //LS.Globals.msgCallback(msg);
        var res = LS.Globals.msgCallback(msg);
        if (res === false) {
            if (fromWS) {
                LS.Globals.ws.send(msg.id + ": true"); // HARDCODED
                console.log("(shortcut) Sending POST response with id:", msg.id);
            }
            return;
        }
    }


    // Client id -> should be characterId?
    if (msg.clientId !== undefined && !LS.Globals.ws.id) {
        LS.Globals.ws.id = msg.clientId;

        console.log("Client ID: ", msg.clientId);
        LS.infoText = "Client ID: " + msg.clientId;

        return;
    }


    // Load audio files
    if (msg.lg) {
        var hasToLoad = LS.Globals.loadAudio(msg);
        if (hasToLoad) {
            LS.Globals.pendingResources.push(msg);
            console.log("Needs to preload audio files.");
            return;
        }
    }



    if (!msg) {
        console.error("An undefined msg has been received.", msg);
        return;
    }

    // Process block
    // Create new bml if necessary
    if (LS.Globals.BMLPlanner)
        LS.Globals.BMLPlanner.newBlock(msg);

    if (!msg) {
        console.error("An undefined block has been created by BMLPlanner.", msg);
        return;
    }

    // Update to remove aborted blocks
    if (!LS.Globals.BMLManager)
        return;
    LS.Globals.BMLManager.update(LS.Globals.processBML, LS.GlobalScene.time);

    if (!msg) {
        console.error("An undefined block has been created due to the update of BMLManager.", msg);
        return;
    }

    // Add new block to stack
    LS.Globals.BMLManager.newBlock(msg, LS.GlobalScene.time);

}


// Process message
LS.Globals.processBML = function(key, bml) {
    //console.log("PROCESS BML\n", key, JSON.stringify(bml));
    if (!LS.Globals.Facial)
        return;

    var thatFacial = LS.Globals.Facial;

    switch (key) {
        case "blink":
            thatFacial._blinking = true;
            thatFacial.newBlink(bml);
            break;
        case "gaze":
            thatFacial.newGaze(bml, false);
            break;
        case "gazeShift":
            thatFacial.newGaze(bml, true);
            break;
        case "head":
            thatFacial.newHeadBML(bml);
            break;
        case "headDirectionShift":
            bml.influence = "HEAD";
            thatFacial.newGaze(bml, true, null, true);
            break;
        case "face":
            thatFacial.newFA(bml, false);
            break;
        case "faceShift":
            thatFacial.newFA(bml, true);
            break;
        case "speech":
            thatFacial.newSpeech(bml);
            break;
        case "gesture":
            LS.Globals.gesture(bml);
            break;
        case "posture":
        		console.log("posture")
            LS.Globals.posture(bml);
            break;
        case "pointing":
            break;
        case "lg":
            thatFacial._visSeq.sequence = bml.sequence;
            thatFacial._audio.src = bml.audioURL; // When audio loads it plays
            // All "lg" go through pending resources and are called when the audio is loaded.
            // If I assign again the audioURL is the audio already loaded?
            
            var CC = LS.GlobalScene._root.getComponent("CaptionsComponent");
            if (CC && !LS.Globals.hideCaptions){
              	var split = 5.0;
              
                if (bml.duration <= split )
                    CC.addSentence(bml.text, CC.getTime(), CC.getTime() + bml.end);
              
              	else{
                  	bml.text.replace(".", " .").replace(",", " ,").split(" ");
                  
                  	var sentence =  [0,0,""], copy = null;
                		for(var w in bml.words){
                    		var word = bml.words[w];
                      	sentence[1] = word.end;	
                      	sentence[2] += " "+word.word;
                      	
                  			if( (sentence[1] - sentence[0])/split >= 1){
                        		copy = sentence.clone();
                    				CC.addSentence(copy[2], CC.getTime() + copy[0], CC.getTime() + copy[1]);
                   					sentence = [sentence[1],sentence[1],""];
                  			}
												
                		}
              	}

            }
                
						
            if(bml.metadata){
              LS.Globals.lg = {metadata : bml.metadata,
                               start: bml.start,
                               end:bml.end,
                               valence:bml.valence,
                               arousal:bml.arousal};
              LS.Globals.count = bml.end - bml.start;
              if(bml.metadata.FacialExpression){
                LS.Globals.BMLManager.newBlock({"id":"face", "face":{ "start": bml.start, "attackPeak": ((bml.end - bml.start)/4), end: bml.end, "valaro": [bml.valence,bml.arousal]}, composition:"OVERWRITE"})
              }
                
            }
            break;
    }
}


// Preloads audios to avoid loading time when added to BML stacks
LS.Globals.loadAudio = function(block) {
    var output = false;
    if (block.lg.constructor === Array) {
        for (var i = 0; i < block.lg.length; i++) {
            if (!block.lg[i].audio) {
                block.lg[i].audio = new Audio();
                block.lg[i].audio.src = block.lg[i].audioURL;
                output = true;
            }
        }
    } else {
        if (!block.lg.audio) {
            block.lg.audio = new Audio();
            block.lg.audio.src = block.lg.audioURL;
            output = true;
        }
    }

    return output;
}
LS.Globals.count = 0;
this.onRenderGUI = function(ctx)
{
  var length;
	
  if(!LS.Globals.showGUI || LS.Globals.count <= 0 || !LS.Globals.lg || !LS.Globals.lg.metadata || (length = Object.keys(LS.Globals.lg.metadata).length) == 0)// || LS.Globals.lg.end == undefined || LS.Globals.lg.end <= LS.GlobalScene.time || LS.Globals.lg.start == undefined || LS.Globals.lg.start > LS.GlobalScene.time)
    return;
 
  LS.GUI.Label( [56,285,400,22], "Mode-Selection:");	
  LS.GUI.Box(   [59,310,190,length*19], "rgba(55,55,55,0.5)" );
  
  LS.Globals.count -= LS.GlobalScene._last_dt;
  
  var row = 0;
  for(var k in LS.Globals.lg.metadata){
    LS.GUI.Label( [70,315+18*row++,400,16], k + ": "+LS.Globals.lg.metadata[k]);	
  }
    
  
}

/*
// How to send POST messages through webglstudio.org:8080
var msg = {
    "type": "idle",
    "uuid": 100,
    "meta": {
        "user": "Anna",
        "avatar": "KRISTINA",
        "scenario": "babycare",
        "language": "pl"
    },
    "data": {
        "blink": {
          "start": 0,
          "end": 0.5
        },
        "composite": "APPEND"
    }
}


req = new XMLHttpRequest();
req.open('POST', 'https://webglstudio.org:8080/idle', true);
req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
req.send(JSON.stringify(msg));

req.onreadystatechange = function () { //Call a function when the state changes.
    if (req.readyState == 4 && req.status == 200) {
        console.log(req.responseText);
    }
}




*/