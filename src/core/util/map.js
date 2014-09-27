/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
** JavaScript objects only support strings as keys
*/
class Map {
    
    constructor () {
        this.keys = []
        this.values = []
    }

    getKeys () {
        return _api.util.array.clone(this.keys)
    }
    
    hasKey (key) {
        return _api.util.array.contains(this.keys, key)
    }
    
    set (key, value) {
        if (this.hasKey(key)) {
            this.values[this.keys.indexOf(key)] = value
        } else {
            this.keys.push(key)
            this.values.push(value)
        }
    }
    
    get (key) {
        if (this.hasKey(key)) {
            return this.values[this.keys.indexOf(key)]
        }
    }
    
    remove (key) {
        if (this.hasKey(key)) {
            _api.util.array.remove(this.values, this.values[this.keys.indexOf(key)])
            _api.util.array.remove(this.keys, key)
        }
    }

}

/*  export class  */
_api.util.Map = Map
