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
_api.util.exception = (msg) => {
    return new Error(msg)
}

/*  utility function: logging via environment console  */
_api.util.log = (msg) => {
    /*  try Firebug-style console (in regular browser or Node)  */
    if (   typeof root.console     !== "undefined"
        && typeof root.console.log !== "undefined")
        root.console.log(msg)
}

/*  utility function: return a value or (if undefined) a fallback value  */
_api.util.definedOrElse = (value, fallback) => {
    return (typeof value !== "undefined" ? value : fallback)
}

/* Returns a unique jquery selector for $element
   Taken from http://stackoverflow.com/questions/2068272/getting-a-jquery-selector-for-an-element */
_api.util.getPath = (context, element) => {
    let $current = $api.$()(element)
    let $context = $api.$()(context)
    let path = new Array();
    let realpath = "";
    // Since this code is taken from the web, we limit the number of iterations to
    // avoid hard to track errors
    let iterations = 0
    while (!$current.is($context)) {
        let index = $current.parent().find($current.prop("tagName")).index($current);
        let name = $current.prop("tagName");
        let selector = " " + name + ":eq(" + index + ") ";
        path.push(selector);
        $current = $current.parent();
        
        iterations++
        if (iterations > 10000) {
            throw _api.util.exception("Internal error: Too many iterations")
        }
    }
    while (path.length != 0) {
        realpath += path.pop();
    }
    return realpath;
}

