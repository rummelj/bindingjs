/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 _api.engine.iterator.getTemplate = (binding) => {
    return binding.vars.iterationTree.get("links")[0].get("template")
 }
 
 _api.engine.iterator.init = (binding, vars) => {
    var root = binding.vars.iterationTree
    for (var i = 0; i < root.childs().length; i++) {
        _api.engine.iterator.initInternal(vars, root.childs()[i])
    }
 }
 
 _api.engine.iterator.initInternal = (vars, node) => {
    vars.localScope.observe(node.get("sourceId"), () => {
        _api.engine.iterator.changeListener(vars, node)
    })
    _api.engine.iterator.changeListener(vars, node)
    for (var i = 0; i < node.childs().length; i++) {
        _api.engine.iterator.initInternal(vars, node.childs()[i])
    }
}
 
 _api.engine.iterator.changeListener = (vars, node) => {
    var newCollection = vars.localScope.get(node.get("sourceId"))
    newCollection = newCollection ? newCollection : []
    var oldCollection = node.get("collection")
    node.set("collection", newCollection)
    
    var changes = _api.engine.iterator.levensthein(oldCollection, newCollection)
    for (var i = 0; i < changes.length; i++) {
        switch (changes[i].type) {
            case "remove":
                _api.engine.iterator.remove(node, changes[i].index)
                break
            case "add":
                _api.engine.iterator.add(node, changes[i].index, changes[i].value)
                break
            default:
                throw new _api.util.exception("Internal Error: Unknown change type")
        }
    }
 }
 
 _api.engine.iterator.remove = (node, index) => {
    let childs = node.childs()
    for (var i = 0; i < childs.length; i++) {
        let child = childs[i]
        _api.engine.iterator.destroyChild(child)
    }
 }
 
 _api.engine.iterator.add = (node, index, value) => {
    let links = node.get("links")
    let childs = node.childs()
    for (var i = 0; i < links.length; i++) {
        let link = links[i]

        let oldTemplate = link.get("template")
        let newTemplate = oldTemplate.clone()
        let newBinding = link.get("binding").clone()
        
        // The references inside binding still refer to the template before it was cloned
        let scopes = newBinding.getAll("Scope")
        for (var j = 0; j < scopes.length; j++) {
            let scope =  scopes[j]
            let element = scope.get("element")
            let selector = _api.util.getPath(oldTemplate, element)
            let newElement = $api.$()(selector, newTemplate)
            scope.set("element", newElement)
        }
        
        for (var j = 0; j < childs.length; j++) {
            let child = childs[j]
            let newChildLink = _api.engine.iterator.initChild(child)
            link.add(newChildLink)
        }
        
        link.getParent().get("placeholders").template[node.getParent().childs().indexOf(node)].after(link.get("template"))
        // TODO insert binding
        link.get("instances").push({template: newTemplate, binding: newBinding})
    }
 }
 
 _api.engine.iterator.destroyChild = (node) => {
    let links = node.get("links")
    let last = links[links.length - 1]
    last.getParent().del(last)
    links.pop()
    
    let collection = node.get("collection")
    let childs = node.childs()
    for (var i = 0; i < collection.length; i++) {
        for (var j = 0; j < childs.length; j++) {
            let child = childs[j]
            _api.engine.iterator.destroyChild(child)
        }
    }
 }
 
 _api.engine.iterator.initChild = (node) => {
    let newLink = new _api.util.Tree("ExpandedIteration")

    let collection = node.get("collection")
    let childs = node.childs()
    for (var i = 0; i < collection.length; i++) {
        for (var j = 0; j < children.length; j++) {
            let child = childs[j]
            let newChildLink = _api.engine.iterator.initChild(child)
            newLink.add(newChildLink)
        }
    }
    
    newLink.set("instances", [])
        
    let oldTemplate = node.get("iterationTemplate")
    let newTemplate = oldTemplate.clone()
    
    let newBinding = node.get("binding").clone()
    newLink.set("template", newTemplate)
    newLink.set("binding", newBinding)
        
    // Update placeholders
    newLink.set("placeholders", {template: [], binding: []})
    for (var i = 0; i < node.get("placeholders").template.length; i++) {
        let templatePl = node.get("placeholders").template[i]
        let selector = _api.util.getPath(node.get("iterationTemplate"), templatePl)
        let newPlaceholder = $api.$()(selector, newTemplate)
        newLink.get("placeholders").template.push(newPlaceholder)
    }
    // Replace template placeholders by comments
    for (var i = 0; i < newLink.get("placeholders").template.length; i++) {
        let templatePl = newLink.get("placeholders").template[i]
        let comment = $api.$()("<!-- -->")
        templatePl.replaceWith(comment)
        newLink.get("placeholders").template[i] = comment
    }
    for (var i = 0; i < node.get("placeholders").binding.length; i++) {
        let bindingPl =  node.get("placeholders").binding[i]
        let newPlaceholders = newBinding.getAll("Iteration-" + i)
        if (newPlaceholders.length != 1) {
            throw _api.util.exception("Internal error")
        }
        newLink.get("placeholders").binding.push(newPlaceholders[0])
    }
    
    // The references inside binding still refer to the template before it was cloned
    let scopes = newBinding.getAll("Scope")
    for (var i = 0; i < scopes.length; i++) {
        let scope =  scopes[i]
        let element = scope.get("element")
        let selector = _api.util.getPath(oldTemplate, element)
        let newElement = $api.$()(selector, newTemplate)
        scope.set("element", newElement)
    }
        
    node.get("links").push(newLink)
    return newLink
 }
 
 _api.engine.iterator.levensthein = (oldCollection, newCollection) => {
    // TODO: Resolve references to true values
    // TODO: Add Levensthein
    var result = []
    for (var i = 0; i < oldCollection.length; i++) {
        result.push({type: "remove", index: 0})
    }
    for (var i = newCollection.length - 1; i >= 0; i--) {
        result.push({type: "add", index: 0, value: newCollection[i]})
    }
    return result
 }