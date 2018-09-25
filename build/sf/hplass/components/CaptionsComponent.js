//https://github.com/jagenjo/litescene.js/blob/master/guides/creating_new_components.md
//This is an example of a component code
function Sentence(o) {
    o = o || {};
    this.start = o.start || 0;
    this.end = o.end || 0;
    this.text = o.text || '';
}

function CaptionsComponent(o) {
		
    this._sentences = [];
    this._time;
    this._container;
    this._copy;
    this.file = '';
  	
    this.watch('file', function(i, o, v) {
        this.loadFromSRT(v);
        return v;
    });

    var sheet = (function() {
        var style = document.head.querySelector('#captions') || document.createElement("style");
        style.id = "captions";
        style.appendChild(document.createTextNode(""));
        document.head.appendChild(style);
        return style.sheet;
    })()
    sheet.insertRule("#captions-container{color:white;position:absolute;bottom:0;background-color:rgba(100,100,100,.50);margin:25px 30% 20px;width:40%;box-shadow:0 0 1em rgba(150,150,150,.125);border-radius:7px/5em;padding:.5em 0;opacity:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-style:normal;font-variant:normal;font-weight:300;line-height:20px;font-size:21px;text-align:center;-webkit-transition:opacity .25s ease;-moz-transition:opacity .25s ease;-o-transition:opacity .25s ease;-ms-transition:opacity .25s ease;transition:opacity .25s ease}", 0);

    //this will allow to load SRTs as text objects instead of binary objects
    LS.Formats.addSupportedFormat("srt", {
        extension: "srt",
        dataType: "text"
    });

    if (o)
        this.configure(o);
}

CaptionsComponent.prototype.onAddedToScene = function(scene) {
    LEvent.bind(scene, "start", this.onStart, this);
    LEvent.bind(scene, "update", this.onUpdate, this);
}

CaptionsComponent.prototype.onRemovedFromScene = function(scene) {
    LEvent.unbindAll(scene, this);
}

CaptionsComponent.prototype.onStart = function(scene) {
    this._time = 0;
    this._container = document.createElement('div');
    this._container.id = "captions-container";

    LS.GUI.getRoot().appendChild(this._container);
}

CaptionsComponent.prototype.onUpdate = function(e, dt) {
    var that = this;
    this._copy = this._sentences.slice();
    this._sentences.some(function(sentence, index, array) {
        if (sentence.end < that._time) {
            that._copy.shift();
            return false;
        }

        if (sentence.start <= that._time && sentence.end >= that._time) {
            that.displaySentence(sentence);
            that._copy.shift();
            return false;
        }

        if (sentence.start > that._time)
            return true;

    });
    this._sentences = this._copy.slice();
    this._time += dt;
}

CaptionsComponent.prototype.displaySentence = function(sentence) {

    var el = document.createElement('div');
    el.style.opacity = 0;
    el.style.display = "block";

    var that = this;
    setTimeout(function(component, text, div) {
        component._container.appendChild(div);
        component._checkVisibility();
        div.style.opacity = 1;
        div.innerHTML = text + ' ';
    }, Math.max(0, sentence.start - this._time) * 1000, this, sentence.text, el);

    setTimeout(function(component, div) {
        component._container.style.opacity = 0;
        setTimeout(function(component, div) {
            div.parentNode.removeChild(div);
            component._checkVisibility();
        }, 250, component, div);
    }, (Math.max(0, (sentence.end - this._time)*1000-266)), this, el);
}

CaptionsComponent.prototype._checkVisibility = function() {
    if (this._container.firstChild)
        this._container.style.opacity = 1;
    else
        this._container.style.opacity = 0;
}

CaptionsComponent.prototype.getTime = function() {
    return this._time;
}

CaptionsComponent.prototype.addSentence = function(text, start, end) {
    this._sentences.push(new Sentence({
        text: text,
        start: start,
        end: end
    }));
}

CaptionsComponent.prototype.loadFromSRT = function(url) {
    if (!url)
        return;

    LS.ResourcesManager.load(url, {}, (function(srt) {

        srt = srt.getData();

        if (!(typeof (srt) === 'string'))
            return;
        var cr = srt.includes('\r')
          , sentences = (cr) ? srt.split('\r\n\r\n') : srt.split('\n\n')
          , sentences_length = sentences.length;

        var sentence, lines, lines_length, time, start, end;

        try {
            for (var i = 0; i < sentences_length; ++i) {
                sentence = sentences[i];
                if (sentence.length == 0)
                    continue;

                lines = (cr) ? sentence.split('\r\n') : sentence.split('\n');
                lines_length = lines.length;

                time = lines[1].split('-->');
                start = parseTime(time[0]);
                end = parseTime(time[1]);

                for (var j = 2; j < lines_length; ++j) {
                    this._sentences.push(new Sentence({
                        start: start,
                        end: end,
                        text: lines[j]
                    }));
                }
            }
        } catch (e) {
            console.error("Error while parsing SRT file. Bad format.");
        }
    }
    ).bind(this))

}
CaptionsComponent["@file"] = {
    type: "resource"
};
CaptionsComponent.icon = "mini-icon-text.png";
LS.registerComponent(CaptionsComponent);

//

function parseTime(text) {
    if (!text)
        return;

    var h, m, s;
    text = text.replace(/[ \t]+/g, " ").replace(/\s\s*$/, "");
    text = text.split(':');
    h = text[0];
    m = text[1];
    s = parseFloat(text[2].replace(',', '.'));

    return ( (h * 3600) + (m * 60) + s) ;
    //in miliseconds

}

//watch / unwatch polyfill
(function() {
    if (!Object.prototype.watch) {
        Object.defineProperty(Object.prototype, "watch", {
            enumerable: false,
            configurable: true,
            writable: false,
            value: function(prop, handler) {
                var oldval = this[prop]
                  , newval = oldval
                  , getter = function() {
                    return newval;
                }
                  , setter = function(val) {
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
            value: function(prop) {
                var val = this[prop];
                delete this[prop];
                // remove accessors
                this[prop] = val;
            }
        });
    }
})();