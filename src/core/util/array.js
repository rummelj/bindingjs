/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.util.array.remove = (array, element) => {
    _api.util.array.removeAt(array, array.indexOf(element))
}

_api.util.array.removeAt = (array, index) => {
    array.splice(index, 1)
}

_api.util.array.contains = (array, element) => {
    return array.indexOf(element) > -1
}

_api.util.array.subArray = (array, to) => {
    return _api.util.array.subArray(array, 0, to)
}

_api.util.array.subArray = (array, from, to) => {
    let result = []
    for (let i = from; i < to; i++) {
        result.push(array[i])
    }
    return result
}

_api.util.array.map = (array, fn) => {
    let result = []
    for (let i = 0; i < array.length; i++) {
        result.push(fn(array[i], i, array))
    }
    return result
}

_api.util.array.addAll = (addTo, array) => {
    for (let i = 0; i < array.length; i++) {
        addTo.push(array[i])
    }
}

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

_api.util.array.ifAny = (array, condition) => {
    for (let key in array) {
        if (condition(array[key], key)) {
            return true
        }
    }
    return false
}

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

_api.util.array.each = (array, fn) => {
    if (array) {
        for (var i = 0; i < array.length; i++) {
            fn(array[i], i, array)
        }
    }
}

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

_api.util.array.clone = (array) => {
    return array.slice(0)
}

_api.util.array.remove = (array, element) => {
    if (array.indexOf(element) === -1) {
        _api.util.assume(false)
    }
    array.splice(array.indexOf(element), 1)
}

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