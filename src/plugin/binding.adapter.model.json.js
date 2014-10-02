/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* global WatchJS */
/* global JSON */

BindingJS.plugin("$", ($api, _api) => {
    class JsonAdapter {
        
        constructor () {
            this.observer = new _api.util.Map()
            this.counter = new _api.util.Counter()
        }
        
        /* private */ notify (model, path) {
            if (this.observer.hasKey(model)) {
                _api.util.each(this.observer.get(model), (observer) => {
                    if (_api.util.object.equals(path, observer.path)) {
                        observer.callback()
                    }
                })
            }
        }
        
        observe (model, path, callback) {
            if (path.length === 0) {
                throw _api.util.exception("$ Adapter cannot be used without a Qualifier")
            }
            
            if (!this.observer.hasKey(model)) {
                this.observer.set(model, [])
            }
            
            let id = this.counter.getNext()
            let newObserver = { id: id, path: path, callback: callback }
            this.observer.get(model).push(newObserver)
            
            let observerWithSamePath = _api.util.array.findFirst(this.observer.get(model), (observer) => {
                return observer !== newObserver && _api.util.object.equals(path, observer.path)
            })
            if (!_api.util.object.isDefined(observerWithSamePath)) {
                // Navigate to parent of element, that should be observed
                let elem = model
                for (let i = 0; i < path.length - 1; i++) {
                    elem = elem[path[i]]
                }
                let self = this
                WatchJS.watch(elem,
                              path[path.length - 1] + "" /* WatchJS has trouble if the attribute name is not a string */,
                              () => { self.notify(model, path) })
            }

            return id
        }
        
        unobserve (id) {
            _api.util.each(this.observer.getKeys(), (model, _, __, breakOuter) => {
                let found = false
                _api.util.each(this.observer.get(model), (observer, ___, ____, breaK) => {
                    if (observer.id === id) {
                        _api.util.array.remove(this.observer.get(model), observer)
                        if (this.observer.get(model).length === 0) {
                            this.observer.remove(model)
                        }
                        found = true
                        return breaK
                    }
                })
                if (found) {
                    return breakOuter
                }
            })
        }
        
        getValue (model, path, params) {
            let ref = model
            _api.util.each(path, (id) => {
                if (!ref.hasOwnProperty(id)) {
                    throw _api.util.exception("Could not find path " +
                        JSON.stringify(path) + " in Presentation Model")
                }
                ref = ref[id]
            })
            
            if (ref instanceof Function) {
                return ref(params)
            } else if (ref instanceof Array) {
                return _api.util.array.clone(ref)
            } else if (typeof ref === "object") {
                return _api.util.object.clone(ref)
            } else {
                return ref
            }
        }
        
        getPaths (model, path) {
            let paths = [path]
            let value = this.getValue(model, path)
            if (value instanceof Array || typeof value === "object") {
                _api.util.each(value, (_, indexOrKey) => {
                    let newPath = _api.util.array.clone(path)
                    newPath.push(indexOrKey)
                    // Recursion
                    _api.util.array.addAll(paths, this.getPaths(model, newPath))
                })
            }
            return paths
        }
        
        set (model, path, value, params) {
            if (path.length === 0) {
                throw _api.util.exception("$ Adapter cannot be used without a Qualifier")
            }
            
            let ref = model
            _api.util.each(path, (id, index) => {
                if (index < path.length - 1) {
                    if (!ref.hasOwnProperty(id)) {
                        throw _api.util.exception("Could not find path " +
                            JSON.stringify(path) + " in Presentation Model")
                    }
                    ref = ref[id]
                }
            })
            
            let target = ref[path[path.length - 1]]
            if (target instanceof Function) {
                target(value, params)
            } else {
                ref[path[path.length - 1]] = value
            }
        }
        
        type () {
            return "model"
        }
    }
    
    return new JsonAdapter()   
})
