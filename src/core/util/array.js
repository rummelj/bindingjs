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
    for (var i = from; i < to; i++) {
        result.push(array[i])
    }
    return result
}