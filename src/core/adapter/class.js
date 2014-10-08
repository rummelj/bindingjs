/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

$api.plugin("class", () => {
    return {     
        getPaths: (element, path) => {
            return [path]
        },
        
        getValue: (element, path) => {
            return element.hasClass(path[0])
        },
        
        set: (element, path, value) => {
            if (value) {
                element.addClass(path[0])
            } else {
                element.removeClass(path[0])
            }
        },
        
        type: () => {
            return "view"
        }
    }
})
