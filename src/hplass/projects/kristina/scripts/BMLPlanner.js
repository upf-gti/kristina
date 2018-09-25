//@BMLPlanner
// TODO: separate NVG of bml planner (processSpeechBlock).
var BMLPlanner = function ()
{

	this.conversation = "--- New dialogue---\n\n";
	this.state = "WAITING";
	this.stateTime = 0;
	this.nextBlockIn = 1 + Math.random() * 2;

	// Default facial state
	this.defaultValence = 0.4;
	this.currentArousal = 0;

	// Idle timings (blink and saccades)
	this.blinkIdle = 0.5 + Math.random() * 6;
	this.blinkDur = Math.random() * 0.5 + 0.15;
	this.blinkCountdown = 0;

	this.saccIdle = 0.5 + Math.random() * 6;
	this.saccDur = Math.random() + 0.5;
	this.saccCountdown = 0;
}

BMLPlanner.prototype.update = function (dt)
{
	if (LS.Globals.disablePlanner)
		return;

	this.stateTime += dt;

	// Automatic state update
	if (this.nextBlockIn < this.stateTime)
	{
		this.stateTime = 0;
		return this.createBlock();
	}

	// Check if speech has finished to change to WAITING
	if (this.state == "SPEAKING")
	{
		if (LS.Globals.BMLManager)
		{
			if (LS.Globals.BMLManager.lgStack.length == 0)
				this.transition(
				{
					control: "WAITING"
				});
		}
	}

	// Automatic blink and saccades
	return this.updateBlinksAndSaccades(dt);

}

BMLPlanner.prototype.transition = function (block)
{
	if (block.control == "UNDERSTANDING" || block.control == "PLANNING")
		block.control = "PROCESSING";

	var nextState = block.control;

	if (nextState == this.state)
		return;
	console.log("PREV STATE:", this.state, "\nNEXT STATE:", block.control);

	// Reset state time
	this.stateTime = 0;

	// Transitions
	// Waiting can only come after speaking
	if (nextState == "WAITING")
	{
		// Look at user for a while, then start gazing around
		this.nextBlockIn = 2 + Math.random() * 4;
	}
	// Can start speaking at any moment
	else if (nextState == "LISTENING")
	{
		// Force to overwrite existing bml
		block.composition = "OVERWRITE";
		if (this.state == "SPEAKING")
		{
			// Abort speech
			this.abortSpeech();
		}
		// Look at user and default face
		this.attentionToUser(block, true);
		// Back-channelling
		this.nextBlockIn = 1 + Math.random() * 2;

	}
	// Processing always after listening
	else if (nextState == "PROCESSING")
	{
		this.nextBlockIn = 0;
	}
	// Speaking always after processing
	else if (nextState == "SPEAKING")
	{
		this.attentionToUser(block, true);
		// Should I create random gestures during speech?
		this.nextBlockIn = 2 + Math.random() * 4;
	}

	this.state = nextState;

}


// Create blocks during a state
BMLPlanner.prototype.createBlock = function ()
{
	var state = this.state;
	var block = {
		id: state,
		composition: "OVERWRITE"
	};

	// LISTENING
	if (state == "LISTENING")
	{
		this.nextBlockIn = 1.5 + Math.random() * 3;
		// head -> link with this.currentArousal
		if (Math.random() < 0.6)
			block.head = {
				start: 0,
				end: 1.5 + Math.random() * 2,
				lexeme: "NOD",
				amount: 0.05 + Math.random() * 0.1
			}
		// Random blink
		if (Math.random() < 0.8)
			block.blink = {
				start: 0.3,
				end: 0.5 + Math.random() * 0.5
			};

		// Esporadic raising eyebrows
		if (Math.random() < 0.5)
		{
			var start = Math.random();
			var end = start + 1 + Math.random();
			block.face = {
				start: start,
				attackPeak: start + (end - start) * 0.2,
				relax: start + (end - start) * 0.5,
				end: end,
				lexeme:
				{
					lexeme: "RAISE_BROWS",
					amount: 0.1 + Math.random() * 0.2
				}
			}
		}

		// Gaze should already be towards user

		return block;
	}
	// SPEAKING
	else if (state == "SPEAKING")
	{
		this.nextBlockIn = 2 + Math.random() * 4;
		// Head
		if (Math.random() < 0.6)
		{
			block.head = {
				start: 0,
				end: 2.5 + Math.random() * 1.5,
				lexeme: "NOD",
				amount: 0.05 + Math.random() * 0.05
			}
			// Deviate head slightly
			if (Math.random() < 0.85)
			{
				var offsetDirections = ["DOWNRIGHT", "DOWNLEFT", "LEFT", "RIGHT"]; // Upper and sides
				var randOffset = offsetDirections[Math.floor(Math.random() * offsetDirections.length)];
				block.headDirectionShift = {
					start: 0,
					end: 1 + Math.random(),
					target: "CAMERA",
					offsetDirection: randOffset,
					offsetAngle: 1 + Math.random() * 3
				}
			}
		}
		// Esporadic raising eyebrows
		if (Math.random() < 0.7)
		{
			var start = Math.random();
			var end = start + 1.2 + Math.random() * 0.5;
			block.face = {
				start: start,
				attackPeak: start + (end - start) * 0.2,
				relax: start + (end - start) * 0.5,
				end: end,
				lexeme:
				{
					lexeme: "RAISE_BROWS",
					amount: 0.1 + Math.random() * 0.2
				}
			}
		}
		// Redirect gaze to user
		if (Math.random() < 0.7)
		{
			var start = Math.random();
			var end = start + 0.5 + Math.random() * 1;
			block.gazeShift = {
				start: start,
				end: end,
				influence: "EYES",
				target: "CAMERA"
			}
			block.composition = "OVERWRITE";
		}


		return block;
	}


	// PROCESSING
	else if (state == "PROCESSING")
	{
		this.nextBlockIn = 2 + Math.random() * 2;
		// gaze
		var offsetDirections = ["UPRIGHT", "UPLEFT", "LEFT", "RIGHT"]; // Upper and sides
		var randOffset = offsetDirections[Math.floor(Math.random() * offsetDirections.length)];
		if (Math.random() < 0.8)
		{
			block.gazeShift = {
				start: 0,
				end: 1 + Math.random(),
				influence: "EYES",
				target: "CAMERA",
				offsetDirection: randOffset,
				offsetAngle: 10 + 5 * Math.random()
			}
			// blink
			block.blink = {
				start: 0,
				end: 0.2 + block.gazeShift.end * Math.random()
			};
		}

		// head nods
		if (Math.random() < 0.3)
		{
			block.head = {
				start: 0,
				end: 1.5 + Math.random() * 2,
				lexeme: Math.random() < 0.2 ? "TILT" : "NOD",
				amount: 0.05 + Math.random() * 0.1
			}
		}

		// frown
		if (Math.random() < 0.6)
		{
			block.face = {
				start: 0,
				end: 1 + Math.random(),
				lexeme: [
				{
					lexeme: "LOWER_BROWS",
					amount: 0.2 + Math.random() * 0.5
				}]
			}
		}

		// press lips
		if (Math.random() < 0.3)
		{
			var lexeme = {
				lexeme: "PRESS_LIPS",
				amount: 0.1 + 0.3 * Math.random()
			};
			if (block.face)
				block.face.lexeme.push(lexeme)
			else
				block.face = {
					start: 0,
					end: 1 + Math.random(),
					lexeme: lexeme
				}
		}

		return block;
	}
	// WAITING
	else if (state == "WAITING")
	{
		this.nextBlockIn = 2 + Math.random() * 3;
		// gaze
		var offsetDirections = ["DOWN", "DOWNRIGHT", "DOWNLEFT", "LEFT", "RIGHT"]; // Upper and sides
		var randOffset = offsetDirections[Math.floor(Math.random() * offsetDirections.length)];
		var influence = Math.random() > 0.5 ? "HEAD" : "EYES";
    block.gazeShift = {
			start: 0,
			end: 1 + Math.random(),
			target: "CAMERA",
			influence: influence,
			offsetDirection: randOffset,
      offsetAngle: ((influence == "EYES")?1:3) + Math.random()
		}
		// Blink
		if (Math.random() < 0.8)
			block.blink = {
				start: 0,
				end: 0.2 + Math.random() * 0.5
			};

		// Set to neutral face
		block.faceShift = {
			start: 0,
			end: 2,
			valaro: [0, 0]
		};

		return block;
	}
}



// Automatic blink and saccades
// http://hal.univ-grenoble-alpes.fr/hal-01025241/document
BMLPlanner.prototype.updateBlinksAndSaccades = function (dt)
{
	// Minimum time between saccades 150ms
	// Commonly occurring saccades 5-10 deg durations 30-40ms
	// Saccade latency to visual target is 200ms (min 100 ms)
	// Frequency?

	// 10-30 blinks per minute during conversation (every two-six seconds)
	// 1.4 - 14 blinks per min during reading

	var block = null;

	// Blink
	this.blinkCountdown += dt;
	if (this.blinkCountdown > this.blinkIdle)
	{
		block = {
			blink:
			{
				end: this.blinkDur
			}
		};

		this.blinkCountdown = this.blinkDur;
		this.blinkIdle = this.blinkDur + 0.5 + Math.random() * 10;
		this.blinkDur = Math.random() * 0.5 + 0.15;
	}

	// Saccade
	this.saccCountdown += dt;
	if (this.saccCountdown > this.saccIdle)
	{
		// Random direction
		var opts = ["RIGHT", "LEFT", "DOWN", "DOWNRIGHT", "DOWNLEFT", "UP", "UPLEFT", "UPRIGHT"]; // If you are looking at the eyes usually don't look at the hair
		var randDir = opts[Math.floor(Math.random() * opts.length)];
		// Fixed point to saccade around?
		var target = "EYESTARGET";
		if (this.state == "LISTENING") target = "CAMERA";

		if (!block) block = {};

		block.gazeShift = {
			start: 0,
			end: Math.random() * 0.1 + 0.1,
			target: target,
			influence: "EYES",
			offsetDirection: randDir,
			offsetAngle: Math.random() * 3 + 2
		}

		this.saccCountdown = this.saccDur;
		if (this.state == "LISTENING" || this.state == "SPEAKING")
			this.saccIdle = this.saccDur + 2 + Math.random() * 6;
		else
			this.saccIdle = this.saccDur + 0.5 + Math.random() * 6;

		this.saccDur = Math.random() * 0.5 + 0.5;
	}


	return block;
}



// -------------------- NEW BLOCK --------------------
// New block arrives. It could be speech or control.
BMLPlanner.prototype.newBlock = function (block)
{

	// State
	if (block.control)
		this.transition(block);

	// User input
	if (block.userText)
		this.conversation = "USER: " + block.userText + "\n";

	// If langauge-generation
	if (block.lg)
	{
		block.blink = [];
		block.face = [];

		// List of bml instructions
		if (block.lg.constructor !== Array)
			block.lg = [block.lg]
    
    for (var i = 0; i < block.lg.length; i++)
		{
        this.processSpeechBlock(block.lg[i], block, (i == block.lg.length - 1));
				this.addUtterancePause(block.lg[i]);

        if(block.lg && block.lg[i].metadata)
        {
          
          /*
					proximity: [distant, close] //simple, personal
          style:		 [formal, informal] //formal, simple
          personality:[introverted, extroverted] //low arousal/simple vs high arousal/personal
          expressivity:[low, medium, high] //low arousal vs high arousal
          facial expression: -> from valence/arousal
          social:				[colloquial, heartly, reserved]????
					*/

          if( block.lg[i].metadata.FacialExpression /*facial expression shift*/){
						var faceShift = {
              start: block.lg[i].id+":start",
              end: block.lg[i].id+":start+2",
              valaro: [block.lg[i].valence, block.lg[i].arousal]
            };
          	this.addToBlock(faceShift, block, "faceShift");
					}
            
						
          
          //if( block.lg.metadata.hasProximity && act.toLowerCase().includes("greet") )
            

					
          
          
          //SimpleGreet: {src: "animations_1.1.1.wbin", range: [0,1.88]},
          //PersonalGreet: {src: "animations_1.1.1.wbin", range: [0,1.88]},
          //SimpleSayGoodbye: {src: "animations_1.1.1.wbin", range: [0,1.88]},
          //PersonalSayGoodbye: {src: "animations_1.1.1.wbin", range: [0,1.88]},
          //MeetAgainSayGoodbye:
				}


				
			}
		// No array
		//else
			//this.processSpeechBlock(block.lg, block, true);
	}
 
  
	// If non-verbal -> inside mode-selection.nonverbal
	if (block.nonVerbal)
	{
      // Add gesture (check arousal of message)
      if (block.nonVerbal.constructor === Array)
      { // It is always an array in server
          for (var i = 0; i < block.nonVerbal.length; i++)
          { // TODO -> relate nonVerbal with lg

              var act = block.nonVerbal[i].dialogueAct;

              block.gesture = {
                lexeme: act,
                start: 0,
                end: 2
              };

          }
      }
	}

  if(block.lg && (!block.nonVerbal || block.nonVerbal.length === 0))
  {
    	if(!LS.Globals.lg)
        return;
    	
    	if (block.lg.constructor !== Array)
        block.lg = [block.lg];
        
			block.gesture = [];
      for(var i in block.lg)
      {
          var lg = block.lg[i];
          var gesture = "talking";

          if(lg.arousal <= 0.20)
            continue;
          if(lg.arousal >= 0.5)
            gesture = "talking_hiaro";

          block.gesture.push({
            lexeme: gesture,
            start: lg.start,
            end: lg.end,
          });

      }
        

    
  		
  }
}



BMLPlanner.prototype.abortSpeech = function ()
{
	// Cancel audio and lipsync in Facial
	if (LS.Globals.Facial)
	{
		var facial = LS.Globals.Facial;
		if (!facial._audio.paused)
		{
			facial._audio.pause(); // Then paused is true and no facial actions
			// Go to neutral face? Here or somewhere else?
		}
	}
	// End all blocks in BMLManager
	if (LS.Globals.BMLManager)
	{
		var manager = LS.Globals.BMLManager;
		for (var i = 0; i < manager.stack.length; i++)
		{
			manager.stack[i].endGlobalTime = 0;
		}
	}
}


BMLPlanner.prototype.attentionToUser = function (block, overwrite)
{
	// If gazeShift already exists, modify

	var end = 0.5 + Math.random();
	var startHead = 0;
	var startGaze = startHead + Math.random() * 0.5; // Late start

	// gazeShift
	var gazeShift = {
		id: "gazeEnd",
		start: startGaze,
		end: end,
		influence: "EYES",
		target: "CAMERA"
	}

	// blink
	var startBlink = -Math.random() * 0.2;
	var blink = {
		start: startHead,
		end: end
	}

	// headDirectionShift
	var offsetDirections = ["DOWN", "DOWNLEFT", "DOWNRIGHT"]; // Submissive? Listening?
	var randOffset = offsetDirections[Math.floor(Math.random() * offsetDirections.length)];
	var startDir = -Math.random() * 0.3;
	var headDir = {
		start: startHead,
		end: end,
		target: "CAMERA",
		offsetDirection: randOffset,
		offsetAngle: 2 + 5 * Math.random()
	}

	var faceShift = {
		start: startHead,
		end: end,
		valaro: [this.defaultValence, 0],
	}

	// Force and remove existing bml instructions
	if (overwrite)
	{
		block.blink = blink;
		block.faceShift = faceShift;
		block.gazeShift = gazeShift;
		block.headDirectionShift = headDir;
	}
	else
	{
		this.addToBlock(blink, block, "blink");
		this.addToBlock(faceShift, block, "faceShift");
		this.addToBlock(gazeShift, block, "gazeShift");
		this.addToBlock(headDir, block, "headDirectionShift");
	}
}


BMLPlanner.prototype.addToBlock = function (bml, block, key)
{
	if (block[key])
	{
		// Add to array (TODO: overwrite, merge etc...)
		if (block[key].constructor === Array)
		{
			if (bml.constructor === Array)
				for (var i = 0; i < bml.length; i++)
					block[key].push(bml[i]);
			else
				block[key].push(bml);
		}
		// Transform object to array
		else
		{
			var tmpObj = block[key];
			block[key] = [];
			block[key].push(tmpObj);
			if (bml.constructor === Array)
				for (var i = 0; i < bml.length; i++)
					block[key].push(bml[i]);
			else
				block[key].push(bml);
		}
	}
	// Doesn't exist yet
	else
		block[key] = bml;

}




// ---------------------------- NONVERBAL GENERATOR (for speech) ----------------------------
// Process language generation message
// Adds new bml instructions according to the dialogue act and speech
BMLPlanner.prototype.processSpeechBlock = function (bmlLG, block, isLast)
{

	// Check if there is content
	if (bmlLG.start === undefined)
	{
		console.error("Wrong language generation format.", JSON.stringify(bmlLG));
		block.lg = [];
		return;
	}


	// Add to dialogue
	this.conversation += "KRISTINA: " + bmlLG.text + "\n";

  //Non-verbal face expression generation
  
  
  
  //(bmlLG.metadata && bmlLG.metadata["FacialExpression"])
  //block.face.push(bmlLG.metadata["FacialExpression"]);    
  // this.addToBlock(faceBrows, block, "face");
 
    /*
	 if(block.lg.metadata)
    {
    	for(var i in block.lg.metadata)
      {
        switch(i){
          case "FacialExpression":
            block.face.push(block.lg.metadata[i]);
            break;
        }
      }
    }
*/
  
	// Raise eyebrows using longest word
	var faceBrows = undefined;
	if (bmlLG.textTiming)
		faceBrows = this.createBrowsUp(bmlLG);

	// Valence face end of speech
	if (!bmlLG.valence) bmlLG.valence = this.defaultValence;
	var faceShiftsEnd = this.createEndFace(bmlLG);

	// Head nod at start
	var head = this.createHeadNodStart(bmlLG);

	// Gaze behaviors and blinking
	// Gaze start
	var gazeblinkStart = this.createGazeStart(bmlLG);

	// Gaze end (only for the last speech to give turn)
	var gazeblinkEnd = null;
	if (isLast)
		gazeblinkEnd = this.createGazeEnd(bmlLG); // gaze, blink, headDir
	else
	{
		gazeblinkEnd = {
			start: bmlLG.duration
		}; // blink at the end of every sentence
		this.fixSyncStart(gazeblinkEnd, bmlLG.start);
	}

	// Add to block
	if (faceBrows)
		this.addToBlock(faceBrows, block, "face");
	if (isLast)
	{
		this.addToBlock(faceShiftsEnd, block, "faceShift");
		// Arrange ending
		var lastFaceBrow = block.face[block.face.length - 1];
		if (lastFaceBrow)
			if (lastFaceBrow.end > block.faceShift[0].start)
				block.face.pop();
	}
	this.addToBlock(head, block, "head");

	if (isLast)
	{
		this.addToBlock(gazeblinkEnd[2], block, "headDirectionShift");
		this.addToBlock(gazeblinkEnd[0], block, "gazeShift");
		this.addToBlock(gazeblinkEnd[1], block, "blink");
	}
	else
		this.addToBlock(gazeblinkEnd, block, "blink");


	if (gazeblinkStart[0] != null)
	{
		this.addToBlock(gazeblinkStart[0], block, "gaze");
		this.addToBlock(gazeblinkStart[1], block, "blink");
	}

}




// Use longest word as prosody mark
BMLPlanner.prototype.createBrowsUp = function (bmlLG)
{
	var numWords = bmlLG.textTiming[0].length;
	if (numWords == 0)
		return undefined;

	// Find prosody marks
	// Use longer words for now (should be speech rate)
	var maxT = 0;
	var maxInd = 0;
	for (var i = 0; i < numWords; i++)
	{
		var diff = bmlLG.textTiming[2][i] - bmlLG.textTiming[1][i];
		if (diff > maxT)
		{
			maxT = diff;
			maxInd = i;
		}
	}

	// Create eyebrow lexeme
	var lexLongestWord = {
		lexeme: "RAISE_BROWS",
		amount: 0.25 + Math.random() * 0.4 // min-max (0.25, 0.65)
	}
	// Create bml face
	var faceLongestWord = {
		id: "longestWord",
		lexeme: lexLongestWord
	}
	// Add sync attrs
	var endOfSentence = bmlLG.duration; //bmlLG.textTiming[2][numWords-1];
	faceLongestWord.start = Math.max(0, bmlLG.textTiming[1][maxInd] - Math.random() * 0.4); // Substract <0.4 from start of longest word
	//faceLongestWord.attackPeak = Math.random()*maxT +  bmlLG.textTiming[1][maxInd]; // Add <wordTime to start of word
	//faceLongestWord.relax = Math.max(faceLongestWord.attackPeak, Math.min(endOfSentence-0.2, faceLongestWord.attackPeak + Math.random()*maxT/2)); // Add <wordTime/2 to attackPeak
	faceLongestWord.end = endOfSentence; //Math.min(endOfSentence, faceLongestWord.relax + 0.2 + Math.random()*0.5); // Add 0.2 + <0.5 to relax
	// Add offset start
	this.fixSyncStart(faceLongestWord, bmlLG.start);

	return faceLongestWord;
}




// Generate faceShifts at the end of speech
BMLPlanner.prototype.createEndFace = function (bmlLG)
{
	var endOfSentence = bmlLG.duration; //bmlLG.textTiming[2][bmlLG.textTiming[2].length-1]; 

	// If no valence
	if (bmlLG.valence === undefined)
	{
		console.log("Error: no valence in langauge-generation (lg)");
		bmlLG.valence = 0.5;
	}

	// Generate one faceshit
	var randomTiming = 0.5 + bmlLG.valence * (0.5 + Math.random());
	var faceValence0 = {
		id: "toFace" + parseInt(Math.random() * 1000),
		valaro: [bmlLG.valence, 0],
		start: endOfSentence,
		end: endOfSentence + randomTiming // // If valence is high, should take more time?
	}

	// Add offset start
	this.fixSyncStart(faceValence0, bmlLG.start);

	// Generate two faceShifts
	randomTiming = 3 * Math.abs(bmlLG.valence - this.defaultValence) * (0.5 + Math.random());
	var faceValence1 = {
		id: "toNeutral" + parseInt(Math.random() * 1000),
		valaro: [this.defaultValence, 0], // TODO - default face is 0.25,0?
		start: faceValence0.id + ":end",
		end: (faceValence0.id + ":end") + "+" + randomTiming // If valence is high, should take more time?
	}

	return [faceValence0, faceValence1];
}



// Create a head nod at the beggining
BMLPlanner.prototype.createHeadNodStart = function (bmlLG)
{

	var start = 0;
	var ready = Math.random() * 0.4 + start + 0.2;
	var stroke = Math.random() * 0.4 + ready + 0.2;
	var relax = Math.random() * 0.4 + stroke + 0.2;
	var end = Math.random() * 0.4 + relax + 0.2;

	var headNod = {
		start: start,
		ready: ready,
		stroke: stroke,
		relax: relax,
		end: end,
		lexeme: "NOD",
		amount: 0.1 - Math.random() * 0.08
	}

	// Add offset start
	this.fixSyncStart(headNod, bmlLG.start);

	return headNod;
}


// Create gaze (one at start to look away and back to user)
BMLPlanner.prototype.createGazeStart = function (bmlLG)
{
	var endOfSentence = bmlLG.duration; //bmlLG.textTiming[2][bmlLG.textTiming[2].length-1]; 

	// Random probability that a start gaze will happen on short-med speeches.
	var gaze0 = null;
	var blink0 = null;
	if (true)
	{ //endOfSentence > 3 + Math.random()*4){
		var start = Math.random() * 0.2; // One second max to start movement
		var ready = start + 0.5 + Math.random();
		var relax = ready + 0.2 + Math.random() * 0.5;
		var end = ready + 1 + Math.random();

		var offsetDirections = ["LEFT, RIGHT"]; // TODO: Sure about these directions??
		var randOffset = offsetDirections[Math.floor(Math.random() * offsetDirections.length)];

		gaze0 = {
			id: "gazeStart" + parseInt(Math.random() * 1000),
			start: start,
			ready: ready,
			relax: relax,
			end: end,
			influence: "HEAD",
			target: "CAMERA",
			offsetAngle: 10, //5 + Math.random()*5, // TODO: angle magnitude?

			offsetDirection: randOffset
		}

		// Add offset start
		this.fixSyncStart(gaze0, bmlLG.start);

		blink0 = { // TODO OPTIONAL: add another blink when coming back
			start: gaze0.start,
			end: gaze0.ready
		}

	}

	return [gaze0, blink0]
}




// Look at the camera at the end
BMLPlanner.prototype.createGazeEnd = function (bmlLG)
{
	var endOfSentence = bmlLG.duration; //bmlLG.textTiming[2][bmlLG.textTiming[2].length-1]; 

	var end = endOfSentence - Math.random();
	var start = end - Math.random();
	// Fix negative timings
	if (start < 0) start = 0;
	if (end < 0) end = 1 + Math.random() * 0.5;

	// gazeShift
	var gazeShift = {
		id: "gazeEnd" + parseInt(Math.random() * 1000),
		start: start,
		end: end,
		influence: "EYES",
		target: "CAMERA"
	}

	// Add offset
	this.fixSyncStart(gazeShift, bmlLG.start);

	// blink
	var startBlink = Math.random() * 0.2;
	var blink = {
		start: gazeShift.id + ":start" + "+" + startBlink,
		end: gazeShift.id + ":start" + "+" + (startBlink + Math.random() * 0.7)
	}

	// headDirectionShift
	var offsetDirections = ["DOWN", "DOWNLEFT", "DOWNRIGHT"]; // Submissive
	var randOffset = offsetDirections[Math.floor(Math.random() * offsetDirections.length)];
	var startDir = Math.random() * 0.3;
	var headDir = {
		start: gazeShift.id + ":start" + "+" + startDir,
		end: gazeShift.id + ":end" + "+" + (0.5 + Math.random() * 0.3),
		target: "CAMERA",
		offsetDirection: randOffset,
		offsetAngle: 2 + 5 * Math.random()
	}



	return [gazeShift, blink, headDir];
}



// Change offsets of new bml instructions
BMLPlanner.prototype.fixSyncStart = function (bml, offsetStart)
{
	// Find which sync attributes exist
	var syncAttrs = ["start"];
	var possibleSyncAttrs = ["end", "attackPeak", "relax", "ready", "strokeStart", "strokeEnd", "stroke"];
	for (var i = 0; i < possibleSyncAttrs.length; i++)
		if (bml[possibleSyncAttrs[i]] !== undefined)
			syncAttrs.push(possibleSyncAttrs[i]);


	// Is a reference to another bml?
	var start = parseFloat(offsetStart);
	var isRef = false;
	if (isNaN(start))
		isRef = true;


	// Add start
	// Reference to another bml -> start: "bml1:end + 1"
	if (isRef)
	{
		// If ref already has an offset
		var str = offsetStart.split("+");
		var offset = str[1] === undefined ? 0 : parseFloat(offset);
		// Add start ref to bml start
		for (var i = 0; i < syncAttrs.length; i++)
		{
			var syncName = syncAttrs[i];
			bml[syncName] = str[0] + "+" + (bml[syncName] + offset);
		}
	}
	// Not a reference, just a number
	else
	{
		// Add start offset to bml start
		for (var i = 0; i < syncAttrs.length; i++)
		{
			var syncName = syncAttrs[i];
			bml[syncName] = start + bml[syncName];
		}
	}
}



// Add a pause between speeches

BMLPlanner.prototype.addUtterancePause = function (bmlLG)
{
	// Pause time
	var pauseTime = 0.2 + Math.random() * 0.4;

	// Is a reference to another bml?
	var end = parseFloat(bmlLG.end);
	var isRef = false;
	if (isNaN(end))
		isRef = true;

	if (isRef)
	{
		// If ref already has an offset
		var str = bmlLG.end.split("+");
		var offset = str[1] === undefined ? 0 : parseFloat(str[1]);
		offset += pauseTime;
		bmlLG.end = str[0] + "+" + offset;
	}
	else
		bmlLG.end = parseFloat(bmlLG.end) + pauseTime;

}