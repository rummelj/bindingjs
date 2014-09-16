/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
**  COMMON UTILITY FUNCTIONALITIES
*/

/*  utility function: create an exception string for throwing  */
_api.util.exception = (msg) => {
    return new Error(msg)
}

/*  utility function: logging via environment console  */
_api.util.log = (msg) => {
    /*  try Firebug-style console (in regular browser or Node)  */
    if (   typeof root.console     !== "undefined"
        && typeof root.console.log !== "undefined")
        root.console.log(msg)
}

/*  utility function: return a value or (if undefined) a fallback value  */
_api.util.definedOrElse = (value, fallback) => {
    return (typeof value !== "undefined" ? value : fallback)
}

/* Returns a unique jquery selector for $element
   Taken from http://stackoverflow.com/questions/2068272/getting-a-jquery-selector-for-an-element */
_api.util.getPath = (context, element) => {
    let $current = $api.$()(element)
    let $context = $api.$()(context)
    let path = new Array();
    let realpath = "";
    // Since this code is taken from the web, we limit the number of iterations to
    // avoid hard to track errors
    let iterations = 0
    while (!$current.is($context)) {
        let index = $current.parent().find($current.prop("tagName")).index($current);
        let name = $current.prop("tagName");
        let selector = " " + name + ":eq(" + index + ") ";
        path.push(selector);
        $current = $current.parent();
        
        iterations++
        if (iterations > 10000) {
            throw _api.util.exception("Internal error: GetPath called with element, that is NOT a descendant of context")
        }
    }
    while (path.length != 0) {
        realpath += path.pop();
    }
    return realpath;
}

_api.util.objectEquals = (a, b) => {
    if (typeof a !== typeof b) {
        return false
    } else {
        if (a instanceof Array && !(b instanceof Array) ||
            b instanceof Array && !(a instanceof Array)) {
                return false
        } else if (a instanceof Array && b instanceof Array) {
            if (a.length != b.length) {
                return false
            } else {
                for (var i = 0; i < a.length; i++) {
                    if (!_api.util.objectEquals(a[i], b[i])) {
                        return false
                    }
                }
                return true
            }
        } else if (typeof a == "object") {
            // Check if every key of a is in b and vice versa
            let aKeys = _api.util.getObjectKeys(a)
            for (var i = 0; i < aKeys.length; i++) {
                if (!(aKeys[i] in b)) {
                    return false
                }
            }
            let bKeys = _api.util.getObjectKeys(b)
            for (var i = 0; i < bKeys.length; i++) {
                if (!(bKeys[i] in a)) {
                    return false
                }
            }
            // Both keysets are equal
            for (var i = 0; i < aKeys.length; i++) {
                if (!_api.util.objectEquals(a[aKeys[i]], b[bKeys[i]])) {
                    return false
                }
            }
            return true
        } else {
            return a === b
        }
    }
}

_api.util.isReference = (obj) => {
    return obj && obj instanceof _api.engine.binding.Reference
}

_api.util.getObjectKeys = (obj) => {
    let result = []
    for (key in obj) {
        result.push(key)
    }
    return result
}

// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
_api.util.getGuid = (() => {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
    }
    return () => {
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
             s4() + '-' + s4() + s4() + s4();
    }
})()

_api.util.isPrimitive = (value) => {
    let type = typeof value
    return type  === "boolean" ||
           type  === "number"  ||
           type  === "string"  ||
           value === "undefined" ||
           value === null
}