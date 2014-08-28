/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
    
class Reference {
    /*  constructor for a Tree node  */
    constructor (adapter, path) {
        this.adapter = adapter
        this.path = path
    }
    
    setElement (element) {
        this.element = element
    }
    
    setModel (model) {
        this.model = model
    }
    
    getValue() {
        if (this.adapter.type() == "model") {
            return this.adapter.getValue(this.model, this.path)
        } else if (this.adapter.type() == "view") {
            return this.adapter.getValue(this.element, this.path)
        } else {
            throw _api.util.exception("Unknown adapter type: " + this.adapter.type())
        }
    }
}

/*  export class  */
_api.engine.binding.Reference = Reference
