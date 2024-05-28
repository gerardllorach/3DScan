// Globals
if (!LS.Globals)
  LS.Globals = {};

thatFacial = this;

this.headNodeName = "omarHead";
this.jawNodeName = "jaw";
this._jawInitRot = null;
this._jawRot = quat.create();


// Blend shapes index
this.smileBSIndex = 0;
this.sadBSIndex = 1;
this.kissBSIndex = 2;
this.lipsClosedBSIndex = 3;

this.browsDownBSIndex = 5;
this.browsInnerUpBSIndex = 6;
this.browsUpBSIndex = 7;
this.eyeLidsBSIndex = 8;



// Lip-sync blend shapes factor
this.LipKissFactor = 1;
this.LipLipsClosedFactor = 1;
this.LipJawFactor = 1;

this['@LipKissFactor'] = {type: "slider", max: 4, min: 0.1};
this['@LipLipsClosedFactor'] = {type: "slider", max: 4, min: 0.1};
this['@LipJawFactor'] = {type: "slider", max: 4, min: 0.1};


// Facial blend shapes factors
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
this._blendshapes = null;
this.valence = 0;
this.arousal = 0;
//this.activation_evaluation = [this.valence, this.arousal]
//this['@activation_evaluation'] = {type:"vec2", widget: "pad", min:-1, max: 1};

// Lipsync
// Energy bins
var energy = undefined;
this._lipsyncBSW = [0,0,0]; //kiss, lipsClosed, jaw



// Blink timings
this._blkTime = 0;
this._blkDur = 0.45;
this._initialWeight = 0;
this.blinking = false;
   
  
this.onStart = function(){
  // Point to global energy
  energy = LS.Globals.energy;
  LS.Globals.lipsyncBSW = this._lipsyncBSW;
  
  // Get head node
  head = node.scene.getNodeByName (this.headNodeName);
  if(!head){
    console.log("Head node not found");
    return; 
  }
  
  // Get morph targets
  morphTargets = head.getComponent(LS.Components.MorphDeformer);
  
  if (!morphTargets){
    console.log("Morph deformer not found in: ", head.name);
    return; 
  }
  morphTargets = morphTargets.morph_targets;
  this._blendshapes = morphTargets;
  
  // Get eyeLidsBS
  if (this.eyeLidsBSIndex > morphTargets.length-1){
    console.log("Eye lid index", this.eyeLidsBSIndex ," is not found in: ", morphTargets);
    return; 
  }
	
  this.eyeLidsBS = morphTargets[this.eyeLidsBSIndex];
  
  
  // Get jaw node and initial rotation
  this.jaw = node.scene.getNodeByName (this.jawNodeName);
  
  if (!this.jaw){
    console.log("Jaw node not found with name: ", this.jawNodeName);
    return;
  }
  // Initial rotation
  this._jawInitRotation = vec4.copy(vec4.create(), this.jaw.transform.rotation);
  

}
  
  

this.onUpdate = function(dt)
{
  
  if (this.blinking && this.eyeLidsBS){
    // Find initial weight
    if (this._blkTime == 0)
      this._initialWeight = this.eyeLidsBS.weight;
    
    this.blink(dt);
    
    if (this._blkTime > this._blkDur){
      this._blkTime = 0;
      this.blinking = false;
      this.eyeLidsBS.weight = this._facialBSW[8];
    }
      
  }
  
  
  // Update blendshapes
  if (!this._blendshapes || !this.jaw)
    return;
  
  
  // Lipsync
  this.updateLipsync();

  this._blendshapes[this.lipsClosedBSIndex].weight = this._lipsyncBSW[1] * this.LipLipsClosedFactor;
  this._blendshapes[this.kissBSIndex].weight = this._lipsyncBSW[0] * this.LipKissFactor;

  quat.copy (this._jawRot, this._jawInitRotation);
  this._jawRot[3] += -this._lipsyncBSW[2] * 0.3 * this.LipJawFactor; // jaw
  this.jaw.transform.rotation = quat.normalize(this._jawRot, this._jawRot);

  // Whissel Wheel
  if (this.changingFace){
    this._blendshapes[this.sadBSIndex].weight = this._facialBSW[0] // sad
    this._blendshapes[this.smileBSIndex].weight = this._facialBSW[1] // smile
    
  	this._blendshapes[this.browsDownBSIndex].weight = this._facialBSW[5] // browsDown
  	this._blendshapes[this.browsInnerUpBSIndex].weight = this._facialBSW[6] // browsInnerUp
  	this._blendshapes[this.browsUpBSIndex].weight = this._facialBSW[7] // browsUp
  	this._blendshapes[this.eyeLidsBSIndex].weight = this._facialBSW[8] // eyeLids
  	thatFacial.changingFace = false;
  }
  

	node.scene.refresh();
}





// --------------------- BLINK ---------------------

this.blink = function(dt){
 	// Increase time
  this._blkTime += dt;
  
  // Cosine function to smooth movement
  freq = 1.0/this._blkDur;
  value = (-Math.cos(2.0*Math.PI*freq*this._blkTime) + 1.0) * 0.5;
  
  // Set to 0, prevent slow FPS errors
  if (this._blkTime > this._blkDur)
    value = this._initialWeight;
  
  // Set weight
  this.eyeLidsBS.weight = this._initialWeight + value*(1-this._initialWeight);
  
  
}




LS.Globals.blink = function(blinkData){

  thatFacial._blkDur = blinkData.blinkDuration || 0.45;
  thatFacial.blinking = true;
  
  // Server response
  if (blinkData.cmdId) 
    setTimeout(LS.ws.send, thatFacial._blkDur * 1000, blinkData.cmdId + ": true");
}




// --------------------- WHISSEL WHEEL ---------------------


LS.Globals.facialExpression = function(faceData){
	thatFacial.facialExpression(faceData);
  thatFacial.changingFace = true;
  
  // Server response
  if (faceData.cmdId) 
    LS.ws.send(faceData.cmdId + ": true");
}

this.facialExpression = function(faceData){
  
  maxDist = 0.8;
  
  var blendValues = [0,0,0,0,0,0,0,0,0];
  var bNumber = 11;
  
  this._p[0] = faceData.face[0];
	this._p[1] = faceData.face[1];
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
	this._facialBSW [ 0 ] = blendValues[0] * this.sadFactor; // sad
	this._facialBSW [ 1 ] = blendValues[1] * this.smileFactor; // smile
	this._facialBSW [ 2 ] = blendValues[2] * this.lipsClosedFactor; // lips closed pressed
	this._facialBSW [ 3 ] = blendValues[3] * this.kissFactor; // kiss
	
  this._facialBSW [4]  = blendValues[4] * this.jawFactor;

	this._facialBSW [5] = blendValues[5] * this.browsDownFactor; // eyebrow down
	this._facialBSW [6] = blendValues[6] * this.browsInnerUpFactor; // eyebrow rotate outwards
	this._facialBSW [7] = blendValues[7] * this.browsUpFactor; // eyebrow up
	this._facialBSW [8] = blendValues[8]; // eyelids closed

}

// Psyche Interpolation Table
this._pit = [0.000,	0.000,	0.000,	0.000,	0.000,	0.000,	0.000,	0.000,	0.000,	0.000,	0.000,
				0.000,	1.000,	0.138,	0.075,	0.000,	0.675,	0.300,	0.056,	0.200,	0.216,	0.300,
				0.500,	0.866,	0.000,	0.700,	0.000,	0.000,	0.000,	0.530,	0.000,	0.763,	0.000,
				0.866,	0.500,	0.000,	1.000,	0.000,	0.000,	0.600,	0.346,	0.732,	0.779,	0.000,
				1.000,	0.000,	0.065,	0.000,	0.344,	0.344,	0.700,	0.000,	0.000,	1.000,	-0.300,
				0.866,	-0.500,	0.391,	0.570,	0.591,	0.462,	1.000,	0.000,	0.981,	0.077,	0.000,
				0.500,	-0.866,	0.920,	0.527,	0.000,	0.757,	0.250,	0.989,	0.000,	0.366,	-0.600,
				0.000,	-1.000,	0.527,	0.000,	0.441,	0.531,	0.000,	0.000,	1.000,	0.000,	0.600,
				-0.707,	-0.707,	1.000,	0.000,	0.000,	0.000,	0.500,	1.000,	0.000,	0.000,	0.600,
				-1.000,	0.000,	0.995,	0.000,	0.225,	0.000,	0.000,	0.996,	0.000,	0.996,	0.200,
				-0.707,	0.707,	0.138,	0.075,	0.000,	0.675,	0.300,	0.380,	0.050,	0.216,	0.300];

this._p = vec3.create();
this._pA = vec3.create();






// --------------------- LIPSYNC ---------------------


this.updateLipsync = function(){
  
  if (energy !== undefined){
    
    var value = 0;

    // Kiss blend shape
    // When there is energy in the 3 and 4 bin, blend shape is 0
    value = (0.5 - (energy[2]))*2;
    if (energy[1]<0.2)
      value = value*(energy[1]*5)
    value = Math.max(0, Math.min(value, 1)); // Clip
    this._lipsyncBSW[0] = value * this.kissFactor;

    // Jaw blend shape
    value = energy[1]*0.8 - energy[3]*0.8;
    value = Math.max(0, Math.min(value, 1)); // Clip
    this._lipsyncBSW[2] = value * this.jawFactor;


    // Lips closed blend shape
    value = energy[3]*3;
    value = Math.max(0, Math.min(value, 1)); // Clip
    this._lipsyncBSW[1] = value * this.lipsClosedFactor;
  }
}






// --------------------- GUI ---------------------

this.onRenderGUI = function(){
	
  width = gl.viewport_data[2];
  height = gl.viewport_data[3];
  
  gl.start2D();
  
  // Whissel Wheel
  // Mouse
  var dist = Math.sqrt((-gl.mouse.x + width - 130)*(-gl.mouse.x + width - 130) + (-gl.mouse.y + height - 130)*(-gl.mouse.y + height - 130));

  if (dist<100){
    gl.fillStyle = "rgba(255,0,0,0.8)";
    
    if (gl.mouse.dragging){
    	this.valence = (gl.mouse.x - width + 130)/100;
    	this.arousal = (gl.mouse.y - height + 130)/100;
      
      this.facialExpression({"face": [this.valence, this.arousal]});
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
  
  
  
  
  
  
  // Show text
  gl.font = "15px Arial";
  gl.fillStyle = "rgba(255,255,255,0.8)";
  gl.textAlign = "center";
  var FEText = "Arousal "+ this.arousal.toFixed(2) +"\nValence "+ this.valence.toFixed(2);
  gl.fillText(FEText, width-130, 145);
  
  gl.finish2D();
}
