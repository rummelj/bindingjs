/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
** Returns a new View Data Binding instanceof
*/
$api.create = () => {
    return new _api.ViewDataBinding()
}

/*
** Allows to set or retrieve a reference to jQuery
** - Without a parameter, the current reference to jQuery is returned
** - With a parameter, the current reference is overwritten
*/
$api.$ = (() => {
    let internaljQuery
    return () => {
        let params = _api.util.Ducky.params("$", arguments, {
            jQuery: { pos: 0, req: false, valid: "function" }
        })
        
        if (!params.jQuery) {
            // Return jQuery
            if (typeof internaljQuery !== "undefined") {
                return internaljQuery
            } else {
                // Try default access
                /* global jQuery */
                if (typeof jQuery !== "undefined") {
                    return jQuery
                } else {
                   throw _api.util.exception("BindingJS requires jQuery which is not loaded or not " +
                                             "registered under its default name 'jQuery'. If you use " +
                                             "another or no symbol for jQuery, please provide a " +
                                             "reference to jQuery first by calling BindingJS.$(jQuery)")
                }
            }
        } else /* if (params.jQuery) */ {
            // Set jQuery
            internaljQuery = params.jQuery
            return $api
        }
    }
})()

/*
** Allows logging debug messages or setting the debug level
** - debug()            Returns current debug level
** - debug(level)       Sets new debug level
** - debug(level, msg)  Logs message at given debug level
*/
$api.debug = (() => {
    let debugLevel = 9
    return () => {
        let params = _api.util.Ducky.params("debug", arguments, {
            level: { pos: 0, req: false, valid: "number" },
            msg:   { pos: 1, req: false, valid: "string" }
        })
        if (arguments.length === 0) {
            /*  return old debug level  */
            return debugLevel
        } else if (arguments.length === 1) {
            /*  configure new debug level  */
            debugLevel = params.level
            return $api
        } else {
            /*  perform runtime logging  */
            if (params.level <= debugLevel) {
                /*  determine indentation based on debug level  */
                let indent = ""
                for (let i = 1; i < params.level; i++) {
                    indent += " "
                }

                /*  display debug message  */
                _api.util.log("DEBUG[" + params.level + "]: " + indent + params.msg)
            }
            return $api
        }
    }
})()

/*
** Allows to plug-in custom Adapter and Connector
** - First parameter is the name of the component as its used
**      in the Binding Specification
** - The second parameter is a method returning the component itself.
**   The method is provided with the external (BindingJS) api as well as
**   the internal api. ( called as factory(external, internal) )
**      - An Adapter needs to be an object with the following method
**        signatures (optional methods suffixed by ?)
**          - observe? (model: any / element: jQuery, path: string[], callback: () => void) : number
**          - unobserve? (observerId: number) : void
**          - getValue (model: any / element: jQuery, path: string[]) : any
**          - getPaths (model: any / element: jQuery, path: string[]) : string[][]
**          - set? (model: any / element: jQuery, path: string, value: any) : void
**          - type() : "model" / "view"
**        Examples can be found in src/plugin/binding.adapter.*
**      - A Connector needs to be an object with the following method
**        signatures
**          - process (input: any) : any
**
** Allows to get the registered plug-in with a certain name if the
** second parameter is emitted. If a Connector is registered under the
** same name as an Adapter, only the Adapter is returned
*/
$api.plugin = () => {
    let params = _api.util.Ducky.params("plugin", arguments, {
        name:    { pos: 0, req: true, valid: "string" },
        factory: { pos: 1, req: false, valid: "function" }
    })
    
    if (arguments.length === 2) {
        // Register component
        let component = params.factory($api, _api)   
        if (typeof component.process === "function") {
            $api.debug(3, "Registering " + params.name + " as a Connector")
            _api.repository.connector.register(params.name, component)
        } else {
            if (!(typeof component.getValue === "function" &&
                  typeof component.getPaths === "function" &&
                  typeof component.type === "function")) {
                throw _api.util.exception("Every Adapter needs to implemented at least " +
                    "getValue, getPaths and type")
            } else if (component.type() !== "model" && component.type() !== "view") {
                throw _api.util.exception("The method type() of an Adapter must " +
                    "either return 'model' or 'view'")
            }
            $api.debug(3, "Registering " + params.name + " as an Adapter")
            _api.repository.adapter.register(params.name, component)
        }
    } else /* if (arguments.length === 1) */ {
        // Retrieve component
        if (_api.repository.adapter.has(params.name)) {
            return _api.repository.adapter.get(params.name)
        } else if (_api.repository.connector.has(params.name)) {
            return _api.repository.connector.get(params.name)
        } else {
            return
        }
    }
}

$api.version = {
    major: $major,
    minor: $minor,
    micro: $micro,
    date:  $date
}

/*
** This variable must be returned by a Connector, if Propagation should
** be aborted.
*/
$api.abortSymbol = {}

/*
** Allows access to internal API. This should only be used from
** Mocha test cases and never in production!
*/
$api.internal = () => {
    $api.debug(1, "Warning: This method is only for testing purpose!")
    return _api
}