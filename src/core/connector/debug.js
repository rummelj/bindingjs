/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.org>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


$api.plugin("debug", ($api, _api) => {
    return {   
        process: (input, params) => {
            let msg = _api.util.object.isDefined(params) && params.length > 0 ? 
                        JSON.stringify(_api.util.convertToValues(params[0])) : "No message provided"
            msg += ", Input: " + JSON.stringify(_api.util.convertToValues(input))
            $api.debug(1, "Debug Connector (" + msg + ")")
            return input
        }
    }
})
