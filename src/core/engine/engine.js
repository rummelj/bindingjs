/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 // Associative array to store things for a binding
 _api.engine.vars = []
 
 _api.engine.getVars = (binding) => {
    if (!_api.engine.vars[binding]) {
        _api.engine.vars[binding] = {
            localScope: new _api.engine.LocalScope(),
        }
    }
    return _api.engine.vars[binding]
 }
 
 _api.engine.activate = (binding) => {
    // TODO: Refactor iterationSetup to transform
    var vars = _api.engine.getVars(binding)
    _api.engine.init(binding, vars, binding.vars.iterationTree)
 }
 
 _api.engine.init = (binding, vars, iterationTree) => {
    for (var i = 0; i < iterationTree.getChildren().length; i++) {
        let child = iterationTree.getChildren()[i]
        _api.engine.init(binding, vars, child)
    }
    
    if (iterationTree.isIterated()) {
        let id = iterationTree.getIterationSourceId()
        let observerId = vars.localScope.observe(id, () => {
            let newLen = vars.localScope.get(id).length
            let oldLen = iterationTree.getIterationInstances()
            
            if (newLen > oldLen) {
                let toAdd = newLen - oldLen
                for (var i = 0; i < toAdd; i++) {
                    let newChild = iterationTree.spawnChild(binding.bindingScopePrefix(), binding.vars.tempCounter)
                }
            } else {
                let toRemove = oldLen - newLen
                for (var i = 0; i < toAdd; i++) {
                    let oldChild = iterationTree.destroyChild()
                    _api.engine.destroy(oldChild)
                }
            }
            for (var i = 0; i < newLen; i++) {
                _api.engine.init(binding, vars, iterationTree.getChildren()[i])
            }
        })
        iterationTree.setObserverId(observerId)
    }
 }
 
 _api.engine.destroy = (binding, iterationTree) => {
    // TODO
 }
 
 _api.engine.mount = (binding, arguments) => {
    if (arguments.length == 1) {
        let arg = arguments[0]
        if (typeof arg === "string") {
            let mountPoint = $api.$()(arg)
            if (mountPoint.length !== 1) {
                throw _api.util.exception("Selector " + arg + " did not match exactly one element, but " +
                                          mountPoint.length)
            }
            mountPoint.replaceWith(binding.vars.iterationTree.getTemplate())
        } else {
            // TOOD
        }
    } else if (arguments.length == 2) {
         // TODO
    } else {
        throw _api.util.exception("Illegal number of arguments")
    }
 }