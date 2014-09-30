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