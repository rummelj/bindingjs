/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  
** Generates increasing numbers starting at 0
*/
class Counter {
    constructor () {
        this.value = 0
    }

    /*
    ** Gets current value of Counter without increasing it
    */
    get () {
        return this.value
    }
    
    /*
    ** Gets the next value and increases the internal counter
    */
    getNext () {
        return ++this.value
    }
    
    /*
    ** Sets the internal Counter to value
    */
    set (value) {
        this.value = value
    }
}

_api.util.Counter = Counter
