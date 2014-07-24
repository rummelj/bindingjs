/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.engine.validate.checkIterationIds = (binding) => {
    _api.engine.validate.checkIterationIdsRec(binding, [])
}

_api.engine.validate.checkIterationIdsRec = (binding, ids) => {
    if (binding.isA("Rule")) {
        // Check if the rule has an 'Iterator' child
        let iterator = null
        for (var i = 0; i < binding.childs().length; i++) {
            if (binding.childs()[i].isA("Iterator")) {
                iterator = binding.childs()[i]
                break;
            }
        }
        
        if (iterator) {
            // Check if the variables are contained in ids
            if (iterator.childs().length === 0) {
                throw _api.util.exception("Found Iterator element in AST without children")
            }
            let variablesNode = iterator.childs()[0]
            if (!variablesNode.isA("Variables")) {
                throw _api.util.exception("Expected first child of Iterator to always " + 
                                          "be Variables, but it was not")
            }
            
            let variables = _api.engine.validate.getAllVariables(variablesNode)
            // TODO: Check if all start with @
            for (var i = 0; i < variables.length; i++) {
                // Check if all start with correct prefix
                if (variables[i].get("ns") !== $api.bindingScopeAdapterPrefix()) {
                    throw _api.util.exception("You can only use the binding scope adapter as the " +
                                              "variable for an iteration. Instead " + variables[i].get("text") + " " +
                                              "was used")
                }
                
                // $.inArray(value, array) returns index or -1 if not found
                if ($api.$().inArray(variables[i].get("id"), ids) >= 0) {
                    throw _api.util.exception("Variable " + variables[i].get("text") +
                                              " was used as an iteration variable " +
                                              " but was also declared in an ancestor scope")
                }
            }
        }
        
        let variables = _api.engine.validate.getAllVariables(binding, "Rule")
        let variableIdsToAdd = []
        for (var i = 0; i < variables.length; i++) {
            let variable = variables[i]
            // Only add those ids that are refs to the binding scope and that are neither
            // - in the ids already found (happens if same name used on multiple levels)
            // - in the variableNamesToAdd already (happens if occuring multiple times in rule)
            if (variable.get("ns") === $api.bindingScopeAdapterPrefix() &&
                $api.$().inArray(variable.get("id"), ids) === -1 &&
                $api.$().inArray(variable.get("id"), variableIdsToAdd) === -1) {
                variableIdsToAdd.push(variable.get("id"))
            }
        }
        // Add new variables (creates copy)
        ids = ids.concat(variableIdsToAdd)
    }
    
    // Recursion
    for (var i = 0; i < binding.childs().length; i++) {
        _api.engine.validate.checkIterationIdsRec(binding.childs()[i], ids)
    }
}

_api.engine.validate.getAllVariables = (binding, stopAt) => {
    let result = []
    _api.engine.validate.getAllVariablesRec(binding, stopAt, true, result)
    return result
}

_api.engine.validate.getAllVariablesRec = (binding, stopAt, firstCall, accumulator) => {
    // binding: AST
    // stopAt: string if walk comes to AST with that type and this AST is not the root of the search,
    //         search is not continued at this point
    // firstCall: boolean whether it is the first call. Prevents stopping if ROOT.T === stopAt
    // accumulator: [] reference to a list of all variables found so far
    
    if (binding.isA("Variable")) {
        accumulator.push(binding)
    }
    if (firstCall || !stopAt || !binding.isA(stopAt)) {
        for (var i = 0; i < binding.childs().length; i++) {
            _api.engine.validate.getAllVariablesRec(binding.childs()[i], stopAt, false, accumulator)
        }
    }
}