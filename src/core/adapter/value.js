/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


_api.adapter.value = class ValueAdapter {
    init () {
    }
       
    shutdown () {
    }
    
    observe (element, path, callback) {
        element.on("input propertychange paste", callback)
    }
    
    unobserve () {
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
