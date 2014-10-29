/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.org>
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

    /*
    ** Returns a (shallow) copy of all keys stored in this map
    */
    getKeys () {
        return _api.util.array.clone(this.keys)
    }
    
    /*
    ** Checks if the map holds an element with the given key
    */ 
    hasKey (key) {
        return _api.util.array.contains(this.keys, key)
    }
    
    /*
    ** Sets the map at a given key to a given value
    ** If the key was set previously, its value is overwritten
    */
    set (key, value) {
        if (this.hasKey(key)) {
            this.values[this.keys.indexOf(key)] = value
        } else {
            this.keys.push(key)
            this.values.push(value)
        }
    }
    
    /*
    ** Returns the value stored at a given key or undefined if no such key
    */
    get (key) {
        if (this.hasKey(key)) {
            return this.values[this.keys.indexOf(key)]
        }
    }
    
    /*
    ** Removes the given key together with its value from the map
    */
    remove (key) {
        if (this.hasKey(key)) {
            _api.util.array.remove(this.values, this.values[this.keys.indexOf(key)])
            _api.util.array.remove(this.keys, key)
        }
    }

}

_api.util.Map = Map
