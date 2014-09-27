/*
 **  viewDataBindingJS -- View Data viewDataBinding for JavaScript <http://viewDataBindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 _api.engine.sockets.callRemoval = (viewDataBinding, expItNode) => {
    _api.util.array.each(expItNode.get("instances"), (instance) => {
        _api.engine.sockets.callRemovalInstance(viewDataBinding, expItNode, instance)
    })
    _api.util.array.each(expItNode.childs(), (child) => {
        _api.engine.sockets.callRemoval(viewDataBinding, child)
    })
 }
 
 _api.engine.sockets.callInsertion = (viewDataBinding, expItNode) => {
    _api.util.array.each(expItNode.get("instances"), (instance) => {
        _api.engine.sockets.callInsertionInstance(viewDataBinding, expItNode, instance)
    })
    _api.util.array.each(expItNode.childs(), (child) => {
        _api.engine.sockets.callInsertion(viewDataBinding, child)
    })
 }
 
 _api.engine.sockets.callRemovalInstance = (viewDataBinding, expItNode, instance) => {
    if (instance.sockets.length > 0) {
        let keys = _api.engine.sockets.getKeys(expItNode, instance)
        _api.util.array.each(instance.sockets, (socket) => {
            _api.util.array.each(viewDataBinding.vars.socketRemovalObserver[socket.id], (callback) => {
                callback(keys, socket.element)
            })
        })
    }
 }
 
 _api.engine.sockets.callInsertionInstance = (viewDataBinding, expItNode, instance) => {
    if (instance.sockets.length > 0) {
        let keys = _api.engine.sockets.getKeys(expItNode, instance)
        _api.util.array.each(instance.sockets, (socket) => {
            _api.util.array.each(viewDataBinding.vars.socketInsertionObserver[socket.id], (callback) => {
                callback(keys, socket.element)
            })
        })
    }
 }
 
 _api.engine.sockets.getKeys = (expItNode, instance) => {
    let keys = []
    // Do not add key, if this is the root expItNode
    if (expItNode.getParent()) {
        keys.push(instance.key)
    }
    // If not expItNode.getParent().getParent() means, that expItNode.get("instance") refers to the instance of root
    while (expItNode.getParent() && expItNode.getParent().getParent() && expItNode.get("instance")) {
        keys.push(expItNode.get("instance").key)
        expItNode = expItNode.getParent()
    }
    return keys
 }