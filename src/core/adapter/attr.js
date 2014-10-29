/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.org>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


$api.plugin("attr", ($api, _api) => {
    return {   
        getPaths: (element, path) => {
            return [path]
        },
        
        getValue: (element, path) => {
            if (path.length !== 1) {
                throw _api.util.exception("attr requires a Qualifier")
            }
            
            let name = path[0]
            switch (name) {
                case "checked":
                    return element.prop("checked")
                default:
                    return element.attr(name)
            }
        },
        
        set: (element, path, value) => {
            if (path.length !== 1) {
                throw _api.util.exception("attr requires a Qualifier")
            }
            
            let name = path[0]
            switch (name) {
                case "checked":
                    element.prop("checked", value ? true : false)
                    break
                default:
                    element.attr(name, value)
                    break
            }
        },
        
        type: () => {
            return "view"
        }
    }
})
