//@Animation control
// Globals
if (!LS.Globals)
  LS.Globals = {};

LS.Globals.Anim = this;
var _initRot = vec4.create(),
    _animRot = vec4.create(),
    _lookRot = vec4.create(),
    _deltaRot = vec4.create(),
    _finalRot = vec4.create(),
    _anim = null,
    _headBone = null,
    _lookAtHead = null;

// Start
this.onStart = function(){
  
  this.defineDialogueActs();
  
  //this.anims = ["stand2walk_f.wbin", "walk_f.wbin", "walk2stand_f.wbin"];
	this.path = "hplass/projects/kristina/animations/";

	this.animComp = node.getComponents(LS.Components.PlayAnimation)[0];
  if (!this.animComp){
    console.log("Creating PlayAnimation Component");
    this.animComp = new LS.Components.PlayAnimation();
    node.addComponent(this.animComp);
  }
  
  this.animCompPool = [];
  for(var i = 0; i < 5; i++){
    var aC = new LS.Components.PlayAnimation();
    aC.playing = false;
  	this.animCompPool.push(aC);
    //node.addComponent(aC);
  }
  
  this.stance = 'default';
  
  
  _headBone   = node.scene.getNodeByName("head") || node.scene.getNodeByName("mixamorig_Head");
  _lookAtHead = node.scene.getNodeByName ("lookAtHead");
  
  if (!_headBone || !_lookAtHead){
    console.error("head node or lookAtHead not found. ");
    return;
  }
  // Initial rotation
  _initRot = vec4.copy(vec4.create(), _headBone.transform.rotation);
  
}



this.onUpdate = function(dt){
  
  
  var deltaRotation;
  var dir;//lookAt> extraer la direccion que ha de mirar, La rotacion.
  
  //el componente lookat tiene la dir3eccion neutral de la cabeza
  
  var deltaRotation;//rotacionAnimacion - rotacionNeutral
  
  //Rotacion incial
  //Rotacion de la animacion
  //Rotacion del lookat
  //Rotacion final = lookatRot + delta(initialRot, animRot)

  if(!_headBone)
    return;
  vec4.copy(_animRot, _headBone.transform.rotation);
  vec4.sub(_deltaRot, _animRot, _initRot);
  vec4.add(_finalRot, _lookRot, _deltaRot);
  //initialRoot -> la sacamos del componente lookatHead
  //animRot -> coger el take de la animacion que pueda afectar al head bone. (la ultima que afecte al hueso)
  
}





// Animation name as input
this.getEndAnim = function(){
  this.animComp.getDuration();
}

// Dialogue act as input
this.getEndDialogueAct = function(){
  
}

// Relates dialogue acts with specific animation clips
this.defineDialogueActs = function(){
  this.dialogueActs = {
    // Greetings
    SimpleGreet: {src: "animations_1.1.1.wbin", range: [0,1.88]},
    PersonalGreet: {src: "animations_1.1.1.wbin", range: [0,1.88]},
    SimpleSayGoodbye: {src: "animations_1.1.1.wbin", range: [0,1.88]},
    PersonalSayGoodbye: {src: "animations_1.1.1.wbin", range: [0,1.88]},
    MeetAgainSayGoodbye: {src: "animations_1.1.1.wbin", range: [0,1.88]},
    // Moods
    ShareJoy: {src: "animations_1.1.1.wbin", range: [0,0]},
    CheerUp: {src: "animations_1.1.1.wbin", range: [0,0]},
    CalmDown: {src: "animations_1.1.1.wbin", range: [0,0]},
    Console: {src: "animations_1.1.1.wbin", range: [0,0]},
    SimpleMotivate: {src: "animations_1.1.1.wbin", range: [0,0]},
    // Ask
    AskMood: {src: "animations_1.1.1.wbin", range: [0,0]},
    AskTask: {src: "animations_1.1.1.wbin", range: [0,0]},
    // Please repeat
    RequestRephrase: {src: "animations_1.1.1.wbin", range: [1.88,4.58]},
    RequestRepeat: {src: "animations_1.1.1.wbin", range: [1.88,4.58]},
    StateMissingComprehension: {src: "animations_1.1.1.wbin", range: [4.58,6.03]},
    // Thanks
    AnswerThank: {src: "animations_1.1.1.wbin", range: [1.88,4.58]},
    // Apologise
    SimpleApologise: {src: "animations_1.1.1.wbin", range: [4.58,6.03]},
    PersonalApologise: {src: "animations_1.1.1.wbin", range: [4.58,6.03]},
    // Statement
    Accept: {src: "animations_1.1.1.wbin", range: [0,0]},
    Acknowledge: {src: "animations_1.1.1.wbin", range: [0,0]},
    Reject: {src: "animations_1.1.1.wbin", range: [0,0]}
  };
}


var file = "hplass/projects/kristina/animations/animations_kristina.wbin";
var gestures = {
	//strokeStart, stroke, strokeEnd,
  head_nod    		:{src: file, take: "Head_Nod"    				 ,speed:1.0,start:0.0,ready:0.0,strokeStart:0.0,stroke:0.0,strokeEnd:0.0,relax:0.0,end:2.00},
  head_nod2   		:{src: file, take: "Head_Nod2"   				 ,speed:1.0,start:0.0,ready:0.0,strokeStart:0.0,stroke:0.0,strokeEnd:0.0,relax:0.0,end:3.20},
  head_shake  		:{src: file, take: "Head_Shake"  				 ,speed:1.0,start:0.0,ready:0.0,strokeStart:0.0,stroke:0.0,strokeEnd:0.0,relax:0.0,end:2.20},
  gest_reject 		:{src: file, take: "Gesture_Reject" 		 ,speed:1.0,start:0.0,ready:0.0,strokeStart:0.0,stroke:0.0,strokeEnd:0.0,relax:0.0,end:2.63},
  gest_wave   		:{src: file, take: "Gesture_Wave"   		 ,speed:1.0,start:0.0,ready:0.0,strokeStart:0.0,stroke:0.0,strokeEnd:0.0,relax:0.0,end:4.40},
  gest_bow    		:{src: file, take: "Gesture_Bow"    		 ,speed:1.0,start:0.0,ready:0.00,strokeStart:0.64,stroke:0.50,strokeEnd:1.00,relax:1.50,end:3.33},
  gest_longwave   :{src: file, take: "Gesture_LongWave"    ,speed:1.0,start:0.0,ready:0.0,strokeStart:0.0,stroke:0.0,strokeEnd:0.0,relax:0.0,end:5.40},
  gest_acknowledge:{src: file, take: "Gesture_Acknowledge" ,speed:1.0,start:0.0,ready:0.0,strokeStart:0.0,stroke:0.0,strokeEnd:0.0,relax:0.0,end:2.33},
}


var dialogueActMatch = {
  
  	goodbye: 						"wave",
  	saygoodbye: 				"wave",
  	greeting: 					"wave",
		simplegreet: 				"wave",
    personalgreet: 			"wave",
    simplesaygoodbye: 	"wave",
    personalsaygoodbye:	"wave",
    meetagainsaygoodbye:"wave",
  	morninggreet:				"wave",
  	eveninggreet: 			"wave",
    introduce: 					"wave",
  
    // moods
    sharejoy:						null,
    cheerup:  					null,
    calmdown: 					null,
    console:  					null,
    simplemotivate: 		null,

    // ask
  	ack: 								"show",
    askmood: 						"show",
    asktask: 						"show",
  
    // please repeat
  	requestfeedback:		"repeat",
 		unknownrequest:			"repeat",
  	unknownstatement:		"repeat",
  	notfound:						"repeat",
  	requestrephrase: 		"repeat",
    requestrepeat: 			"repeat",
    statemissingcomprehension: "repeat",
    // thanks
    answerthank: 				"thanks",
    // apologise
    simpleapologise: 		null,
    personalapologise: 	null,
  
  	show: 							"show",
  	showvideo: 					"show",
  	showweather:				"show",
  	linkresponse: 			"show",
  	irresponse:					"show",
    proactivelist: 			"show",
    // statement
    accept: 						"headnod",
  	affirm:							"headnod",
  	acknowledge:				"headnod",
    reject: 						"headshake",
  	talking: 						"talking",
  	talking_hiaro: 			"talking_hiaro",

  
  
   /*
   	Falta poner:
    Acknowledge = IRResponse falta
    ProactiveList hecho
    
    
   */
}

// --------------------- GESTURE ---------------------
// BML
// <gesture start ready strokeStart stroke strokeEnd relax end mode lexeme>
// mode [LEFT_HAND, RIGHT_HAND, BOTH_HANDS]
// lexeme [BEAT]
LS.Globals.gesture = function(gestData){
  /*var gestureInfo = LS.Globals.Anim.dialogueActs[gestData.lexeme];
  if (!gestureInfo){
    console.warn("Gesture lexeme not found:", gestData.lexeme);
    return;
  }
    
  var str = LS.Globals.Anim.path + gestureInfo.src;
  
  var animComp = LS.Globals.Anim.animComp;
  if (animComp){
    animComp.animation = str;
  	animComp.range = gestureInfo.range;
  	animComp.current_time = 0;
  	animComp.mode = LS.Components.PlayAnimation.ONCE;
  	animComp.play();
  }*/
	if(LS.Globals.lg && LS.Globals.lg.arousal < 0.25)
    return console.warn("No gesture, low arousal:", LS.Globals.lg.arousal);
  
  var gesture = dialogueActMatch[gestData.lexeme.toLowerCase()];
  
  if (!gesture){
    console.warn("Gesture lexeme not found:", gestData.lexeme);	
    return;
  }


  switch(gesture){
    case "talking":
      /*if(LS.Globals.lg && LS.Globals.lg.end <= 3.63)
        gesture = "talking0";*/
      
      if(LS.Globals.lg && LS.Globals.lg.arousal >= 0.5){
      	gesture = "talking_hiaro"
        /*if(LS.Globals.lg && LS.Globals.lg.end < 10)
        	gesture = "talking_hiaro0";*/
      }
      break;
      
    case "wave": 
      if(LS.Globals.lg && LS.Globals.lg.arousal >= 0.5)
        gesture = "wave_hiaro"  
      break;
      
    case "headshake":
      gesture = null;
    case "repeat": 
     	LS.Globals.BMLManager.newBlock({"id": "head","head":{"lexeme": "SHAKE"}, composition: "OVERWRITE"});
      break;
      
    case "headnod":
      gesture = null;  
    case "thanks": 
      LS.Globals.BMLManager.newBlock({"id": "head","head":{"lexeme": "NOD"}, composition: "OVERWRITE", start:0.25});
      break;
  }
  if(gesture)
  	LS.Globals._animation = gesture; //When this value changes, an observer notifies the change to the state machine and plays the animation

  /*if (!gestureInfo){
    console.warn("Gesture lexeme not found:", gestData.lexeme);
    return;
  }
  if(Array.isArray(gesture))
    gestureInfo = gesture[Math.floor(Math.random()*gesture.length)] //selects one randomly
  */
  
    
  /*
  var aC = null;

  aC = new LS.Components.PlayAnimation();
  node.addComponent(aC);
  if(!aC) throw("no player available");
  
  aC.playing			= false;
  aC.animation 		= gestureInfo.src;
  aC.take			 		= gestureInfo.take;
  aC.current_time = gestureInfo.start;
  aC.mode 		 		= LS.Components.PlayAnimation.ONCE;
  aC.speed 				= gestData.speed || gestureInfo.speed || 1.0;
  aC.play();
  var n = node;
  LEvent.bind(aC, "end_animation", function(e, a,b,c){
    
    console.log("end_animation")
    //this.playing = false;
    var nd = n;
    var that = this;
    setTimeout(function(){
    	nd.removeComponent(that);
    }, 10)
  }, aC);*/

}

// --------------------- Posture ---------------------
// Plays a static posture or posture animation until a new one is set.
// BML
//  <postureShift id="behavior1" start="5">            
//		<stance type="SITTING"/> 
//    <pose type="ARMS" lexeme="ARMS_CROSSED"/>
//  </postureShift>
// lexeme [BEAT]

var postures = {
  idle: {src: file,
         take: 'A',
         range: null,
         start/*start moving to a new pose*/:0, 
         ready/*new pose achieved*/:0, 
         relax/*start returning to BASE posture*/:0, 
         end/*temporary posture ended,  back at BASE posture*/:0},
  hand_l_relax:{src: file, take: "Hand_L_Relax",start:0.0,ready:0.64,relax:0.64,end:1.27},
  hand_r_relax:{src: file, take: "Hand_R_Relax",start:0.0,ready:0.64,relax:0.64,end:1.27},
	hand_r_palm :{src: file, take: "Hand_R_Palm" ,start:0.0,ready:0.64,relax:0.64,end:1.27},
  hand_r_punch:{src: file, take: "Hand_R_Punch",start:0.0,ready:0.64,relax:0.64,end:1.27},
  
  hand_r_one  :{src: file, take: "Hand_R_One"  ,start:0.0,ready:0.64,relax:1.66,end:2.10},
  hand_r_two  :{src: file, take: "Hand_R_Two"  ,start:0.0,ready:0.64,relax:1.66,end:2.10},
  hand_r_three:{src: file, take: "Hand_R_Three",start:0.0,ready:0.64,relax:1.66,end:2.10},
  hand_r_four :{src: file, take: "Hand_R_Four" ,start:0.0,ready:0.64,relax:1.66,end:2.10},
  hand_r_five :{src: file, take: "Hand_R_Five" ,start:0.0,ready:0.64,relax:1.66,end:2.10},
  
  
}

LS.Globals.Anim.playStance = function(stance, aC, mode){
    if(!postures[stance])
      return false;
    
    var sD = postures[stance];
   
    aC.playing			= false;
    aC.animation 		= sD.src;
    aC.take			 		= sD.take;
    aC.range				= sD.range;  
    aC.current_time = 0;
    aC.speed 				= sD.speed || 0.5;
  	aC.blend_time	  = 0.5;
    switch(mode){
      case 'LOOP':	
        aC.mode	 = LS.Components.PlayAnimation.LOOP;
        break;
      case 'ONCE':	
        aC.mode  = LS.Components.PlayAnimation.ONCE; 
        aC.range = [sD.start, sD.ready]; 
        break;
    }
    
    
    aC.play();
    
  	return aC;
}


LS.Globals.posture = function(postureData){
  console.log('posture', postureData);
  if(!postureData || !postureData.pose)
  	return;
 	
  //Set stance
  this.stance;
  var newstance = postureData.stance.toLowerCase();

  //Check if we got a transition between stances
  if(LS.Globals.Anim.playStance(this.stance+'to'+newstance, LS.Globals.Anim.animComp,'ONCE'))
    LEvent.bind(LS.Globals.Anim.animComp, "end_animation", function(e){
          this.playing = false;
      		LS.Globals.Anim.playStance(newstance,LS.Globals.Anim.animComp, 'LOOP');
    }, aC);
  else
    LS.Globals.Anim.playStance(newstance, LS.Globals.Anim.animComp, 'LOOP')
   
 
  //Stance Ready to loop, Set pose
  if(postureData.pose){
  	 if(!Array.isArray(postureData.pose))
    	postureData.pose = [postureData.pose];
  
    postureData.pose.forEach(function(pose){
      var aC = null;
     /*LS.Globals.Anim.animCompPool.some(function(a){
        if(!a.playing){
        	aC = a;
          return true;
        }
        return false;
      });*/
      
      aC = new LS.Components.PlayAnimation();
    	node.addComponent(aC);
      
      if(aC && pose.lexeme){
        poseData = postures[pose.lexeme.toLowerCase()];
        if(!poseData)
          return console.warn("Posture pose not found:", pose.lexeme);
				aC.playing			= false;
        aC.range				= [0, 0.62];
        aC.animation 		= poseData.src;
        aC.take			 		= poseData.take;
        aC.current_time = poseData.start;
        aC.mode 		 		= LS.Components.PlayAnimation.ONCE;
        aC.speed 				= poseData.speed || 0.25;
        aC.play();
				var n = node;
        LEvent.bind(aC, "end_animation", function(e, a,b,c){
          console.log("end_animation")
          this.playing = false;
          var nd = n;
          var that = this;
         
          setTimeout(function(){
            nd.removeComponent(that);
          }, 10)
        }, aC);
      }   
    })
    
  
  }
 
  
    
    
	

}

this.onGetResources = function(res){
	return res;
  var resources = ['hplass/projects/kristina/models/K-cf2.PACK.wbin'];
  
  resources.forEach(function(r){
  	res[r] = true;
  });
	return res;
}
