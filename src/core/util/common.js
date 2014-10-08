/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
**  Utility function: create an exception string for throwing 
*/
_api.util.exception = (msg) => {
    return new Error(msg)
}

/*
** Checks, if an object is an instance of Reference
*/
_api.util.isReference = (obj) => {
    return obj && obj instanceof _api.engine.binding.Reference
}

/*
** Generates a string that looks like a GUID and has similar randomness
** Adapted from: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
*/
_api.util.getGuid = (() => {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
    }
    return () => {
      return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
             s4() + "-" + s4() + s4() + s4();
    }
})()

/*
** Checks, if value is primitive (boolean, number, string, undefined, null)
*/
_api.util.isPrimitive = (value) => {
    let type = typeof value
    return type  === "boolean" ||
           type  === "number"  ||
           type  === "string"  ||
           type  === "undefined" ||
           value === null
}

/*
** Returns the input or the underlying value, if value is a Reference
*/
_api.util.convertIfReference = (value) => {
    if (value instanceof _api.engine.binding.Reference) {
        return value.getValue()
    } else {
        return value
    }
}

/*
** Returns the same object with all References replaced by their values
*/
_api.util.convertToValues = (value) => {
    return _api.engine.binding.convertToValues(value)
}

/*
** Executes fn for each item of the array or for each key of the object
*/
_api.util.each = (array, fn) => {
    if (array) {
        let breaK = {}
        if (array instanceof Array) {
            for (var i = 0; i < array.length; i++) {
                let result = fn(array[i], i, array, breaK)
                if (result === breaK) {
                    break
                }
            }
        } else if (typeof array === "object") {
            for (let key in array) {
                if (array.hasOwnProperty(key)) {
                    let result = fn(array[key], key, array, breaK)
                    if (result === breaK) {
                        break
                    }
                }
            }
        }
    }
}

/*
** Recursively calls callback for each item of value, which is neither an object
** nor an array. Callback may return a value which replaces the old
*/
_api.util.traverseStructure = (value, callback) => {
    if (value instanceof Array) {
        let newArr = []
        for (let i = 0; i < value.length; i++) {
            newArr.push(_api.util.traverseStructure(value[i], callback))
        }
        return newArr
    } else if (typeof value === "object" && value.constructor.name === "Object") {
        let newObj = {}
        for (let key in value) {
            let newValue = _api.util.traverseStructure(value[key], callback)
            newObj[key] = newValue
        }
        return newObj
    } else {
        return callback(value)
    }
}

/*
** If condition is false, an (unspecific) exception is thrown
*/
_api.util.assume = (condition) => {
    if (!condition) {
        throw _api.util.exception("Internal assumption error")
    }
}