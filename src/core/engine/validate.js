/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.engine.validate.checkIterationIds = (binding, bindingScopePrefix) => {
    _api.engine.validate.checkIterationIdsRec(binding, bindingScopePrefix, [])
}

_api.engine.validate.checkIterationIdsRec = (binding, bindingScopePrefix, ids) => {
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
            
            let variables = variablesNode.getAll("Variable", "Rule")
            // TODO: Check if all start with @
            for (var i = 0; i < variables.length; i++) {
                // Check if all start with correct prefix
                if (variables[i].get("ns") !== bindingScopePrefix) {
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
        
        let variables = binding.getAll("Variable", "Rule")
        let variableIdsToAdd = []
        for (var i = 0; i < variables.length; i++) {
            let variable = variables[i]
            // Only add those ids that are refs to the binding scope and that are neither
            // - in the ids already found (happens if same name used on multiple levels)
            // - in the variableNamesToAdd already (happens if occuring multiple times in rule)
            if (variable.get("ns") === bindingScopePrefix &&
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
        _api.engine.validate.checkIterationIdsRec(binding.childs()[i], bindingScopePrefix, ids)
    }
}