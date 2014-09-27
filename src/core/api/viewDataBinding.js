/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

let methods = {
    // Parses the binding specification and returns that part of
    // the abstract syntax tree identified by groupString
    parseAndExtract: (bindingSpec, groupString) => {
        let ast = _api.dsl.parser.safeParser(bindingSpec)
        
        // TODO: It is very inefficient, that the whole binding is parsed only to cut out the correct
        // part referenced by arguments[1]. Solution: Create own grammar that only parses groups
        // and only parse the correct group with the full parser
        if (typeof groupString !== "undefined") {
            let path = groupString.split(".")
            for (let i = 0; i < path.length; i++) {
                let id = path[i]
                let groups = ast.getAll("Group", "Group")
                if (_api.util.array.contains(groups, ast)) {
                    _api.util.array.remove(groups, ast)
                }
                
                // Check if there is exactly one group with id
                let target
                for (let j = 0; j < groups.length; j++) {
                    let group = groups[j]
                    if (group.get("id") === id && target) {
                        let msg = "When resolving path " + groupString + " after " +
                            "having already processed " + _api.util.array.subArray(path, i).join(".") + 
                            " there was more than one group with id "  + id 
                        throw _api.util.exception(msg)
                    } else if (group.get("id") === id /* && !target */) {
                        target = group
                    }
                }
                // If no group found...
                if (!target) {
                    let msg = "When resolving path " + groupString[1] + " after " +
                            "having already processed " + _api.util.array.subArray(path, i).join(".") + 
                            " there was no group with id " + id
                    throw _api.util.exception(msg)
                }
                ast = target
            }
        }
        return ast
    },
    
    // Checks if both template and bindingspec, that are necessary for preprocessing
    // are present and does preprocessing if so
    initIfReady: (viewDataBinding) => {
        let ready = viewDataBinding.vars.template
                    && viewDataBinding.vars.ast
        if (ready) {
            _api.preprocessor.preprocess(viewDataBinding)
            viewDataBinding.vars.initialized = true
        }
    },
    
    // Checks, if a socket id is valid
    checkIfSocketExists: (viewDataBinding, id) => {
        if (!viewDataBinding.vars.initialized) {
            throw _api.util.exception("You must provide template, binding and model " +
                " before using the socket api")
        }
        let allLabels = methods.getAllSocketIds(viewDataBinding.vars.iterationTree)
        if (!_api.util.array.contains(allLabels, id)) {
            let available = allLabels.join("\n") + "\n"
            throw _api.util.exception("Tried to use the socket api with id " + 
                id + ". This id does not exist. Only the following ids are " +
                "available: \n" + available)
        }
    },
    
    getAllSocketIds: (iterationTree) => {
        let result = _api.util.array.map(iterationTree.get("sockets"), (element) => {
            return element.id
        })
        for (let i = 0; i < iterationTree.childs().length; i++) {
            // Recursion
            _api.util.array.addAll(result, methods.getAllSocketIds(iterationTree.childs()[i]))
        }
        return result
    },
    
    checkDestroyed: (viewDataBinding) => {
        if (viewDataBinding.vars.destroyed) {
            throw _api.util.exception("You can not operate on an instance " +
                " of view data binding, that has been destroyed!")
        }
    }
}

class ViewDataBinding {
    
    constructor () {
        this.vars = {
            tempCounter: new _api.util.Counter(),
            active: false,
            socketInsertionObserver: {},
            socketRemovalObserver: {},
            localScope: new _api.engine.LocalScope(),
            paused: false,
            pauseQueue: [],
            initialized: false,
            bindingScopePrefix: "@",
            destroyed: false
        }
        return this
    }
    
    // Sets the binding specification with optional group selector (foo.bar)
    binding (bindingSpec, groupString) {
        methods.checkDestroyed(this)
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
    template (param) {
        methods.checkDestroyed(this)
        // Prevent setting template more than once
        if (this.vars.template) {
            throw _api.util.exception("Cannot set template more than once")
        }
        
        if (typeof param === "object") {
            // TODO: Handle DocumentFragment and HTMLElement
        } else if (typeof param === "string") {
            // TODO: Decide if Selector or HTMLString, do not clone if latter
            this.vars.template = $api.$()(param).clone()
        } else {
            throw _api.util.exception("Unexpected type " + (typeof param) + " as template")
        }
        
        methods.initIfReady(this)
        return this
    }
    
    // Sets the model
    model (param) {
        methods.checkDestroyed(this)
        if (typeof this.vars.model !== "undefined") {
            throw _api.util.exception("Setting the model more than once is " +
                " not supported")
        }
        this.vars.model = param
        return this
    }
    
    mount () {
        methods.checkDestroyed(this)
        _api.engine.mount(this, arguments)
        return this
    }
    
    activate () {
        methods.checkDestroyed(this)
        if (!this.vars.active) {
            _api.engine.activate(this)
            this.vars.active = true
        } else {
            $api.debug(1, "Warning: Tried to activate binding, which was already active")
        }
        return this
    }
    
    deactivate () {
        methods.checkDestroyed(this)
        if (this.vars.active) {
            _api.engine.deactivate(this)
            this.vars.active = false
        } else {
            $api.debug(1, "Warning: Tried to deactivate binding, which was already inactive")
        }
        return this
    }
    
    pause () {
        methods.checkDestroyed(this)
        if (!this.vars.paused) {
            this.vars.paused = true
            this.vars.localScope.pause()
        } else {
            $api.debug(1, "Warning: Tried to pause binding, which was already paused")
        }
        return this
    }
    
    resume () {
        methods.checkDestroyed(this)
        if (this.vars.paused) {
            this.vars.localScope.resume()
            this.vars.paused = false
            for (let i = 0; i < this.vars.pauseQueue.length; i++) {
                _api.engine.binding.propagate(this, this.vars.pauseQueue[i])
            }
            this.vars.pauseQueue = []
        } else {
            $api.debug(1, "Warning: Tried to resume binding, which was not paused")
        }
        return this
    }
    
    socket (id) {
        methods.checkDestroyed(this)
        methods.checkIfSocketExists(this, id)
        return {
            instances: () => {
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
                if (!this.vars.socketInsertionObserver[id]) {
                    this.vars.socketInsertionObserver[id] = []
                }
                this.vars.socketInsertionObserver[id].push(callback)
            },
            onRemove: (callback) => {
                if (typeof callback !== "function") {
                    throw _api.util.exception("Callback must be a function!")
                }
                 if (!this.vars.socketRemovalObserver[id]) {
                    this.vars.socketRemovalObserver[id] = []
                }
                this.vars.socketRemovalObserver[id].push(callback)
            }
        }
    }
    
    destroy() {
        methods.checkDestroyed(this)
        this.vars = null
        this.vars = {
            destroyed: true
        }
    }
    
    bindingScopePrefix () {
        methods.checkDestroyed(this)
        let params = _api.util.Ducky.params("bindingScopePrefix", arguments, {
            newPrefix: { pos: 0, req: false, valid: "string" }
        })
        if (typeof params.newPrefix === "undefined") {
            return this.vars.bindingScopePrefix
        } else /* if (params.newPrefix) */ {
            this.vars.bindingScopePrefix = params.newPrefix
            return this
        }
    }
}

/*  export class  */
_api.ViewDataBinding = ViewDataBinding
