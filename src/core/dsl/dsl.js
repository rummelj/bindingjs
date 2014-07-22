/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

// Parses
// - Returns AST wrapper
$api.parse = (txt, rule) => {
    let ast = _api.dsl.parser.parser(txt, rule)
    return ast
}

// Parses
// - Throws error and logs to console if error
// - Returns unwrapped AST if no error
_api.safeParse = (txt, rule) => {
    var astWrapper = $api.parse(txt, rule)
    if (astWrapper.error !== null) {
        let e = astWrapper.error
        let prefix1 = "line " + e.line + " (col " + e.column + "): "
        let prefix2 = ""
        for (let i = 0; i < prefix1.length + e.location.prolog.length; i++){
            prefix2 += "-"
        }
        console.error(prefix1 + e.location.prolog + e.location.token + e.location.epilog)
        console.error(prefix2 + "^")
        console.error(e.message)
        throw _api.util.exception("Parsing failed")
    } else {
        return astWrapper.ast
    }
}
