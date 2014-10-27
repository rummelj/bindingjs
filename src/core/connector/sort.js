/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

// Usage 1: sort("firstname", "-age")
// Usage 2: sort(a, b => a.age > b.age)
$api.plugin("sort", ($api, _api) => {
    return {   
        process: (input, params) => {
            input = input instanceof Array ? input : [input]
            if (params.length === 1 && typeof params[0] === "function") {
                // Usage 2
                let sortFn = params[0]
                input.sort((a, b) => {
                    let aVal = _api.util.convertToValues(a)
                    let bVal = _api.util.convertToValues(b)
                    return sortFn(aVal, bVal)
                })
            } else if (params.length > 0) {
                // Usage 1
                for (var i = params.length - 1; i >= 0; i--) {
                    let attribute = _api.util.convertIfReference(params[i])
                    if (typeof attribute !== "string" || params[i] === "") {
                        throw _api.util.exception("Cannot sort by " + attribute)
                    }
                    let descending = params[i].charAt(0) === "-"
                    attribute = descending ? attribute.substr(1) : attribute
                    input.sort((a, b) => {
                        let aVal = _api.util.convertToValues(a)
                        let bVal = _api.util.convertToValues(b)
                        let greater = descending ? aVal[attribute] < bVal[attribute] : aVal[attribute] > bVal[attribute]
                        let equal = aVal[attribute] === bVal[attribute]
                        return equal ? 0 : (greater ? 1 : -1)
                    })
                }
            } else {
                // Without parameter
                input.sort()
            }
            return input
        }
    }
})
