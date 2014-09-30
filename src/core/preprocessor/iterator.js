/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
 _api.preprocessor.iterator.setupIterationTree = (ast, template) => {
    let iteratedNode = new _api.util.Tree("PlainIteration")

    // Move the iteration information into interatedNode
    if (ast.isA("Scope") && ast.hasChild("Iterator")) {
        // Create iterated node
        let iterator = ast.childs()[0]
        _api.util.assume(iterator.isA("Iterator"))
        let variables = iterator.getAll("Variables")
        _api.util.assume(variables.length === 1)
            
        // Parse variables
        let variableNodes = variables[0].getAll("Variable")
        if (variableNodes.length === 1) {
            iteratedNode.set("entryId", variableNodes[0].get("id"))
        } else if (variableNodes.length === 2) /* Could also be 0 */ {
            iteratedNode.set("entryId", variableNodes[0].get("id"))
            iteratedNode.set("keyId", variableNodes[1].get("id"))
        }
        
        // After the preprocessing the iterator always has a temp ref as input
        let exprs = iterator.getAll("Expr")
        _api.util.assume(exprs.length === 1)
        _api.util.assume(exprs[0].childs().length === 1) 
        let inputVariable = exprs[0].childs()[0]
        _api.util.assume(inputVariable.isA("Variable"))
        iteratedNode.set("sourceId", inputVariable.get("id"))
        
        // Delete the iterator
        ast.del(iterator)
        
        let $template = $api.$()(template)
        // Tag names starting with numbers are invalid, so always prepend BindingJS-
        let virtual = $api.$()("<BindingJS-" + _api.util.getGuid() + " />")
        $template.after(virtual)
        $template.detach()
        iteratedNode.set("iterationTemplate", $template)
        iteratedNode.set("template", virtual)
        iteratedNode.set("collection", [])
    } else {
        iteratedNode.set("template", template)
        iteratedNode.set("collection", true)
    }
    iteratedNode.set("links", [])
    iteratedNode.set("placeholder", [])
    
    let iterators = ast.getAll("Iterator")
    let newIterators = []
    // Filter out all, that are nested in other iterators
    _api.util.array.each(iterators, (iterator) => {
        let scope = iterator.getParent()
        _api.util.assume(scope.isA("Scope"))
        
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
        
        if (!nested) {
            newIterators.push(iterator)
        }
    })
    iterators = newIterators
    
    // Recursion
    _api.util.array.each(iterators, (iterator) => {
        let scope = iterator.getParent()
        let child = _api.preprocessor.iterator.setupIterationTree(scope, scope.get("element"))
        
        // Cut out childs binding
        scope.getParent().del(scope)
        iteratedNode.get("placeholder").push(child.get("template"))
        iteratedNode.add(child)
    })
    iteratedNode.set("binding", ast.clone())

    return iteratedNode
 }
 
 _api.preprocessor.iterator.setupExpandedIterationTree = (viewDataBinding, root) => {
    let rootLink = _api.preprocessor.iterator.initExpandedIterationNode(viewDataBinding, root)
    
    // rootLink always exactly has one instance, the placeholder in rootLink
    // will never have to be located again, so they can be safely replaced
    let placeholder = rootLink.get("placeholder")
    for (let i = 0; i < placeholder.length; i++) {
        let comment = $api.$()("<!-- -->")
        placeholder[i].replaceWith(comment)
        placeholder[i] = comment
    }
    let rootInstance = {
        template: rootLink.get("template"),
        binding: rootLink.get("binding"),
        bindingRenames: rootLink.get("bindingRenames"),
        placeholder: rootLink.get("placeholder"),
        sockets: rootLink.get("sockets")
    }
    rootLink.set("instances", [rootInstance])
    
    // Add the rootLink to root
    root.set("links", [rootLink])
    
    // Each child iteration of root is initially present without instances
    _api.util.array.each(root.childs(), (child) => {
        let newChildLink =  _api.preprocessor.iterator.initExpandedIterationNode(viewDataBinding, child, rootLink)
        newChildLink.set("instance", rootInstance)       
        child.set("links", [newChildLink])
        rootLink.add(newChildLink)
    })
    
    return rootLink
 }
 
 _api.preprocessor.iterator.initExpandedIterationNode = (viewDataBinding, plItNode, parentLink) => {
    let result = new _api.util.Tree("ExpandedIteration")
    
    let isRoot = !plItNode.getParent()
    let oldTemplate = isRoot ? plItNode.get("template") : plItNode.get("iterationTemplate")
    let template = oldTemplate.clone()
    let binding = plItNode.get("binding").clone()
    result.set("template", template)
    result.set("binding", binding)
    result.set("instances", [])
    result.set("placeholderIndex", isRoot ? -1 : plItNode.getParent().childs().indexOf(plItNode))
    result.set("sourceId", plItNode.get("sourceId"))
    result.set("origin", plItNode)
    result.set("collection", [])
    
    // Update template placeholders
    result.set("placeholder", [])
    
    let templatePlList = plItNode.get("placeholder")
    for (let i = 0; i < templatePlList.length; i++) {
        let templatePl = templatePlList[i]
        let selector = _api.util.jQuery.getPath(oldTemplate, templatePl)
        let newPlaceholder = selector === "" ? template : $api.$()(selector, template)
        result.get("placeholder").push(newPlaceholder)
    }
    
    // Update sockets
    let sockets = plItNode.get("sockets")
    result.set("sockets", [])
    for (let i = 0; i < sockets.length; i++) {
        let socket = sockets[i]
        let element = socket.element
        let selector = _api.util.jQuery.getPath(oldTemplate, element)
        let newElement = selector === "" ? template : $api.$()(selector,  template)
        result.get("sockets").push({ element: newElement, id: socket.id })
    }
    
    // The references inside binding still refer to the template before it was cloned
    let scopes = binding.getAll("Scope")
    for (let i = 0; i < scopes.length; i++) {
        let scope =  scopes[i]
        let element = scope.get("element")
        let selector = _api.util.jQuery.getPath(oldTemplate, element)
        let newElement = selector === "" ? template : $api.$()(selector, template)
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
        for (let i = 0; i < variables.length; i++) {
            let variable = variables[i]
            for (let oldId in parentRenames) {
                if (variable.get("ns") === viewDataBinding.bindingScopePrefix() &&
                    variable.get("id") === oldId) {
                        variable.set("id", parentRenames[oldId]) 
                }
            }
        }   
        // Including source
        if (parentRenames[result.get("sourceId")]) {
            result.set("sourceId", parentRenames[result.get("sourceId")])
        }
    }
    
    // Find all tempVariables in plItNode, which are in no ancestor
    let ancestorOwnVariables = []
    let parent = parentLink
    while (parent) {
        for (let i = 0; i < parent.get("ownVariables").length; i++) {
            ancestorOwnVariables.push(parent.get("ownVariables")[i])
        }
        parent = parent.getParent()
    }
    
    let ownVariables = []
    for (let i = 0; i < variables.length; i++) {
        let variable = variables[i]
        if (variable.get("ns") === viewDataBinding.bindingScopePrefix() &&
            ancestorOwnVariables.indexOf(variable.get("id")) === -1) {
            ownVariables.push(variable.get("id"))
        }
    }
    // Entry and key are own variables too
    if (plItNode.get("entryId")) {
        ownVariables.push(plItNode.get("entryId"))
    }
    if (plItNode.get("keyId")) {
        ownVariables.push(plItNode.get("keyId"))
    }
    
    // Store ownVariables
    result.set("ownVariables", ownVariables)
    
    
    // For each own variable add an own rename
    let ownRenames = {}
    for (let i = 0; i < ownVariables.length; i++) {
        let ownVariable = ownVariables[i]
        let newId = "temp" + viewDataBinding.vars.tempCounter.getNext()
        ownRenames[ownVariable] = newId
        // the own variable will be renamed and this is reflected already
        ownVariables[i] = newId
    }
    
    // Do the ownRenames renaming
    for (let i = 0; i < variables.length; i++) {
        let variable = variables[i]
        for (let oldId in ownRenames) {
            if (variable.get("ns") === viewDataBinding.bindingScopePrefix() &&
                variable.get("id") === oldId) {
                    variable.set("id", ownRenames[oldId]) 
            }
        }
    }   
    // The source id can never be an own variable, so it is not included
    
    // Since entry and key id are always ownVariables, they need to be renamed in the result
    let oldEntryId = plItNode.get("entryId")
    if (oldEntryId) {
        result.set("entryId", ownRenames[oldEntryId])
    }
    let oldKeyId = plItNode.get("keyId")
    if (oldKeyId) {
        result.set("keyId", ownRenames[oldKeyId])
    }
    
    // The final set of renames for this plItNode is both, parentRenames and ownRenames
    // Copy parentRenames
    let bindingRenames = _api.util.object.clone(parentRenames)
    // Add entries from ownRenames
    for (let oldId in ownRenames) {
        bindingRenames[oldId] = ownRenames[oldId]
    }
    result.set("bindingRenames", bindingRenames)
    
    return result
 }
