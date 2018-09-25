Animator.prototype.addState = function ( layerID, o )
{
    var id = this.st_id++;

    if ( o.id )
        delete o.id;

    var state = {
        id: id,
        layer: layerID,
        name: "state" + id,
        motion: null, //[animationTake || animationTree]
        transitions: [],
      	callback: null,
      	exit_callback: null,
        _timestamp: null,
        _weight: 0
    }
    Object.assign( state, o );

    this.states[id] = state;

    return id;
}

Animator.prototype.getStateByID = function ( stateID )
{
    return this.states[stateID];
}

Animator.prototype.getStateByName = function ( stateName )
{
    return this.states.filter( function ( state )
    {
        return state.name == stateName;
    });
}

Animator.prototype.addMotionFromURL = function ( stateID, motionURL, take, mode, blendTime )
{
    var id = this.mt_id++;
    var state = this.states[stateID];

    state.motion = id;

    this.mt_url[id] = motionURL;
    this.mt_name[id] = "motion" + state.motion;
    this.mt_mode[id] = (mode || 2); //1:once, 2:loop
    this.mt_takeID[id] = ( take || "default" );
    this.mt_speed[id] = 1;
    this.mt_duration[id] = 1;
    this.mt_blendtime[id] = (blendTime || 0.5);
    this._mt_takes[id] = null;
    this._mt_start[id] = 0;
    this._mt_time[id] = 0;
    this._mt_lasttime[id] = 0;


    this.loadTake( state.motion );
}

Animator.prototype.playMotion = function ( motionID, weight, start, last)
{
    var take = this._mt_takes[motionID];
    this._mt_weight[motionID] = weight;

    switch ( this.mt_mode[motionID] )
    {
        case ( 1 )://Once
            if ( LS.GlobalScene.time - start - take.duration  >= 0 )
                break;
            take.applyTracks(
                ( LS.GlobalScene.time - start ),//current_time
                last,//last_time
                null,//ignore_interpolation
                null,//root_node
                null,//scene
                weight,//weight
                null,//on_pre_apply
                null//on_apply_sample
            );
            break;
        case ( 2 )://Loop
            take.applyTracks(
                ( LS.GlobalScene.time % take.duration ),//current_time
                last,//last_time
                null,//ignore_interpolation
                null,//root_node
                null,//scene
                weight,//weight
                null,//on_pre_apply
                null//on_apply_sample
            );
            break;
    }
}

Animator.prototype.playStateMotion = function ( stateID, dt )
{
    var state = this.getStateByID( stateID );
    var currentMotion = this._currentMotion[state.layer];

    if ( !currentMotion )
        this._currentMotion[state.layer] = state.motion;

    var weight = ( LS.GlobalScene.time - state._timestamp ) / this.mt_blendtime[state.motion];
    if ( currentMotion != state.motion && weight < 1)
    { 
        this.playMotion( currentMotion, 1.0 - weight, state._timestamp, state._lasttime );
        this.playMotion( state.motion, weight, state._timestamp, state._lasttime );
    }
    else
    {
        this._currentMotion[state.layer] = state.motion;
        this.playMotion( state.motion, 1, state._timestamp, state._lasttime );
    }
    state._lasttime = LS.GlobalScene.time;

    //this._mt_time[id] = 0;
    //this._mt_lasttime[id] = 0;

    if ( state.transitions.localtime )
        this.checkTransitions( state.transitions.localtime, (LS.GlobalScene.time - state._timestamp) / this._mt_takes[state.motion].duration );
}