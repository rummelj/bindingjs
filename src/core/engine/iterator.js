/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 _api.engine.iterator.setupIterations = (binding, template) => {
    let iteratedNode = new _api.engine.iterator.IterationNode(false)
    // Move the iteration information into interatedNode
    if (binding.isA("Rule") && binding.hasChild("Iterator")) {
        // Create iterated node
        iteratedNode.setIterated(true)
        let iterator = binding.childs()[1]
        if (!iterator.isA("Iterator")) {
            throw _api.util.exception("Expected the second child of an iterated " +
                                      "rule to be Iterator, but it was not")
        }
        let variables = iterator.getAll("Variables")
        if (variables.length !== 1) {
            throw _api.util.exception("Expected Iterator to have exactly one descendant " +
                                      "with type Variables")
        }
        
        // Parse variables
        let variableNodes = variables[0].getAll("Variable")
        if (variableNodes.length === 1) {
            iteratedNode.setIterationEntryId(variableNodes[0].get("id"))
        } else if (variableNodes.length === 2) /* Could also be 0 */ {
            iteratedNode.setIterationEntryId(variableNodes[0].get("id"))
            iteratedNode.setIterationKeyId(variableNodes[1].get("id"))
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
        iteratedNode.setIterationSourceId(inputVariable.get("id"))
        
        // Delete the iterator
        binding.del(iterator)
    }
    
    var iterators = binding.getAll("Iterator")
    // Filter out all, that are nested in other iterators
    for (var i = 0; i < iterators.length; i++) {
        let iterator = iterators[i]
        let rule = iterator.getParent()
        if (!rule.isA("Rule")) {
            throw _api.util.exception("Assumed that the parent of an Iterator " +
                                      "always is a Rule, but it was not")
        }
        
        // Check if this iterator is nested inside other iterators
        let nested = false
        let temp = rule.getParent()
        while (temp && !nested) {
            if (temp.isA("Rule") && temp.hasChild("Iterator")) {
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
    
    // Recursion
    for (var i = 0; i < iterators.length; i++) {
        let iterator = iterators[i]
        let rule = iterator.getParent()
        
        // Extract template
        let element = rule.childs()[0]
        if (!element.isA("Element")) {
            throw _api.util.exception("Expected first child of Rule to always be " +
                                      "an Element after preprocessing, but it was not")
        }
        let $element = $api.$()(element.get("element"))
        let child = _api.engine.iterator.setupIterations(rule, $element)
        let virtualAst = AST("IterationChild").set("index", i)
        rule.replace(virtualAst)
        
        iteratedNode.add(child)
    }
    iteratedNode.setBinding(binding.clone())
    iteratedNode.setTemplate(template)

    return iteratedNode
 }