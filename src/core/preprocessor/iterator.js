/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
 _api.preprocessor.iterator.setupIterationTree = (binding, template) => {
    let root = true
    let iteratedNode = new _api.util.Tree("PlainIteration")
    iteratedNode.set("placeholder", [])
    // Move the iteration information into interatedNode
    if (binding.isA("Scope") && binding.hasChild("Iterator")) {
        root = false
        // Create iterated node
        let iterator = binding.childs()[0]
        if (!iterator.isA("Iterator")) {
            throw _api.util.exception("Expected the first child of an iterated " +
                                      "scope to be Iterator, but it was not")
        }
        let variables = iterator.getAll("Variables")
        if (variables.length !== 1) {
            throw _api.util.exception("Expected Iterator to have exactly one descendant " +
                                      "with type Variables")
        }
        
        // Parse variables
        let variableNodes = variables[0].getAll("Variable")
        if (variableNodes.length === 1) {
            iteratedNode.set("entryId", variableNodes[0].get("id"))
        } else if (variableNodes.length === 2) /* Could also be 0 */ {
            // TODO: Think about if (@key, @entry : @coll) feels more naturally (?)
            iteratedNode.set("entryId", variableNodes[0].get("id"))
            iteratedNode.set("keyId", variableNodes[1].get("id"))
        }
        
        // After the preprocessing the iterator always has a temp ref as input
        let exprs = iterator.getAll("Expr")
        if (exprs.length !== 1) {
            throw _api.util.exception("Expected Iterator to always have exactly one " +
                                      "child with type Expr")
        }
        if (!exprs[0].childs().length === 1) {
            throw _api.util.exception("Expected the Expr in Iteration to always have " +
                                     "exactly one child")
        }
        let inputVariable = exprs[0].childs()[0]
        if (!inputVariable.isA("Variable")) {
            throw _api.util.exception("Expected the expr of an iteration to always " +
                                      "be a Variable after the preprocessing")
        }
        iteratedNode.set("sourceId", inputVariable.get("id"))
        
        // Delete the iterator
        binding.del(iterator)
    }
    
    var iterators = binding.getAll("Iterator")
    // Filter out all, that are nested in other iterators
    for (var i = 0; i < iterators.length; i++) {
        let iterator = iterators[i]
        let scope = iterator.getParent()
        if (!scope.isA("Scope")) {
            throw _api.util.exception("Assumed that the parent of an Iterator " +
                                      "always is a scope, but it was not")
        }
        
        // Check if this iterator is nested inside other iterators
        let nested = false
        let temp = scope.getParent()
        while (temp && !nested) {
            if (temp.isA("Scope") && temp.hasChild("Iterator")) {
                // Remove this iterator since it is nested inside other
                // Iterators
                nested = true
                break
            }
            temp = temp.getParent()
        }
        
        if (nested) {
            // Remove this iterator
            iterators.splice(i, 1)
            i--
        }
    }
    
    // Set template
    if (!root) {
        let $template = $api.$()(template)
        // Tag names starting with numbers are invalid, so always prepend BindingJS-
        let virtual = $api.$()("<BindingJS-" + _api.util.getGuid() + " />")
        $template.after(virtual)
        $template.detach()
        iteratedNode.set("iterationTemplate", $template)
        iteratedNode.set("template", virtual)
    } else {
        iteratedNode.set("template", template)
    }
    
    // Recursion
    for (var i = 0; i < iterators.length; i++) {
        let iterator = iterators[i]
        let scope = iterator.getParent()
        
        // Recursion
        let child = _api.preprocessor.iterator.setupIterationTree(scope, scope.get("element"))
        
        // Cut out childs binding
        scope.getParent().del(scope)
        iteratedNode.get("placeholder").push(child.get("template"))
        
        iteratedNode.add(child)
    }
    iteratedNode.set("binding", binding.clone())
    
    // Set collection
    if (!root) {
        iteratedNode.set("collection", [])
    } else {
        iteratedNode.set("collection", true)
    }
    
    // Set links
    iteratedNode.set("links", [])

    return iteratedNode
 }
 
 _api.preprocessor.iterator.setupExpandedIterationTree = (bindingObj, root) => {
    let rootLink = _api.preprocessor.iterator.initExpandedIterationNode(bindingObj, root)
    
    // rootLink always exactly has one instance, the placeholder in rootLink
    // will never have to be located again, so they can be safely replaced
    let placeholder = rootLink.get("placeholder")
    for (var i = 0; i < placeholder.length; i++) {
        let comment = $api.$()("<!-- -->")
        placeholder[i].replaceWith(comment)
        placeholder[i] = comment
    }
    let rootInstance = {
        template: rootLink.get("template"),
        binding: rootLink.get("binding"),
        bindingRenames: rootLink.get("bindingRenames"),
        placeholder: rootLink.get("placeholder"),
        slots: rootLink.get("slots")
    }
    rootLink.set("instances", [rootInstance])
    
    // Add the rootLink to root
    root.set("links", [rootLink])
    
    // Each child iteration of root is initially present without instances
    for (var i = 0; i < root.childs().length; i++) {
        let child = root.childs()[i]
        let newChildLink =  _api.preprocessor.iterator.initExpandedIterationNode(bindingObj, child, rootLink)
        newChildLink.set("instance", rootInstance)
        
        child.set("links", [newChildLink])
        rootLink.add(newChildLink)
    }
    
    return rootLink
 }
 
 _api.preprocessor.iterator.initExpandedIterationNode = (bindingObj, node, parentLink) => {
    let result = new _api.util.Tree("ExpandedIteration")
    
    let isRoot = !node.getParent()
    let oldTemplate = isRoot ? node.get("template") : node.get("iterationTemplate")
    let template = oldTemplate.clone()
    let binding = node.get("binding").clone()
    result.set("template", template)
    result.set("binding", binding)
    result.set("instances", [])
    result.set("placeholderIndex", isRoot ? -1 : node.getParent().childs().indexOf(node))
    result.set("sourceId", node.get("sourceId"))
    result.set("origin", node)
    result.set("collection", [])
    
    // Update template placeholders
    result.set("placeholder", [])
    
    let templatePlList = node.get("placeholder")
    for (var i = 0; i < templatePlList.length; i++) {
        let templatePl = templatePlList[i]
        let selector = _api.util.getPath(oldTemplate, templatePl)
        let newPlaceholder = selector == "" ? template : $api.$()(selector, template)
        result.get("placeholder").push(newPlaceholder)
    }
    
    // Update slots
    let slots = node.get("slots")
    result.set("slots", [])
    for (var i = 0; i < slots.length; i++) {
        let slot = slots[i]
        let element = slot.element
        let selector = _api.util.getPath(oldTemplate, element)
        let newElement = selector == "" ? template : $api.$()(selector,  template)
        result.get("slots").push({ element: newElement, id: slot.id })
    }
    
    // The references inside binding still refer to the template before it was cloned
    let scopes = binding.getAll("Scope")
    for (var i = 0; i < scopes.length; i++) {
        let scope =  scopes[i]
        let element = scope.get("element")
        let selector = _api.util.getPath(oldTemplate, element)
        let newElement = selector == "" ? template : $api.$()(selector, template)
        if (newElement.length !== 1) {
            throw _api.util.exception("Could not locate element in template clone")
        }
        scope.set("element", newElement)
    }
    
    // ------------
    // | RENAMING |
    // ------------
    
    // Rename whatever parent has already renamed, including own sourceId
    let variables = result.get("binding").getAll("Variable")
    let parentRenames = parentLink ? parentLink.get("bindingRenames") : []
    if (!$api.$().isEmptyObject(parentRenames)) {
        // Do the renaming
        for (var i = 0; i < variables.length; i++) {
            let variable = variables[i]
            for (var oldId in parentRenames) {
                if (variable.get("ns") == bindingObj.bindingScopePrefix() &&
                    variable.get("id") == oldId) {
                        variable.set("id", parentRenames[oldId]) 
                }
            }
        }   
        // Including source
        if (parentRenames[result.get("sourceId")]) {
            result.set("sourceId", parentRenames[result.get("sourceId")])
        }
    }
    
    // Find all tempVariables in node, which are in no ancestor
    let ancestorOwnVariables = []
    let parent = parentLink
    while (parent) {
        for (var i = 0; i < parent.get("ownVariables").length; i++) {
            ancestorOwnVariables.push(parent.get("ownVariables")[i])
        }
        parent = parent.getParent()
    }
    
    let ownVariables = []
    for (var i = 0; i < variables.length; i++) {
        let variable = variables[i]
        if (variable.get("ns") == bindingObj.bindingScopePrefix() &&
            ancestorOwnVariables.indexOf(variable.get("id")) == -1) {
            ownVariables.push(variable.get("id"))
        }
    }
    // Entry and key are own variables too
    if (node.get("entryId")) {
        ownVariables.push(node.get("entryId"))
    }
    if (node.get("keyId")) {
        ownVariables.push(node.get("keyId"))
    }
    
    // Store ownVariables
    result.set("ownVariables", ownVariables)
    
    
    // For each own variable add an own rename
    let ownRenames = {}
    for (var i = 0; i < ownVariables.length; i++) {
        let ownVariable = ownVariables[i]
        let newId = "temp" + bindingObj.vars.tempCounter.getNext()
        ownRenames[ownVariable] = newId
        // the own variable will be renamed and this is reflected already
        ownVariables[i] = newId
    }
    
    // Do the ownRenames renaming
    for (var i = 0; i < variables.length; i++) {
        let variable = variables[i]
        for (var oldId in ownRenames) {
            if (variable.get("ns") == bindingObj.bindingScopePrefix() &&
                variable.get("id") == oldId) {
                    variable.set("id", ownRenames[oldId]) 
            }
        }
    }   
    // The source id can never be an own variable, so it is not included
    
    // Since entry and key id are always ownVariables, they need to be renamed in the result
    let oldEntryId = node.get("entryId")
    if (oldEntryId) {
        result.set("entryId", ownRenames[oldEntryId])
    }
    let oldKeyId = node.get("keyId")
    if (oldKeyId) {
        result.set("keyId", ownRenames[oldKeyId])
    }
    
    // The final set of renames for this node is both, parentRenames and ownRenames
    // Copy parentRenames
    let bindingRenames = $api.$().extend({}, parentRenames)
    // Add entries from ownRenames
    for (var oldId in ownRenames) {
        bindingRenames[oldId] = ownRenames[oldId]
    }
    result.set("bindingRenames", bindingRenames)
    
    return result
 }
 
 _api.preprocessor.iterator.shutdownExpandedIterationNode = (binding, newLink) => {
    // Do the opposite of _api.preprocessor.iterator.initExpandedIterationNode in reverse order
    
    // Nothing to do yet
    // Adapt if necessary
 }