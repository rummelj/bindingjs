/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


$api.plugin("split", ($api, _api) => {
    return {   
        process: (input, params) => {
            if (params.length !== 1) {
                throw _api.util.exception("The split Connector expects exactly " +
                    "one parameter, which has to be a string. Example: " +
                    "@firstName, @lastName <- split(\" \") <- $fullName")
            }
            
            let separator = _api.util.convertIfReference(params[0])
            input = input instanceof Array ? input[0] : input
            return _api.util.convertIfReference(input).split(separator)
        }
    }
})
