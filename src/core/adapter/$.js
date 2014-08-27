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
    
    observe (path, callback) {
        if (path.length == 0) {
            throw _api.util.exception("$ Adapter cannot be used without path")
        }
        let elem = this.model
        for (var i = 0; i < path.length - 1; i++) {
            elem = elem[path[i]]
        }
        _api.util.WatchJS.watch(elem, path[path.length - 1], callback)
    }
    
    unobserve (/* id */) {
    }
    
    get (path) {
        let elem = this.model
        for (var i = 0; i < path.length; i++) {
            elem = elem[path[i]]
        }
        return elem
    }
    
    set (path, value) {
        if (path.length == 0) {
            throw _api.util.exception("$ Adapter cannot be used without path")
        }
        let elem = this.model
        for (var i = 0; i < path.length - 1; i++) {
            elem = elem[path[i]]
        }
        elem[path[path.length - 1]] = value
    }
    
    setModel(model) {
        $api.debug(5, "Model set: " + model)
        this.model = model
    }
    
    type () {
        return "model"
    }
}

_api.repository.adapter.register("$", new _api.adapter.$())
