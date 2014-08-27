/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
 _api.repository.adapter.init = () => {
    if (!_api.adapterRepo) {
        _api.adapterRepo = {}
    }
 }
 
 _api.repository.adapter.register = (name, impl) => {
    _api.repository.adapter.init()
    _api.adapterRepo[name] = impl
 }
 
 _api.repository.adapter.get = (name) => {
    _api.repository.adapter.init()
    if (!_api.adapterRepo[name]) {
        throw _api.util.exception("No adapter with name " + name +
            " registered")
    }
    return _api.adapterRepo[name]
 }
 
 _api.repository.adapter.getAll = (type) => {
    _api.repository.adapter.init()
    let result = []
    for (name in _api.adapterRepo) {
        let impl = _api.repository.adapter.get(name)
        if (impl.type() == type) {
            result.push(impl)
        }
    }
    return result
 }