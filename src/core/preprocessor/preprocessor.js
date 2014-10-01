/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.preprocessor.preprocess = (viewDataBinding) => {
    let template = viewDataBinding.vars.template
    let bind = viewDataBinding.vars.ast
    let bindingScopePrefix = viewDataBinding.bindingScopePrefix()
    let tempCounter = viewDataBinding.vars.tempCounter
    
    // Step 1: Check if iteration ids were used earlier and if they're all starting with bindingScopePrefix
    // This is a sanity check. Counter example:
    // ... {
    //      @entry <- $foo
    //      li (@entry, @key: $bar) { ... }
    // }
    _api.preprocessor.validate.checkIterationIds(bind, bindingScopePrefix)
    
    // Step 2: Rename sockets, so that they include their ancestor group names
    _api.preprocessor.transform.renameSockets(bind)
    
    // Step 3: Check, if all bindings only use one of the symbols <-, ->, <~, ~> or <->
    _api.preprocessor.validate.checkDirections(bind)
    
    // Step 4: Change parameters, so that each parameter is a single adapter without parameter
    // Example: @foo(@bar(@baz)) nests parameter, which is changed to the following set of bindings
    // @temp <- @bar(@baz)
    // .. @foo(@temp) ...
    _api.preprocessor.convenience.parameter(bind, bindingScopePrefix, tempCounter)
    
    // Step 5: Transform two-way bindings into two one way bindings
    _api.preprocessor.convenience.twoWayBindings(bind)
    
    // Step 6: Replace selectors with their elements in the template
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
    
    // Step 7: Check that one socket always exactly matches only one element
    // from the template
    _api.preprocessor.validate.checkSockets(bind)
    
    // Step 8: Make all references to the binding scope unique
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
    
    
    // Step 9: Make every iteration read out of the temp scope.
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
    
    // Step 10: Prevent iterating over the same element more than once
    // This would lead to confusion and the order in which the binding is written would affect the template
    // It is however always possible to define the same element multiple times in the template
    _api.preprocessor.validate.preventMultiIteration(bind)
    
    // Step 11: Move Bindings that affect iterated elements into the iteration
    _api.preprocessor.transform.nestIteratedBindings(bind)
    
    // Step 12: Setup iteration tree
    let iterationTree = _api.preprocessor.iterator.setupIterationTree(bind, template)
    
    // Step 13: Mark the sockets in the iteration tree
    _api.preprocessor.transform.markSockets(iterationTree)
    
    // Step 14: Setup expanded iteration tree
    _api.preprocessor.iterator.setupExpandedIterationTree(viewDataBinding, iterationTree)
    
    viewDataBinding.vars.iterationTree = iterationTree
    viewDataBinding.vars.binding = bind
    delete viewDataBinding.vars.ast
}
