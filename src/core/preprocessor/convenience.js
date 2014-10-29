/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.org>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* global JSON */
                
_api.preprocessor.convenience.twoWayBindings = (ast) => {
    _api.util.each(ast.getAll("Binding"), (binding) => {
        let operators = binding.getAll("BindingOperator")
        _api.util.assume(operators.length > 0)
        if (/* is Two-Way Binding*/ operators[0].get("value") === "<->") {
            _api.util.each(operators, (operator) => {
                operator.set("value", "->")
            })
            let newBinding = binding.clone()
            _api.util.each(newBinding.getAll("BindingOperator"), (operator) => {
                operator.set("value", "<-")
            })
            // Add newBinding after old one
            _api.util.assume(binding.getParent())
            binding.getParent().addAt(binding.getParent().childs().indexOf(binding) + 1, newBinding)
        }
    })
}

_api.preprocessor.convenience.parameter = (ast, bindingScopePrefix, counter) => {
    _api.util.each(ast.getAll("Parameters"), (parameters) => {
        // Validate, that positional and named parameters are never mixed
        let allNamed = _api.util.array.ifAll(parameters.childs(), (child) => {
            return child.isA("ParamNamed")
        })
        let allPositional = _api.util.array.ifAll(parameters.childs(), (child) => {
            return child.isA("ParamPositional")
        })
        if (!allNamed && !allPositional) {
            let binding = parameters
            while (binding && !binding.isA("Binding")) {
                binding = binding.getParent()
            }
            throw _api.util.exception("It is not allowed to mix positional and name " +
                "based parameters as in " + binding.asBindingSpec())
        }
        // Denest all Parameters
        let directChildParameters = parameters.getAll("Parameters", "Parameters")
        _api.util.array.remove(directChildParameters, parameters)
        _api.util.each(directChildParameters, (directChildParameter) => {
            let variable = directChildParameter.getParent()
            let variableHook = variable.getParent()
            let variableIndex = variableHook.childs().indexOf(variable)
            _api.util.assume(variable.isA("Variable"))
            let newTempId = "temp" + counter.getNext()
            let newTempRef = bindingScopePrefix + newTempId
            let newBinding = _api.dsl.parser.safeParser(newTempRef + " <- foo", "binding")
            // Replace foo by variable
            let foo = _api.util.array.findFirst(newBinding.getAll("Variable"), (variable) => {
                return variable.get("ns") === "" && variable.get("id") === "foo"
            })
            _api.util.assume(foo)
            variable.getParent().del(variable)
            foo.replace(variable)
            // Replace place of variable by newTempId
            let newTempRefAst = _api.util.array.findFirst(newBinding.getAll("Variable"), (variable) => {
                return variable.get("ns") === bindingScopePrefix && variable.get("id") === newTempId
            })
            _api.util.assume(newTempRefAst)
            variableHook.addAt(variableIndex, newTempRefAst.clone())
            // Add newBinding
            let binding = parameters
            while (binding && !binding.isA("Binding")) {
                binding = binding.getParent()
            }
            _api.util.assume(binding)
            binding.getParent().addAt(binding.getParent().childs().indexOf(binding), newBinding)
        })
    })
}

// TODO: Comment
_api.preprocessor.convenience.expression = (ast, bindingScopePrefix, counter) => {
    _api.util.each(ast.getAll("ExprSeq"), (exprSeq) => {
        _api.util.each(exprSeq.childs(), (child) => {
            _api.preprocessor.convenience.convertExpression(child, bindingScopePrefix, counter)
        })
    })
    _api.util.each(ast.getAll("Parameters"), (parameters) => {
        _api.util.each(parameters.childs(), (child) => {
            // child is now either a NamedParam or PositionalParam element
            // its first child is the actual parameter
            _api.util.assume(child.childs()[0])
            _api.preprocessor.convenience.convertExpression(child.childs()[0], bindingScopePrefix, counter)
        })
    })
}

// TODO: Comment and explain idea
_api.preprocessor.convenience.convertExpression = (ast, bindingScopePrefix, counter) => {
    if (!ast.isA("Variable")) {
        let variables = []
        let fn = _api.preprocessor.convenience.getExpressionFn(ast, bindingScopePrefix, counter, variables)
        // If the expression does not need any variables, use a fake one
        if (variables.length === 0) {
            let fakeVariable = new _api.util.Tree("Variable").set({ ns: bindingScopePrefix, id: "temp" + counter.getNext() })
            variables.push(fakeVariable)
        }
        // Create an expression Sequence from variables
        let variablesExprSeq = new _api.util.Tree("ExprSeq").add(variables)
        let exprReplacer = new _api.util.Tree("Variable").set({ ns: bindingScopePrefix, id: "temp" + counter.getNext() })
        // Create a new binding
        let newBinding = _api.dsl.parser.safeParser("foo <- virtual <- bar", "binding")
        // Replace foo by exprReplacer
        let foo = _api.util.array.findFirst(newBinding.getAll("Variable"), (variable) => {
            return variable.get("id") === "foo"
        })
        _api.util.assume(foo)
        foo.replace(exprReplacer)
        // Replace bar by variablesExprSeq
        let bar = _api.util.array.findFirst(newBinding.getAll("Variable"), (variable) => {
            return variable.get("id") === "bar"
        })
        _api.util.assume(bar)
        _api.util.assume(bar.getParent().isA("ExprSeq"))
        bar.getParent().replace(variablesExprSeq)
        // Set virtual to be virtual and evaluation function
        let virtual = newBinding.getAll("Connector")[0]
        _api.util.assume(virtual)
        virtual.set("virtual", true)
        virtual.set("fn", {
            process: (input) => {
                return fn(input)
            }
        })
        
        // Add the new Binding
        let binding = ast
        while (binding && !binding.isA("Binding")) {
            binding = binding.getParent()
        }
        _api.util.assume(binding)
        
        // Take Initiators over to the expression binding if the expression itself was not used as an initiator
        let ref = ast
        let usedInInitiator = false
        while (ref && ref.getParent() && !ref.isA("Binding")) {
            if (ref.isA("Initiator")) {
                usedInInitiator = true
                break
            }
            ref = ref.getParent()
        }
        if (!usedInInitiator) {
            // Check if binding has Initiators
            let bos = binding.getAll("BindingOperator")
            _api.util.assume(bos.length > 0)
            let direction = bos[0].get("value") === "<-" ? "left" : "right"
            _api.util.assume(binding.childs().length >= 2)
            _api.util.assume(binding.childs()[0].isA("Adapter"))
            _api.util.assume(binding.childs()[binding.childs().length - 1].isA("Adapter"))
            let sourceAdapter = direction === "right" ? binding.childs()[0] : binding.childs()[binding.childs().length - 1]
            let initiator = sourceAdapter.getAll("Initiator")
            _api.util.assume(initiator.length <= 1)
            if (initiator.length === 1) {
                // add initiator
                _api.util.assume(variablesExprSeq.getParent().isA("Adapter"))
                variablesExprSeq.getParent().add(initiator[0].clone())
            }
        }
        
        // Replace the original ast by the exprReplacer
        ast.replace(exprReplacer)
        // Add newBinding
        binding.getParent().addAt(binding.getParent().childs().indexOf(binding), newBinding)
    }
}

// TODO: Comment and explain idea
_api.preprocessor.convenience.getExpressionFn = (ast, bindingScopePrefix, counter, /* out */ variables) => {
    let fn
    if (ast.isA("Variable")) {
        let oldVariable = _api.util.array.findFirst(variables, (variable) => {
            return variable.get("id") === ast.get("id") && variable.get("ns") === ast.get("ns")
        })
        let index
        if (!_api.util.object.isDefined(oldVariable)) {
            index = variables.push(ast) - 1
        } else {
            index = variables.indexOf(oldVariable)
        }
        fn = (() => {
            let myIndex = index
            return (input) => {
                return input[myIndex]
            }
        })()
    } else if (ast.isA("LiteralString") || ast.isA("LiteralNumber") || ast.isA("LiteralValue")) {
        fn = (() => {
            let value = ast.get("value")
            return  () => {
                return value
            }
        })()
    } else if (ast.isA("Additive")) {
        fn = (() => {
            let summands = []
            let operands = []
            _api.util.each(ast.childs(), (child, index) => {
                if (index % 2 === 0) {
                    // Recursion
                    summands.push(_api.preprocessor.convenience.getExpressionFn(child, bindingScopePrefix, counter, variables))
                } else {
                    _api.util.assume(child.isA("AdditiveOp"))
                    operands.push(child.get("op"))
                }
            })
            return (input) => {
                let result = _api.util.convertIfReference(summands[0](input))
                for (var i = 1; i < summands.length; i++) {
                    let summand = _api.engine.binding.convertToValues(summands[i](input))
                    if (operands[i - 1] === "+") {
                        if (result instanceof Array) {
                            _api.util.array.addAll(result, summand)
                        } else {
                            result = _api.util.object.isDefined(result) ? result : 0
                            summand = _api.util.object.isDefined(summand) ? summand : 0
                            result += summand
                        }
                    } else if (operands[i - 1] === "-") {
                        if (result instanceof Array) {
                            let toRemove = _api.util.array.findFirst(result, (item) => {
                                return _api.util.object.equals(
                                            _api.engine.binding.convertToValues(item),
                                            summand
                                        )
                            })
                            if (!toRemove) {
                                throw _api.util.exception("Tried to remove " + JSON.stringify(_api.engine.binding.convertToValues(summand)) +
                                    " from " + JSON.stringify(_api.engine.binding.convertToValues(result)) + ", but it was not there")
                            }
                            _api.util.array.remove(result, toRemove)
                        } else {
                            result = _api.util.object.isDefined(result) ? result : 0
                            summand = _api.util.object.isDefined(summand) ? summand : 0
                            result -= summand
                        }
                    } else {
                        _api.util.assume(false)
                    }
                }
                return result
            }
        })()
    } else if (ast.isA("Multiplicative")) {
        fn = (() => {
            let factors = []
            let operands = []
            _api.util.each(ast.childs(), (child, index) => {
                if (index % 2 === 0) {
                    // Recursion
                    factors.push(_api.preprocessor.convenience.getExpressionFn(child, bindingScopePrefix, counter, variables))
                } else {
                    _api.util.assume(child.isA("MultiplicativeOp"))
                    operands.push(child.get("op"))
                }
            })
            return (input) => {
                let result = _api.util.convertIfReference(factors[0](input))
                result = _api.util.object.isDefined(result) ? result : 1
                for (var i = 1; i < factors.length; i++) {
                    let factor = _api.util.convertIfReference(factors[i](input))
                    factor = _api.util.object.isDefined(factor) ? factor : 1
                    if (operands[i - 1] === "*") {
                        result *= factor
                    } else if (operands[i - 1] === "/") {
                        result /= factor
                    } else if (operands[i - 1] === "%") {
                        result %= factor
                    } else {
                        _api.util.assume(false)
                    }
                }
                return result
            }
        })()
    } else if (ast.isA("Conditional")) {
        fn = (() => {
            _api.util.assume(ast.childs().length === 3)
            // Recursion
            let iF = _api.preprocessor.convenience.getExpressionFn(ast.childs()[0], bindingScopePrefix, counter, variables)
            let theN = _api.preprocessor.convenience.getExpressionFn(ast.childs()[1], bindingScopePrefix, counter, variables)
            let elsE = _api.preprocessor.convenience.getExpressionFn(ast.childs()[2], bindingScopePrefix, counter, variables)
            return (input) => {
                let ifValue = _api.util.convertIfReference(iF(input))
                return ifValue ? theN(input) : elsE(input)
            }
        })()
    } else if (ast.isA("LogicalNot")) {
        fn = (() => {
            _api.util.assume(ast.childs().length === 1)
            // Recursion
            let toNot = _api.preprocessor.convenience.getExpressionFn(ast.childs()[0], bindingScopePrefix, counter, variables)
            return (input) => {
                let toNotValue = _api.util.convertIfReference(toNot(input))
                return !toNotValue
            }
        })()
    } else if (ast.isA("Logical")) {
        fn = (() => {
            let facts = []
            let operands = []
            _api.util.each(ast.childs(), (child, index) => {
                if (index % 2 === 0) {
                    // Recursion
                    facts.push(_api.preprocessor.convenience.getExpressionFn(child, bindingScopePrefix, counter, variables))
                } else {
                    _api.util.assume(child.isA("LogicalOp"))
                    operands.push(child.get("op"))
                }
            })
            return (input) => {
                let result = _api.util.convertIfReference(facts[0](input))
                for (var i = 1; i < facts.length; i++) {
                    if (operands[i - 1] === "&&") {
                        result = result && _api.util.convertIfReference(facts[i](input))
                    } else if (operands[i - 1] === "||") {
                        result = result || _api.util.convertIfReference(facts[i](input))
                    } else {
                        _api.util.assume(false)
                    }
                }
                return result
            }
        })()
    } else if (ast.isA("Relational")) {
        fn = (() => {
            let facts = []
            let operands = []
            _api.util.each(ast.childs(), (child, index) => {
                if (index % 2 === 0) {
                    // Recursion
                    facts.push(_api.preprocessor.convenience.getExpressionFn(child, bindingScopePrefix, counter, variables))
                } else {
                    _api.util.assume(child.isA("RelationalOp"))
                    operands.push(child.get("op"))
                }
            })
            return (input) => {
                let result = true
                // Compare pairs of two, all must be true
                for (var i = 0; i < facts.length - 1; i++) {
                    let left = _api.util.convertIfReference(facts[i](input))
                    let right = _api.util.convertIfReference(facts[i + 1](input))
                    
                    if (operands[i] === "==") {
                        /* jshint ignore:start */
                        result = result && left == right
                        /* jshint ignore:end */
                    } else if (operands[i] === "===") {
                        result = result && left === right
                    } else if (operands[i] === "!=)") {
                        /* jshint ignore:start */
                        result = result && left != right
                        /* jshint ignore:end */
                    } else if (operands[i] === "!==") {
                        result = result && left !== right
                    } else if (operands[i] === "<=") {
                        result = result && left <= right
                    } else if (operands[i] === ">=") {
                        result = result && left >= right
                    } else if (operands[i] === "<") {
                        result = result && left < right
                    } else if (operands[i] === ">") {
                        result = result && left > right
                    }
                    
                    if (!result) {
                        break
                    }
                }
                return result
            }
        })()
    } else if (ast.isA("Deref")) {
        fn = (() => {
            _api.util.assume(ast.childs().length > 1)
            // Recursion
            let base = _api.preprocessor.convenience.getExpressionFn(ast.childs()[0], bindingScopePrefix, counter, variables)
            let derefs = []
            for (var i = 1; i < ast.childs().length; i++) {
                let deref = ast.childs()[i]
                if (deref.isA("Identifier")) {
                    let fn = (() => {
                        let myId = deref.get("id")
                        return () => {
                            return myId
                        }
                    })()
                    derefs.push(fn)
                } else {
                    derefs.push(_api.preprocessor.convenience.getExpressionFn(ast.childs()[i], bindingScopePrefix, counter, variables))
                }
            }
            return (input) => {
                let baseValue = base(input)
                _api.util.each(derefs, (deref) => {
                    let derefValue = _api.util.convertIfReference(deref(input))
                    if (baseValue instanceof Array) {
                        if (derefValue < 0 || derefValue >= baseValue.length) {
                            throw _api.util.exception("Can not resolve deref " + derefValue + " in " + 
                                JSON.stringify(_api.engine.binding.convertToValues(baseValue)))
                        }
                        baseValue = baseValue[derefValue]
                    } else if (_api.util.isReference(baseValue)) {
                        baseValue = baseValue.cloneAndAddToPath(derefValue)
                    } else if (typeof baseValue === "object") {
                        if (!baseValue.hasOwnProperty(derefValue)) {
                            throw _api.util.exception("Can not resolve deref " + derefValue + " in " + 
                                JSON.stringify(_api.engine.binding.convertToValues(baseValue)))
                        }
                        baseValue = baseValue[derefValue]
                    } else {
                        throw _api.util.exception("Can not resolve deref " + derefValue + " in " + 
                            JSON.stringify(_api.engine.binding.convertToValues(baseValue)))
                    }
                })
                return baseValue
            }
        })()
    } else if (ast.isA("Array")) {
        fn = (() => {
            // Recursion
            let elements = []
            _api.util.each(ast.childs(), (child) => {
                elements.push(_api.preprocessor.convenience.getExpressionFn(child, bindingScopePrefix, counter, variables))
            })
            return (input) => {
                let result = []
                _api.util.each(elements, (element) => {
                    result.push(element(input))
                })
                return result
            }
        })()
    } else if (ast.isA("Hash")) {
        fn = (() => {
            let hash = {}
            _api.util.each(ast.childs(), (keyVal) => {
                _api.util.assume(keyVal.isA("KeyVal"))
                _api.util.assume(keyVal.childs().length === 2)
                let idAst = keyVal.childs()[0]
                _api.util.assume(idAst.isA("Identifier"))
                let id = idAst.get("id")
                // Recursion
                let valueFn = _api.preprocessor.convenience.getExpressionFn(keyVal.childs()[1], bindingScopePrefix, counter, variables)
                hash[id] = valueFn
            })
            return (input) => {
                let result = {}
                _api.util.each(hash, (valueFn, key) => {
                    result[key] = valueFn(input)
                })
                return result
            }
        })()
    } else if (ast.isA("Lambda")) {
        fn = (() => {
            let identifiers = []
            _api.util.assume(ast.childs().length === 2)
            let identifiersAst = ast.childs()[0]
            _api.util.each(identifiersAst.childs(), (identifierAst) => {
                let id = identifierAst.get("id")
                if (_api.repository.adapter.has(id)) {
                    throw _api.util.exception("You can not use " + id + " as the parameter for " +
                        "a lambda expression because an adapter with this name is already registered")
                }
                identifiers.push(id)
                variables.push(_api.util.Tree("Variable").set({ id: id, ns: "" }))
            })
            let insertVariablesAt =  variables.length - identifiers.length
            
            let expressionAst = ast.childs()[1]
            _api.util.assume(expressionAst.childs().length === 1)
            let exprFn = _api.preprocessor.convenience.getExpressionFn(expressionAst.childs()[0], bindingScopePrefix, counter, variables)
            _api.util.each(identifiers, () => {
                _api.util.array.removeAt(variables, insertVariablesAt)
            })
            return (input) => {
                return () => {
                    let inputClone = _api.util.array.clone(input)
                    for (var i = identifiers.length - 1; i >= 0; i--) {
                        _api.util.array.addAt(inputClone, arguments[i], insertVariablesAt)
                    }
                    return exprFn(inputClone)
                }
            }
        })()
    }
    return fn
}