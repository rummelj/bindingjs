/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.org>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


$api.plugin("join", ($api, _api) => {
    return {   
        process: (input, params) => {
            if (params.length !== 1) {
                throw _api.util.exception("The join Connector expects exactly " +
                    "one parameter, which has to be a string. Example: " +
                    "@fullName <- join(\" \") <- $firstName, $lastName")
            }
            
            input = input instanceof Array ? input : [input]
            let result = ""
            let separator = _api.util.convertIfReference(params[0])
            _api.util.each(input, (element, index) => {
                result += _api.util.convertIfReference(element)
                if (index < input.length - 1) {
                    result += separator
                }
            })
            return result
        }
    }
})
