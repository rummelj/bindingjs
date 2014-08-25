/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.preprocessor.transform.expandSelectors = (template, binding) => {
    _api.preprocessor.transform.expandSelectorsRec(template, binding, [[]])
    
    // Remove all placeholder
    let placeholders = binding.getAll("Placeholder")
    for (var i = 0; i < placeholders.length; i++) {
        let placeholder = placeholders[i]
        placeholder.getParent().del(placeholder)
    }
    
    // Check if every scope received a template element
    let scopes = binding.getAll("Scope")
    for (var i = 0; i < scopes.length; i++) {
        let scope = scopes[i]
        if(!scope.get("element")) {
            throw _api.util.exception("Internal Error: Scope did not receive a template element")
        }
    }
}

_api.preprocessor.transform.expandSelectorsRec = (template, binding) => {
    if (binding.isA("Scope")) {
        // If the scope already has an element it was processed before and can be safely skipped
        if (!binding.get("element")) {
            let selectorList = []
            
            // Add intermediate selectors on the way down
            var selectorListElem = binding.childs()[0]
            if (!selectorListElem.isA("SelectorList")) {
                throw _api.util.exception("Expected the first child of Scope to always be " +
                                          "a SelectorList, but it was not")
            }
            
            for (var i = 0; i < selectorListElem.childs().length; i++) {
                var selectorCombination = selectorListElem.childs()[i]
                if (!selectorCombination.isA("SelectorCombination")) {
                    throw _api.util.exception("Expected all children of SelectorList to " +
                                              "always be SelectorCombination, but it was not")
                }
                
                // Add all found selectors to the last list in selectorList
                selectorList.push(selectorCombination.get("text"))
            }
            
            // Permutate the list of selectors
            // e.g. [[a], [b, c], [d]] yields two permutations
            // - [a, b, d]
            // - [a, c, d]
            //let permutations = _api.preprocessor.transform.getAllPermutations(selectorList)
            
            // foreach permutation select all elements
            // foreach element put a new scope in the same place as the old scope
            // in every such scope the part with SelectorList is replace by the element
            let newScopes = []
            
            // Prepare old scope by removing its first child to prevent
            // doing it for every clone
            // First child must be SelectorList (was checked above)
            binding.del(binding.childs()[0])
            
            for (var i = 0; i < selectorList.length; i++) {
                let selector = selectorList[i]
                
                // Select all matching elements in template
                var elements = $api.$()(selector, template)
                if (elements.length === 0) {
                    $api.debug(5, "Found no element for selector " + selector + " in\n" +
                               $api.$()(template).clone().wrap("<div>").parent().html())
                }
                
                // Note. If the selector did not match any elements, the scope disappears
                for (var j = 0; j < elements.length; j++) {
                    let newScope = binding.clone()
                    newScope.set("element", elements[j])
                    newScopes.push(newScope)
                }
            }
            
            if (newScopes.length > 0) {
                // Replace old scope with newScopes
                binding.replace(newScopes)
            } else {
                // The parent call iterates over its children in ascending order
                // If the amount of children is increased it is not a problem
                // If however it is decreased elements might get skipped
                // So a placeholder is added, which is later removed
                binding.replace(new _api.util.Tree("Placeholder"))
            }
            
            // Push a new empty list onto the selector list for the next recursion
            selectorList.push([])
            
            // Recursion over every newly generated scope
            for (var i = 0; i < newScopes.length; i++) {
                let newScope = newScopes[i]
                for (var j = 0; j < newScope.childs().length; j++) {
                    let child = newScope.childs()[j]
                    _api.preprocessor.transform.expandSelectorsRec(newScope.get("element"), child)
                }
            }
        }
    } else {
        // Recursion
        for (var i = 0; i < binding.childs().length; i++) {
            let child = binding.childs()[i]
            _api.preprocessor.transform.expandSelectorsRec(template, child)
        }
    }
}

_api.preprocessor.transform.getAllPermutations = (listOfLists) => {
    var accumulator = [[]]
    listOfListsClone = $api.$().extend(true, [], listOfLists)
    _api.preprocessor.transform.getAllPermutationsRec(listOfListsClone, accumulator)
    return accumulator
}

_api.preprocessor.transform.getAllPermutationsRec = (listOfLists, accumulator) => {
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
        _api.preprocessor.transform.getAllPermutationsRec(listOfLists, accumulator)
    }
}

_api.preprocessor.transform.makeTempRefsUnique = (binding, bindingScopePrefix, tempCounter) => {
    _api.preprocessor.transform.makeTempRefsUniqueRec(binding, bindingScopePrefix, tempCounter, {})
}

_api.preprocessor.transform.makeTempRefsUniqueRec = (binding, bindingScopePrefix, tempCounter, assign) => {
    if (binding.isA("Scope")) {
        // Find all temp references in this scope
        let assignCopied = false
        let refs = binding.getAll("Variable", "Scope")
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
        _api.preprocessor.transform.makeTempRefsUniqueRec(binding.childs()[i], bindingScopePrefix, tempCounter, assign)
    }
}

_api.preprocessor.transform.extractIterationCollections = (bind, bindingScopePrefix, tempCounter) => {
    let iterators = bind.getAll("Iterator")
    if (iterators.length > 0) {
        for (var i = 0; i < iterators.length; i++) {
            let iterator = iterators[i]
            
            // Scopes look different since Step 2 (expandSelectors)
            let iteratedScope = iterator.getParent()
            
            // Find parent Scope
            let parentScope = iteratedScope.getParent()
            while (parentScope && !parentScope.isA("Scope")) {
                parentScope = parentScope.getParent()
            }
            if (!parentScope) {
                throw _api.util.exception("It is not allowed that a Scope which has no parent is iterated!")
            }
            
            // Create binding
            let newTempId = "temp" + tempCounter.getNext()
            let newTempRef = bindingScopePrefix + newTempId
            let newBinding = _api.dsl.parser.safeParser(newTempRef + " <- foo", "binding")
            // foo needs to be replaced by the original iteration expression
            let iterationExpression = iterator.childs()[1]
            if (!iterationExpression.isA("Expr")) {
                throw _api.util.exception("Expected second child of Iterator to always be Expr, but it was not")
            }
            if (iterationExpression.childs().length !== 1) {
                throw _api.util.exception("Expected that Expr in Iterator always has exactly one child, but there were " +
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
            iterationExpression.replace(_api.util.Tree("Variable").set({ ns: bindingScopePrefix, id: newTempId, text: newTempRef }))
            
            // Add binding to parentScope
            parentScope.add(newBinding)
        }
    }
}

_api.preprocessor.transform.nestIteratedBindings = (binding) => {
    // 1. Remember all elements in a map
    // 2. Push around Bindings
    // 3. Remove empty Scopes
}