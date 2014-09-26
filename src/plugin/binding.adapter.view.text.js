/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

let factory = ($api, _api) => {
    return {     
        getPaths: function(element, path) {
            return [path]
        },
        
        getValue: function(element, path) {
            if (path.length > 0) {
                throw _api.util.exception("text can not process paths")
            }
            return element.text()
        },
        
        set: function(element, path, value) {
            if (path.length > 0) {
                throw _api.util.exception("value can not process paths")
            }
            if (typeof value === "object") {
                try {
                    value = JSON.stringify(value)
                } catch (e) {
                    value = "{circular object}"
                }
            }
            element.text(value)
        },
        
        type: function() { return "view" }
    }
}

BindingJS.plugin("text", factory)
