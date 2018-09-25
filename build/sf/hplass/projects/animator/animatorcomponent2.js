"use strict";

function Animator(o)
{
    this._currentMotion = [];
    this._currentStates = [];
    this._currentTransitions = [];
    this.parameters = {};

    //layers
    this.ly_id = 1;
    this.ly_name = [];
    this.ly_weight = [];
    this.ly_default = [];

    //States
    this.st_id = 1;
    this.states = [];

    //motions
    this.mt_id = 1;
    this.mt_url = [];
    this.mt_name = [];
    this.mt_mode = []; //once, loop
    this.mt_takes = [];
    this.mt_speed = [];
    this.mt_duration = [];
    this.mt_blendtime = [];
    this._mt_takes = [];
    this._mt_time = [];
    this._mt_lasttime = [];
    this._mt_weight = [];
}


LS.registerComponent(Animator);

Animator.LESS = 0;
Animator.EQUALS = 1;
Animator.GREATER = 2;
Animator.ISNOT = 3;
Animator.ONCE = 1;
Animator.LOOP = 2;
Animator._check = [
    function ( param, val ) { return param < val; },
    function ( param, val ) { return param == val; },
    function ( param, val ) { return param > val; },
  	function ( param, val ) { return param != val; }
];

Animator.prototype.onAddedToScene = function ( scene )
{
    //LEvent.bind( scene, "start", this.onStart, this );
    LEvent.bind( scene, "update", this.onUpdate, this );
}

Animator.prototype.onRemovedFromScene = function ( scene )
{
    LEvent.unbindAll( scene, this );
}

Animator.prototype.onStart = function ()
{
    this._time = performance.now();
    var that = this;
    this.mt_url.forEach( function ( v, k, a )
    {
        if ( !that._mt_takes[k] )
            that.loadTake( k );
    } );

    this._currentStates = optimizeArray( [].concat( this.ly_default ) );

    for ( var s in this._currentStates )
        this.states[s]._timestamp = LS.GlobalScene.time;

    this.updateTransitions();
}

Animator.prototype.onUpdate = function ( evt, dt )
{
    this.time += dt;

    for ( var s in this._currentStates )
    {
        this.playStateMotion( this._currentStates[s] );
    }
}

Animator.prototype.cleanUp = function ()
{
    this._currentStates = [];
    this._currentTransitions = [];
    this.parameters = {};

    //layers
    this.ly_id = 1;
    this.ly_name = [];
    this.ly_weight = [];
    this.ly_default = [];

    //States
    this.st_id = 1;
    this.states = [];

    //motions
    this.mt_id = 1;
    this.mt_url = [];
    this.mt_name = []; //once, loop
    this.mt_mode = []; //once, loop
    this.mt_takeID = [];
    this.mt_speed = [];
    this.mt_duration = [];
    this.mt_blendtime = [];
    this._mt_takes = [];
    this._mt_start = [];
    this._mt_time = [];
    this._mt_lasttime = [];
    this._mt_weight = [];
}

Animator.prototype.loadTake = function (motionID)
{
    var motionURL = this.mt_url[motionID]
    var animation = LS.ResourcesManager.getResource(motionURL);

    if (!animation)
        return console.error ("Animation resource not found " + motionURL);
    var takeID = this.mt_takeID[motionID];
 		
  	this.mt_duration[motionID] = animation.takes[takeID].duration;
    this._mt_takes[motionID] = animation.takes[takeID];     
}

Animator.prototype.addParameter = function (context, param, defaultValue, callback)
{
    if (defaultValue !== undefined && defaultValue !== null)
        context[param] = defaultValue;
    
    this.parameters[param] = context[param]
    this.updateTransitions();

    var that = this;
    function bla(i, o, v) {
        if (o != v) {
            that.parameters[param] = v;
            that.checkTransition(param, v);
          	if(callback)
              callback(v);
            return v;
        }
        return o;
    }
    context.watch(param, bla);
}

Animator.prototype.getResources = function (res)
{
    if ( this.mt_url )
    {
        for ( var i in this.mt_url )
        {
            res[this.mt_url[i]] = LS.Animation; 
        }
    }

    return res;
}

//-----------------------------------------------------------------------

LS.Components.Animator["@inspector"] = function (animator, inspector)
{
    /*if (!animator)
        return;

    var node = animator._root;

    inspector.addTitle("Properties");

    var group = inspector.beginGroup("Propertiess", { collapsed: true });

    inspector.endGroup();
    inspector.addSeparator();

    inspector.addButton(null, "Edit Animator logic", {
        callback: function () {
            console.log("Animator Editor");
        }
    });*/

    //EditorModule.refreshAttributes();
}

/**()
 * This function deletes undefined and null values to improve performance
 */
function optimizeArray( array ) 
{
    array.forEach(function(v, k){
        if (v === null || v === undefined)
            delete array[k];
    });
    return array;
}

function arrayfindAndRemove( array, value ) 
{
    array.some(function(v, k, a){
        if (v == value) {
            delete a[k];
            return true;
        }
    });
    array = array.filter( function ( e ) { return String( e ).trim() });
    return array;
}
//watch / unwatch polyfill
/* usage
    this.watch('file', function(i, o, v) {
        this.loadFromSRT(v);
        return v;
    });
*/
(function () {
    if (!Object.prototype.watch) {
        Object.defineProperty(Object.prototype, "watch", {
            enumerable: false,
            configurable: true,
            writable: false,
            value: function (prop, handler) {
                var oldval = this[prop]
                    , newval = oldval
                    , getter = function () {
                        return newval;
                    }
                    , setter = function (val) {
                        oldval = newval;
                        return newval = handler.call(this, prop, oldval, val);
                    };

                if (delete this[prop]) {
                    // can't watch constants
                    Object.defineProperty(this, prop, {
                        get: getter,
                        set: setter,
                        enumerable: true,
                        configurable: true
                    });
                }
            }
        });
    }

    // object.unwatch
    if (!Object.prototype.unwatch) {
        Object.defineProperty(Object.prototype, "unwatch", {
            enumerable: false,
            configurable: true,
            writable: false,
            value: function (prop) {
                var val = this[prop];
                delete this[prop];
                // remove accessors
                this[prop] = val;
            }
        });
    }
})();