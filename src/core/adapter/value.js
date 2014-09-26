/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


_api.adapter.value = class ValueAdapter {

    constructor () {
        // Keys for this.observer
        this.observedElements = []
        // Values for this.observedElements
        // Each entry is a list of {observerId: Number, callback: function()}
        this.observer = []
        // Used to generate new observerIds
        this.observerCounter = new _api.util.Counter()
    }
    
    notify (element) {
        if (this.observedElements.indexOf(element) === -1) {
            return
        }
        
        let observer = this.observer[this.observedElements.indexOf(element)]
        for (let i = 0; i < observer.length; i++) {
            observer[i].callback()
        }
    }
    
    observe (element, path, callback) {
        if (path.length > 0) {
            throw _api.util.exception("value can not process paths")
        }
        
        if (this.observedElements.indexOf(element) === -1) {
            this.observedElements.push(element)
            this.observer.push([])
            let self = this
            element.on("change input propertychange paste", function () { self.notify(element) })
        }
        
        let observerId = this.observerCounter.getNext()
        this.observer[this.observedElements.indexOf(element)].push({ observerId: observerId, callback: callback })
        return observerId
    }
    
    unobserve (observerId) {
        let elementIndex
        let observerIndex
        let found = false
        for (let i = 0; i < this.observer.length; i++) {
            let elementObserver = this.observer[i]
            for (let j = 0; j < elementObserver.length; j++) {
                if (elementObserver[j].observerId === observerId) {
                    elementIndex = i
                    observerIndex = j
                    found = true
                    break
                }
            }
            if (found) {
                break
            }
        }
        
        if (!found) {
            $api.debug(1, "Internal WARN: Tried to unobserve, but no such observer!")
            return
        }
        
        if (this.observer[observerIndex].length === 1) {
            this.observedElements[elementIndex].off("change input propertychange paste")
            this.observedElements.splice(elementIndex, 1)
            this.observer.splice(elementIndex, 1)
        } else {
            this.observer[observerIndex].splice(observerIndex, 1)
        }
    }
    
    getPaths (element, path) {
        return [path]
    }
    
    getValue (element, path) {
        if (path.length > 0) {
            throw _api.util.exception("value can not process paths")
        }
        return element.val()
    }
    
    set (element, path, value) {
        if (path.length > 0) {
            throw _api.util.exception("value can not process paths")
        }
        let oldValue = element.val()
        element.val(value)
        if (value !== oldValue) {
            element.trigger("change")
        }
    }
    
    type () {
        return "view"
    }
}

_api.repository.adapter.register("value", new _api.adapter.value())
