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
    vars.localScope.observe(node.get("links")[0].get("sourceId"), () => {
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
            switch (changes[i].action) {
                case "remove":
                    _api.engine.iterator.remove(binding, node, changes[i].index)
                    break
                case "add":
                    _api.engine.iterator.add(binding, vars, node, changes[i].index, changes[i].newProperty)
                    break
                case "replace":
                    // TODO
                    break
                default:
                    throw new _api.util.exception("Internal Error: Unknown change action")
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
 
 _api.engine.iterator.add = (binding, vars, node, index, property) => {
    let childs = node.get("origin").childs()
    let newInstance = _api.engine.iterator.addInstance(binding, vars, node, index, property)
    
    // Initialize new children
    for (var j = 0; j < childs.length; j++) {
        let child = childs[j]
        let newChildLink = _api.engine.iterator.initChild(binding, vars, node, child, newInstance)
        node.add(newChildLink)
    }
    
    // Initialize binding for newInstance
    _api.engine.binding.init(binding, vars, newInstance)
 }

 _api.engine.iterator.addInstance = (binding, vars, link, index, property) => {
    $api.debug(8, "Adding instance, index: " + index + ", value: " + JSON.stringify(property.value))
    let instances = link.get("instances")
    
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
        vars.localScope.set(newEntryId, property.value)
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
        value: property.value,
        template: newTemplate,
        binding: newBinding,
        bindingRenames: bindingRenames,
        placeholder: {
            template: newTemplatePlaceholder,
            binding: undefined /* TODO */
        }
    }
    
    // Insert template
    if (index /* might be undefined, means insert at front */
        && link.get("instances").length > 0) {
        // Search for instance with that key and insert after it
        for (var i = 0; i < link.get("instances").length; i++) {
            let instance = link.get("instances")[i]
            if (instance.key == index) {
                instance.template.after(newTemplate)
            }
        }
    } else {
        // link.get("instance") === link.getParent().get("instances")[link.getParent().get("instances").indexOf(link.get("instance")]
        link.get("instance").placeholder.template[link.get("placeholderIndex")].after(newTemplate)
    }
   
    // Add to instances
    link.get("instances").push(newInstance)
    
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
                    result.push({ action: "replace", newValue: newCollection[afterMap[x]], index: beforeMap[y] })
                } 
            }
        } else if (horizontal <= vertical && horizontal == current || horizontal + 1 == current) {
            y--
            result.push({ action: "remove", index: beforeMap[y] })
        } else {
            x--;
            result.push({ action: "add",
                           newProperty: { key: afterMap[x], value: newCollection[afterMap[x]]  },
                           index /* after */: beforeMap[y - 1] /* this might be undefined */
                       })
        }
    }
     
    return result
 }