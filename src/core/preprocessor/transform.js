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
                // Never move up over groups
                if (parentScope.isA("Group")) {
                    parentScope = null
                    break
                }
                parentScope = parentScope.getParent()
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
            
            
            if (parentScope) {
                // Add binding to parentScope
                parentScope.add(newBinding)
            } else {
                // 1. Check if no View Mask Adpater are used in iterationExpression
                let variables = iterationExpression.getAll("Variable")
                for (var j = 0; j < variables.length; j++) {
                    let variable = variables[j]
                    let adapterName
                    if (variable.get("ns") !== "") {
                        adapterName = variable.get("ns")
                    } else {
                        adapterName = variable.get("id")
                    }
                    if (adapterName !== bindingScopePrefix) {
                        if (_api.repository.adapter.get(adapterName).type() == "view") {
                            throw _api.util.exception("It is not allowed to use view adapter in iteration " +
                                "expression, if the iteration has no parent inside the same group as in " +
                                iterationExpression.asBindingSpec())
                        }
                    }
                }
                
                // 2. Create virtual Scope
                let virtualScope = _api.dsl.parser.safeParser(".foo {}").getAll("Scope")[0]
                if (!virtualScope.childs()[0].isA("SelectorList")) {
                    throw _api.util.exception("Assumed that the first child of a Scope always is a SelectorList, but it was not")
                }
                // Repeat, what expandSelectors did
                virtualScope.del(virtualScope.childs()[0])
                
                // 3. Set as the element of that Scope the parent of the element from the iterated scope to prevent later errros even element never used
                virtualScope.set("element", iteratedScope.get("element").parentElement)
                
                // 4. Add binding to this scope
                virtualScope.add(newBinding)
                
                // 5. Place virtual scope in front of iteratedScope
                iteratedScope.getParent().addAt(iteratedScope.getParent().childs().indexOf(iteratedScope), virtualScope)
            }
            
            // Reset iteration expression
            iterationExpression.replace(_api.util.Tree("Variable").set({ ns: bindingScopePrefix, id: newTempId, text: newTempRef }))
        }
    }
}

_api.preprocessor.transform.nestIteratedBindings = (binding) => {
    let scopes = binding.getAll("Scope")
    // Create a map of all elements and their scopes
    let elements = []
    let elementScopes = []
    let addScope = (element, scope) => {
        let index = elements.indexOf(element)
        if (index == -1) {
            elements.push(element)
            elementScopes.push([scope])
        } else {
            elementScopes[index].push(scope)
        }
    }
    let getScopes = (element) => {
        let index = elements.indexOf(element)
        if (index == -1) {
            return []
        } else {
            return elementScopes[index]
        }
    }
    
    for (var i = 0; i < scopes.length; i++) {
        let scope = scopes[i]
        let element = scope.get("element")
        addScope(element, scope)
    }
    
    // For each entry in the map, check if the element has a parent with an iterated scope
    for (var i = 0; i < elements.length; i++) {
        let element = elements[i]
        
        // Check if any parent is iterated
        let iteratedScope = undefined
        while (element) {
            let scopeList = getScopes(element)
            let found = false
            for (var j = 0; j < scopeList.length; j++) {
                let scope = scopeList[j]
                if (scope.childs().length > 0 && scope.childs()[0].isA("Iterator")) {
                    iteratedScope = scope
                    break
                }
            }
            if (iteratedScope) {
                break
            }
            element = element.parentElement
        }
        element = elements[i]
        
        if (iteratedScope) {
            // Check if all scopes are a descendant of the iterated scope
            let scopeList = getScopes(element)
            for (var j = 0; j < scopeList.length; j++) {
                let scope = scopeList[j]
                while (scope && scope !== iteratedScope) {
                    scope = scope.getParent()
                }
                // If the scope is now undefined it has to be moved into iterated Scope
                if (!scope) {
                    scope = scopeList[j]
                    scope.getParent().del(scope)
                    iteratedScope.add(scope)
                }
            }
        }
    }
    
    // Check for empty Scopes and remove them
    for (var i = 0; i < scopes.length; i++) {
        let scope = scopes[i]
        let bindings = scope.getAll("Binding")
        let iterators = scope.getAll("Iterator")
        let exports = scope.getAll("Export")
        let imports = scope.getAll("Import")
        let labels = scope.getAll("Label")
        if (bindings.length === 0 &&
            iterators.length === 0 &&
            exports.length === 0 &&
            imports.length === 0 &&
            labels.length === 0) {
                // Remove Scope
                scope.getParent().del(scope)
        }
    }
}

_api.preprocessor.transform.markSlots = (iterationTree) => {
    iterationTree.set("slots", [])
    
    let binding = iterationTree.get("binding")
    let labels = binding.getAll("Label")
    for (var i = 0; i < labels.length; i++) {
        let label = labels[i]
        let scope = label.getParent()
        if (!scope.isA("Scope")) {
            throw _api.util.exception("Assumed, that the parent of a Label always " +
                "is a Scope, but it was not")
        }
        let element = scope.get("element")
        let labelId = label.get("id")
        iterationTree.get("slots").push( {element: element, id: labelId} )
    }
    
    for (var i = 0; i < iterationTree.childs().length; i++) {
        _api.preprocessor.transform.markSlots(iterationTree.childs()[i])
    }
    
    // Remove the scopes with the slots
    for (var i = 0; i < labels.length; i++) {
        let label = labels[i]
        let scope = label.getParent()
        scope.getParent().del(scope)
    }
}