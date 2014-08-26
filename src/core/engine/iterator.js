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
        _api.engine.iterator.initInternal(binding, vars, root.childs()[i])
    }
 }
 
 _api.engine.iterator.initInternal = (binding, vars, node) => {
    // Only observes first level iterations, all others will be 
    // observed as soon as created through instances
    vars.localScope.observe(node.get("sourceId"), () => {
        _api.engine.iterator.changeListener(binding, vars, node.get("links")[0])
    })
    _api.engine.iterator.changeListener(binding, vars, node.get("links")[0])
}
 
 _api.engine.iterator.changeListener = (binding, vars, node) => {
    var newCollection = vars.localScope.get(node.get("sourceId"))
    newCollection = newCollection ? newCollection : []
    var oldCollection = node.get("collection")
    node.set("collection", newCollection)
    
    var changes = _api.engine.iterator.levensthein(oldCollection, newCollection)
    for (var i = 0; i < changes.length; i++) {
        switch (changes[i].type) {
            case "remove":
                _api.engine.iterator.remove(binding, node, changes[i].index)
                break
            case "add":
                _api.engine.iterator.add(binding, vars, node, changes[i].index, changes[i].value)
                break
            default:
                throw new _api.util.exception("Internal Error: Unknown change type")
        }
    }
 }
 
 _api.engine.iterator.remove = (binding, node, index) => {
    // TODO
    let childs = node.childs()
    for (var i = 0; i < childs.length; i++) {
        let child = childs[i]
        _api.engine.iterator.destroyChild(binding, child)
    }
 }
 
 _api.engine.iterator.add = (binding, vars, node, index, value) => {
    let childs = node.get("origin").childs()
    let newInstance = _api.engine.iterator.addInstance(binding, node, index, value)
    
    // Initialize new children
    for (var j = 0; j < childs.length; j++) {
        let child = childs[j]
        let newChildLink = _api.engine.iterator.initChild(binding, vars, node, child)
        node.add(newChildLink)
        
        newChildLink.set("instance", newInstance)
    }
    
    // Initialize binding for newInstance
    let observerIds = _api.engine.binding.init(newInstance.template, newInstance.binding)
    newInstance.set("observerIds", observerIds)
 }

 _api.engine.iterator.addInstance = (binding, link, index, value) => {
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
    for (var i = 0; i < scopes.length; i++) {
        let scope =  scopes[i]
        let element = scope.get("element")
        let selector = _api.util.getPath(oldTemplate, element)
        let newElement = selector == "" ? newTemplate : $api.$()(selector, newTemplate)
        if (newElement.length !== 1) {
            throw _api.util.exception("Could not locate element in template clone")
        }
        scope.set("element", newElement)
    }
    
    // Replace same what parent already did
    let bindingRenames = {}
    
    let parentBindingRenames = link.get("instance").bindingRenames
    for (parentBindingRename in parentBindingRenames) {
        bindingRenames[parentBindingRename] = parentBindingRenames[parentBindingRename]
    }
    let linkRenames = link.get("bindingRenames")
    for (linkRename in linkRenames){
        bindingRenames[linkRename] = linkRenames[linkRename]
    }
    
    // Generate new rename for entry and key
    let entryId = link.get("entryId")
    if (entryId) {
        let newEntryId = "temp" + binding.vars.tempCounter.getNext()
        bindingRenames[entryId] = newEntryId
    }
    let keyId = link.get("keyId")
    if (keyId) {
        let newKeyId = "temp" + binding.vars.tempCounter.getNext()
        bindingRenames[keyId] = newKeyId
    }
    
    // Do the renaming
    let variables = newBinding.getAll("Variable")
    for (var i = 0; i < variables.length; i++) {
        let variable = variables[i]
        if (variable.get("ns") !== binding.bindingScopePrefix()) {
            continue 
        }
        for (bindingRename in bindingRenames) {
            let oldId = bindingRename
            let newId = bindingRenames[oldId]
            if (variable.get("id") === oldId) {
                variable.set("id", newId)
            }
        }
    }
    
    // Rename all elements, which are newly introduced in this scope
    
    // Inject entry
    // Inject key
    // Replace all key adapter including sourceId of descendant iterations
    // Replace all entry adapter including sourceIds of descendant iterations
    
    let newInstance = {
        value: value,
        template: newTemplate,
        binding: newBinding,
        bindingRenames: bindingRenames,
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
 
 _api.engine.iterator.destroyChild = (binding, node) => {
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
            _api.engine.iterator.destroyChild(binding, child)
        }
    }
 }
 
 _api.engine.iterator.initChild = (binding, vars, parentLink, node) => {
    let newLink = _api.preprocessor.iterator.initExpandedIterationNode(node)
    node.get("links").push(newLink)
    
    /*let collection = node.get("collection")
    let childs = node.childs()
    for (var i = 0; i < collection.length; i++) {
        let newInstance = _api.engine.iterator.addInstance(binding, newLink, i, collection[i])
        for (var j = 0; j < children.length; j++) {
            let child = childs[j]
            let newChildLink = _api.engine.iterator.initChild(binding, vars, child)
            newLink.add(newChildLink)
            newChildLink.set("instance", newInstance)
        }
    }*/
    
    // Replace in newLink's Binding all sourceIds of Iterations
    for (var i = 0; i < node.childs().length; i++) {
        let child = node.childs()[i]
        let oldSourceId = child.get("sourceId")
        let newSourceId = "temp" + binding.vars.tempCounter.getNext()
        newLink.get("bindingRenames")[oldSourceId] = newSourceId
        // Replace all references in binding
        let variables = newLink.get("binding").getAll("Variable")
        for (var j = 0; j < variables.length; j++) {
            let variable = variables[j]
            if (variable.get("ns") === binding.bindingScopePrefix() &&
                variable.get("id") === oldSourceId) {
                    variable.set("id", newSourceId)
            }
        }
    }
    
    // Change sourceId if appropriate
    if (parentLink.get("bindingRenames")[newLink.get("sourceId")]) {
        newLink.set("sourceId", parentLink.get("bindingRenames")[newLink.get("sourceId")])
    }
    
    // Setup observer
    vars.localScope.observe(newLink.get("sourceId"), () => {
        _api.engine.iterator.changeListener(binding, vars, newLink)
    })
    _api.engine.iterator.changeListener(binding, vars, newLink)
    
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