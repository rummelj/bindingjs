/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.org>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  include the generated PEG parser  */
_api.dsl.parser = (function () {
    let module = {}
    // Generated in grunt process
    include("grammar.js")
    return module.exports
})()

/*  provide a helper function for unrolling the parse stack  */
_api.dsl.parser.unroll = (first, list, take) => {
    if (typeof list !== "object"
        || !(list instanceof Array))
        throw "unroll: invalid list argument (expected Array)"
    if (typeof take !== "undefined") {
        if (typeof take === "number")
            take = [ take ]
        let result = []
        if (first !== null)
            result.push(first)
        for (let i = 0; i < list.length; i++) {
            for (let j = 0; j < take.length; j++)
                result.push(list[i][take[j]])
        }
        return result
    }
    else {
        if (first !== null)
            list.unshift(first)
        return list
    }
}

/*  utility function  */
let excerpt = (txt, o) => {
    let l = txt.length
    let b = o - 20; if (b < 0) b = 0
    let e = o + 20; if (e > l) e = l
    let extract = (txt, pos, len) =>
        txt.substr(pos, len).replace(/\r/g, "\\r").replace(/\n/g, "\\n")
    return {
        prolog: extract(txt, b, o - b),
        token:  extract(txt, o, 1),
        epilog: extract(txt, o + 1, e - (o + 1))
    }
}

/*  provide top-level parsing functionality  */
_api.dsl.parser.parser = (txt, rule) => {
    if (typeof rule === "undefined")
        rule = "spec"
    let result = { ast: null, error: null }
    try {
        result.ast = _api.dsl.parser.parse(txt, { startRule: rule })
    }
    catch (e) {
        result.error = {
            line:     _api.util.object.ifUndefined(e.line, 0),
            column:   _api.util.object.ifUndefined(e.column, 0),
            message:  e.message,
            found:    _api.util.object.ifUndefined(e.found, ""),
            expected: _api.util.object.ifUndefined(e.expected, ""),
            location: excerpt(txt, _api.util.object.ifUndefined(e.offset, 0))
        }
    }
    return result
}

_api.dsl.parser.safeParser = (txt, rule) => {
    let astWrapper = _api.dsl.parser.parser(txt, rule)
    if (astWrapper.error !== null) {
        let e = astWrapper.error
        let prefix1 = "line " + e.line + " (col " + e.column + "): "
        let prefix2 = ""
        for (let i = 0; i < prefix1.length + e.location.prolog.length; i++){
            prefix2 += "-"
        }
        $api.debug(1, prefix1 + e.location.prolog + e.location.token + e.location.epilog)
        $api.debug(1, prefix2 + "^")
        $api.debug(1, e.message)
        throw _api.util.exception("Parsing failed")
    } else {
        return astWrapper.ast
    }
}
