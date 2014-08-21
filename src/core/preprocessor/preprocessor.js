/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.preprocessor.preprocess = (binding) => {
    var model = binding.vars.model
    var template = binding.vars.template
    var bind = binding.vars.ast
    var bindingScopePrefix = binding.bindingScopePrefix()
    // A getter would be nicer, but it would be exposed in the public API
    var tempCounter = binding.vars.tempCounter
    
    // Step 1: Check if iteration ids were used earlier
    // This is a sanity check. Counter example:
    // ... {
    //      @entry <- $foo
    //      li (@entry, @key: $bar) { ... }
    // }
    _api.preprocessor.validate.checkIterationIds(bind, bindingScopePrefix)
    
    
    // Step 2: Replace selectors with their elements in the template
    // Scopes might be duplicated because of
    // - Multiple matches for one selector
    // - CombinationLists (e.g. '.foo, #bar')
    // - Nested structures with CombinationLists which result in exponential many new scopes
    //   e.g. '.foo, .bar { ... .baz, .quux {<scope>} }) evaluates the following selectors
    //   against the template:
    //      - .foo .baz
    //      - .foo .quux
    //      - .bar .baz
    //      - .bar .quux
    //  Assuming that each selector matches exactly one element, the original <scope>
    //  is then replaced by four new scopes with these elements
    _api.preprocessor.transform.expandSelectors(template, bind)
    
    // Step 3: Make all references to the binding scope unique
    // This way we do not have to deal with scoping later (except if new items
    // in iterations are added
    // Example (Brackets are scopes and elements inside the brackets are ids):
    //                   (A)
    //                   / \
    //                 (B) (A)
    //                  /    \
    //                 (A)   (B)
    // ===>
    //                   (0)
    //                   / \
    //                 (1) (0)
    //                  /    \
    //                 (0)   (2)
    // All A's reference the same value since they have a common ancestor
    // The two B's however reference different values
    _api.preprocessor.transform.makeTempRefsUnique(bind, bindingScopePrefix, tempCounter)
    
    
    // Step 4: Make every iteration read out of the temp scope.
    // This makes it easier to implement the iteration since it has
    // to only observe the temp scope
    // Example
    // ... {
    //      li (@temp: $collection) { ... }
    // }
    // ===>
    // ... {
    //      @input <- $collection
    //      li (@temp: @input) { ... }
    // }
    //
    // NOTE: It is never necessary to extract a two way binding
    // since @input is artificial and never written. The elements
    // inside however may be references or values, and a back-propagation
    // always happens through references and never through the binding
    _api.preprocessor.transform.extractIterationCollections(bind, bindingScopePrefix, tempCounter)
    
    // Step 5: Prevent iterating over the same element more than once
    // This would lead to confusion and the order in which the binding is written would affect the template
    // It is however always possible to define the same element multiple times in the template
    _api.preprocessor.validate.preventMultiIteration(bind)
    
    binding.vars.binding = bind
    binding.vars.ast = null
    
    // Step 6: Setup iteration tree
    binding.vars.iterationTree =
        _api.preprocessor.iterator.setupIterations(
                                                    binding.vars.binding,
                                                    binding.vars.template
                                                )
}
