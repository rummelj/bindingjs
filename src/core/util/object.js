/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.util.object.isBoolean = (obj) => {
    let type = Object.prototype.toString.call(obj)
    return type === "[object Boolean]"
}

_api.util.object.isDefined = (obj) => {
    return typeof obj !== "undefined"
}

_api.util.object.ifUndefined = (obj, defaultObj) => {
    if (typeof obj === "undefined") {
        return defaultObj
    } else {
        return obj
    }
}

_api.util.object.clone = (obj) => {
    return $api.$().extend({}, obj)
}