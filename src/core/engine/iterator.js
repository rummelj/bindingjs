/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 _api.engine.iterator.mount = (viewDataBinding, mountPoint) => {
    let expandedIterationTreeRoot = viewDataBinding.vars.iterationTree.get("links")[0]
    let iterationInstanceRoot = expandedIterationTreeRoot.get("instances")[0]
    let template = iterationInstanceRoot.template
    // Check if template was mounted before and call destroy observer for sockets
    if (template.parentElement) {
        _api.engine.sockets.callRemoval(viewDataBinding, expandedIterationTreeRoot)
    }
    mountPoint.replaceWith(template)
    _api.engine.sockets.callInsertion(viewDataBinding, expandedIterationTreeRoot)
 }
 
 _api.engine.iterator.unmount = (viewDataBinding) => {
    let expandedIterationTreeRoot = viewDataBinding.vars.iterationTree.get("links")[0]
    let iterationInstanceRoot = expandedIterationTreeRoot.get("instances")[0]
    let template = iterationInstanceRoot.template
    _api.engine.sockets.callRemoval(viewDataBinding, expandedIterationTreeRoot)
    $api.$()(template).detach()
 }
 
 _api.engine.iterator.init = (viewDataBinding) => {
    let root = viewDataBinding.vars.iterationTree
    // Init binding of root instance
    _api.engine.binding.init(viewDataBinding, root.get("links")[0].get("instances")[0])
    viewDataBinding.vars.firstLevelIterationObserverIds = []
    _api.util.each(root.childs(), (plItNode) => {
        let observerId = viewDataBinding.vars.bindingScope.observe(plItNode.get("links")[0].get("sourceId"), () => {
            _api.engine.iterator.changeListener(viewDataBinding, plItNode.get("links")[0])
        })
        _api.engine.iterator.changeListener(viewDataBinding, plItNode.get("links")[0])
        viewDataBinding.vars.firstLevelIterationObserverIds.push(observerId)
    })
 }
 
 _api.engine.iterator.shutdown = (viewDataBinding) => {
    // Opposite of _api.engine.iterator.init in reverse order
    let root = viewDataBinding.vars.iterationTree
    
    _api.util.each(viewDataBinding.vars.firstLevelIterationObserverIds, (observerId) => {
        viewDataBinding.vars.bindingScope.unobserve(observerId)
        // Destroy is not necessary, since in shutdownInternal the values (which might be references for when)
        // will be overwritten and the unobserve is done in bindingScope
    })
    _api.util.each(root.childs(), (child) => {
        _api.engine.iterator.shutdownInternal(viewDataBinding, child)
    })
    _api.engine.binding.shutdown(viewDataBinding, root.get("links")[0].get("instances")[0])
 }

_api.engine.iterator.shutdownInternal = (viewDataBinding, node) => {
    let sourceId = node.get("links")[0].get("sourceId")
    let currentCollection = viewDataBinding.vars.bindingScope.get(sourceId)
    currentCollection = _api.util.convertIfReference(currentCollection)
    currentCollection = _api.util.object.ifUndefined(currentCollection, [])
    
    let newCollection
    if (_api.util.object.isBoolean(currentCollection)) {
        newCollection = false
    } else if (currentCollection instanceof Array) {
        newCollection = []
    } else {
        newCollection = {}
    }
    viewDataBinding.vars.bindingScope.set(sourceId, newCollection)
    
    // Observers are already down, so call the changeListener manually
    _api.engine.iterator.changeListener(viewDataBinding, node.get("links")[0])
}

 _api.engine.iterator.changeListener = (viewDataBinding, expItNode) => {
    let newCollection = viewDataBinding.vars.bindingScope.get(expItNode.get("sourceId"))
    // Special case for true and false or empty collection
    newCollection = _api.util.convertIfReference(newCollection)
    newCollection = _api.util.object.ifUndefined(newCollection, [])
    let oldCollection = expItNode.get("collection")
    expItNode.set("collection", _api.engine.binding.convertToValues(newCollection))
    
    if (_api.util.object.isBoolean(newCollection)) {
        // collection is always initialized with [], so if the boolean arrives for the first time
        // this needs to be interpreted as false
        if (oldCollection instanceof Array) {
            oldCollection = false
        }
        if (oldCollection === true && newCollection === false) {
            // Was there, now is not there anymore
            _api.engine.iterator.remove(viewDataBinding, expItNode, 0)
        } else if (oldCollection === false && newCollection === true) {
            // Was not there, now should be there
            _api.engine.iterator.add(viewDataBinding, expItNode, { key: 0, value: true })
        }
    } else {
        let changes = _api.engine.iterator.levensthein(oldCollection, newCollection)
        for (let i = 0; i < changes.length; i++) {
            switch (changes[i].action) {
                case "remove":
                    _api.engine.iterator.remove(viewDataBinding, expItNode, changes[i].key)
                    break
                case "add":
                    _api.engine.iterator.add(viewDataBinding, expItNode, changes[i].newProperty)
                    break
                case "replace":
                    _api.engine.iterator.replace(viewDataBinding, expItNode, changes[i].key, changes[i].newValue)
                    break
                default:
                    _api.util.assume(false)
            }
        }
        _api.engine.iterator.updateInstances(viewDataBinding, expItNode, newCollection)
    }
 }
 
 _api.engine.iterator.add = (viewDataBinding, expItNode, property) => {
    let newInstance = _api.engine.iterator.addInstance(viewDataBinding, expItNode, property)
    
    // Initialize new children in expanded iteration tree
    _api.util.each(expItNode.get("origin").childs(), (child) => {
        let newChildLink = _api.engine.iterator.initChild(viewDataBinding, expItNode, child, newInstance)
        expItNode.add(newChildLink)
    })
    
    // Initialize binding for newInstance
    _api.engine.binding.init(viewDataBinding, newInstance)
    _api.engine.iterator.refreshKeysAdded(viewDataBinding, expItNode, newInstance, property.key)
 }
 
 _api.engine.iterator.remove = (viewDataBinding, expItNode, key) => {
    // Find instance
    let oldInstance = _api.util.array.findFirst(expItNode.get("instances"), (instance) => {
        return instance.key === key
    })
    if (!oldInstance) {
        throw _api.util.exception("Cannot remove key " + key + " because it does not exist")
    }
    
    _api.engine.binding.shutdown(viewDataBinding, oldInstance)
    
    _api.util.each(expItNode.childs(), (child) => {
        if (child.get("instance") === oldInstance) {
            expItNode.del(child)
            _api.engine.iterator.destroyChild(viewDataBinding, child)
        }
    })

    _api.engine.iterator.removeInstance(viewDataBinding, expItNode, key, oldInstance)
    _api.engine.iterator.refreshKeysRemoved(viewDataBinding, expItNode, key)
 }
 
 _api.engine.iterator.replace = (viewDataBinding, expItNode, key, newValue) => {
    let childrenWithKey = _api.util.array.findAll(expItNode.childs(), (child) => {
        return child.get("instance").key === key
    })
    _api.util.each(childrenWithKey, (child) => {
        viewDataBinding.vars.bindingScope.set(child.get("sourceId"), newValue)
    })
 }
 
 _api.engine.iterator.addInstance = (viewDataBinding, expItNode, property) => {
    // Template
    let oldTemplate = expItNode.get("template")
    let newTemplate = oldTemplate.clone()
    
    // Template Placeholder
    let oldTemplatePlaceholder = expItNode.get("placeholder")
    let newTemplatePlaceholder = []
    for (let i = 0; i < oldTemplatePlaceholder.length; i++) {
        let oldPlaceholder = oldTemplatePlaceholder[i]
        let selector = _api.util.jQuery.getPath(oldTemplate, oldPlaceholder)
        let newPlaceholder = selector === "" ? newTemplate : $api.$()(selector, newTemplate)
        let comment = $api.$()("<!-- -->")
        newPlaceholder.replaceWith(comment)
        newTemplatePlaceholder.push(comment)
    }
    
    // Sockets
    let sockets = expItNode.get("sockets")
    let newSockets = []
    for (let i = 0; i < sockets.length; i++) {
        let socket = sockets[i]
        let element = socket.element
        let selector = _api.util.jQuery.getPath(oldTemplate, element)
        let newElement = selector === "" ? newTemplate : $api.$()(selector,  newTemplate)
        newSockets.push({ element: newElement, id: socket.id })
    }
    
    // Binding
    let newBinding = expItNode.get("binding").clone()
    let scopes = newBinding.getAll("Scope")
    for (let i = 0; i < scopes.length; i++) {
        let scope =  scopes[i]
        let element = scope.get("element")
        let selector = _api.util.jQuery.getPath(oldTemplate, element)
        let newElement = selector === "" ? newTemplate : $api.$()(selector, newTemplate)
        if (newElement.length !== 1) {
            throw _api.util.exception("Could not locate element in template clone")
        }
        scope.set("element", newElement)
    }
    
    // ------------
    // | RENAMING |
    // ------------
    
    let bindingRenames = {}
    // Rename all own variables
    let ownVariables = expItNode.get("ownVariables")
    let newOwnVariables = []
    for (let i = 0; i < ownVariables.length; i++) {
        let ownVariable = ownVariables[i]
        let newOwnVariable = "temp" + viewDataBinding.vars.tempCounter.getNext()
        newOwnVariables.push(newOwnVariable)
        bindingRenames[ownVariable] = newOwnVariable
    }
    
    // Generate new rename for entry and key
    let entryId = expItNode.get("entryId")
    if (entryId) {
        let newEntryId = "temp" + viewDataBinding.vars.tempCounter.getNext()
        bindingRenames[entryId] = newEntryId
        // Set the entry in bindingScope
        viewDataBinding.vars.bindingScope.set(newEntryId, property.value)
        entryId = newEntryId
    }
    let keyId = expItNode.get("keyId")
    if (keyId) {
        let newKeyId = "temp" + viewDataBinding.vars.tempCounter.getNext()
        bindingRenames[keyId] = newKeyId
        // Set the key in bindingScope
        viewDataBinding.vars.bindingScope.set(newKeyId, property.key)
        keyId = newKeyId
    }
    
    // Also rename anything that parent has renamed
    let parentRenames = expItNode.get("instance") ? expItNode.get("instance").bindingRenames : {}
    for (let oldId in parentRenames) {
        bindingRenames[oldId] = parentRenames[oldId]
    }
    
    // Do the renaming
    let variables = newBinding.getAll("Variable")
    for (let i = 0; i < variables.length; i++) {
        let variable = variables[i]
        if (variable.get("ns") !== viewDataBinding.bindingScopePrefix()) {
            continue 
        }
        for (let bindingRename in bindingRenames) {
            let oldId = bindingRename
            let newId = bindingRenames[oldId]
            if (variable.get("id") === oldId) {
                variable.set("id", newId)
            }
        }
    }
    
    // If afterKey is numeric
    let newKey = (!_api.util.object.isDefined(property.afterKey) ||
                  !_api.util.number.isWholePositiveNumber(property.afterKey)) ?
                  property.key : parseInt(property.afterKey) + 1
                  
    let newInstance = {
        key: newKey,
        keyId: keyId,
        entryId: entryId, 
        template: newTemplate,
        binding: newBinding,
        bindingRenames: bindingRenames,
        placeholder: newTemplatePlaceholder,
        sockets: newSockets,
        ownVariables: newOwnVariables
    }
    
    let instances = expItNode.get("instances")
    // Insert template
    // afterKey === -1 means "insert at front"
    if (_api.util.object.isDefined(property.afterKey) &&
          property.afterKey !== -1 &&
          instances.length > 0) {
        // Search for instance with that key and insert after it
        let instanceWithKey = _api.util.array.findFirst(instances, (instance) => {
            return instance.key === property.afterKey
        })
        if (!instanceWithKey) {
            _api.util.assume(false)
        }
        instanceWithKey.template.after(newTemplate)
    } else if (expItNode.get("instance") /* only false if initializing root instance */){
        expItNode.get("instance").placeholder[expItNode.get("placeholderIndex")].after(newTemplate)
    }
   
    // Add to instances
    if (_api.util.object.isDefined(property.afterKey) &&
        property.afterKey + 1 < instances.length) {
        _api.util.array.addAt(instances, newInstance, property.afterKey + 1)
    } else if (expItNode.get("instance")){
        instances.push(newInstance)
    }
    
    // Call sockets
    _api.engine.sockets.callInsertionInstance(viewDataBinding, expItNode, newInstance)
    
    return newInstance
 }
 
 _api.engine.iterator.refreshKeysAdded = (viewDataBinding, expItNode, newInstance, keyAdded) => {
    // Check if collection is array
    if (expItNode.get("collection") instanceof Array) {
        // Increase key of all instances greater than keyAdded by one
        _api.util.each(expItNode.get("instances"), (instance) => {
            if (instance !== newInstance && instance.key >= keyAdded) {
                // Update key
                instance.key = parseInt(instance.key) + 1
                viewDataBinding.vars.bindingScope.set(instance.keyId, instance.key)
            }
        })
    }
 }
 
 _api.engine.iterator.removeInstance = (viewDataBinding, expItNode, key, instance) => {
    // Call sockets
    _api.engine.sockets.callRemovalInstance(viewDataBinding, expItNode, instance)
    // Remove from instances
    _api.util.array.remove(expItNode.get("instances"), instance)
    // Remove template
    instance.template.detach()
    // Kill the entries in bindingScope for entry and key (to destroy probable observers)
    if (instance.entryId) {
        viewDataBinding.vars.bindingScope.destroy(instance.entryId)
    }
    if (instance.keyId) {
        viewDataBinding.vars.bindingScope.destroy(instance.keyId)
    }
    // Kill all own variables
    let ownVariables = instance.ownVariables
    for (let i = 0; i < ownVariables.length; i++) {
        viewDataBinding.vars.bindingScope.destroy(ownVariables[i])
    }
 }
 
 _api.engine.iterator.refreshKeysRemoved = (viewDataBinding, expItNode, keyRemoved) => {
    // Check if collection is array
    if (expItNode.get("collection") instanceof Array) {
        // Reduce key of all instances greater than keyRemoved by one
        _api.util.each(expItNode.get("instances"), (instance) => {
            if (instance.key > keyRemoved) {
                // Update key
                instance.key = parseInt(instance.key) - 1
                viewDataBinding.vars.bindingScope.set(instance.keyId, instance.key)
            }
        })
    }
 }
 
 _api.engine.iterator.updateInstances = (viewDataBinding, expItNode, newCollection) => {
    if (newCollection instanceof Array) {
        _api.util.assume(expItNode.get("instances").length === newCollection.length)
        _api.util.each(expItNode.get("instances"), (instance, index) => {
            let oldElement = viewDataBinding.vars.bindingScope.get(instance.entryId)
            let newElement = newCollection[index]
            let oldIsRef = _api.util.isReference(oldElement)
            let newIsRef = _api.util.isReference(newElement)
            if (oldIsRef && newIsRef && !_api.util.object.equals(oldElement.getPath(), newElement.getPath())) {
                viewDataBinding.vars.bindingScope.set(instance.entryId, newElement)
            }   
        })
    }
 }
 
 _api.engine.iterator.initChild = (viewDataBinding, parentExpItNode, plItNode, instance) => {
    let expItNode = _api.preprocessor.iterator.initExpandedIterationNode(viewDataBinding, plItNode, parentExpItNode)
    plItNode.get("links").push(expItNode)
    expItNode.set("instance", instance)
    
    // Change sourceId if appropriate
    if (instance.bindingRenames[expItNode.get("sourceId")]) {
        expItNode.set("sourceId", instance.bindingRenames[expItNode.get("sourceId")])
    }
    
    // Setup observer
    let sourceObserverId = viewDataBinding.vars.bindingScope.observe(expItNode.get("sourceId"), () => {
        _api.engine.iterator.changeListener(viewDataBinding, expItNode)
    })
    _api.engine.iterator.changeListener(viewDataBinding, expItNode)
    
    // Store observerId
    expItNode.set("sourceObserverId", sourceObserverId)
    
    return expItNode
 }
 
 _api.engine.iterator.destroyChild = (viewDataBinding, expItNode) => {
    // Unobserve
    viewDataBinding.vars.bindingScope.unobserve(expItNode.get("sourceObserverId"))
    
    // Reset collection to empty collections or false
    let sourceId = expItNode.get("sourceId")
    let currentCollection = viewDataBinding.vars.bindingScope.get(sourceId)
    currentCollection = _api.util.convertIfReference(currentCollection)
    currentCollection = _api.util.object.ifUndefined(currentCollection, [])
    
    let newCollection = null
    if (_api.util.object.isBoolean(currentCollection)) {
        newCollection = false
    } else if (currentCollection instanceof Array) {
        newCollection = []
    } else {
        newCollection = {}
    }
    
    viewDataBinding.vars.bindingScope.set(sourceId, newCollection)
    
    // Observers are already down, so call the changeListener manually
    _api.engine.iterator.changeListener(viewDataBinding, expItNode)
    
    // Remove from links of origin
    _api.util.array.remove(expItNode.get("origin").get("links"), expItNode)
 }
 
 _api.engine.iterator.levensthein = (oldCollection, newCollection) => {
    
    // New Collection might contain references
    let newValues = []
    for (let key in newCollection) {
        newValues[key] = _api.engine.binding.convertToValues(newCollection[key])
    }
    
    let result = [];
    // Use levensthein to compare arrays
    if (oldCollection instanceof Array && newCollection instanceof Array) {
        // Levensthein
        let matrix = [];
         
        // increment along the first column of each row
        for (let i = 0; i <= newCollection.length; i++) {
            matrix[i] = [i];
        }
         
        // increment each column in the first row
        for (let j = 0; j <= oldCollection.length; j++) {
            matrix[0][j] = j
        }
         
        // Fill in the rest of the matrix
        for (let i = 1; i <= newCollection.length; i++) {
            for (let j = 1; j <= oldCollection.length; j++) {
                if (_api.util.object.equals(newValues[i-1], oldCollection[j-1])) {
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                            Math.min(matrix[i][j-1] + 1, // insertion
                                                     matrix[i-1][j] + 1)); // deletion
                }
            }
        }
        
        // Reconstruct changes from matrix
        let x = newCollection.length
        let y = oldCollection.length
        
        while (x >= 0 && y >= 0) {
            let current = matrix[x][y];
            let diagonal = x - 1 >= 0 && y - 1 >= 0 ? matrix[x-1][y-1] : Number.MAX_VALUE
            let vertical = x - 1 >= 0 ? matrix[x-1][y] : Number.MAX_VALUE
            let horizontal = y - 1 >= 0 ? matrix[x][y-1] : Number.MAX_VALUE
            if (diagonal <= Math.min(horizontal, vertical)) {
                x--
                y--
                if (diagonal === current || diagonal + 1 === current) {
                    if (diagonal + 1 === current) {
                        result.push({ action: "replace", key: y, newValue: newCollection[x] })
                    } 
                }
            } else if (horizontal <= vertical && horizontal === current || horizontal + 1 === current) {
                y--
                result.push({ action: "remove", key: y })
            } else {
                x--;
                result.push({ action: "add",
                               newProperty: { afterKey: y-1,
                                              key: x,
                                              value: newCollection[x] }
                           })
            }
        }
        
        result.reverse()
        for (let i = 0; i < result.length; i++) {
            let change = result[i]
            if (change.action === "add") {
                for (let j = i + 1; j < result.length; j++) {
                    let laterChange = result[j]
                    if (laterChange.action === "replace" || laterChange.action === "remove") {
                        if (laterChange.key >= change.newProperty.afterKey) {
                            laterChange.key++
                        }
                    } else /* is add */ {
                        if (laterChange.newProperty.key >= change.newProperty.afterKey) {
                            laterChange.newProperty.afterKey++
                        }
                    }
                }
            } else if (change.action === "remove") {
                for (let j = i + 1; j < result.length; j++) {
                    let laterChange = result[j]
                    if (laterChange.action === "replace" || laterChange.action === "remove") {
                        if (laterChange.key >= change.key) {
                            laterChange.key--
                        }
                    } else /* is add */ {
                        if (laterChange.newProperty.key >= change.key) {
                            laterChange.newProperty.afterKey--
                        }
                    }
                }
            }
        }
    } else {
        // Use a simple diff for objects
        for (let key in oldCollection) {
            if (oldCollection.hasOwnProperty(key) && !newCollection.hasOwnProperty(key)) {
                result.push({ action: "remove", key: key })
            } else if (oldCollection.hasOwnProperty(key) && newCollection.hasOwnProperty(key) &&
                       !_api.util.object.equals(oldCollection[key], newCollection[key])) {
                result.push({ action: "replace", key: key, newValue: newCollection[key] })
            }
        }
        let last
        for (let key in newCollection) {
            if (newCollection.hasOwnProperty(key) && !oldCollection.hasOwnProperty(key)) {
                result.push( {action: "add", newProperty: { afterKey: last, key: key, value: newCollection[key] } } )
                last = key
            }
        }
    }
     
    return result
 }