/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.util.number.maxValue = () => {
    return Number.MAX_VALUE
}

_api.util.number.minValue = () => {
    return Number.MIN_VALUE
}

_api.util.number.isWholePositiveNumber = (obj) => {
    return _api.util.number.isWholeNumber(obj) && parseInt(obj, 10) >= 0
}

_api.util.number.isWholeNumber = (obj) => {
    return obj % 1 === 0
}