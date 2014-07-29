/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

class LocalScope {
    constructor () {
        this.data = []
        this.observer = []
        this.observerId = 0
    }

    getIds() {
        let result = []
        for (id in this.data) {
            result.push(id)
        }
        return result
    }
    
    get(id) {
        return this.data[id]
    }
    
    set(id, to) {
        if (this.data[id] !== to) {
            this.data[id] = to
            this.notify(id)
        }
    }
    
    observe(id, callback) {
        $api.debug(3, "LocalScope observer for " + id + " registered")
        // TODO: Remove
        if (!this.data[id]) { this.set(id, null) }
        if(!this.observer[id]) {
            this.observer[id] = []
        }
        this.observer[id].push({ id: this.observerId, callback: callback })
        return this.observerId++
    }
    
    unobserve(id) {
        var found = false
        for (id in observer) {
            for (index in observer[id]) {
                if (observer[id][index].id === id) {
                    observer.splice(index, 1)
                    // Break outer
                    found = true
                    // Break inner
                    break;
                }
            }
            if (found) {
                break
            }
        }
    }
    
    notify(id) {
        for (var i = 0; this.observer[id] && i < this.observer[id].length; i++) {
            this.observer[id][i].callback()
        }
    }
}

/*  export class  */
_api.engine.LocalScope = LocalScope
