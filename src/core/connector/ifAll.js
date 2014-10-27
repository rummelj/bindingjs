/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


$api.plugin("ifAll", ($api, _api) => {
    return {   
        process: (input, params) => {
            if (params.length !== 1 || typeof params[0] !== "function") {
                throw _api.util.exception("The ifAll Connector expects exactly " +
                    "one parameter, which is a lambda expression. Example: " +
                    "@result <- ifAll(elem => elem > 3) <- $numbers")
            }
            
            let ifFn = params[0]
            let result = true
            _api.util.each(input, (element, index, _, breaK) => {
                if (!ifFn(_api.util.convertIfReference(element), index)) {
                    result = false
                    return breaK
                }
            })
            return result
        }
    }
})
