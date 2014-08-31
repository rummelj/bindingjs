/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 _api.preprocessor.iterator.setupIterations = (bindingObj) => {
    let bindingSpec = bindingObj.vars.ast
    let template = bindingObj.vars.template
    let iterationTree = _api.preprocessor.iterator.setupIterationTree(bindingSpec, template)
    _api.preprocessor.iterator.setupExpandedIterationTree(bindingObj, iterationTree)
    return iterationTree
 }
 
 _api.preprocessor.iterator.setupIterationTree = (binding, template) => {
    let root = true
    let iteratedNode = new _api.util.Tree("PlainIteration")
    iteratedNode.set("placeholder", {template: [], binding: []})
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
        // TODO: Add check that this tag is never used inside the template
        let virtual = $api.$()("<BindingJsMagicTag />")
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
        
        let virtualAst = new _api.util.Tree("Iteration-" + i)
        scope.replace(virtualAst)
        iteratedNode.get("placeholder").binding.push(virtualAst)
        iteratedNode.get("placeholder").template.push(child.get("template"))
        
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
    var rootLink = _api.preprocessor.iterator.initExpandedIterationNode(bindingObj, root)
    
    // rootLink always exactly has one instance
    let rootInstance = {
        key: 0,
        value: true,
        template: rootLink.get("template"),
        binding: rootLink.get("binding"),
        bindingRenames: rootLink.get("bindingRenames"),
        placeholder: {
            template: rootLink.get("placeholder").template,
            binding: rootLink.get("placeholder").binding
        }
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
    result.set("placeholder", {template: [], binding: []})
    
    let templatePlList = node.get("placeholder").template
    for (var i = 0; i < templatePlList.length; i++) {
        let templatePl = templatePlList[i]
        let selector = selector == "" ? templatePl : _api.util.getPath(oldTemplate, templatePl)
        let newPlaceholder = $api.$()(selector, template)
        result.get("placeholder").template.push(newPlaceholder)
    }
    
    // Update binding placeholders
    let bindingPlList = node.get("placeholder").binding
    for (var i = 0; i < bindingPlList.length; i++) {
        let bindingPl =  bindingPlList[i]
        let newPlaceholders = binding.getAll("Iteration-" + i)
        if (newPlaceholders.length != 1) {
            throw _api.util.exception("Internal error")
        }
        result.get("placeholder").binding.push(newPlaceholders[0])
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
    let variables = result.get("binding").getAll("Variable")
    for (var i = 0; i < variables.length; i++) {
        let variable = variables[i]
        if (variable.get("ns") == bindingObj.bindingScopePrefix() &&
            ancestorOwnVariables.indexOf(variable.get("id") == -1)) {
            ownVariables.push(variable.get("id"))
        }
    }
    
    // Inherit renames from parent and add a new for each own variable
    let bindingRenames = {}
    if (parentLink) {
        bindingRenames = $api.$().extend({}, parentLink.get("bindingRenames"))
    }
    for (var i = 0; i < ownVariables.length; i++) {
        let ownVariable = ownVariables[i]
        let newId = "temp" + bindingObj.vars.tempCounter.getNext()
        bindingRenames[ownVariable] = newId
        // ownVariable will be later renamed
        ownVariables[i] = newId
    }
    
    // Store ownVariables
    result.set("ownVariables", ownVariables)
    
    // Rename entry and key
    let oldEntryId = node.get("entryId")
    if (oldEntryId) {
        let newEntryId = "temp" + bindingObj.vars.tempCounter.getNext()
        bindingRenames[oldEntryId] = newEntryId
        result.set("entryId", newEntryId)
    }
    let oldKeyId = node.get("keyId")
    if (oldKeyId) {
        let newKeyId = "temp" + bindingObj.vars.tempCounter.getNext()
        bindingRenames[oldKeyId] = newKeyId
        result.set("keyId", newKeyId)
    }
    
    // Do the renaming
    for (var i = 0; i < variables.length; i++) {
        let variable = variables[i]
        for (var oldId in bindingRenames) {
            if (variable.get("ns") == bindingObj.bindingScopePrefix() &&
                variable.get("id") == oldId) {
                    variable.set("id", bindingRenames[oldId]) 
            }
        }
    }   
    // Including source
    if (bindingRenames[result.get("sourceId")]) {
        result.set("sourceId", bindingRenames[result.get("sourceId")])
    }
    
    result.set("bindingRenames", bindingRenames)
    
    return result
 }
 
 _api.preprocessor.iterator.shutdownExpandedIterationNode = (binding, newLink) => {
    // Do the opposite of _api.preprocessor.iterator.initExpandedIterationNode in reverse order
    
    // Nothing to do yet
    // Adapter if necessary
 }