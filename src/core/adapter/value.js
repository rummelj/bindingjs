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
        if (this.observedElements.indexOf(element) == -1) {
            return
        }
        
        let observer = this.observer[this.observedElements.indexOf(element)]
        for (var i = 0; i < observer.length; i++) {
            observer[i].callback()
        }
    }
    
    observe (element, path, callback) {
        if (path.length > 0) {
            throw _api.util.exception("value can not process paths")
        }
        
        if (this.observedElements.indexOf(element) == -1) {
            this.observedElements.push(element)
            this.observer.push([])
            let self = this
            element.on("change", function () { self.notify(element) })
        }
        
        let observerId = this.observerCounter.getNext()
        this.observer[this.observedElements.indexOf(element)].push({ observerId: observerId, callback: callback })
        return observerId
    }
    
    unobserve (observerId) {
        if (path.length > 0) {
            throw _api.util.exception("value can not process paths")
        }
        
        let elementIndex
        let observerIndex
        for (var i = 0; i < this.observer.length; i++) {
            let elementObserver = this.observer[i]
            for (var j = 0; j < elementObserver.length; j++) {
                if (elementObserver.observerId == observerId) {
                    elementIndex = i
                    observerIndex = j
                    break
                }
            }
            if (elementIndex) {
                break
            }
        }
        
        if (this.observer[observerIndex].length == 1) {
            this.observedElements[elementIndex].off("change")
            this.observedElements.splice(elementIndex, 1)
        }
        
        this.observer[observerIndex].splice(observerIndex, 1)
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
        element.val(value)
    }
    
    type () {
        return "view"
    }
}

_api.repository.adapter.register("value", new _api.adapter.value())
