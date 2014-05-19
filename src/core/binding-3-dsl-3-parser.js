/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  include the generated PEG parser  */
_api.parser = (function (module) {
    /* jshint unused: false */
    /*  provide a helper function for unrolling the parse stack  */
    var unroll = (first, list, take) => {
        if (   typeof list !== "object"
            || !(list instanceof Array))
            throw "unroll: invalid list argument (expected Array)"
        if (typeof take !== "undefined") {
            if (typeof take === "number")
                take = [ take ]
            var result = []
            if (first !== null)
                result.push(first)
            for (var i = 0; i < list.length; i++)
                for (var j = 0; j < take.length; j++)
                    result.push(list[i][take[j]])
            return result
        }
        else {
            if (first !== null)
                list.unshift(first)
            return list
        }
    }

    include("binding-3-dsl-2-grammar.js")
    return module
})({}).exports

/*  utility function  */
var excerpt = (txt, o) => {
    var l = txt.length
    var b = o - 20; if (b < 0) b = 0
    var e = o + 20; if (e > l) e = l
    return {
        prolog: txt.substr(b, o - b).replace(/\r/g, "\\r").replace(/\n/g, "\\n"),
        token:  txt.substr(o, 1).replace(/\r/g, "\\r").replace(/\n/g, "\\n"),
        epilog: txt.substr(o + 1, e - (o + 1)).replace(/\r/g, "\\r").replace(/\n/g, "\\n")
    }
}

/*  provide top-level parsing functionality  */
$api.parse = (txt, rule) => {
    if (typeof rule === "undefined")
        rule = "spec"
    var result = { ast: null, error: null }
    try {
        result.ast = _api.parser.parse(txt, { startRule: rule })
    }
    catch (e) {
        result.error = {
            line:     e.line,
            column:   e.column,
            message:  e.message,
            found:    e.found,
            expected: e.expected,
            location: excerpt(txt, e.offset)
        }
    }
    return result
}

