/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


_api.adapter.attr = class AttrAdapter {
    init () {
    }
       
    shutdown () {
    }
    
    observe (/* cb */) {
    }
    
    unobserve (/* id */) {
    }
    
    getPaths (element, path) {
        // We could list all attributes, but that does not make sense
        return [path]
    }
    
    getValue (element, path) {
        if (path.length != 1) {
            throw _api.util.exception("attr needs a path of length 1")
        }
        return element.attr(path[0])
    }
    
    set (element, path, value) {
        if (path.length != 1) {
            throw _api.util.exception("attr needs a path of length 1")
        }
        element.attr(path[0], value)
    }
    
    type () {
        return "view"
    }
}

_api.repository.adapter.register("attr", new _api.adapter.attr())
