/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  constructor for an AST node  */
_api.AST = function () {
    if (!(this instanceof arguments.callee)) {
        var ast = new arguments.callee();
        ast.init.apply(ast, arguments);
        return ast;
    }
    else {
        this.init.apply(this, arguments);
        return this;
    }
};

_api.AST.prototype.init = function (t, a, c) {
    this.T = t;
    this.A = {};
    this.C = [];
    this.P = { L: 0, C: 0, O: 0 };
    if (typeof a === "object")
        this.set(a);
    if (typeof c === "object" && c instanceof Array)
        this.add(c);
};

_api.AST.prototype.isA = function (t) {
    return (this.T === t);
};

_api.AST.prototype.pos = function (L, C, O) {
    this.P.L = L;
    this.P.C = C;
    this.P.O = O;
    return this;
};

_api.AST.prototype.set = function () {
    if (arguments.length === 1 && typeof arguments[0] === "object")
        for (var key in arguments[0])
            this.A[key] = arguments[0][key];
    else if (arguments.length === 2)
        this.A[arguments[0]] = arguments[1];
    else
        throw new Error("set: invalid arguments");
    return this;
};

_api.AST.prototype.get = function (key) {
    if (typeof key !== "string")
        throw new Error("get: invalid argument");
    return this.A[key];
};

_api.AST.prototype.childs = function () {
    return this.C;
};

_api.AST.prototype.add = function () {
    if (arguments.length === 0)
        throw new Error("add: invalid argument");
    var add = function (C, args) {
        for (var i = 0; i < args.length; i++) {
            if (!(   (typeof args[i].T === "string")
                  && (typeof args[i].A === "object")
                  && (typeof args[i].C === "object" && args[i].C instanceof Array)))
                throw new Error("add: invalid AST node: " + JSON.stringify(args[i]));
            C.push(args[i]);
        }
    };
    if (arguments.length === 1 && typeof arguments[0] === "object" && arguments[0] instanceof Array)
        add(this.C, arguments[0]);
    else
        add(this.C, arguments);
    return this;
};

_api.AST.prototype.del = function () {
    if (arguments.length === 0)
        throw new Error("del: invalid argument");
    for (var i = 0; i < arguments.length; i++) {
        var found = false;
        for (var j = 0; j < this.C.length; j++) {
            if (this.C[j] === arguments[i]) {
                this.C.splice(j, 1);
                found = true;
                break;
            }
        }
        if (!found)
            throw new Error("del: child not found");
    }
    return this;
};

_api.AST.prototype.walk = function (cb, after) {
    if (typeof after !== "boolean")
        after = false;
    var dump = function (node, depth) {
        if (!after)
            cb.call(null, node, depth);
        for (var i = 0; i < node.C.length; i++)
            dump(node.C[i], depth + 1);
        if (after)
            cb.call(null, node, depth);
    };
    dump(this, 0);
};

_api.AST.prototype.dump = function () {
    var dump = "";
    this.walk(function (node, depth) {
        for (var i = 0; i  < depth; i++)
            dump += "    ";
        dump += node.T + " ";
        var hasAttributes = false;
        var key;
        for (key in node.A) {
            if (!node.A.hasOwnProperty(key))
                continue;
            hasAttributes = true;
            break;
        }
        if (hasAttributes) {
            dump += "(";
            var first = true;
            for (key in node.A) {
                if (!node.A.hasOwnProperty(key))
                    continue;
                if (!first)
                    dump += ", ";
                else
                    first = false;
                dump += key + ": ";
                switch (typeof node.A[key]) {
                    case "string":
                        dump += "\"" + node.A[key].replace(/\n/, "\\n").replace(/"/, "\\\"") + "\"";
                        break;
                    default: 
                        dump += node.A[key];
                        break;
                }
            }
            dump += ") ";
        }
        dump += "[" + node.P.L + "/" + node.P.C + "]\n";
    });
    return dump;
};
