/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

$api.plugin("on", ($api, _api) => {
    class OnAdapter {
    
        constructor () {
            this.observer = new _api.util.Map()
            this.lastEvents = new _api.util.Map()
            this.observerCounter = new _api.util.Counter()
        }
        
        observe (element, path, params, callback) {
            if (path.length === 0) {
                throw _api.util.exception("The on adapter expects a qualifier")
            }
            let qualifier = path[0]
            let observerId = this.observerCounter.getNext()
            let keys = []
            _api.util.each(params, (param) => {
                _api.util.array.addAll(keys, param.split(" "))
            })
            let keyCodes = []
            _api.util.each(keys, (key) => {
                keyCodes.push(this.getKeyCode(key))
            })
            let handler = (event) => {
                if (keyCodes.length === 0 || _api.util.array.contains(keyCodes, event.keyCode)) {
                    this.setLastEvent(element, qualifier, event)
                    callback()
                }
            }
            element.on(qualifier, handler)
            this.observer.set(observerId, { handler: handler, element: element, qualifier: qualifier } )
            return observerId
        }
        
        unobserve (observerId) {
            let observer = this.observer.get(observerId)
            if (observer) {
                observer.element.off(observer.qualifier, observer.handler)
            }
        }

        // Fires events if value is true
        set (element, path, value) {
            if (path.length === 0) {
                throw _api.util.exception("The on adapter expects a qualifier")
            }
            if (value) {
                switch (path[0]) {
                    case "focus": element.focus(); break
                    case "show": element.show(); break
                    case "hide": element.hide(); break
                    default: throw _api.util.exception("Could not interpret qualifier " +
                        path[0] + " when setting on adapter")
                }
            }
        }
        
        getPaths (element, path) {
            return [path]
        }
        
        getValue (element, path) {
            if (path.length === 0) {
                throw _api.util.exception("The on adapter expects a qualifier")
            }
            return this.lastEvents.get(element).get(path[0])
        }
        
        type () {
            return "view"
        }
        
        setLastEvent (element, qualifier, event) {
            if (!this.lastEvents.hasKey(element)) {
                this.lastEvents.set(element, new _api.util.Map())
            }
            this.lastEvents.get(element).set(qualifier, event)
        }
        
        getKeyCode (key) {
            switch (key) {
                case "backspace": return 8
                case "tab": return 9
                case "enter": return 13
                case "return": return 13
                case "shift": return 16
                case "ctrl": return 17
                case "alt": return 18
                case "pause": return 19
                case "capslock": return 20
                case "escape": return 27
                case "esc": return 27
                case "pageup": return 33
                case "pagedown": return 34
                case "end": return 35
                case "home": return 36
                case "leftarrow": return 37
                case "uparrow": return 38
                case "rightarrow": return 39
                case "downarrow": return 40
                case "insert": return 45
                case "delete": return 46
                case "f1": return 112
                case "f2": return 113
                case "f3": return 114
                case "f4": return 115
                case "f5": return 116
                case "f6": return 117
                case "f7": return 118
                case "f8": return 119
                case "f9": return 120
                case "f10": return 121
                case "f11": return 122
                case "f12": return 123
                default: 
                    if (key.length === 1) {
                        return key.charCodeAt(0)
                    } else {
                        throw _api.util.exception("Could not interpret key " + key)
                    }
            }
        }
    }
    
    return new OnAdapter()    
})
