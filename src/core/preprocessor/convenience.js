/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.preprocessor.convenience.twoWayBindings = (ast) => {
    _api.util.array.each(ast.getAll("Binding"), (binding) => {
        let operators = binding.getAll("BindingOperator")
        _api.util.assume(operators.length > 0)
        if (/* is Two-Way Binding*/ operators[0].get("value") === "<->") {
            _api.util.array.each(operators, (operator) => {
                operator.set("value", "->")
            })
            let newBinding = binding.clone()
            _api.util.array.each(newBinding.getAll("BindingOperator"), (operator) => {
                operator.set("value", "<-")
            })
            // Add newBinding after old one
            _api.util.assume(binding.getParent())
            binding.getParent().addAt(binding.getParent().childs().indexOf(binding) + 1, newBinding)
        }
    })
}

_api.preprocessor.convenience.parameter = (ast, bindingScopePrefix, counter) => {
    _api.util.array.each(ast.getAll("Parameters"), (parameters) => {
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
        _api.util.array.each(directChildParameters, (directChildParameter) => {
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