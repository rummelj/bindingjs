/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

let methods = {  
    parseAndExtract: (bindingSpec, groupString) => {
        let ast = _api.dsl.parser.safeParser(bindingSpec)
        
        // TODO: It is very inefficient, that the whole binding is parsed only to cut out the correct
        // part referenced by arguments[1]. Solution: Create own grammar that only parses groups
        // and only parse the correct group with the full parser
        if (groupString) {
            let path = groupString.split(".")
            for (let i = 0; i < path.length; i++) {
                let id = path[i]
                let groups = ast.getAll("Group", "Group")
                // groups might include ast which is unwanted
                if (groups.indexOf(ast) !== -1) {
                    groups.splice(groups.indexOf(ast), 1)
                }
                
                let target = null
                for (let j = 0; j < groups.length; j++) {
                    let group = groups[j]
                    if (group.get("id") === id && target) {
                        let msg = "When resolving path " + arguments[1] + " after " +
                            "having already processed "
                        for (let k = 0; k < i; k++) {
                            msg += path[k]
                            if (k < i - 1) {
                                msg += "."
                            }
                        }
                        msg += " there was more than one group with id "  + id
                        throw _api.util.exception(msg)
                    } else if (group.get("id") === id /* && !target */) {
                        target = group
                    }
                }
                if (!target) {
                    let msg = "When resolving path " + arguments[1] + " after " +
                            "having already processed "
                    for (let k = 0; k < i; k++) {
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
        return ast
    },
    
    initIfReady: (viewDataBinding) => {
        let ready = viewDataBinding.vars.template && viewDataBinding.vars.ast && viewDataBinding.vars.model
        if (ready) {
            _api.preprocessor.preprocess(viewDataBinding)
            viewDataBinding.vars.initialized = true
        }
    },
    
    checkIfSlotExists: (viewDataBinding, id) => {
        if (!viewDataBinding.vars.initialized) {
            throw _api.util.exception("You must provide template, binding and model " +
                " before using the slot api")
        }
        let allLabels = methods.getAllSocketIds(viewDataBinding.vars.iterationTree)
        let found = false
        for (let i = 0; i < allLabels.length; i++) {
            if (allLabels[i] === id) {
                found = true
                break
            }
        }
        if (!found) {
            let available = ""
            for (let i = 0; i < allLabels.length; i++) {
                available += allLabels[i] + "\n"
            }
            throw _api.util.exception("Tried to use the slot api with id " + 
                id + ". This id does not exist. Only the following ids are " +
                "available: \n" + available)
        }
    },
    
    getAllSocketIds: (iterationTree) => {
        let result = []
        let sockets = iterationTree.get("slots")
        for (let i = 0; i < sockets.length; i++) {
            let socket = sockets[i]
            result.push(socket.id)
        }
        for (let i = 0; i < iterationTree.childs().length; i++) {
            let subResult = methods.getAllSocketIds(iterationTree.childs()[i])
            for (let j = 0; j < subResult.length; j++) {
                result.push(subResult[j])
            }
        }
        return result
    }
}

class ViewDataBinding {
    
    constructor () {
        this.vars = {}
        this.vars.tempCounter = new _api.util.Counter()
        this.vars.active = false
        this.vars.slotInsertionObserver = {}
        this.vars.slotRemovalObserver = {}
        this.vars.localScope = new _api.engine.LocalScope()
        this.vars.paused = false
        this.vars.pauseQueue = []
        this.vars.initialized = false
        return this
    }
    
    // Sets the binding specification with optional group selector (foo.bar)
    binding (bindingSpec, groupString) {
        // Prevent setting binding more than once
        if (this.vars.ast) {
            throw _api.util.exception("Cannot set binding more than once")
        }
        
        // If bindingSpec is HTMLElement
        if (typeof bindingSpec.text === "function") {
            // TODO: Declarative Case
            bindingSpec = bindingSpec.text()
        }
        
        this.vars.ast = methods.parseAndExtract(bindingSpec, groupString)
        methods.initIfReady(this)
        return this
    }
    
    // Sets the template
    template () {
        // Prevent setting template more than once
        if (this.vars.template) {
            throw _api.util.exception("Cannot set template more than once")
        }
        
        if (arguments.length !== 1) {
            throw _api.util.exception("Expected 1 argument, but received " + arguments.length)
        }
                
        let templateDomFragment = arguments[0]
        if (typeof templateDomFragment === "object") {
            // TODO: Handle DocumentFragment and HTMLElement
        } else if (typeof templateDomFragment === "string") {
            // TODO: Decide if Selector or HTMLString, do not clone if latter
            this.vars.template = $api.$()(templateDomFragment).clone()
        } else {
            throw _api.util.exception("Unexpected type " + (typeof templateDomFragment) + " as template")
        }
        
        methods.initIfReady(this)
        return this
    }
    
    // Sets the model
    model () {
        // Prevent setting model more than once
        if (this.vars.model) {
            throw _api.util.exception("Cannot set model more than once")
        }
        
        if (arguments.length !== 1) {
            throw _api.util.exception("Expected 1 argument, but received " + arguments.length)
        }
        this.vars.model = arguments[0]
        
        methods.initIfReady(this)
        return this
    }
    
    mount () {
        // TODO: Implement version with callback and fragment (see spec.d.ts)
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
            _api.engine.deactivate(this)
            this.vars.active = false
        } else {
            $api.debug(1, "Tried to deactivate binding, which was already inactive")
        }
        return this
    }
    
    pause () {
        if (this.vars.paused) {
            $api.debug(1, "Tried to pause binding, which was already paused")
        } else {
            this.vars.paused = true
            this.vars.localScope.pause()
        }
        return this
    }
    
    resume () {
        if (!this.vars.paused) {
            $api.debug(1, "Tried to resume binding, which was not paused")
        } else {
            this.vars.localScope.resume()
            this.vars.paused = false
            for (let i = 0; i < this.vars.pauseQueue.length; i++) {
                _api.engine.binding.propagate(this, this.vars.pauseQueue[i])
            }
            this.vars.pauseQueue = []
        }
        return this
    }
    
    slot (id) {
        methods.checkIfSlotExists(this, id)
        return {
            instaces: () => {
                // TODO
                throw _api.util.exception("Not implemented yet")
            },
            instance: (number) => {
                // TODO
                throw _api.util.exception("Not implemented yet " + number)
            },
            onInsert: (callback) => {
                if (typeof callback !== "function") {
                    throw _api.util.exception("Callback must be a function!")
                }
                if (!this.vars.slotInsertionObserver[id]) {
                    this.vars.slotInsertionObserver[id] = []
                }
                this.vars.slotInsertionObserver[id].push(callback)
            },
            onRemove: (callback) => {
                if (typeof callback !== "function") {
                    throw _api.util.exception("Callback must be a function!")
                }
                 if (!this.vars.slotRemovalObserver[id]) {
                    this.vars.slotRemovalObserver[id] = []
                }
                this.vars.slotRemovalObserver[id].push(callback)
            }
        }
    }
    
    destroy() {
        // TODO
    }
    
    bindingScopePrefix () {
        if (arguments.length > 1) {
            throw _api.util.exception("Expected no or one argument but received " + arguments.length)
        }
        
        if (arguments.length === 0) {
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
_api.ViewDataBinding = ViewDataBinding
