/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.engine.transform.expandSelectors = (template, binding) => {
    return _api.engine.transform.expandSelectorsRec(template, binding, [])
}

_api.engine.transform.expandSelectorsRec = (template, binding, data) => {
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
                    .push(selectorCombination.get("selector"))
            }
            
            // Push a new empty list onto the selector list for the next recursion
            dataCopy.selectorList.push([])
            // Update the rule to the last rule found
            dataCopy.rule = child
            
            // Recursion
            _api.engine.transform.expandSelectorsRec(template, child, dataCopy)
        } else {
            // Recursion
            _api.engine.transform.expandSelectorsRec(template, child, data)
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
        let permutations = _api.engine.transform.getAllPermutations(data.selectorList)
        
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

_api.engine.transform.getAllPermutations = (listOfLists) => {
    var accumulator = [[]]
    _api.engine.transform.getAllPermutationsRec(listOfLists, accumulator)
    return accumulator
}

_api.engine.transform.getAllPermutationsRec = (listOfLists, accumulator) => {
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
        _api.engine.transform.getAllPermutationsRec(listOfLists, accumulator)
    }
}