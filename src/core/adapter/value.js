/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

$api.plugin("value", ($api, _api) => {
    class ValueAdapter {

        constructor () {
            this.observer = new _api.util.Map()
            this.observerCounter = new _api.util.Counter()
        }
        
        notify (element) {
            _api.util.each(this.observer.get(element), (observer) => {
                observer.callback()
            })
        }
        
        observe (element, path, callback) {
            _api.util.assume(path.length === 0)
            if (!this.observer.hasKey(element)) {
                this.observer.set(element, [])
                let self = this
                element.on("change input propertychange paste", () => { self.notify(element) })
            }
            let observerId = this.observerCounter.getNext()
            this.observer.get(element).push({ observerId: observerId, callback: callback })
            return observerId
        }
        
        unobserve (observerId) {
            let element = _api.util.array.findFirst(this.observer.getKeys(), (key) => {
                return _api.util.array.ifAny(this.observer.get(key), (observer) => {
                    return observer.observerId === observerId
                })
            })
            let observer = _api.util.array.findFirst(this.observer.get(element), (observer) => {
                return observer.observerId === observerId
            })
            _api.util.array.remove(this.observer.get(element), observer)
            if (this.observer.get(element).length === 0) {
                element.off("change input propertychange paste")
                this.observer.remove(element)
            }
        }
        
        getPaths (element, path) {
            return [path]
        }
        
        getValue (element, path, params) {
            let value = element.val()
            if (params && params.trim) {
                value = value.trim()
            }
            return value
        }
        
        set (element, path, value, params) {
            let oldValue = element.val()
            
            if (params && params.typeKeys) {
                params.delay = params.delay ? params.delay : 50
                for (let i = 0; i < value.length; i++) {
                    let j = i
                    /* global setTimeout */
                    setTimeout(() => {
                        element.val(value.substr(0, j + 1))
                    }, params.delay * j)
                }
            } else {
                element.val(value)
            }
            
            if (value !== oldValue) {
                element.trigger("change")
            }
        }
        
        type () {
            return "view"
        }
    }
    
    return new ValueAdapter()    
})
