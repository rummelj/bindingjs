/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
 _api.engine.activate = (binding) => {
     _api.engine.iterator.init(binding)
 }
 
 _api.engine.deactivate = (binding) => {
    _api.engine.iterator.shutdown(binding)
 }
 
 _api.engine.mount = (viewDataBinding, args) => {
    if (args.length === 1) {
        let arg = args[0]
        if (typeof arg === "string") {
            let mountPoint = $api.$()(arg)
            if (mountPoint.length !== 1) {
                throw _api.util.exception("Selector " + arg + " did not match exactly one element, but " +
                                          mountPoint.length)
            }
            _api.engine.iterator.mount(viewDataBinding, mountPoint)
        } else {
            // TOOD
        }
    } else if (args.length === 2) {
         // TODO
    } else {
        throw _api.util.exception("Illegal number of arguments")
    }
 }