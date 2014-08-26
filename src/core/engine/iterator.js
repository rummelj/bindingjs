/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 _api.engine.iterator.getTemplate = (binding) => {
    return binding.vars.iterationTree.get("links")[0].get("instances")[0].template[0]
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
    // TODO
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
        let newInstance = _api.engine.iterator.addInstance(link, index, value)
        
        // Initialize new children
        for (var j = 0; j < childs.length; j++) {
            let child = childs[j]
            let newChildLink = _api.engine.iterator.initChild(child)
            link.add(newChildLink)
            
            newChildLink.set("instance", newInstance)
        }
    }
 }

 _api.engine.iterator.addInstance = (link, index, value) => {
    let instances = link.get("instances")
    if (instances.length < index) {
        throw _api.util.exception("Cannot add instance at index " + index + " because there are " +
                                  "only " + instances.length + " instances present")
    }
    
    // Template
    let oldTemplate = link.get("template")
    let newTemplate = oldTemplate.clone()
    
    // Template Placeholder
    let oldTemplatePlaceholder = link.get("placeholder").template
    let newTemplatePlaceholder = []
    for (var i = 0; i < oldTemplatePlaceholder.length; i++) {
        let oldPlaceholder = oldTemplatePlaceholder[i]
        let selector = _api.util.getPath(oldTemplate, oldPlaceholder)
        let newPlaceholder = selector == "" ? newTemplate : $api.$()(selector, newTemplate)
        newTemplatePlaceholder.push(newPlaceholder)
    }
    
    // Binding
    let newBinding = link.get("binding").clone()
    let scopes = newBinding.getAll("Scope")
    for (var j = 0; j < scopes.length; j++) {
        let scope =  scopes[j]
        let element = scope.get("element")
        let selector = _api.util.getPath(oldTemplate, element)
        let newElement = selector == "" ? newTemplate : $api.$()(selector, newTemplate)
        if (newElement.length !== 1) {
            throw _api.util.exception("Could not locate element in template clone")
        }
        scope.set("element", newElement)
    }
    
    let newInstance = {
        value: value,
        template: newTemplate,
        binding: newBinding,
        placeholder: {
            template: newTemplatePlaceholder,
            binding: undefined /* TODO */
        }
    }
    
    // Insert template
    if (link.get("instances").length > 0) {
        link.get("instances")[index].template.after(newTemplate)
    } else {
        // link.get("instance") === link.getParent().get("instances")[link.getParent().get("instances").indexOf(link.get("instance")]
        link.get("instance").placeholder.template[link.get("placeholderIndex")].after(newTemplate)
    }
    
    // TODO: Insert Binding
   
    // Add to instances
    link.get("instances").splice(index, 0, newInstance)
    
    return newInstance
 }
 
 _api.engine.iterator.destroyChild = (node) => {
    // TODO
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
    let newLink = _api.preprocessor.iterator.initExpandedIterationNode(node)
    node.get("links").push(newLink)
    
    let collection = node.get("collection")
    let childs = node.childs()
    for (var i = 0; i < collection.length; i++) {
        let newInstance = _api.engine.iterator.addInstance(newLink, i, collection[i])
        for (var j = 0; j < children.length; j++) {
            let child = childs[j]
            let newChildLink = _api.engine.iterator.initChild(child)
            newLink.add(newChildLink)
            newChildLink.set("instance", newInstance)
        }
    }
    
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