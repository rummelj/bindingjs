/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 _api.engine.iterator.mount = (binding, mountPoint) => {
    let template = binding.vars.iterationTree.get("links")[0].get("instances")[0].template[0]
    // Check if template was mounted before and call destroy observer for slots
    if (template.parentElement) {
        _api.engine.iterator.callSlotRemovalObserver(binding, binding.vars.iterationTree.get("links")[0])
    }
    mountPoint.replaceWith(template)
    _api.engine.iterator.callSlotInsertionObserver(binding, binding.vars.iterationTree.get("links")[0])
 }
 
 _api.engine.iterator.callSlotRemovalObserver = (binding, node) => {
    for (var i = 0; i < node.get("instances").length; i++) {
        let instance = node.get("instances")[i]
        _api.engine.iterator.callSlotRemovalObserverInstance(binding, node, instance)
    }
    
    for (var i = 0; i < node.childs().length; i++) {
        _api.engine.iterator.callSlotRemovalObserver(binding, node.childs()[i])
    }
 }
 
 _api.engine.iterator.callSlotInsertionObserver = (binding, node) => {
    for (var i = 0; i < node.get("instances").length; i++) {
        let instance = node.get("instances")[i]
        _api.engine.iterator.callSlotInsertionObserverInstance(binding, node, instance)
    }
    
    for (var i = 0; i < node.childs().length; i++) {
        _api.engine.iterator.callSlotInsertionObserver(binding, node.childs()[i])
    }
 }
 
 _api.engine.iterator.callSlotRemovalObserverInstance = (binding, node, instance) => {
    if (instance.slots.length > 0) {
        let keys = []
        // Do not add key, if this is the root node
        if (node.getParent()) {
            keys.push(instance.key)
        }
        // If not node.getParent().getParent() means, that node.get("instance") refers to the instance of root
        while (node.getParent() && node.getParent().getParent() && node.get("instance")) {
            keys.push(node.get("instance").key)
            node = node.getParent()
        }
        for (var i = 0; i < instance.slots.length; i++) {
            let slot = instance.slots[i]
            let id = slot.id
            let element = slot.element
            let callbacks = binding.vars.slotRemovalObserver[id]
            if (callbacks) {
                for (var j = 0; j < callbacks.length; j++) {
                    let callback = callbacks[j]
                    callback(keys, element)
                }
            }
        }
    }
 }
 
 _api.engine.iterator.callSlotInsertionObserverInstance = (binding, node, instance) => {
    if (instance.slots.length > 0) {
        let keys = []
        // Do not add key, if this is the root node
        if (node.getParent()) {
            keys.push(instance.key)
        }
        // If not node.getParent().getParent() means, that node.get("instance") refers to the instance of root
        while (node.getParent() && node.getParent().getParent() && node.get("instance")) {
            keys.push(node.get("instance").key)
            node = node.getParent()
        }
        for (var i = 0; i < instance.slots.length; i++) {
            let slot = instance.slots[i]
            let id = slot.id
            let element = slot.element
            let callbacks = binding.vars.slotInsertionObserver[id]
            if (callbacks) {
                for (var j = 0; j < callbacks.length; j++) {
                    let callback = callbacks[j]
                    callback(keys, element)
                }
            }
        }
    }
 }
 
 _api.engine.iterator.init = (binding) => {
    var root = binding.vars.iterationTree
    // Init binding of root instance
    _api.engine.binding.init(binding, root.get("links")[0].get("instances")[0])
    for (var i = 0; i < root.childs().length; i++) {
        _api.engine.iterator.initInternal(binding, root.childs()[i])
    }
 }
 
 _api.engine.iterator.initInternal = (binding, node) => {
    // Only observes first level iterations, all others will be 
    // observed as soon as created through instances
    binding.vars.localScope.observe(node.get("links")[0].get("sourceId"), () => {
        _api.engine.iterator.changeListener(binding, node.get("links")[0])
    })
    _api.engine.iterator.changeListener(binding, node.get("links")[0])
}
 
 _api.engine.iterator.changeListener = (binding, node) => {
    var newCollection = binding.vars.localScope.get(node.get("sourceId"))
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
            _api.engine.iterator.add(binding, node, { key: 0, value: true })
        }
    } else {
        var changes = _api.engine.iterator.levensthein(oldCollection, newCollection)
        for (var i = 0; i < changes.length; i++) {
            switch (changes[i].action) {
                case "remove":
                    _api.engine.iterator.remove(binding, node, changes[i].key)
                    break
                case "add":
                    _api.engine.iterator.add(binding, node, changes[i].newProperty)
                    break
                case "replace":
                    _api.engine.iterator.replace(binding, node, changes[i].key, changes[i].newValue)
                    break
                default:
                    throw new _api.util.exception("Internal Error: Unknown change action")
            }
        }
    }
 }
 
 _api.engine.iterator.add = (binding, node, property) => {
    let childs = node.get("origin").childs()
    let newInstance = _api.engine.iterator.addInstance(binding, node, property)
    
    // Initialize new children
    for (var j = 0; j < childs.length; j++) {
        let child = childs[j]
        let newChildLink = _api.engine.iterator.initChild(binding, node, child, newInstance, property.key)
        node.add(newChildLink)
    }
    
    // Initialize binding for newInstance
    _api.engine.binding.init(binding, newInstance)
 }
 
 _api.engine.iterator.remove = (binding, node, key) => {
    // Find instance
    let oldInstance
    let instances = node.get("instances")
    for (var i = 0; i < instances.length; i++) {
        let instance = instances[i]
        if (instance.key == key) {
            oldInstance = instance
            break
        }
    }
    if (!oldInstance) {
        throw _api.util.exception("Cannot remove key " + key + " because it does not exist")
    }
    
    // Do the opposite of _api.engine.iterator.add in reverse order
    _api.engine.binding.shutdown(binding, oldInstance)
    
    let childs = node.childs()
    for (var i = 0; i < childs.length; i++) {
        let child = childs[i]
        if (child.get("instance") === oldInstance) {
            node.del(child)
            _api.engine.iterator.destroyChild(binding, child)
        }
    }
    
    _api.engine.iterator.removeInstance(binding, node, key, oldInstance)
 }
 
 _api.engine.iterator.replace = (binding, node, key, newValue) => {
    for (var i = 0; i < node.childs().length; i++) {
        let child = node.childs()[i]
        if (child.get("key") == key) {
            binding.vars.localScope.set(child.get("sourceId"), newValue)
        }
    }
 }
 
 _api.engine.iterator.addInstance = (binding, link, property) => {
    $api.debug(8, "Adding instance, property.key: " + property.key)
    let instances = link.get("instances")
    
    // Template
    let oldTemplate = link.get("template")
    let newTemplate = oldTemplate.clone()
    
    // Template Placeholder
    let oldTemplatePlaceholder = link.get("placeholder")
    let newTemplatePlaceholder = []
    for (var i = 0; i < oldTemplatePlaceholder.length; i++) {
        let oldPlaceholder = oldTemplatePlaceholder[i]
        let selector = _api.util.getPath(oldTemplate, oldPlaceholder)
        let newPlaceholder = selector == "" ? newTemplate : $api.$()(selector, newTemplate)
        newTemplatePlaceholder.push(newPlaceholder)
    }
    
    // Update slots
    let slots = link.get("slots")
    let newSlots = []
    for (var i = 0; i < slots.length; i++) {
        let slot = slots[i]
        let element = slot.element
        let selector = _api.util.getPath(oldTemplate, element)
        let newElement = selector == "" ? newTemplate : $api.$()(selector,  newTemplate)
        newSlots.push({ element: newElement, id: slot.id })
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
        binding.vars.localScope.set(newEntryId, property.value)
        entryId = newEntryId
    }
    let keyId = link.get("keyId")
    if (keyId) {
        let newKeyId = "temp" + binding.vars.tempCounter.getNext()
        bindingRenames[keyId] = newKeyId
        // Set the key in localScope
        binding.vars.localScope.set(newKeyId, property.key)
        keyId = newKeyId
    }
    
    // Do the renaming
    let variables = newBinding.getAll("Variable")
    for (var i = 0; i < variables.length; i++) {
        let variable = variables[i]
        if (variable.get("ns") !== binding.bindingScopePrefix()) {
            continue 
        }
        for (var bindingRename in bindingRenames) {
            let oldId = bindingRename
            let newId = bindingRenames[oldId]
            if (variable.get("id") === oldId) {
                variable.set("id", newId)
            }
        }
    }
    
    let newInstance = {
        key: property.key,
        keyId: keyId,
        entryId: entryId, 
        template: newTemplate,
        binding: newBinding,
        bindingRenames: bindingRenames,
        placeholder: newTemplatePlaceholder,
        slots: newSlots
    }
    
    // Insert template
    if (property.afterKey && link.get("instances").length > 0) {
        // Search for instance with that key and insert after it
        for (var i = 0; i < link.get("instances").length; i++) {
            let instance = link.get("instances")[i]
            if (instance.key == property.afterKey) {
                instance.template.after(newTemplate)
                break
            }
        }
    } else {
        // link.get("instance") === link.getParent().get("instances")[link.getParent().get("instances").indexOf(link.get("instance")]
        link.get("instance").placeholder[link.get("placeholderIndex")].after(newTemplate)
    }
   
    // Add to instances
    link.get("instances").push(newInstance)
    
    // Call slots
    _api.engine.iterator.callSlotInsertionObserverInstance(binding, link, newInstance)
    
    return newInstance
 }
 
 _api.engine.iterator.removeInstance = (binding, link, key, instance) => {
    $api.debug(8, "Removing instance, key: " + key)
    // Do the opposite of everything relevant from _api.engine.iterator.addInstance in reverse order
    
    // Call slots
    _api.engine.iterator.callSlotRemovalObserverInstance(binding, link, instance)
    
    // Remove from instances
    link.get("instances").splice(link.get("instances").indexOf(instance), 1)
    
    // Remove template
    instance.template.detach()
    
    // Kill the entries in localScope for entry and key (to destroy probable observers)
    if (instance.entryId) {
        binding.vars.localScope.destroy(instance.entryId)
    }
    if (instance.keyId) {
        binding.vars.localScope.destroy(instance.keyId)
    }
 }
 
 _api.engine.iterator.initChild = (binding, parentLink, node, instance, key) => {
    let newLink = _api.preprocessor.iterator.initExpandedIterationNode(binding, node, parentLink)
    node.get("links").push(newLink)
    
    newLink.set("instance", instance)
    
    // Change sourceId if appropriate
    if (instance.bindingRenames[newLink.get("sourceId")]) {
        newLink.set("sourceId", instance.bindingRenames[newLink.get("sourceId")])
    }
    
    // Setup observer
    let sourceObserverId = binding.vars.localScope.observe(newLink.get("sourceId"), () => {
        _api.engine.iterator.changeListener(binding, newLink)
    })
    _api.engine.iterator.changeListener(binding, newLink)
    
    // Store observerId
    newLink.set("sourceObserverId", sourceObserverId)
    // Store key
    newLink.set("key", key)
    
    return newLink
 }
 
 _api.engine.iterator.destroyChild = (binding, newLink) => {
    // Do the opposite of _api.engine.iterator.initChild in reverse order
    
    // Unobserve
    binding.vars.localScope.unobserve(newLink.get("sourceObserverId"))
    
    // _api.engine.iterator.changeListener(binding, newLink)
    // led to children being added, so act as if all those were removed
    let childs = newLink.childs()
    for (var i = 0; i < childs.length; i++) {
        _api.engine.iterator.remove(binding, childs[i], newLink.get("key"))
    }
    _api.engine.iterator.remove(binding, node, changes[i].key)
    
    // Remove from links of origin
    let originLinks = newLink.get("origin").get("links")
    originLinks.splice(originLinks.indexOf(newLink), 1)
    
    _api.preprocessor.iterator.shutdownExpandedIterationNode(binding, newLink)
 }
 
 _api.engine.iterator.levensthein = (oldCollection, newCollection) => {
    // Both collections may contain references, to compare them,
    // they must be first converted to values
    let oldValues = []
    for (var key in oldCollection) {
        oldValues[key] = _api.engine.binding.convertToValues(oldCollection[key])
    }
    let newValues = []
    for (var key in newCollection) {
        newValues[key] = _api.engine.binding.convertToValues(newCollection[key])
    }
    
    // We cannot use the original keys, because they might be arbitrary
    let before = []
    let beforeMap = {}
    for (var key in oldValues) {
        beforeMap[before.length] = key
        before.push(oldValues[key])
    }
    let after = []
    let afterMap = {}
    for (var key in newValues) {
        afterMap[after.length] = key
        after.push(newValues[key])
    }
     
    // Levensthein
    let matrix = [];
     
    // increment along the first column of each row
    for (var i = 0; i <= after.length; i++) {
        matrix[i] = [i];
    }
     
    // increment each column in the first row
    for (var j = 0; j <= before.length; j++) {
        matrix[0][j] = j
    }
     
    // Fill in the rest of the matrix
    for (var i = 1; i <= after.length; i++) {
        for (var j = 1; j <= before.length; j++) {
            if (_api.util.objectEquals(after[i-1], before[j-1])) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                        Math.min(matrix[i][j-1] + 1, // insertion
                                                 matrix[i-1][j] + 1)); // deletion
            }
        }
    }
    
    // Reconstruct changes from matrix
    let x = after.length
    let y = before.length
    let result = [];
    while (x >= 0 && y >= 0) {
        let current = matrix[x][y];
        let diagonal = x - 1 >= 0 && y - 1 >= 0 ? matrix[x-1][y-1] : Number.MAX_VALUE
        let vertical = x - 1 >= 0 ? matrix[x-1][y] : Number.MAX_VALUE
        let horizontal = y - 1 >= 0 ? matrix[x][y-1] : Number.MAX_VALUE
        if (diagonal <= Math.min(horizontal, vertical)) {
            x--
            y--
            if (diagonal == current || diagonal + 1 == current) {
                if (diagonal + 1 == current) {
                    result.push({ action: "replace", key: beforeMap[y], newValue: newCollection[afterMap[x]] })
                } 
            }
        } else if (horizontal <= vertical && horizontal == current || horizontal + 1 == current) {
            y--
            result.push({ action: "remove", key: beforeMap[y] })
        } else {
            x--;
            result.push({ action: "add",
                           newProperty: { afterKey: beforeMap[y - 1] ,key: afterMap[x], value: newCollection[afterMap[x]] }
                       })
        }
    }
     
    return result
 }