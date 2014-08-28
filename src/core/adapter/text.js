/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


_api.adapter.text = class TextAdapter {
    init () {
    }
       
    shutdown () {
    }
    
    observe (/* cb */) {
    }
    
    unobserve (/* id */) {
    }
    
    getPaths (element, path) {
        return [path]
    }
    
    getValue (element, path) {
        if (path.length > 0) {
            throw _api.util.exception("text can not process paths")
        }
        return element.text()
    }
    
    set (element, path, value) {
        if (path.length > 0) {
            throw _api.util.exception("value can not process paths")
        }
        element.text(value)
    }
    
    type () {
        return "view"
    }
}

_api.repository.adapter.register("text", new _api.adapter.text())
