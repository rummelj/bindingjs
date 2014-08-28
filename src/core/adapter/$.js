/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


_api.adapter.$ = class $Adapter {
    init () {
    }
       
    shutdown () {
    }
    
    observe (model, path, callback) {
        if (path.length == 0) {
            throw _api.util.exception("$ Adapter cannot be used without path")
        }
        let elem = model
        for (var i = 0; i < path.length - 1; i++) {
            elem = elem[path[i]]
        }
        _api.util.WatchJS.watch(elem, path[path.length - 1], callback)
    }
    
    unobserve (/* id */) {
    }
    
    getValue (model, path) {
        let elem = model
        for (var i = 0; i < path.length; i++) {
            elem = elem[path[i]]
        }
        return elem
    }
    
    getPaths (model, path) {
        let result = [path]
        let value = this.getValue(model, path)
        if (typeof value == "object") {
            for (key in value) {
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
        elem[path[path.length - 1]] = value
    }
    
    type () {
        return "model"
    }
}

_api.repository.adapter.register("$", new _api.adapter.$())
