Animator.prototype.addTransition = function ( fromStateID, toStateID, param, condition, value, o )
{
    var transitions = this.getStateByID( fromStateID ).transitions;

    if ( !transitions[param] )
        transitions[param] = [];

    transitions[param].push( [fromStateID, toStateID, param, condition, JSON.parse( JSON.stringify( value ) ), o] );

    this.updateTransitions();
}

Animator.prototype.checkTransition = function ( param, value )
{

  if( param == "localtime" )
    return;
  
  if ( !this._currentTransitions[param] )
    	throw ( "param not defined" + param + "  " + this._currentTransitions )
    
  var that = this;
  optimizeArray( this._currentTransitions[param] )
  this.checkTransitions( this._currentTransitions[param], value);
  
    //[1, 2, "speed", 2, 0, undefined]

    
}

Animator.prototype.checkTransitions = function ( transitions, value )
{
    for ( var t in transitions )
    {
        var v = transitions[t];
        if ( Animator._check[v[3]/*< = >*/]( value, v[4] ) )
        {
            this._currentStates = arrayfindAndRemove( this._currentStates, v[0] ); //we are not now in the old state v[0]
            this._currentStates.push( v[1] );                //now we are in the new state v[1]  
            this.states[v[1]]._timestamp = LS.GlobalScene.time;
            this.states[v[1]]._lasttime = LS.GlobalScene.time;
            this.updateTransitions();
          		
          	if(this.states[v[0]].exit_callback)
              this.states[v[0]].exit_callback(this.states[v[0]]);
          
          	if(this.states[v[1]].callback)
              this.states[v[1]].callback(this.states[v[1]]);
          
          	for( var param in this.states[v[1]].transitions )
            {
            	this.checkTransition(param, this.parameters[param]);
            }
          
            return;
        }
    }
}

Animator.prototype.updateTransitions = function ()
{
    this._currentTransitions = [];
    for ( var p in this.parameters )
    {
        this._currentTransitions[p] = [];

        for ( var s in this._currentStates )
        {
            var state = this.getStateByID( this._currentStates[s] );
            if ( !state.transitions[p] )
                continue;

            this._currentTransitions[p] = this._currentTransitions[p].concat( state.transitions[p] );
        }
    }
}