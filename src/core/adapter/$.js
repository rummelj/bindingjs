/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


_api.adapter.$ = class $Adapter {
    
    constructor () {
        // Keys for this.observer
        this.observedModels = []
        // Values for this.observedModels
        // Each entry is a list of {observerId: Number, path: String[], callback: function()}
        this.observer = []
        // Used to generate new observerIds
        this.observerCounter = new _api.util.Counter()
    }
    
    notify (model, path) {
        if (this.observedModels.indexOf(model) == -1) {
            return
        }
        
        let observer = this.observer[this.observedModels.indexOf(model)]
        for (var i = 0; i < observer.length; i++) {
            if (_api.util.objectEquals(path, observer[i].path)) {
                observer[i].callback()
            }
        }
    }
    
    observe (model, path, callback) {
        $api.debug(7, "Observing model at " + JSON.stringify(path))
        if (path.length == 0) {
            throw _api.util.exception("$ Adapter cannot be used without path")
        }
        let elem = model
        for (var i = 0; i < path.length - 1; i++) {
            elem = elem[path[i]]
        }

        if (this.observedModels.indexOf(model) == -1) {
            this.observedModels.push(model)
            this.observer.push([])
        }
        // Check if path was observed before
        let modelObserver = this.observer[this.observedModels.indexOf(model)]
        let pathObserved = false
        for (var i = 0; i < modelObserver.length; i++) {
            if (_api.util.objectEquals(modelObserver[i].path, path)) {
                pathObserved = true
                break
            }
        }
        
        let observerId = this.observerCounter.getNext()
        let self = this
        let watchJsCallback = function() { self.notify(model, path) }
        modelObserver.push({ observerId: observerId, path: path, callback: callback, watchJsCallback: watchJsCallback })
        
        if (!pathObserved) {
            $api.debug(9, "Watching " + JSON.stringify(path))
            _api.util.WatchJS.watch(elem,
                                    path[path.length - 1] + "" /* WatchJS has trouble if the attribute name is not a string */,
                                    watchJsCallback)
        }

        return observerId
    }
    
    unobserve (observerId) {
        let modelIndex
        let observerIndex
        let found = false
        for (var i = 0; i < this.observer.length; i++) {
            let modelObserver = this.observer[i]
            for (var j = 0; j < modelObserver.length; j++) {
                if (modelObserver[j].observerId == observerId) {
                    modelIndex = i
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
        
        // Check if it is the only observer observing this path
        let otherPresent = false
        let modelObserver = this.observer[modelIndex]
        for (var i = 0; i < modelObserver.length; i++) {
            if (i == observerIndex) {
                continue
            }
            if (_api.util.objectEquals(modelObserver[i].path, modelObserver[observerIndex].path)) {
                otherPresent = true
                break
            }
        }
        
        // TODO: This is probably buggy
        // 1. Check if unwatch works as expected
        if (!otherPresent) {
            let elem = this.observedModels[modelIndex]
            let path = this.observer[modelIndex][observerIndex].path
            let watchJsObserver = this.observer[modelIndex][observerIndex].watchJsCallback
            for (var i = 0; i < path.length - 1; i++) {
                elem = elem[path[i]]
            }
            $api.debug(9, "Unwatching " + JSON.stringify(path))
            _api.util.WatchJS.unwatch(elem,
                                      path[path.length - 1] + "" /* WatchJS has trouble if the attribute name is not a string */,
                                      watchJsObserver)
            // Workaround for WatchJS which pushes the watcher to all descendants, manually remove these watchers
            // delete elem.watchers[path[path.length - 1]]
        }
        
        this.observer[modelIndex].splice(observerIndex, 1)
    }
    
    getValue (model, path) {
        let elem = model
        for (var i = 0; i < path.length; i++) {
            elem = elem[path[i]]
        }
        if (elem instanceof Function) {
            return elem()
        } else if (elem instanceof Array) {
            return elem.slice(0)
        } else if (typeof elem == "object") {
            return $api.$().extend(true, {}, elem)
        } else {
            return elem
        }
    }
    
    getPaths (model, path) {
        let result = [path]
        let value = this.getValue(model, path)
        if (typeof value == "object") {
            for (var key in value) {
                let newPath = path.slice()
                newPath.push(key)
                let subPaths = this.getPaths(model, newPath)
                for (var i = 0; i < subPaths.length; i++) {
                    result.push(subPaths[i])
                }
            }
        }
        return result
    }
    
    set (model, path, value) {
        if (path.length == 0) {
            throw _api.util.exception("$ Adapter cannot be used without path")
        }
        let elem = model
        for (var i = 0; i < path.length - 1; i++) {
            elem = elem[path[i]]
        }
        let target = elem[path[path.length - 1]]
        if (target instanceof Function) {
            target(value)
        } else {
            elem[path[path.length - 1]] = value
        }
    }
    
    type () {
        return "model"
    }
}

_api.repository.adapter.register("$", new _api.adapter.$())
