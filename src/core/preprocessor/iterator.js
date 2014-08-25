/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 _api.preprocessor.iterator.setupIterations = (bindingSpec, template) => {    
    let iterationTree = _api.preprocessor.iterator.setupIterationTree(bindingSpec, template)
    _api.preprocessor.iterator.setupExpandedIterationTree(iterationTree)
    return iterationTree
 }
 
 _api.preprocessor.iterator.setupIterationTree = (binding, template) => {
    let root = true
    let iteratedNode = new _api.util.Tree("PlainIteration")
    iteratedNode.set("placeholders", {template: [], binding: []})
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
        let virtual = $api.$()("<div />")
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
        iteratedNode.get("placeholders").binding.push(virtualAst)
        iteratedNode.get("placeholders").template.push(child.get("template"))
        
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
 
 _api.preprocessor.iterator.setupExpandedIterationTree = (root) => {
    var rootLink = new _api.util.Tree("ExpandedIteration")
    
    // Set up root link
    let rootTemplate = root.get("template").clone()
    let rootBinding = root.get("binding").clone()
    rootLink.set("template", rootTemplate)
    rootLink.set("binding", rootBinding)
    // Root always exactly has one instance, because it is no real iteration
    rootLink.set("instances", [{template: rootTemplate, binding: rootBinding}])
    
    // Update placeholders
    rootLink.set("placeholders", {template: [], binding: []})
    for (var i = 0; i < root.get("placeholders").template.length; i++) {
        let templatePl = root.get("placeholders").template[i]
        let selector = _api.util.getPath(root.get("template"), templatePl)
        let newPlaceholder = $api.$()(selector, rootTemplate)
        rootLink.get("placeholders").template.push(newPlaceholder)
    }
    // Replace template placeholders by comments
    for (var i = 0; i < rootLink.get("placeholders").template.length; i++) {
        let templatePl = rootLink.get("placeholders").template[i]
        let comment = $api.$()("<!-- -->")
        templatePl.replaceWith(comment)
        rootLink.get("placeholders").template[i] = comment
    }
    for (var i = 0; i < root.get("placeholders").binding.length; i++) {
        let bindingPl =  root.get("placeholders").binding[i]
        let newPlaceholders = rootBinding.getAll("Iteration-" + i)
        if (newPlaceholders.length != 1) {
            throw _api.util.exception("Internal error")
        }
        rootLink.get("placeholders").binding.push(newPlaceholders[0])
    }
    
    // The references inside binding still refer to the template before it was cloned
    let scopes = rootBinding.getAll("Scope")
    for (var j = 0; j < scopes.length; j++) {
        let scope =  scopes[j]
        let element = scope.get("element")
        let selector = _api.util.getPath(root.get("template"), element)
        let newElement = $api.$()(selector, rootTemplate)
        scope.set("element", newElement)
    }
        
    // Add the rootLink to root
    root.set("links", [rootLink])
    
    // Each child iteration of root is initially present without instances
    for (var i = 0; i < root.childs().length; i++) {
        var newChildLink = new _api.util.Tree("ExpandedIteration")
        
        let child = root.childs()[i]
        
        // Initialize empty instances
        newChildLink.set("instances", [])
        
        // Set template and iteraion
        let oldTemplate = child.get("iterationTemplate")
        let newTemplate = oldTemplate.clone()
        let newBinding = child.get("binding").clone()
        newChildLink.set("template", newTemplate)
        newChildLink.set("binding", newBinding)
        
        // Update placeholders
        newChildLink.set("placeholders", {template: [], binding: []})
        for (var j = 0; j < child.get("placeholders").template.length; j++) {
            let templatePl = child.get("placeholders").template[j]
            let selector = _api.util.getPath(child.get("iterationTemplate"), templatePl)
            let newPlaceholder = $api.$()(selector, newTemplate)
            newChildLink.get("placeholders").template.push(newPlaceholder)
        }
        // Replace template placeholders by comments
        for (var j = 0; j < newChildLink.get("placeholders").template.length; j++) {
            let templatePl = newChildLink.get("placeholders").template[j]
            let comment = $api.$()("<!-- -->")
            templatePl.replaceWith(comment)
            newChildLink.get("placeholders").template[j] = comment
        }
        for (var j = 0; j < child.get("placeholders").binding.length; j++) {
            let bindingPl =  child.get("placeholders").binding[j]
            let newPlaceholders = newBinding.getAll("Iteration-" + j)
            if (newPlaceholders.length != 1) {
                throw _api.util.exception("Internal error")
            }
            newChildLink.get("placeholders").binding.push(newPlaceholders[0])
        }
        
        // The references inside binding still refer to the template before it was cloned
        let scopes = newBinding.getAll("Scope")
        for (var j = 0; j < scopes.length; j++) {
            let scope =  scopes[j]
            let element = scope.get("element")
            let selector = _api.util.getPath(oldTemplate, element)
            let newElement = $api.$()(selector, newTemplate)
            scope.set("element", newElement)
        }
        
        // Add link to child
        child.set("links", [newChildLink])
        
        // Connect the ExpandedIteration nodes
        rootLink.add(newChildLink)
    }
    
    return rootLink
 }