/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

// TODO: Remove (see below)
/*global $ */
class Binding {
    
    constructor () {
        return this
    }
    
    binding () {
        if (arguments.length !== 1) {
            throw _api.exception("binding", "Expected 1 argument, but received " + arguments.length)
        }
                
        let input = arguments[0]
        if (typeof input === "object") {
            input = input.text()
        }
        
        var astWrapper = $api.parse(input)
        if (astWrapper.error !== null) {
            let e = astWrapper.error
            let prefix1 = "line " + e.line + " (col " + e.column + "): "
            let prefix2 = ""
            for (let i = 0; i < prefix1.length + e.location.prolog.length; i++){
                prefix2 += "-"
            }
            console.error("ERROR: " + prefix1 + e.location.prolog + e.location.token + e.location.epilog)
            console.error("ERROR: " + prefix2 + "^")
            console.error("ERROR: " + e.message)
            throw _api.exception("binding", "Parsing failed")
        } else {
            this.ast = astWrapper.ast
        }
        
        return this
    }
    
    template () {
        if (arguments.length !== 1) {
            throw _api.exception("template", "Expected 1 argument, but received " + arguments.length)
        }
                
        let input = arguments[0]
        if (typeof input === "object") {
            // TODO: Handle DocumentFragment and HTMLElement
        } else if (typeof input === "string") {
            // TODO: Store jQuery in Framework with configurable symbol
            this.template = $(input).clone()
        } else {
            throw _api.exception("template", "Unexpected type " + (typeof input) + " as input")
        }
        
        return this
    }
    
    model () {
        if (arguments.length !== 1) {
            throw _api.exception("model", "Expected 1 argument, but received " + arguments.length)
        }
                
        let input = arguments[0]
        this.model = input
        
        return this
    }
    
    mount () {
        console.log(arguments)
        return this
    }
    
    activate () {
        console.log(arguments)
        return this
    }
    
    deactivate () {
        console.log(arguments)
        return this
    }
    
    pause () {
        console.log(arguments)
        return this
    }
    
    resume () {
        console.log(arguments)
        return this
    }
    
    slot () {
        console.log(arguments)
        // TODO: Find slot and return instance
    }
    
    destroy() {
        console.log(arguments)
    
    }
    
}

/*  export class  */
_api.binding = Binding
