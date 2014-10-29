/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.org>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
 _api.repository.connector.init = () => {
    if (!_api.connectorRepo) {
        _api.connectorRepo = {}
    }
 }
 
 _api.repository.connector.register = (name, impl) => {
    _api.repository.connector.init()
    _api.connectorRepo[name] = impl
 }
 
 _api.repository.connector.has = (name) => {
    _api.repository.adapter.init()
    return _api.connectorRepo[name] ? true : false
 }
 
 _api.repository.connector.get = (name) => {
    _api.repository.connector.init()
    if (!_api.connectorRepo[name]) {
        throw _api.util.exception("No connector with name " + name +
            " registered")
    }
    return _api.connectorRepo[name]
 }