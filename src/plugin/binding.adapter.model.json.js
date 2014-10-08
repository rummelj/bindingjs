/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* global JSON */
/* global setInterval */

BindingJS.plugin("$", ($api, _api) => {
    class JsonAdapter {
        
        constructor () {
            this.observer = new _api.util.Map()
            this.oldModels = new _api.util.Map()
            this.counter = new _api.util.Counter()
        }
        
        /* private */ compare (model, oldModel, pathSoFar) {
            let result = []
            if (model instanceof Array) {
                if (!(oldModel instanceof Array) || model.length !== oldModel.length) {
                    result.push(pathSoFar)
                } else {
                    _api.util.each(model, (item, index) => {
                        let newPath = _api.util.array.clone(pathSoFar)
                        newPath.push(index)
                        _api.util.array.addAll(result, this.compare(model[index], 
                                                                    oldModel[index],
                                                                    newPath))
                    })
                }
            } else if (typeof model === "object") {
                if (typeof oldModel !== "object" || 
                    !_api.util.object.equals(_api.util.object.getKeys(model), 
                                             _api.util.object.getKeys(oldModel))) {
                    result.push(pathSoFar)
                } else {
                    _api.util.each(model, (item, key) => {
                        let newPath = _api.util.array.clone(pathSoFar)
                        newPath.push(key)
                        _api.util.array.addAll(result, this.compare(model[key],
                                                                    oldModel[key],
                                                                    newPath))
                    })
                }
            } else {
                if (model !== oldModel) {
                    result.push(pathSoFar)
                }
            }
            return result
        }
        
        /* private */ notify (model) {
            let oldModel = this.oldModels.get(model)
            let pathsChanged = this.compare(model, oldModel, [])
            if (this.observer.hasKey(model)) {
                let modelObservers = this.observer.get(model)
                _api.util.each(pathsChanged, (pathChanged) => {
                    _api.util.each(modelObservers, (modelObserver) => {
                        if (_api.util.array.startsWith(pathChanged, modelObserver.path)) {
                            modelObserver.callback()
                        }
                    })
                })
            }
            this.oldModels.set(model, _api.util.object.clone(model))
        }
        
        observe (model, path, params, callback) {
            if (path.length === 0) {
                throw _api.util.exception("$ Adapter cannot be used without a Qualifier")
            }
            
            if (!this.observer.hasKey(model)) {
                this.observer.set(model, [])
                this.oldModels.set(model, _api.util.object.clone(model))
                let self = this
                setInterval(() => { self.notify(model) }, 50)
            }
            
            let id = this.counter.getNext()
            let newObserver = { id: id, path: path, callback: callback }
            this.observer.get(model).push(newObserver)

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
