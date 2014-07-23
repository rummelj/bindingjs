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
    if (arguments.length !== 1) {
        throw _api.util.exception("Expected 1 argument, but received " + arguments.length)
    }
            
    let input = arguments[0]
    // If input is HTMLElement
    if (typeof input === "object") {
        input = input.text()
    }
    console.log(input)
    // Set
    binding.vars.ast = _api.dsl.parser.safeParser(input)
    
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
        // Replace AST with initialized binding
        binding.vars.binding = _api.engine.init(binding)
        binding.vars.ast = undefined
        
        console.log(binding.vars.binding)
    }
}



class Binding {
    
    constructor () {
        this.vars = {}
        return this
    }
    
    binding () {
        _api.binding.setBinding(this, arguments)
        return this
    }
    
    template () {
        console.log(_api);
        _api.binding.setTemplate(this, arguments)
        return this
    }
    
    model () {
        _api.binding.setModel(this, arguments)
        return this
    }
    
    mount () {
        _api.util.log(arguments)
        return this
    }
    
    activate () {
        _api.util.log(arguments)
        return this
    }
    
    deactivate () {
        _api.util.log(arguments)
        return this
    }
    
    pause () {
        _api.util.log(arguments)
        return this
    }
    
    resume () {
        _api.util.log(arguments)
        return this
    }
    
    slot () {
        _api.util.log(arguments)
        // TODO: Find slot and return instance
    }
    
    destroy() {
        _api.util.log(arguments)
    
    }
    
}

/*  export class  */
_api.binding.Binding = Binding
