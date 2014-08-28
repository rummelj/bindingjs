/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 _api.engine.binding.init = (bindingObj, vars, instance) => {
    let model = bindingObj.vars.model
    let template = instance.template
    let spec = instance.binding
    let scopes = spec.getAll("Scope")
    
    for (var i = 0; i < scopes.length; i++) {
        let scope = scopes[i]
        let element = scope.get("element")
        let bindings = scope.getAll("Binding", "Scope")
        for (var j = 0; j < bindings.length; j++) {
            let binding = bindings[j]
            let parts = _api.engine.binding.getParts(bindingObj, binding)
            parts.element = element
            
            // TODO: Refactor
            
            // Observe source
            if (parts.source.adapter == "binding") {
                vars.localScope.observe(parts.source.path[0], () => {
                    _api.engine.binding.propagate(model, vars, parts)
                })
                _api.engine.binding.propagate(model, vars, parts)
            } else if (parts.source.adapter.type() == "view") {
                parts.source.adapter.observe(element, parts.source.path, () => {
                    _api.engine.binding.propagate(model, vars, parts)
                })
                _api.engine.binding.propagate(model, vars, parts)
            } else if (parts.source.adapter.type() == "model") {
                parts.source.adapter.observe(model, parts.source.path, () => {
                    _api.engine.binding.propagate(model, vars, parts)
                })
                _api.engine.binding.propagate(model, vars, parts)
            } else {
                throw _api.util.exception("Unknown adapter type: " + parts.source.adapter.type())
            }
        }
    }
 }
 
 _api.engine.binding.propagate = (model, vars, parts) => {
    // Read value from source
    let source = parts.source
    let value = ""
    if (source.adapter == "binding") {
        value = vars.localScope.get(source.path[0])
    } else if (source.adapter.type() == "view") {
        value = source.adapter.getPaths(parts.element, source.path)
    } else if (source.adapter.type() == "model") {
        value = source.adapter.getPaths(model, source.path)
    } else {
        throw _api.util.exception("Unknown adapter type: " + source.adapter.type())
    }
    
    if (source.adapter !== "binding" &&
        (source.adapter.type() == "view"
         || source.adapter.type() == "model")) {
        value = _api.engine.binding.convertToReferences(source.adapter, source.path, value, model, parts.element)
    }
    
    // Propagate through connectors
    let connectorChain = parts.connectors
    for (var i = 0; i < connectorChain.length; i++) {
        value = connectorChain[i].process(value)
    }
    
    let sink = parts.sink
    if (sink.adapter !== "binding" &&
        (sink.adapter.type() == "view"
         || sink.adapter.type() == "model")) {
        value = _api.engine.binding.convertToValues(value)
    }
    
    // Write to sink
    if (sink.adapter == "binding") {
        vars.localScope.set(sink.path[0], value)
    } else if (sink.adapter.type() == "view") {
        sink.adapter.set(parts.element, sink.path, value)
    } else if (sink.adapter.type() == "model") {
        sink.adapter.set(model, sink.path, value)
    } else {
        throw _api.util.exception("Unknown adapter type: " + sink.adapter.type())
    }
 }
 
 _api.engine.binding.convertToReferences = (adapter, originalPath, paths, model, element) => {
    let result = {}
    for (var i = 0; i < paths.length; i++) {
        let path = paths[i]
        // Determine position in result
        let position = result
        for (var j = originalPath.length; j < path.length; j++) {
            let key = path[j]
            if (!position[key]) {
                position[key] = {}
            }
            position = position[key]
        } 
    }
    
    // For every path write a reference into result if there still is a {}
    for (var i = 0; i < paths.length; i++) {
        let path = paths[i]
        let current = result
        for (var j = originalPath.length; j < path.length - 1; j++) {
            let key = path[j]
            current = current[key]
        }
        
        if (path.length - originalPath.length > 0) {
            if ($api.$().isEmptyObject(current[path[path.length - 1]])) {
                let newReference = new _api.engine.binding.Reference(adapter, path)
                if (adapter.type() == "view") {
                    newReference.setElement(element)
                } else if (adapter.type() == "model") {
                    newReference.setModel(model)
                }
                current[path[path.length - 1]] = newReference
            }
        } else {
            if ($api.$().isEmptyObject(result)) {
                let newReference = new _api.engine.binding.Reference(adapter, path)
                if (adapter.type() == "view") {
                    newReference.setElement(element)
                } else if (adapter.type() == "model") {
                    newReference.setModel(model)
                }
                result = newReference
            }
        }
    }
    return result
 }
 
 _api.engine.binding.convertToValues = (value) => {
    if (value instanceof _api.engine.binding.Reference) {
        return value.getValue()
    } else {
        if (typeof value == "object") {
            for (key in value) {
                let newValue = _api.engine.binding.convertToValues(value[key])
                value[key] = newValue
            }
        }
        return value
    }
 }
 
 /*
 *  {
 *    + source: {
 *      + adapter: Adapter / "binding"
 *      + path: String[]
 *    }
 *    + connectors: Connector[]
 *    + sink: {
 *      + adapter: Adapter / "binding"
 *      + path: String[]
 *    }
 *  }
 */
 _api.engine.binding.getParts = (bindingObj, binding) => {
    let direction = _api.engine.binding.getDirection(binding)
    
    if (binding.childs().length < 3) {
        throw _api.util.exception("Assumed that every binding has at least " +
            "three children")
    }
    let firstAdapter = binding.childs()[0]
    let lastAdapter = binding.childs()[binding.childs().length - 1]
    
    let sourceAdapter = direction == "right" ? firstAdapter : lastAdapter
    let sourceName = _api.engine.binding.getName(sourceAdapter)
    let source = sourceName == bindingObj.bindingScopePrefix() ? "binding" : _api.repository.adapter.get(sourceName)
    let sourcePath = _api.engine.binding.getPath(sourceAdapter)
    
    let sinkAdapter = direction == "right" ? lastAdapter : firstAdapter
    let sinkName = _api.engine.binding.getName(sinkAdapter)
    let sink = sinkName == bindingObj.bindingScopePrefix() ? "binding" : _api.repository.adapter.get(sinkName)
    let sinkPath = _api.engine.binding.getPath(sinkAdapter)
    
    let connector = binding.childs()[1]
    if (!connector.isA("Connector")) {
        throw _api.util.exception("Assumed that the second child of a binding " +
            "always is a Connector, but it was not")
    }
    let funcCalls = connector.getAll("FuncCall")
    let connectorChain = []
    for (var i = direction == "right" ? 0 : funcCalls.length - 1;
         direction == "right" ? (i < funcCalls.length) : (i >= 0);
         direction == "right" ? i++ : i--) {
         let funcCall = funcCalls[i]
         connectorChain.push(_api.repository.connector.get(funcCall.get("id")))
    }
    
    return {
        source: {
            adapter: source,
            path: sourcePath
        },
        connectors: connectorChain,
        sink: {
            adapter: sink,
            path: sinkPath
        }
    }
 }
 
 /*
 *  "left": ... <- ... <- ... <- ...
 *  "right": ... -> ... -> ... -> ...
 */
 _api.engine.binding.getDirection = (binding) => {
    let connectors = binding.getAll("Connector")
    if (connectors.length !== 1) {
        throw _api.util.exception("Assumed that every binding has exactly " +
            "one connector element, but there were " + connectors.length)
    }
    let connector = connectors[0]
    if (connector.childs().length == 0) {
        throw _api.util.exception("Assumed that every connector has at least " +
            "one child, but there was none")
    }
    let bindingOperator = connector.childs()[0]
    if (!bindingOperator.isA("BindingOperator")) {
        throw _api.util.exception("Assumed that the first child of a connector " + 
            "always is a BindingOperator, but it was not")
    }
    
    let value = bindingOperator.get("value")
    if (value == "<-") {
        return "left"
    } else if (value == "->") {
        return "right"
    } else {
        throw _api.util.exception("Could not interpret direction for bindingoperator " +
            value)
    }
 }
 
 _api.engine.binding.getName = (adapter) => {
    if (adapter.childs().length == 0) {
        throw _api.util.exception("Expected an adapter to always have at least one child")
    }
    let exprSeq = adapter.childs()[0]
    if (!exprSeq.isA("ExprSeq")) {
        throw _api.util.exception("Expected the first child of an Adapter to always " +
            "be an ExprSeq, but it was not")
    }
    if (exprSeq.childs().length == 0) {
        throw _api.util.exception("Expected the ExprSeq to always have at least one child")
    }
    let variable = exprSeq.childs()[0]
    if (!variable.isA("Variable")) {
        throw _api.util.exception("Expected the first child of an ExprSeq to always " +
            "be a Variable, but it was not")
    }
    if (variable.get("ns") !== "") {
        return variable.get("ns")
    } else {
        return variable.get("id")
    }
 }
 
 _api.engine.binding.getPath = (adapter) => {
    if (adapter.childs().length == 0) {
        throw _api.util.exception("Expected an adapter to always have at least one child")
    }
    let exprSeq = adapter.childs()[0]
    if (!exprSeq.isA("ExprSeq")) {
        throw _api.util.exception("Expected the first child of an Adapter to always " +
            "be an ExprSeq, but it was not")
    }
    if (exprSeq.childs().length == 0) {
        throw _api.util.exception("Expected the ExprSeq to always have at least one child")
    }
    let variable = exprSeq.childs()[0]
    if (!variable.isA("Variable")) {
        throw _api.util.exception("Expected the first child of an ExprSeq to always " +
            "be a Variable, but it was not")
    }
    if (variable.get("ns") !== "") {
        return [variable.get("id")]
    } else {
        return []
    }
 }