/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.org>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.preprocessor.transform.renameSockets = (ast) => {
    _api.util.each(ast.getAll("Label"), (label) => {
        let id = label.get("id")
        let ref = label.getParent()
        while (ref) {
            if (ref.isA("Group")) {
                id = ref.get("id") + "." + id
            }
            ref = ref.getParent()
        }
        label.set("id", id)
    })
}

_api.preprocessor.transform.expandSelectors = (template, ast) => {
    _api.preprocessor.transform.expandSelectorsRec(template, ast, [[]])
    
    // Remove all placeholder
    _api.util.each(ast.getAll("Placeholder"), (placeholder) => {
        placeholder.getParent().del(placeholder)
    })
}

_api.preprocessor.transform.expandSelectorsRec = (template, ast) => {
    if (ast.isA("Scope") && !ast.get("element")) {
        let selectorList = []
        
        // Add intermediate selectors on the way down
        let selectorListElem = ast.childs()[0]
        _api.util.assume(selectorListElem.isA("SelectorList"))
        
        _api.util.each(selectorListElem.childs(), (selectorCombination) => {
            _api.util.assume(selectorCombination.isA("SelectorCombination"))
            selectorList.push(selectorCombination.get("text"))
        })
        
        // Generate new scopes
        let newScopes = []
        // Prepare old scope by removing its first child to prevent
        // doing it for every clone
        // First child must be SelectorList (was checked above)
        ast.del(ast.childs()[0])
        
        _api.util.each(selectorList, (selector) => {
            // Select all matching elements in template
            let elements = $api.$()(selector, template)
            if (elements.length === 0) {
                $api.debug(5, "Found no element for selector " + selector + " in\n" +
                              _api.util.jQuery.outerHtml(template))
            }
            
            // Note. If the selector did not match any elements, the scope disappears
            for (let j = 0; j < elements.length; j++) {
                let newScope = ast.clone()
                newScope.set("element", elements[j])
                newScopes.push(newScope)
            }
        })
        
        if (newScopes.length > 0) {
            // Replace old scope with newScopes
            ast.replace(newScopes)
        } else {
            // The parent call iterates over its children in ascending order
            // If the amount of children is increased it is not a problem
            // If however it is decreased elements might get skipped
            // So a placeholder is added, which is later removed
            ast.replace(new _api.util.Tree("Placeholder"))
        }
        
        // Recursion over every newly generated scope
        _api.util.each(newScopes, (newScope) => {
            _api.util.each(newScope.childs(), (child) => {
                _api.preprocessor.transform.expandSelectorsRec(newScope.get("element"), child)
            })
        })
    } else {
        // Recursion
        _api.util.each(ast.childs(), (child) => {
            _api.preprocessor.transform.expandSelectorsRec(template, child)
        })
    }
}

_api.preprocessor.transform.makeTempRefsUnique = (ast, bindingScopePrefix, tempCounter) => {
    _api.preprocessor.transform.makeTempRefsUniqueRec(ast, bindingScopePrefix, tempCounter, {})
}

_api.preprocessor.transform.makeTempRefsUniqueRec = (ast, bindingScopePrefix, tempCounter, assign) => {
    if (ast.isA("Scope")) {
        // Find all temp references in this scope
        let assignCopied = false
        let refs = ast.getAll("Variable", "Scope")
        for (let i = 0; i < refs.length; i++) {
            let ref = refs[i]
            if (ref.get("ns") === bindingScopePrefix) {
                // Check if ref was assigned before
                if (!assign[ref.get("id")]) {
                    // We are about to change assign
                    // Since further recursion receives a reference
                    // assign needs to be cloned once
                    if (!assignCopied) {
                        assign = _api.util.object.clone(assign)
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
    _api.util.each(ast.childs(), (child) => {
        _api.preprocessor.transform.makeTempRefsUniqueRec(child, bindingScopePrefix, tempCounter, assign)
    })
}

_api.preprocessor.transform.extractIterationCollections = (ast, bindingScopePrefix, tempCounter) => {
    _api.util.each(ast.getAll("Iterator"), (iterator) => {         
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
        _api.util.assume(iterationExpression.isA("Expr"))
        _api.util.assume(iterationExpression.childs().length === 1)
            
        iterationExpression = iterationExpression.childs()[0]
        let foo = _api.util.array.findFirst(newBinding.getAll("Variable"), (variable) => {
            return variable.get("ns") === "" && variable.get("id") === "foo"
        })
        _api.util.assume(foo)
        foo.replace(iterationExpression.clone())
        
        if (parentScope) {
            // Add binding to parentScope
            parentScope.add(newBinding)
        } else {
            // 1. Check if no View Mask Adpater are used in iterationExpression
            let viewAdapter = _api.util.array.findFirst(iterationExpression.getAll("Variable"), (variable) => {
                let adapterName = variable.get("ns") !== "" ? variable.get("ns") : variable.get("id")
                return adapterName !== bindingScopePrefix && _api.repository.adapter.get(adapterName).type() === "view"
            })
            if (viewAdapter) {
                throw _api.util.exception("It is not allowed to use view adapter in iteration " +
                    "expression, if the iteration has no parent inside the same group as in " +
                    iterationExpression.asBindingSpec())
            }
    
            // 2. Create virtual Scope
            let virtualScope = _api.dsl.parser.safeParser(".foo {}").getAll("Scope")[0]
            _api.util.assume(virtualScope.childs()[0].isA("SelectorList"))
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
    })
}

_api.preprocessor.transform.nestIteratedBindings = (ast) => {
    // Create a map of all elements and their scopes
    let elementToScopeMap = new _api.util.Map()
    let scopes = ast.getAll("Scope")
    _api.util.each(scopes, (scope) => {
        let element = scope.get("element")
        if (!elementToScopeMap.hasKey(element)) {
            elementToScopeMap.set(element, [])
        }
        elementToScopeMap.get(element).push(scope) 
    })
    
    // For each entry in the map, check if the element has a parent with an iterated scope
    _api.util.each(elementToScopeMap.getKeys(), (element) => {
        // Check if any parent is iterated
        let iteratedScope
        let ref = element
        while (ref) {
            iteratedScope = _api.util.array.findFirst(elementToScopeMap.get(ref), (scope) => {
                return scope.childs().length > 0 && scope.childs()[0].isA("Iterator")
            })
            if (iteratedScope) {
                break
            }
            ref = ref.parentElement
        }
        
        if (iteratedScope) {
            // Check if all scopes are a descendant of the iterated scope
            _api.util.each(elementToScopeMap.get(element), (scope) => {
                let ref = scope
                while (ref && ref !== iteratedScope) {
                    ref = ref.getParent()
                }
                // If the scope is now undefined it has to be moved into iterated Scope
                if (!ref) {
                    scope.getParent().del(scope)
                    iteratedScope.add(scope)
                }
            })
        }
    })
    
    // Check for empty Scopes and remove them
    _api.util.each(scopes, (scope) => {
        if (scope.getAll("Binding").length  === 0 &&
            scope.getAll("Iterator").length === 0 &&
            scope.getAll("Export").length   === 0 &&
            scope.getAll("Import").length   === 0 &&
            scope.getAll("Label").length    === 0) {
                scope.getParent().del(scope)
        }
    })
}

_api.preprocessor.transform.markSockets = (iterationTree) => {
    iterationTree.set("sockets", [])
    
    let ast = iterationTree.get("binding")
    _api.util.each(ast.getAll("Label"), (label) => {
        let scope = label.getParent()
        _api.util.assume(scope.isA("Scope"))
        iterationTree.get("sockets").push( {element: scope.get("element"), id: label.get("id")} )
    })
    
    // Recursion
    for (let i = 0; i < iterationTree.childs().length; i++) {
        _api.preprocessor.transform.markSockets(iterationTree.childs()[i])
    }
    
    // Remove the scopes with the sockets
    _api.util.each(ast.getAll("Label"), (label) => {
        let scope = label.getParent()
        scope.getParent().del(scope)
    })
}