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

/*
** Returns obj if defined and defaultObj is obj is undefined
*/
_api.util.object.ifUndefined = (obj, defaultObj) => {
    if (typeof obj === "undefined") {
        return defaultObj
    } else {
        return obj
    }
}

/*
** Clones an object with the help of jQuery
*/
_api.util.object.clone = (obj) => {
    return $api.$().extend({}, obj)
}

/*
** Deeply compares two objects by recursively enumerating their nested
** objects and arrays. It does not consider inheritance.
*/
_api.util.object.equals = (a, b) => {
    if (typeof a !== typeof b) {
        return false
    } else {
        if (a instanceof Array && !(b instanceof Array) ||
            b instanceof Array && !(a instanceof Array)) {
                return false
        } else if (a instanceof Array && b instanceof Array) {
            if (a.length !== b.length) {
                return false
            } else {
                for (let i = 0; i < a.length; i++) {
                    if (!_api.util.object.equals(a[i], b[i])) {
                        return false
                    }
                }
                return true
            }
        } else if (typeof a === "object") {
            // Check if every key of a is in b and vice versa
            let aKeys = _api.util.object.getKeys(a)
            for (let i = 0; i < aKeys.length; i++) {
                if (!(aKeys[i] in b)) {
                    return false
                }
            }
            let bKeys = _api.util.object.getKeys(b)
            for (let i = 0; i < bKeys.length; i++) {
                if (!(bKeys[i] in a)) {
                    return false
                }
            }
            // Both keysets are equal
            for (let i = 0; i < aKeys.length; i++) {
                if (!_api.util.object.equals(a[aKeys[i]], b[bKeys[i]])) {
                    return false
                }
            }
            return true
        } else {
            return a === b
        }
    }
}

/*
** Returns the set of keys of an obj
*/
_api.util.object.getKeys = (obj) => {
    let result = []
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            result.push(key)
        }
    }
    return result
}