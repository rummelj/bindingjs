/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
 _api.engine.activate = (binding) => {
     _api.engine.iterator.init(binding)
    
    // Uncomment the following lines and the methods at the end of the file to make debugging easier
    /*
        // Reveals the binding of the actual iteration instances
        _api.engine.showBinding(binding)
        // colors all elements of scopes with random colors to see if elements, that the binding
        // operates on are really in the viewport
        _api.engine.colorred(binding.vars.iterationTree.get("links")[0]);
    */
 }
 
 _api.engine.deactivate = (binding) => {
    _api.engine.iterator.shutdown(binding)
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
            _api.engine.iterator.mount(binding, mountPoint)
        } else {
            // TOOD
        }
    } else if (arguments.length == 2) {
         // TODO
    } else {
        throw _api.util.exception("Illegal number of arguments")
    }
 }
 
  /*
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
 */