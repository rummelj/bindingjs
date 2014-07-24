/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.binding.preprocessor.transform.expandSelectors = (template, binding) => {
    return _api.binding.preprocessor.transform.expandSelectorsRec(template, binding, [])
}

_api.binding.preprocessor.transform.expandSelectorsRec = (template, binding, data) => {
    // data = { selectorList:string[][], rule: AST }
    // Bottom up recursion
    $api.$()(binding.childs()).each((_, child) => {
        if (child.isA("Rule")) {
            // Deep copy selectorList inside data if exists already
            var dataCopy
            if (data.selectorList && data.rule) {
                dataCopy = { selectorList: $api.$().extend(true, [], data.selectorList),
                             rule: data.rule }
            } else {
                dataCopy = { selectorList: [[]], rule: child }
            }
            
            // Add intermediate selectors on the way down
            var selectorListElem = child.childs()[0]
            if (!selectorListElem.isA("SelectorList")) {
                _api.util.exception("Expected the first child of Rule to always be " +
                                    "a SelectorList, but it was not")
            }
            
            for (var i = 0; i < selectorListElem.childs().length; i++) {
                var selectorCombination = selectorListElem.childs()[i]
                if (!selectorCombination.isA("SelectorCombination")) {
                    _api.util.exception("Expected all children of SelectorList to " +
                                        "always be SelectorCombination, but it was not")
                }
                
                // Add all found selectors to the last list in selectorList
                dataCopy.selectorList[dataCopy.selectorList.length - 1]
                    .push(selectorCombination.get("text"))
            }
            
            // Push a new empty list onto the selector list for the next recursion
            dataCopy.selectorList.push([])
            // Update the rule to the last rule found
            dataCopy.rule = child
            
            // Recursion
            _api.binding.preprocessor.transform.expandSelectorsRec(template, child, dataCopy)
        } else {
            // Recursion
            _api.binding.preprocessor.transform.expandSelectorsRec(template, child, data)
        }
    })
    
    // Do work
    if (binding.isA("Rule")) {
        // Last element of selectorList is always empty, remove it
        data.selectorList.splice(data.selectorList.length - 1, 1)
        
        // Permutate the list of selectors
        // e.g. [[a], [b, c], [d]] yields two permutations
        // - [a, b, d]
        // - [a, c, d]
        let permutations = _api.binding.preprocessor.transform.getAllPermutations(data.selectorList)
        
        // foreach permutation select all elements
        // foreach element hat a new rule in the same place as the old rule
        // in every such rule the part with SelectorList is replace by the element
        let newRules = []
        
        // Prepare old rule by removing its first child to prevent
        // doing it for every clone
        // First child must be SelectorList (was checked above)
        data.rule.del(data.rule.childs()[0])
        
        for (var i = 0; i < permutations.length; i++) {
            let permutation = permutations[i]
            // Reconstruct selector
            let selector = ""
            for (var j = 0; j < permutation.length; j++) {
                selector += permutation[j]
                if (j < permutation.length - 1) {
                    selector += " "
                }
            }
            
            // Select all matching elements in template
            var elements = $api.$()(selector, template)
            if (elements.length === 0) {
                $api.debug(1, "Found no element for selector " + selector)
            }
            
            for (var j = 0; j < elements.length; j++) {
                let newRule = data.rule.clone()
                newRule.addAt(0, AST("Element").set("element", elements[j]))
                newRules.push(newRule)
            }
        }
        
        // Replace old rule with newRules
        data.rule.replace(newRules)
    }
    return binding
}

_api.binding.preprocessor.transform.getAllPermutations = (listOfLists) => {
    var accumulator = [[]]
    _api.binding.preprocessor.transform.getAllPermutationsRec(listOfLists, accumulator)
    return accumulator
}

_api.binding.preprocessor.transform.getAllPermutationsRec = (listOfLists, accumulator) => {
    if (listOfLists.length > 0) {
        var firstList = listOfLists[0]
        
        // Repeat accumulator firstList.length - 1 times
        var accumulatorLength = accumulator.length
        for (var i = 0; i < firstList.length - 1; i++) {
            for (var j = 0; j < accumulatorLength; j++) {
                // Must push copy
                accumulator.push($api.$().extend(true, [], accumulator[j]))
            }
        }
        
        // Push elements of firstList onto elements in accumulator
        for (var i = 0; i < firstList.length; i++) {
            for (var j = i * accumulatorLength; j < (i+1) * accumulatorLength; j++) {
                accumulator[j].push(firstList[i])
            }
        }
        
        // Continue recursively with listOfLists without the first element
        listOfLists.shift()
        _api.binding.preprocessor.transform.getAllPermutationsRec(listOfLists, accumulator)
    }
}

_api.binding.preprocessor.transform.makeTempRefsUnique = (binding, bindingScopePrefix, tempCounter) => {
    _api.binding.preprocessor.transform.makeTempRefsUniqueRec(binding, bindingScopePrefix, tempCounter, {})
}

_api.binding.preprocessor.transform.makeTempRefsUniqueRec = (binding, bindingScopePrefix, tempCounter, assign) => {
    if (binding.isA("Rule")) {
        // Find all temp references in this rule
        let assignCopied = false
        let refs = binding.getAll("Variable", "Rule")
        for (var i = 0; i < refs.length; i++) {
            let ref = refs[i]
            if (ref.get("ns") === bindingScopePrefix) {
                // Check if ref was assigned before
                if (!assign[ref.get("id")]) {
                    // We are about to change assign
                    // Since further recursion receives a reference
                    // assign needs to be cloned once
                    if (!assignCopied) {
                        assign = $api.$().extend({}, assign)
                        assignCopied = true
                    }
                    // Create new assign
                    assign[ref.get("id")] = "temp" + tempCounter.getNext()
                }
                
                // Change id
                ref.set("id", assign[ref.get("id")])
            }
        }
    }
    
    // Recursion
    for (var i = 0; i < binding.childs().length; i++) {
        _api.binding.preprocessor.transform.makeTempRefsUniqueRec(binding.childs()[i], bindingScopePrefix, tempCounter, assign)
    }
}

_api.binding.preprocessor.transform.extractIterationCollections = (bind, bindingScopePrefix, tempCounter) => {
    let iterators = bind.getAll("Iterator")
    if (iterators.length > 0) {
        for (var i = 0; i < iterators.length; i++) {
            let iterator = iterators[i]
            
            // Create a new rule (in front) of the iteratied rule
            // With the same viewElement but without anything else
            // It would seem easier to just add the new binding to the parent,
            // but this wont work for two reasons
            // 1. There could be no parent
            // 2. The expression that is iterated could contain a view adapter
            let newRule = _api.dsl.AST("Rule")
            
            // Rules look different since Step 2 (expandSelectors)
            let iteratedRule = iterator.getParent()
            let iteratedElement = iteratedRule.childs()[0]
            if (!iteratedElement.isA("Element")) {
                throw _api.util.exception("Expected first child of Rule to be a Element after expandSelectors, but it was not")
            }
            newRule.add(iteratedElement.clone())
            
            // Create binding
            let newTempId = "temp" + tempCounter.getNext()
            let newTempRef = bindingScopePrefix + newTempId
            let newBinding = _api.dsl.parser.safeParser(newTempRef + " <- foo", "binding")
            // foo needs to be replaced by the original iteration expression
            let iterationExpression = iterator.childs()[1]
            if (!iterationExpression.isA("Expr")) {
                throw _api.util.expression("Expected second child of Iterator to always be Expr, but it was not")
            }
            if (iterationExpression.childs().length !== 1) {
                throw _api.util.expression("Expected that Expr in Iterator always has exactly one child, but there were " +
                                            iterationExpression.childs().length)
            }
            iterationExpression = iterationExpression.childs()[0]
            let variables = newBinding.getAll("Variable")
            let found = false
            for (var j = 0; j < variables.length; j++) {
                let variable = variables[j]
                if (variable.get("ns") === "" && variable.get("id") === "foo") {
                    variable.replace(iterationExpression.clone())
                    found = true
                    break
                }
            }
            if (!found) {
                throw _api.util.expression("Could not find foo element, please check parsing")
            }
            
            // Reset iteration expression
            iterationExpression.replace(_api.dsl.AST("Variable").set({ ns: bindingScopePrefix, id: newTempId, text: newTempRef }))
            
            // Add binding to newRule
            newRule.add(newBinding)
            
            // Add newRule (in front) of iteratedRule
            iteratedRule.getParent().addAt(iteratedRule.getParent().childs().indexOf(iteratedRule), newRule)
        }
    }
}