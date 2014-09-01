/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.binding.setBinding = (binding, arguments) => {
    // Prevent setting binding more than once
    if (binding.vars.ast) {
        throw _api.util.exception("Cannot set binding more than once")
    }
    if (arguments.length < 1 || arguments.length > 2) {
        throw _api.util.exception("Expected 1 or 2 argument(s), but received " + arguments.length)
    }
            
    let input = arguments[0]
    
    // If input is HTMLElement
    if (typeof input === "object") {
        // HTMLElement
        input = input.text()
    }
    
    let ast = _api.dsl.parser.safeParser(input)
    
    // TODO: It is very inefficient, that the whole binding is parsed only to cut out the correct
    // part referenced by arguments[1]. Solution: Create own grammar that only parses groups
    // and only parse the correct group with the full parser
    if (arguments[1]) {
        let path = arguments[1].split("\.")
        for (var i = 0; i < path.length; i++) {
            let id = path[i]
            let groups = ast.getAll("Group", "Group")
            // groups might include ast which is unwanted
            if (groups.indexOf(ast) !== -1) {
                groups.splice(groups.indexOf(ast), 1)
            }
            
            let target = null
            for (var j = 0; j < groups.length; j++) {
                let group = groups[j]
                if (group.get("id") == id && target) {
                    var msg = "When resolving path " + arguments[1] + " after " +
                        "having already processed "
                    for (var k = 0; k < i; k++) {
                        msg += path[k]
                        if (k < i - 1) {
                            msg += "."
                        }
                    }
                    msg += " there was more than one group with id "  + id
                    throw _api.util.exception(msg)
                } else if (group.get("id") == id /* && !target */) {
                    target = group
                }
            }
            if (!target) {
                var msg = "When resolving path " + arguments[1] + " after " +
                        "having already processed "
                for (var k = 0; k < i; k++) {
                    msg += path[k]
                    if (k < i - 1) {
                        msg += "."
                    }
                }
                msg += " there was no group with id " + id
                throw _api.util.exception(msg)
            }
            ast = target
        }
    }
    
    // Set
    binding.vars.ast = ast
    
    _api.binding.initIfReady(binding)
}

_api.binding.setTemplate = (binding, arguments) => {
    // Prevent setting template more than once
    if (binding.vars.template) {
        throw _api.util.exception("Cannot set template more than once")
    }
    
    if (arguments.length !== 1) {
        throw _api.util.exception("Expected 1 argument, but received " + arguments.length)
    }
            
    let input = arguments[0]
    if (typeof input === "object") {
        // TODO: Handle DocumentFragment and HTMLElement
    } else if (typeof input === "string") {
        binding.vars.template = $api.$()(input).clone()
    } else {
        throw _api.util.exception("Unexpected type " + (typeof input) + " as input")
    }
    
    _api.binding.initIfReady(binding)
}

_api.binding.setModel = (binding, arguments) => {
    // Prevent setting model more than once
    if (binding.vars.model) {
        throw _api.util.exception("Cannot set model more than once")
    }
    
    if (arguments.length !== 1) {
        throw _api.util.exception("Expected 1 argument, but received " + arguments.length)
    }
            
    let input = arguments[0]
    binding.vars.model = input
    
    _api.binding.initIfReady(binding)
}

_api.binding.initIfReady = (binding) => {
    let ready = binding.vars.template && binding.vars.ast && binding.vars.model
    if (ready) {
        _api.preprocessor.preprocess(binding)
    }
}

_api.binding.addSlotInsertionObserver = (binding, id, callback) => {
    if (!binding.vars.slotInsertionObserver[id]) {
        binding.vars.slotInsertionObserver[id] = []
    }
    binding.vars.slotInsertionObserver[id].push(callback)
    //callback(indices, values, element)
}

_api.binding.addSlotRemovalObserver = (binding, id, callback) => {
    if (!binding.vars.slotRemovalObserver[id]) {
        binding.vars.slotRemovalObserver[id] = []
    }
    binding.vars.slotRemovalObserver[id].push(callback)
}



class Binding {
    
    constructor () {
        this.vars = {}
        this.vars.tempCounter = new _api.util.Counter()
        this.vars.active = false
        this.vars.slotInsertionObserver = {}
        this.vars.slotRemovalObserver = {}
        return this
    }
    
    binding () {
        _api.binding.setBinding(this, arguments)
        return this
    }
    
    template () {
        _api.binding.setTemplate(this, arguments)
        return this
    }
    
    model () {
        _api.binding.setModel(this, arguments)
        return this
    }
    
    mount () {
        _api.engine.mount(this, arguments)
        return this
    }
    
    activate () {
        if (!this.vars.active) {
            _api.engine.activate(this)
            this.vars.active = true
        } else {
            $api.debug(1, "Tried to activate binding, which was already active")
        }
        return this
    }
    
    deactivate () {
        if (this.vars.active) {
            // TODO
            _api.engine.deactivate(this)
            this.vars.active = false
        } else {
            $api.debug(1, "Tried to deactivate binding, which was already deactive")
        }
        return this
    }
    
    pause () {
        // TODO
        return this
    }
    
    resume () {
        // TODO
        return this
    }
    
    slot (id) {
        return {
            instaces: () => {
                // TODO
            },
            instance: (number) => {
                // TODO
            },
            onInsert: (callback) => {
                _api.binding.addSlotInsertionObserver(this, id, callback)
            },
            onRemove: (callback) => {
                _api.binding.addSlotRemovalObserver(this, id, callback)
            }
        }
    }
    
    destroy() {
       
    }
    
    bindingScopePrefix () {
        if (arguments.length > 1) {
            throw _api.util.exception("Expected no or one argument but received " + arguments.length)
        }
        
        if (arguments.length == 0) {
            // Return
            if (this.vars.bindingScopePrefix) {
                return this.vars.bindingScopePrefix
            } else {
                return "@"
            }
        } else /* if (arguments.length == 1) */ {
            // Set
            this.vars.bindingScopePrefix = arguments[0]
            return this
        }
    }
}

/*  export class  */
_api.Binding = Binding
