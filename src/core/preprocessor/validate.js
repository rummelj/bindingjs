/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.preprocessor.validate.checkIterationIds = (ast, bindingScopePrefix) => {
    _api.preprocessor.validate.checkIterationIdsRec(ast, bindingScopePrefix, [])
}

_api.preprocessor.validate.checkIterationIdsRec = (ast, bindingScopePrefix, ids) => {
    if (ast.isA("Scope")) {
        // Check if the scope has an 'Iterator' child
        let iterator = _api.util.array.findFirst(ast.childs(), (child) => {
            return child.isA("Iterator")
        })
        
        if (iterator) {
            // Check if the variables are contained in ids
            _api.util.assume(iterator.childs().length !== 0)
            let variablesNode = iterator.childs()[0]
            _api.util.assume(variablesNode.isA("Variables"))
            let variables = variablesNode.getAll("Variable", "Scope")
            _api.util.array.each(variables, (variable) => {
                // Check if all start with correct prefix
                if (variable.get("ns") !== bindingScopePrefix) {
                    throw _api.util.exception("You can only use the binding scope adapter as the " +
                                              "variable for an iteration. Instead " + variable.get("text") + " " +
                                              "was used")
                }
                
                // $.inArray(value, array) returns index or -1 if not found
                // indexOf is not enough here because objects have to be deeply compared
                if ($api.$().inArray(variable.get("id"), ids) >= 0) {
                    throw _api.util.exception("Variable " + variable.get("text") +
                                              " was used as an iteration variable " +
                                              " but was also declared in an ancestor scope")
                }
            })
        }
        
        let variables = ast.getAll("Variable", "Scope")
        let variableIdsToAdd = []
        _api.util.array.each(variables, (variable) => {
            // Only add those ids that are refs to the binding scope and that are neither
            // - in the ids already found (happens if same name used on multiple levels)
            // - in the variableNamesToAdd already (happens if occuring multiple times in scope)
            if (variable.get("ns") === bindingScopePrefix &&
                $api.$().inArray(variable.get("id"), ids) === -1 &&
                $api.$().inArray(variable.get("id"), variableIdsToAdd) === -1) {
                variableIdsToAdd.push(variable.get("id"))
            }
        })
        // Add new variables (creates copy)
        ids = ids.concat(variableIdsToAdd)
    }
    
    // Recursion
    _api.util.array.each(ast.childs(), (child) => {
        _api.preprocessor.validate.checkIterationIdsRec(child, bindingScopePrefix, ids)
    })
}

_api.preprocessor.validate.preventMultiIteration = (ast) => {
    let elements = []
    _api.util.array.each(ast.getAll("Iterator"), (iterator) => {
        let scope = iterator.getParent()
        _api.util.assume(scope.isA("Scope"))
        let element = scope.get("element")
        _api.util.assume(element)
        if (_api.util.array.contains(elements, element)) {
            throw _api.util.exception("It is not allowed to iterate the same template element multiple times as in\n" + 
                scope.get("text"))
        }
        elements.push(element)
    })
}

_api.preprocessor.validate.checkSockets = (ast) => {   
    let elements = []
    _api.util.array.each(ast.getAll("Scope"), (scope) => {
        elements.push(scope.get("element"))
    })
    
    _api.util.array.each(ast.getAll("Label"), (label) => {
        let scope = label.getParent()
        _api.util.assume(scope.isA("Scope"))
        let element = scope.get("element")
        let count = _api.util.array.count(elements, (otherElement) => {
            return $api.$()(otherElement).is(element)
        })
        if (count > 1) {
            throw _api.util.exception("The selector of Socket " + label.get("id") +
                " either does not match a single element or the element is matched  " +
                "by the selectors of other scopes")
        }
    })
}