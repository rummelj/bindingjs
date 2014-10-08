/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

class BindingScope {

    constructor () {
        this.data = {}
        this.observerIds = {}
        this.observer = {}
        this.observerId = 0
        this.paused = false
        this.pauseQueue = []
    }

    pause() {
        this.paused = true
    }
    
    resume() {
        this.paused = false
        for (let i = 0; i < this.pauseQueue.length; i++) {
            this.notify(this.pauseQueue[i])
        }
        this.pauseQueue = []
    }
    
    getIds() {
        let result = []
        for (let id in this.data) {
            result.push(id)
        }
        return result
    }
    
    get(id) {
        return this.data[id]
    }
    
    set(id, to) {
        if (this.data[id] !== to) {
            this.unobserveReference(id)
            this.data[id] = to
            this.notify(id)
            this.observeReference(id, to)
        }
    }
    
    observeReference(id, value) {
        if (_api.util.isReference(value) && value.isObservable()) {
            let observerId = value.observe(() => {
                if (!this.paused) {
                    this.notify(id)
                } else if (this.pauseQueue.indexOf(id) === -1) {
                    this.pauseQueue.push(id)
                }
            })
            this.observerIds[id] = { reference: value, observerId: observerId }
        } 
    }
    
    unobserveReference(id) {
        let item = this.observerIds[id]
        if (item && _api.util.isReference(item.reference) && item.reference.isObservable()) {
            item.reference.unobserve(item.observerId)
        }
        delete this.observerIds[id]
    }
    
    destroy(id) {
        // If a reference was previously in bindingScope, unobserve it
        this.unobserveReference(id)
        
        // Purge the id from data
        delete this.data[id]
    }
    
    observe(id, callback) {
        if(!this.observer[id]) {
            this.observer[id] = []
        }
        this.observer[id].push({ id: this.observerId, callback: callback })
        return this.observerId++
    }
    
    unobserve(id) {
        for (let name in this.observer) {
            let observer = _api.util.array.findFirst(this.observer[name], (item) => {
                return item.id === id
            })
            if (observer) {
                _api.util.array.remove(this.observer[name], observer)
                break;
            }
        }
    }
    
    notify(id) {
        _api.util.each(this.observer[id], (observer) => {
            observer.callback()
        })
    }
}

/*  export class  */
_api.engine.BindingScope = BindingScope
