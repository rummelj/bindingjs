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
    // Init binding of root instance
    _api.engine.binding.init(binding, vars, root.get("links")[0].get("instances")[0])
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
    // Special case for true and false
    if (newCollection instanceof _api.engine.binding.Reference) {
        newCollection = newCollection.getValue()
    }
    newCollection = newCollection ? newCollection : []
    var oldCollection = node.get("collection")
    node.set("collection", newCollection)
    
    let newCollectionType = Object.prototype.toString.call(newCollection)
    if (newCollectionType == "[object Boolean]") {
        if (oldCollection && !newCollection) {
            // Was there, now is not there anymore
            _api.engine.iterator.remove(binding, node, 0)
        } else if (!oldCollection && newCollection) {
            // Was not there, now should be there
            _api.engine.iterator.add(binding, vars, node, 0, true)
        }
    } else {
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
    let newInstance = _api.engine.iterator.addInstance(binding, vars, node, index, value)
    
    // Initialize new children
    for (var j = 0; j < childs.length; j++) {
        let child = childs[j]
        let newChildLink = _api.engine.iterator.initChild(binding, vars, node, child, newInstance)
        node.add(newChildLink)
    }
    
    // Initialize binding for newInstance
    _api.engine.binding.init(binding, vars, newInstance)
 }

 _api.engine.iterator.addInstance = (binding, vars, link, index, value) => {
    console.log("Adding instance, index: " + index + ", value: " + JSON.stringify(value))
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
    
    let bindingRenames = {}
    // Rename all own variables
    let ownVariables = link.get("ownVariables")
    for (var i = 0; i < ownVariables.length; i++) {
        let ownVariable = ownVariables[i]
        bindingRenames[ownVariable] = "temp" + binding.vars.tempCounter.getNext()
    }
    
    // Generate new rename for entry and key
    let entryId = link.get("entryId")
    if (entryId) {
        let newEntryId = "temp" + binding.vars.tempCounter.getNext()
        bindingRenames[entryId] = newEntryId
        // Set the entry in localScope
        vars.localScope.set(newEntryId, value)
    }
    let keyId = link.get("keyId")
    if (keyId) {
        let newKeyId = "temp" + binding.vars.tempCounter.getNext()
        bindingRenames[keyId] = newKeyId
        // Set the key in localScope
        vars.localScope.set(newKeyId, index)
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
        // TODO: This wont work for text based keys
        console.log(index)
        link.get("instances")[index - 1].template.after(newTemplate)
    } else {
        // link.get("instance") === link.getParent().get("instances")[link.getParent().get("instances").indexOf(link.get("instance")]
        link.get("instance").placeholder.template[link.get("placeholderIndex")].after(newTemplate)
    }
   
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
 
 _api.engine.iterator.initChild = (binding, vars, parentLink, node, instance) => {
    let newLink = _api.preprocessor.iterator.initExpandedIterationNode(binding, node, parentLink)
    node.get("links").push(newLink)
    
    newLink.set("instance", instance)
    
    // Change sourceId if appropriate
    if (instance.bindingRenames[newLink.get("sourceId")]) {
        newLink.set("sourceId", instance.bindingRenames[newLink.get("sourceId")])
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
    // TODO: Remove
    if (oldCollection.length == newCollection.length) {
        return result
    }
    for (key in oldCollection) {
        result.push({type: "remove", index: key})
    }
    for (key in newCollection) {
        result.push({type: "add", index: key, value: newCollection[key]})
    }
    return result
 }