/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.engine.init = (binding) => {
    var model = binding.vars.model
    var template = binding.vars.template
    var binding = binding.vars.ast
    
    // Step 1: Check if iteration ids were used earlier
    // This is a sanity check. Counter example:
    // ... {
    //      @entry <- $foo
    //      li (@entry, @key: $bar) { ... }
    // }
    console.log(binding.dump())
    _api.engine.validate.checkIterationIds(binding)
    
    // Step 2: Replace selectors with their elements in the template
    // Rules might be duplicated because of
    // - Multiple matches for one selector
    // - CombinationLists (e.g. '.foo, #bar')
    // - Nested structures with CombinationLists which result in exponential many new rules
    //   e.g. '.foo, .bar { ... .baz, .quux {<rule>} }) evaluates the following selectors
    //   against the template:
    //      - .foo .baz
    //      - .foo .quux
    //      - .bar .baz
    //      - .bar .quux
    //  Assuming that each selector matches exactly one element, the original <rule>
    //  is then replaced by four new rules with these elements
    _api.engine.transform.expandSelectors(template, binding)
    
    
    console.log(binding.dump())
    
    return binding
}
