/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 // Initializes the Bindings of an Iteration Instance
 _api.engine.binding.init = (viewDataBinding, instance) => {
    let spec = instance.binding
    
    //Remember what was observed to be able to shut it down later
    let bindingObserver = []
    _api.util.each(spec.getAll("Scope"), (scope) => {
        let element = scope.get("element")
        let allParts = []
        _api.util.each(scope.getAll("Binding", "Scope"), (binding) => {
            let parts = _api.engine.binding.getParts(viewDataBinding, binding, element)
            allParts.push(parts)
            
            if (!parts.oneTime) {
                let toObserve = parts.initiators.length > 0 ? parts.initiators : parts.sources
                _api.util.each(toObserve, (item) => {
                    // Check if source observation possible
                    if (item.adapter !== "binding" && !item.adapter.observe) {
                        throw _api.util.exception("Used the adapter " + item.name + " as the source " +
                            "or initiator of a binding, but it does not implement an observe method")
                    }
                        
                    // Observe source
                    _api.engine.binding.observe(viewDataBinding, parts, item, bindingObserver)
                    
                    // Observe all parameters of source
                    // The Binding Scope adapter does not support parameters, so we do not need
                    // to observe them. Anyway, there shouldn't be parameters
                    if (item.adapter !== "binding") {
                        _api.util.each(item.parameters, (parameter) => {
                            _api.engine.binding.observe(viewDataBinding, parts, parameter, bindingObserver)
                        })
                    }
                })
                
                // Observe all parameters of connectors and sink if there is no initiator
                if (parts.initiators.length === 0) {
                    _api.util.each(parts.connectors, (connector) => {
                        _api.util.each(connector.parameters, (parameter) => {
                            _api.engine.binding.observe(viewDataBinding, parts, parameter, bindingObserver)
                        })
                    })
                    _api.util.each(parts.sinks, (sink) => {
                        _api.util.each(sink.parameters, (parameter) => {
                            _api.engine.binding.observe(viewDataBinding, parts, parameter, bindingObserver)
                        })
                    })
                }
            }
        })
        
        // Trigger bindings once in order:
        // - All that have only model adapters as their sources
        // - All that have only binding adapters as their sources
        // - All that have only view adapters as their sources
        // - All that have both model and binding adapters as their sources
        // - Rest
        _api.util.each(allParts, (parts) => {
            if (_api.util.array.ifAll(parts.sources, (source) => {
                return source.adapter !== "binding" && source.adapter.type() === "model"
            })) {
                _api.engine.binding.propagate(viewDataBinding, parts)
                parts.init = true
            }
        })
        _api.util.each(allParts, (parts) => {
            if (_api.util.array.ifAll(parts.sources, (source) => {
                return source.adapter === "binding"
            })) {
                _api.engine.binding.propagate(viewDataBinding, parts)
                parts.init = true
            }
        })
        _api.util.each(allParts, (parts) => {
            if (_api.util.array.ifAll(parts.sources, (source) => {
                return source.adapter !== "binding" && source.adapter.type() === "view"
            })) {
                _api.engine.binding.propagate(viewDataBinding, parts)
                parts.init = true
            }
        })
        _api.util.each(allParts, (parts) => {
            let sawModelAdapter = false
            let sawBindingAdapter = false
            let sawViewAdapter = false
            _api.util.each(parts.sources, (source) => {
                sawModelAdapter = sawModelAdapter || (source.adapter !== "binding" && source.adapter.type() === "model")
                sawBindingAdapter = sawBindingAdapter || source.adapter === "binding"
                sawViewAdapter = sawViewAdapter || (source.adapter !== "binding" && source.adapter.type() === "view")
            })
            if (sawModelAdapter && sawBindingAdapter && !sawViewAdapter) {
                _api.engine.binding.propagate(viewDataBinding, parts)
                parts.init = true
            }
        })
        _api.util.each(allParts, (parts) => {
            if (!parts.init) {
                _api.engine.binding.propagate(viewDataBinding, parts)
            }
            delete parts.init
        })
    })
    
    // Set bindingObserver ids in Iteration Instance
    instance.bindingObserver = bindingObserver
 }
 
 _api.engine.binding.observe = (viewDataBinding, parts, item, bindingObserver) => {
    if (item.adapter === "binding") {
        let observerId = viewDataBinding.vars.bindingScope.observe(item.path[0], () => {
            _api.engine.binding.observerCallback(viewDataBinding, parts)
        })
        bindingObserver.push({ adapter: "binding", observerId: observerId })
    } else if (item.adapter.type() === "view") {
        let observerId = item.adapter.observe(parts.element, item.path, () => {
            _api.engine.binding.observerCallback(viewDataBinding, parts)
        })
        bindingObserver.push({ adapter: item.adapter, observerId: observerId })
    } else if (item.adapter.type() === "model") {
        let observerId = item.adapter.observe(viewDataBinding.vars.model, item.path, () => {
            _api.engine.binding.observerCallback(viewDataBinding, parts)
        })
        bindingObserver.push({ adapter: item.adapter, observerId: observerId })
    }
 }
 
 // Shuts down the binding of an Iteration Instance
 _api.engine.binding.shutdown = (viewDataBinding, instance) => {
    let observer = instance.bindingObserver
    for (let i = 0; i < observer.length; i++) {
        let elem = observer[i]
        if (elem.adapter === "binding") {
            viewDataBinding.vars.bindingScope.unobserve(elem.observerId)
        } else {
            elem.adapter.unobserve(elem.observerId)
        }
    }
 }
 
 // Wrapper for _api.engine.binding.propagate that handles pause
 _api.engine.binding.observerCallback = (viewDataBinding, parts) => {
    if (!viewDataBinding.vars.paused) {
        _api.engine.binding.propagate(viewDataBinding, parts)
    } else {
        viewDataBinding.vars.pauseQueue.push(parts)
    }
 }
 
 // Propagates a Binding (represented by parts)
 _api.engine.binding.propagate = (viewDataBinding, parts) => {
    // Read values from source
    let values = []
    _api.util.each(parts.sources, (source) => {
        if (source.adapter === "binding") {
            values.push(viewDataBinding.vars.bindingScope.get(source.path[0]))
        } else {
            let parameters = _api.engine.binding.getParameterValues(viewDataBinding, parts, source.parameters)
            let value = source.adapter.type() === "view" ? source.adapter.getPaths(parts.element, source.path, parameters)
                                                         : source.adapter.getPaths(viewDataBinding.vars.model, source.path, parameters)
            value = _api.engine.binding.convertToReferences(source.adapter, source.path, value, 
                                                            viewDataBinding.vars.model, parts.element,
                                                            parameters)
            values.push(value)
        }
    })
    
    _api.util.assume(values.length > 0)
    // Only use list if more than one
    values = values.length === 1 ? values[0] : values
    
    // Propagate through connectors
    let connectorChain = parts.connectors
    for (let i = 0; i < connectorChain.length; i++) {
        let connector = connectorChain[i]
        if (!connector.virtual) {
            let parameters = _api.engine.binding.getParameterValues(viewDataBinding, parts, connector.parameters)
            values = connector.connector.process(values, parameters)
            // Abort if necessary
            if (values === $api.abortSymbol) {
                return
            }
        } else {
            // Expression, always propagate as list
            values = connector.connector.process(!_api.util.object.isDefined(values) || !(values instanceof Array) ? [values]: values)
        }
    }
    
    _api.util.assume(parts.sinks.length > 0)
    if (parts.sinks.length === 1 || !_api.util.object.isDefined(values) || !values instanceof Array) {
        _api.engine.binding.propagateWriteToSink(viewDataBinding, parts, parts.sinks[0], values)
    } else {
        _api.util.each(parts.sinks, (sink, index) => {
            if (index < values.length) {
                _api.engine.binding.propagateWriteToSink(viewDataBinding, parts, sink, values[index])
            }
        })
    }
 }
 
 _api.engine.binding.getParameterValues = (viewDataBinding, parts, parameters) => {
    let result
    if (parameters instanceof Array) {
        result = []
        _api.util.each(parameters, (parameter) => {
            // Leaving out parameter to getValue intentionally
            let value
            if (parameter.adapter === "binding") {
                value = viewDataBinding.vars.bindingScope.get(parameter.path[0])
            } else if (parameter.adapter.type() === "view") {
                value = parameter.adapter.getValue(parts.element, parameter.path) 
            } else if (parameter.adapter.type() === "model") {
                value = parameter.adapter.getValue(viewDataBinding.vars.model, parameter.path)
            }
            result.push(value)
        })
    } else if (typeof parameters === "object") {
        result = {}
        for (let key in parameters) {
            if (parameters.hasOwnProperty(key)) {
                let param = parameters[key]
                // Leaving out parameter to getValue intentionally
                let value
                if (param.adapter === "binding") {
                    value = viewDataBinding.vars.bindingScope.get(param.path[0])
                } else if (param.adapter.type() === "view") {
                    value = param.adapter.getValue(parts.element, param.path) 
                } else if (param.adapter.type() === "model") {
                    value = param.adapter.getValue(viewDataBinding.vars.model, param.path)
                }
                result[key] = value
            }
        }
    }
    // Might return undefined which is fine
    return result
 }
 
 _api.engine.binding.propagateWriteToSink = (viewDataBinding, parts, sink, value) => {
    // Convert to values if sink is not binding adapter
    if (sink.adapter !== "binding" &&
        (sink.adapter.type() === "view"
         || sink.adapter.type() === "model")) {
        value = _api.engine.binding.convertToValues(value)
    }
    
    // Write to sink
    if (sink.adapter === "binding") {
        let currentValue = viewDataBinding.vars.bindingScope.get(sink.path[0])
        if (!currentValue ||
            (!(currentValue instanceof _api.engine.binding.Reference) &&
             !(value instanceof _api.engine.binding.Reference))) {
            // No value there or not references involved, write it
            viewDataBinding.vars.bindingScope.set(sink.path[0], value)
        } else if (!(currentValue instanceof _api.engine.binding.Reference) &&
            (value instanceof _api.engine.binding.Reference)) {
                // current is not a reference, new is, write it
                viewDataBinding.vars.bindingScope.set(sink.path[0], value)
        } else if ((currentValue instanceof _api.engine.binding.Reference) &&
            _api.util.isPrimitive(value)) {
               // current is a reference, new is a primitive
               // write the new value into the point that is referenced
               currentValue.set(value)
               // Notify observers of the bindingScope that refers to currentValue
               // which is sink.path[0]
               viewDataBinding.vars.bindingScope.notify(sink.path[0])
        } else if ((currentValue instanceof _api.engine.binding.Reference) &&
            (value instanceof _api.engine.binding.Reference)) {
            // Both, old and new are references
            if (currentValue.type() === value.type()) {
                // Overwrite if of same type
                viewDataBinding.vars.bindingScope.set(sink.path[0], value)
            } else {
                // Never overwrwite model reference with view reference
                // and vice versa
                currentValue.set(value.getValue())
                // See above
                viewDataBinding.vars.bindingScope.notify(sink.path[0])
            }
        } else {
            // All we know is that currentValue is a reference and value is neither
            // primitive nor a (plain) reference
            // There is one special case allowed where the reference is replaced
            // By structured json containing only references of the same type
            if (_api.engine.binding.containsOnlyReferencesOfSameType(currentValue, value)) {
                // Overwrite
                viewDataBinding.vars.bindingScope.set(sink.path[0], value)
            } else {
                // TODO: See if this ever appears, if it appears in senseful case
                // Adapt to thesis, where no error is thrown and value always overwritten
                throw _api.util.exception("Erroneous Propagation")
            }
        }
    } else if (sink.adapter.type() === "view") {
        let parameters = _api.engine.binding.getParameterValues(viewDataBinding, parts, sink.parameters)
        sink.adapter.set(parts.element, sink.path, value, parameters)
    } else if (sink.adapter.type() === "model") {
        let parameters = _api.engine.binding.getParameterValues(viewDataBinding, parts, sink.parameters)
        sink.adapter.set(viewDataBinding.vars.model, sink.path, value, parameters)
    }
 }
 
 // Checks if value comprises only references and if
 // all references in value have the same type as reference
 _api.engine.binding.containsOnlyReferencesOfSameType = (reference, value) => {
    if (_api.util.isPrimitive(value)) {
        return false
    } else if (_api.util.isReference(value)) {
        return reference.type() === value.type()
    } else if (typeof value === "object") {
        for (let key in value) {
            // Recursion
            if(!_api.engine.binding.containsOnlyReferencesOfSameType(reference, value[key])) {
                return false
            }
        }
        return true
    }
 }
 
 /* Converts a set of paths into structured json
 ** Example:
 **     Input: adapter: <ModelAdapter>
 **            originalPath: ["people"]
 **            paths: [ ["people", 0, "name"],
 **                     ["people", 0, "age"],
 **                     ["people", 1, "name"],
 **                     ["people", 1, "age"] ]
 **             model: <PresentationModelReference>
 **             element: <jQuery>
 **
 **     Result: [
 **                 {
 **                     name: Reference(adapter: <ModelAdapter>, path: ["people", 0, "name"])
 **                     age: Reference(adapter: <ModelAdapter>, path: ["people", 0, "age"])
 **                 },
 **                 {
 **                     name: Reference(adapter: <ModelAdapter>, path: ["people", 1, "name"])
 **                     age: Reference(adapter: <ModelAdapter>, path: ["people", 1, "age"])
 **                 }
 **             ]
 */
 _api.engine.binding.convertToReferences = (adapter, originalPath, paths, model, element, parameters) => {
    let result = {}
    
    // Build the basic structure
    for (let i = 0; i < paths.length; i++) {
        let path = paths[i]
        // Determine position in result
        let position = result
        for (let j = originalPath.length; j < path.length; j++) {
            let key = path[j]
            if (!position[key]) {
                position[key] = {}
            }
            position = position[key]
        } 
    }
    // See example above: Result now contains { 0: { name: {}, age: {} }, 1: { name: {}, age: {} } }
    
    // For every path write a reference into result if there still is a {}
    for (let i = 0; i < paths.length; i++) {
        let path = paths[i]
        let current = result
        for (let j = originalPath.length; j < path.length - 1; j++) {
            current = current[path[j]]
        }
        
        // Helper function
        let initReference = (ada, pat, elem, mod, params) => {
            let newReference = new _api.engine.binding.Reference(ada, pat, params)
            if (ada.type() === "view") {
                newReference.setElement(elem)
            } else if (adapter.type() === "model") {
                newReference.setModel(mod)
            }
            return newReference
        }
        
        if (path.length - originalPath.length > 0) {
            if ($api.$().isEmptyObject(current[path[path.length - 1]])) {
                current[path[path.length - 1]] = initReference(adapter, path, element, model, parameters)
            }
        } else {
            if ($api.$().isEmptyObject(result)) {
                result = initReference(adapter, path, element, model, parameters)
            }
        }
    }
    
    // Convert key sets on each level to arrays
    result = _api.engine.binding.recognizeArrays(result)
    
    return result
 }
 
 // Checks the set of keys in result on each level
 // If they build a contingent series of whole numbers starting at 0
 // This level is converted into an array
 _api.engine.binding.recognizeArrays = (result) => {
    if (typeof result === "object") {
        let keySet = _api.util.object.getKeys(result)
        if (_api.util.array.ifAll(keySet, (item) => {
            return _api.util.number.isWholePositiveNumber(item)
        })) {
            let stats = _api.util.array.getMinAndMax(keySet)
            if (stats.min === 0 && keySet.length === stats.max + 1) {
                let newResult = []
                for (let i = 0; i < stats.max + 1; i++) {
                    // Recursion
                    newResult[i] = _api.engine.binding.recognizeArrays(result[i])
                }
                return newResult
            }
        }
    }
    // In all other cases
    return result
 }
 
 // Replaces all references in value by their values
 _api.engine.binding.convertToValues = (value) => {
    return _api.util.traverseStructure(value, (item) => {
        if (_api.util.isReference(item)) {
            return item.getValue()
        } else {
            return item
        }
    })
 }
 
 /*
 *  Adapter: {
 *      + name: String
 *      + adapter: Adapter / "binding"
 *      + path: String[]
 *      + parameters: Adapter[] / {} where value: Adapter and these Adapter
 *              cannot have parameters (was prevented in preprocessing step)
 *  }
 *  Connector: {
 *      + connector: Connetor(Implementation)
 *      + parameters: Adapter[] / {} where value: Adapter
 *  }
 *  Result: {
 *    + initiators: Adapter[]
 *    + sources: Adapter[]
 *    + connectors: connectorImp[]
 *    + sinks: Adapter[]
 *    + element: jQuery
 *    + oneTime: boolean
 *  }
 */
 _api.engine.binding.getParts = (viewDataBinding, binding, element) => {
    let direction = _api.engine.binding.getDirection(binding)
    _api.util.assume(binding.childs().length >= 3)
    
    let firstAdapters = binding.childs()[0]
    let lastAdapters = binding.childs()[binding.childs().length - 1]
    
    let sourceAdapters = direction.value === "right" ? firstAdapters : lastAdapters
    let sources = _api.engine.binding.getNamesAndPaths(sourceAdapters)
    _api.util.each(sources, (source) => {
        source.adapter = source.name === viewDataBinding.bindingScopePrefix() ? "binding" : _api.repository.adapter.get(source.name)
        _api.util.each(source.parameters, (parameter) => {
            parameter.adapter = parameter.name === viewDataBinding.bindingScopePrefix() ? "binding" : _api.repository.adapter.get(parameter.name)
        })
    })
    
    let initiators = _api.engine.binding.getInitiators(sourceAdapters)
    _api.util.each(initiators, (initiator) => {
        initiator.adapter = initiator.name === viewDataBinding.bindingScopePrefix() ? "binding" : _api.repository.adapter.get(initiator.name)
        _api.util.each(initiator.parameters, (parameter) => {
            parameter.adapter = parameter.name === viewDataBinding.bindingScopePrefix() ? "binding" : _api.repository.adapter.get(parameter.name)
        })
    })
    
    let sinkAdapters = direction.value === "right" ? lastAdapters : firstAdapters
    let sinks = _api.engine.binding.getNamesAndPaths(sinkAdapters)
    _api.util.each(sinks, (sink) => {
        sink.adapter = sink.name === viewDataBinding.bindingScopePrefix() ? "binding" : _api.repository.adapter.get(sink.name)
        _api.util.each(sink.parameters, (parameter) => {
            parameter.adapter = parameter.name === viewDataBinding.bindingScopePrefix() ? "binding" : _api.repository.adapter.get(parameter.name)
        })
    })
    
    let connectorChain = binding.childs()[1]
    _api.util.assume(connectorChain.isA("ConnectorChain"))
    let connectorAsts = connectorChain.getAll("Connector")
    let connectors = []
    for (let i = direction.value === "right" ? 0 : connectorAsts.length - 1;
         direction.value === "right" ? (i < connectorAsts.length) : (i >= 0);
         direction.value === "right" ? i++ : i--) {
         let connectorAst = connectorAsts[i]
         if (!connectorAst.get("virtual")) {
             connectors.push({
                connector: _api.repository.connector.get(connectorAst.get("id")),
                parameters: _api.engine.binding.getParameters(connectorAst),
                virtual: false
             })
         } else {
            connectors.push({
                connector: connectorAst.get("fn"),
                virtual: true
            })
         }
    }
    
    _api.util.each(connectors, (connector) => {
        _api.util.each(connector.parameters, (parameter) => {
            parameter.adapter = parameter.name === viewDataBinding.bindingScopePrefix() ? "binding" : _api.repository.adapter.get(parameter.name)
        })
    })
    
    return {
        initiators: initiators,
        sources: sources,
        connectors: connectors,
        sinks: sinks,
        element: element,
        oneTime: direction.oneTime
    }
 }
 
 /*
 * { 
 *   value: string
 *      "left": ... <- ... <- ... <- ...
 *          / "right": ... -> ... -> ... -> ...,
 *   oneTime: boolean
 * }
 */
 _api.engine.binding.getDirection = (binding) => {
    let connectorChain = binding.getAll("ConnectorChain")
    _api.util.assume(connectorChain.length === 1)
    let connector = connectorChain[0]
    _api.util.assume(connector.childs().length !== 0)
    let bindingOperator = connector.childs()[0]
    _api.util.assume(bindingOperator.isA("BindingOperator"))
    
    let value = bindingOperator.get("value")
    if (value === "<-" || value === "<~") {
        return { value: "left", oneTime: value === "<~" }
    } else if (value === "->" || value === "~>") {
        return { value: "right", oneTime: value === "~>" }
    } else {
        throw _api.util.exception("Could not interpret direction for bindingoperator " + value)
    }
 }
 
 _api.engine.binding.getNamesAndPaths = (ast) => {
    _api.util.assume(ast.isA("Adapter"))
    _api.util.assume(ast.childs().length !== 0)
    let exprSeq = ast.childs()[0]
    _api.util.assume(exprSeq.isA("ExprSeq"))
    _api.util.assume(exprSeq.childs().length !== 0)
    
    let result = []
    _api.util.each(exprSeq.getAll("Variable", "Parameters"), (variable) => {
        result.push({
            name: variable.get("ns") !== "" ? variable.get("ns") : variable.get("id"),
            path: variable.get("ns") !== "" ? [variable.get("id")] : [],
            parameters: _api.engine.binding.getParameters(variable)
        })
    })
    return result
 }
 
 _api.engine.binding.getInitiators = (ast) => {
    _api.util.assume(ast.isA("Adapter"))
    _api.util.assume(ast.childs().length !== 0)
    _api.util.assume(ast.childs()[0].isA("ExprSeq"))
    if (ast.childs().length > 1 && ast.childs()[1].isA("Initiator")) {
        let initiatorElem = ast.childs()[1]
        _api.util.assume(initiatorElem.childs().length !== 0)
        let initiatorExprSeq = initiatorElem.childs()[0]
        _api.util.assume(initiatorExprSeq.isA("ExprSeq"))
        
        let result = []
        _api.util.each(initiatorExprSeq.getAll("Variable", "Parameters"), (variable) => {
            result.push({
                name: variable.get("ns") !== "" ? variable.get("ns") : variable.get("id"),
                path: variable.get("ns") !== "" ? [variable.get("id")] : [],
                parameters: _api.engine.binding.getParameters(variable)
            })
        })
        return result
    } else {
        return []
    }
 }
 
 _api.engine.binding.getParameters = (ast) => {
    let result
    _api.util.each(ast.getAll("Parameters"), (parameters) => {
        // This should never be executed more than once
        _api.util.assume(parameters.childs().length > 0)
        if (/* positional */ parameters.childs()[0].isA("ParamPositional")) {
            result = []
            _api.util.each(parameters.childs(), (param) => {
                _api.util.assume(param.childs().length === 1)
                let variable = param.childs()[0]
                _api.util.assume(variable.isA("Variable"))
                let element = {
                    name: variable.get("ns") !== "" ? variable.get("ns") : variable.get("id"),
                    path: variable.get("ns") !== "" ? [variable.get("id")] : []
                }
                result.push(element)
            })
        } else if (/* name based */ parameters.childs()[0].isA("ParamNamed")) {
            result = {}
            _api.util.each(parameters.childs(), (param) => {
                _api.util.assume(param.childs().length === 1)
                let variable = param.childs()[0]
                _api.util.assume(variable.isA("Variable"))
                let element = {
                    name: variable.get("ns") !== "" ? variable.get("ns") : variable.get("id"),
                    path: variable.get("ns") !== "" ? [variable.get("id")] : []
                }
                result[param.get("id")] = element
            })
        } else {
            // Should never happen
            _api.util.assume(false)
        }
    })
    return result
 }