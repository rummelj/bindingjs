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
    var vars = _api.engine.getVars(binding)  
    _api.engine.init(binding, vars)
    //_api.engine.showBinding(binding)
    
    // TODO: Remove
    /*for (var i = 0; i < 100; i++) {
        vars.localScope.set("temp" + i, [0,1])
    }
    
    _api.engine.colorred(binding.vars.iterationTree.get("links")[0]);*/
 }
 
 _api.engine.showBinding = (binding) => {
    let iterationTreeRoot = binding.vars.iterationTree
    let expandedIterationTreeRoot = iterationTreeRoot.get("links")[0]
    let expandedIterationTreeRootInstance = expandedIterationTreeRoot.get("instances")[0]
    console.log("<Root>")
    console.log(expandedIterationTreeRootInstance.binding.asBindingSpec())
    for (var i = 0; i < expandedIterationTreeRoot.childs().length; i++) {
        _api.engine.showBindingRec(expandedIterationTreeRoot.childs()[i])
    }
 }
 
 _api.engine.showBindingRec = (node) => {
    console.log("<ExpandedIterationNode>")
    console.log("sourceId: " + node.get("sourceId") + ", entryId: " + node.get("entryId") + ", keyId: " + node.get("keyId"))
    console.log("bindingRenames: " + JSON.stringify(node.get("bindingRenames")))
    let instances = node.get("instances")
    for (var i = 0; i < instances.length; i++) {
        let instance = instances[i]
        console.log("<Instance-" + i + ">")
        console.log("bindingRenames: " + JSON.stringify(instance.bindingRenames))
        console.log(instance.binding.asBindingSpec())
    }
    for (var i = 0; i < node.childs().length; i++) {
        _api.engine.showBindingRec(node.childs()[i])
    }
 }
 
 _api.engine.colorred = (node) => {
    let instances = node.get("instances")
    for (var i = 0; i < instances.length; i++) {
        let instance = instances[i]
        let binding = instance.binding
        let scopes = binding.getAll("Scope")
        for (var j = 0; j < scopes.length; j++) {
            let scope = scopes[j]
            let element = scope.get("element")
            console.log(element)
            $api.$()(element).attr("style", "background: " + _api.engine.getRandomColor())
        }
    }
    for (var i = 0; i < node.childs().length; i++) {
        _api.engine.colorred(node.childs()[i])
    }
 }
 
 _api.engine.getRandomColor = () => {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
 
 _api.engine.init = (binding, vars) => {
    _api.engine.iterator.init(binding, vars)
    
    /*
    for (var i = 0; i < iterationTree.getChildren().length; i++) {
        let child = iterationTree.getChildren()[i]
        _api.engine.init(binding, vars, child)
    }
    
    if (iterationTree.isIterated() && !iterationTree.getObserverId()) {
        let id = iterationTree.getIterationSourceId()
        let observerId = vars.localScope.observe(id, () => {
            let newCollection = vars.localScope.get(id)
            if (!newCollection || !newCollection.length) {
                throw _api.util.exception("Did not find a collection in local scope for iteration, but instead " + newCollection)
            }
            
            let newLen = vars.localScope.get(id).length
            let oldLen = iterationTree.getIterationInstances()
            
            if (newLen > oldLen) {
                let toAdd = newLen - oldLen
                for (var i = 0; i < toAdd; i++) {
                    let newChild = iterationTree.spawnChild(binding.bindingScopePrefix(), binding.vars.tempCounter)
                }
            } else {
                let toRemove = oldLen - newLen
                for (var i = 0; i < toRemove; i++) {
                    let oldChild = iterationTree.destroyChild()
                    _api.engine.destroy(oldChild)
                }
            }
            
            // If a child spawns a child inside an already iterated node, this node needs to completely update as well
            let temp = iterationTree
            while (temp.getParent()) {
                temp = temp.getParent()
                
                if (temp.isIterated()) {
                    let childCount = temp.getIterationInstances()
                    for (var i = 0; i < childCount; i++) {
                        temp.destroyChild()
                    }
                    for (var i = 0; i < childCount; i++) {
                        temp.spawnChild(binding.bindingScopePrefix(), binding.vars.tempCounter)
                    }
                }
            }
            
            for (var i = 0; i < temp.getChildren().length; i++) {
                _api.engine.init(binding, vars, temp.getChildren()[i])
            }
        })
        iterationTree.setObserverId(observerId)
    }
    */
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
            mountPoint.replaceWith(_api.engine.iterator.getTemplate(binding))
        } else {
            // TOOD
        }
    } else if (arguments.length == 2) {
         // TODO
    } else {
        throw _api.util.exception("Illegal number of arguments")
    }
 }