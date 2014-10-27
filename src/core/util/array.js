/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
** Removes the given element from the array if its present
*/
_api.util.array.remove = (array, element) => {
    if (!_api.util.array.contains(array, element)) {
        throw _api.util.exception("element not in array")
    }
    _api.util.array.removeAt(array, array.indexOf(element))
}

/*
** Removes the element at the given index from the array
*/
_api.util.array.removeAt = (array, index) => {
    if (index < 0 || index >= array.length) {
        throw _api.util.exception("index not in array")
    }
    array.splice(index, 1)
}

/*
** Decides, whether element is in array
*/
_api.util.array.contains = (array, element) => {
    return array.indexOf(element) > -1
}

/*
** Returns a clone of array by leaving out all indices after to inclusively
*/
_api.util.array.subArray = (array, to) => {
    return _api.util.array.subArray(array, 0, to)
}

/*
** Returns a clone of array, that contains all elements with indices in [from, to)
** (from: inclusively, to: exclusively)
*/
_api.util.array.subArray = (array, from, to) => {
    if (from < 0 || from >= array.length ||
        to < 0 || to >= array.length ||
        from > to) {
            throw _api.util.exception("Illegal parameters")
    }
    let result = []
    for (let i = from; i < to; i++) {
        result.push(array[i])
    }
    return result
}

/*
** Returns a new array, where each entry is mapped by fn
*/
_api.util.array.map = (array, fn) => {
    let result = []
    for (let i = 0; i < array.length; i++) {
        result.push(fn(array[i], i, array))
    }
    return result
}

/*
** Adds all elements in array to addTo
*/
_api.util.array.addAll = (addTo, array) => {
    if (array instanceof Array) {
        for (let i = 0; i < array.length; i++) {
            addTo.push(array[i])
        }
    } else {
        addTo.push(array)
    }
}

/*
** Adds an element at the given index
*/
_api.util.array.addAt = (addTo, what, at) => {
    addTo.splice(at, 0, what)
}

/*
** Checks, if all elements in array meet the given condition
*/
_api.util.array.ifAll = (array, condition) => {
    let result = true
    for (let key in array) {
        if (!condition(array[key], key)) {
            result = false
            break
        }
    }
    return result
}

/*
** Checks, if at least one element in array meets the given condition
*/
_api.util.array.ifAny = (array, condition) => {
    for (let key in array) {
        if (condition(array[key], key)) {
            return true
        }
    }
    return false
}

/*
** Returns the minimum and maximum number in array. The return type
** is an object having "min" and "max" as its keys
*/
_api.util.array.getMinAndMax = (array) => {
    let min = _api.util.number.maxValue()
    let max = _api.util.number.minValue()
    if (array) {
        for (var i  = 0; i < array.length; i++) {
            let current = parseInt(array[i])
            if (min > current) {
                min = current
            }
            if (max < current) {
                max = current
            }
        }
    }
    return { min: min, max: max }
}

/*
** Returns the first element in array that meets the condition or
** undefined, if there is no such element
*/
_api.util.array.findFirst = (array, condition) => {
    let result
    if (array) {
        for (var i = 0; i < array.length; i++) {
            if (condition(array[i], i, array)) {
                result = array[i]
                break
            }
        }
    }
    return result
}

/*
** Returns all elements from array as a list that meet the condition
*/
_api.util.array.findAll = (array, condition) => {
    let result = []
    if (array) {
        for (var i = 0; i < array.length; i++) {
            if (condition(array[i], i, array)) {
                result.push(array[i])
            }
        }
    }
    return result
}

/*
** Returns a shallow copy of array
*/
_api.util.array.clone = (array) => {
    return array.slice(0)
}

/*
** Removes the given element from array
*/
_api.util.array.remove = (array, element) => {
    if (!_api.util.array.contains(array, element)) {
        throw _api.util.exception("element not in array")
    }
    array.splice(array.indexOf(element), 1)
}

/*
** Removes all elements from the array, that meet the condition
*/
_api.util.array.removeIf = (array, condition) => {
    for (var i = 0; i < array.length; i++) {
        if (condition(array[i], i, array)) {
            _api.util.array.remove(array, array[i])
            i--
        }
    }
}

/*
** Returns the number of elements in array, that meet the condition
*/
_api.util.array.count = (array, condition) => {
    let result = 0
    if (array) {
        for (var i = 0; i < array.length; i++) {
            if (condition(array[i], i, array)) {
                result++
            }
        }
    }
    return result
}

/*
** Checks whether withWhat contains all elements from what in its beginning
*/
_api.util.array.startsWith = (what, withWhat) => {
    if (withWhat.length > what.length) {
        return false
    }
    for (var i = 0; i < withWhat.length; i++) {
        if (what[i] !== withWhat[i]) {
            return false
        }
    }
    return true
}
