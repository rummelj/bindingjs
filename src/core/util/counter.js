/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  Number wrapper to pass as reference  */
class Counter {
    constructor () {
        this.value = 0
    }

    get () {
        return this.value
    }
    
    getNext () {
        return ++this.value
    }
    
    set (value) {
        this.value = value
    }
}

/*  export class  */
_api.util.Counter = Counter
