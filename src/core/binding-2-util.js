/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
**  COMMON UTILITY FUNCTIONALITIES
*/

/*  utility function: create an exception string for throwing  */
_api.exception = function (method, error) {
    return new Error("[BindingJS]: ERROR: " + method + ": " + error);
};

/*  utility function: logging via environment console  */
_api.log = function (msg) {
    /*  try Firebug-style console (in regular browser or Node)  */
    if (   typeof root.console     !== "undefined"
        && typeof root.console.log !== "undefined")
        root.console.log("[BindingJS]: " + msg);
};

/*  utility function: debugging  */
$api.debug = (function () {
    var debug_level = 9;
    return function (level, msg) {
        if (arguments.length === 0)
            /*  return old debug level  */
            return debug_level;
        else if (arguments.length === 1)
            /*  configure new debug level  */
            debug_level = level;
        else {
            /*  perform runtime logging  */
            if (level <= debug_level) {
                /*  determine indentation based on debug level  */
                var indent = "";
                for (var i = 1; i < level; i++)
                    indent += "    ";

                /*  display debug message  */
                _api.log("DEBUG[" + level + "]: " + indent + msg);
            }
        }
    };
})();

