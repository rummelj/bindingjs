/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  include the generated PEG parser  */
_api.parser = (function (module) {
    /*  constructor for an AST node  */
    var AST = function () {
        if (!(this instanceof arguments.callee)) {
            var ast = new arguments.callee();
            ast.set.apply(ast, arguments);
            return ast;
        }
        else {
            this.set.apply(this, arguments);
            return this;
        }
    };
    AST.prototype.set = function (t) {
        this.T = t;
        if (arguments.length === 2 && typeof arguments[1] === "object" && !(arguments[1] instanceof Array))
            this.A = arguments[1];
        else if (arguments.length >= 2)
            this.A = Array.prototype.slice.call(arguments, 1);
    };
    AST.prototype.isA = function (t) {
        return (this.T === t);
    };

    /*  provide a helper function for unrolling the parse stack  */
    var unroll = function (first, list, take) {
        if (   typeof list !== "object"
            || !(list instanceof Array))
            throw "unroll: invalid list argument (expected Array)";
        if (typeof take !== "undefined") {
            if (typeof take === "number")
                take = [ take ];
            var result = [];
            if (first !== null)
                result.push(first);
            for (var i = 0; i < list.length; i++)
                for (var j = 0; j < take.length; j++)
                    result.push(list[i][take[j]]);
            return result;
        }
        else {
            if (first !== null)
                list.unshift(first);
            return list;
        }
    };

    /* eslint no-constant-condition: 0 */
    /* eslint no-unused-vars: 0 */
    /* eslint no-use-before-define: 0 */
    /* eslint quotes: 0 */
    /* eslint semi: 0 */
    /* eslint space-infix-ops: 0 */
    /* jshint -W003 */
    /* jshint -W098 */
    /* jshint -W100 */
    /* jshint -W101 */
    /* jshint -W102 */
    /* jshint asi: true */
    /* jshint lastsemic: true */
    /* jshint maxdepth: 40 */
    /* jshint maxstatements: 400 */
    /* jshint quotmark: false */
    /* jshint unused: false */
    include("binding-3-parser-grammar.js");
    return module;
})({}).exports;

/*  utility function  */
var excerpt = function (txt, o) {
    var l = txt.length;
    var b = o - 20; if (b < 0) b = 0;
    var e = o + 20; if (e > l) e = l;
    return {
        prolog: txt.substr(b, o - b).replace(/\r/g, "\\r").replace(/\n/g, "\\n"),
        token:  txt.substr(o, 1).replace(/\r/g, "\\r").replace(/\n/g, "\\n"),
        epilog: txt.substr(o + 1, e - (o + 1)).replace(/\r/g, "\\r").replace(/\n/g, "\\n")
    };
};

/*  provide top-level parsing functionality  */
$api.parse = function (txt, rule) {
    if (typeof rule === "undefined")
        rule = "spec";
    var result = { ast: null, error: null };
    try {
        result.ast = _api.parser.parse(txt, { startRule: rule });
    }
    catch (e) {
        result.error = {
            line:     e.line,
            column:   e.column,
            message:  e.message,
            found:    e.found,
            expected: e.expected,
            location: excerpt(txt, e.offset)
        };
    }
    return result;
};

