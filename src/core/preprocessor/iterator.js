/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 _api.preprocessor.iterator.setupIterations = (binding, template) => {
    let iteratedNode = new _api.util.Tree("PlainIteration").set("isRoot", true)
    // Move the iteration information into interatedNode
    if (binding.isA("Scope") && binding.hasChild("Iterator")) {
        // Create iterated node
        iteratedNode.set("isRoot", false)
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
    if (!iteratedNode.get("isRoot")) {
        let $template = $api.$()(template)
        let virtual = $api.$()("<!-- -->")
        $template.after(virtual)
        $template.detach()
        iteratedNode.set("iterationTemplate", template)
        iteratedNode.set("template", virtual)
    } else {
        iteratedNode.set("template", template)
    }
    
    // Recursion
    for (var i = 0; i < iterators.length; i++) {
        let iterator = iterators[i]
        let scope = iterator.getParent()
        let virtualAst = new _api.util.Tree("IterationChild").set("index", i)
        scope.replace(virtualAst)
        
        // Recursion
        let child = _api.preprocessor.iterator.setupIterations(scope, scope.get("element"))
        iteratedNode.add(child)
    }
    iteratedNode.set("binding", binding.clone())

    return iteratedNode
 }