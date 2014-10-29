/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.org>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


$api.plugin("count", ($api, _api) => {
    return {   
        process: (input, params) => {
            if (params.length !== 1 || typeof params[0] !== "function") {
                throw _api.util.exception("The count Connector expects exactly " +
                    "one parameter, which is a lambda expression. Example: " +
                    "@noCompleted <- count(todo => todo.completed) <- $todos")
            }
            
            let countFn = params[0]
            let result = 0
            _api.util.each(input, (element, index) => {
                result += countFn(_api.util.convertIfReference(element), index) ? 1 : 0
            })
            return result
        }
    }
})
