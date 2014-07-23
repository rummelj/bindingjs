/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

_api.engine.init = (binding) => {
    var model = binding.vars.model
    var template = binding.vars.template
    var binding = binding.vars.ast
    
    console.log(binding.dump())
    _api.engine.transform.expandSelectors(template, binding)
    console.log(binding.dump())
    
    return binding
}
