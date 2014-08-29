/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


_api.connector.uppercase = class Uppercase {
    process (input) {
        if (_api.util.isReference(input)) {
            input = input.getValue()
        }
        return (input + "").toUpperCase()
    }
}

_api.repository.connector.register("uppercase", new _api.connector.uppercase())
