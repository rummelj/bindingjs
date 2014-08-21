/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


_api.util.tree.getAllRec = (tree, type, stopAtType, firstCall, accumulator) => {
    // type: string elements to search for with this type
    // stopAtType: string if walk comes to a tree with that type and this tree is not the root of the search,
    //         search is not continued at this point (optional)
    // firstCall: boolean whether it is the first call. Prevents stopping if ROOT.T === stopAt
    // accumulator: [] reference to a list of all variables found so far
    
    if (tree.isA(type)) {
        accumulator.push(tree)
    }
    if (firstCall || !stopAtType || !tree.isA(stopAtType)) {
        for (var i = 0; i < tree.childs().length; i++) {
            _api.util.tree.getAllRec(tree.childs()[i], type, stopAtType, false, accumulator)
        }
    }
}
    
/*  Tree (Tree)  */
class Tree {
    /*  constructor for a Tree node  */
    constructor () {
        if (!(this instanceof Tree)) {
            let self = new Tree("")
            return self.init.apply(self, arguments)
        }
        return this.init.apply(this, arguments)
    }

    /*  constructor helper: Tree node initialization  */
    init (T) {
        if (typeof T === "undefined")
            throw new Error("init: invalid argument")
        this.T = T
        this.A = {}
        this.C = []
        this.P = { L: 0, C: 0, O: 0 }
        // this.parent (Set when add is called)
        return this
    }
    
    clone () {
        let clone = Tree(this.T)
        clone.A = $api.$().extend({}, this.A)
        clone.P = $api.$().extend({}, this.P)
        for (var i = 0; i < this.C.length; i++) {
            clone.add(this.C[i].clone())
        }
        // Intentionally not setting parent
        return clone
    }

    /*  check the type of an Tree node  */
    isA (T) {
        return this.T === T
    }

    /*  set the parsing position   */
    pos (L = 0, C = 0, O = 0) {
        this.P.L = L
        this.P.C = C
        this.P.O = O
        return this
    }

    /*  set Tree node attributes  */
    set () {
        let args = arguments
        if (args.length === 1 && typeof args[0] === "object")
            Object.keys(args[0]).forEach((key) => this.A[key] = args[0][key])
        else if (args.length === 2)
            this.A[args[0]] = args[1]
        else
            throw new Error("set: invalid arguments")
        return this
    }

    /*  get Tree node attributes  */
    get (key) {
        if (typeof key !== "string")
            throw new Error("get: invalid argument")
        return this.A[key]
    }

    /*  get child Tree nodes  */
    childs () {
        return this.C
    }
    
    hasChild (type) {
        for (var i = 0; i < this.childs().length; i++) {
            if (this.childs()[i].isA(type)) {
                return true
            }
        }
        return false
    }

    getParent () {
        return this.parent
    }
    
    getAll (type, stopAtType) {
        let result = []
        _api.util.tree.getAllRec(this, type, stopAtType, true, result)
        return result
    }

    /*  add child Tree node(s)  */
    add () {
        if (arguments.length === 0)
            throw new Error("add: invalid argument")
        let self = this
        let _add = (C, node) => {
            if (!(   (typeof node   === "object")
                  && (typeof node.T === "string")
                  && (typeof node.P === "object")
                  && (typeof node.A === "object")
                  && (typeof node.C === "object" && node.C instanceof Array)))
                throw new Error("add: invalid Tree node: " + JSON.stringify(node))
            node.parent = self
            C.push(node)
        };
        Array.prototype.slice.call(arguments, 0).forEach((arg) => {
            if (typeof arg === "object" && arg instanceof Array)
                arg.forEach((child) => _add(this.C, child))
            else if (arg !== null)
                _add(this.C, arg)
        })
        return this
    }

    addAt (/* index, node */) {
        if (arguments.length < 2)
            throw new Error("addAt: invalid argument")
        let self = this
        let _add = (C, node, index) => {
            if (!(   (typeof node   === "object")
                  && (typeof node.T === "string")
                  && (typeof node.P === "object")
                  && (typeof node.A === "object")
                  && (typeof node.C === "object" && node.C instanceof Array)))
                throw new Error("add: invalid Tree node: " + node)
            node.parent = self
            C.splice(index, 0, node)
        };
        
        // Iterate backwards and do not add first argument which is the index
        let index = arguments[0]
        for (var i = arguments.length - 1; i >= 1; i--) {
            let arg = arguments[i]
            if (typeof arg === "object" && arg instanceof Array)
                arg.forEach((child) => _add(this.C, child, index))
            else if (arg !== null)
                _add(this.C, arg, index)
        }
        
        return this
    }
    
    replace() {
        if (!this.parent) {
            throw _api.util.exception("Cannot replace root of a Tree")
        }
        
        // Determine own index
        var index = this.parent.childs().indexOf(this)
        // Transform arguments to real array
        let args = Array.prototype.slice.call(arguments)
        // Push index in front
        args.splice(0, 0, index)
        // Add everything at this index
        this.parent.addAt.apply(this.parent, args)
        // Remove self from parent
        this.parent.del(this)
    }
    
    /*  delete child Tree node(s)  */
    del () {
        if (arguments.length === 0)
            throw new Error("del: invalid argument")
        Array.prototype.slice.call(arguments, 0).forEach((arg) => {
            let found = false
            for (let j = 0; j < this.C.length; j++) {
                if (this.C[j] === arg) {
                    this.C.splice(j, 1)
                    arg.parent = null
                    found = true
                    break
                }
            }
            if (!found)
                throw new Error("del: child not found")
        })
        return this
    }

    /*  walk the Tree recursively  */
    walk (cb, after = false) {
        let _walk = (node, depth) => {
            if (!after)
                cb.call(null, node, depth)
            node.C.forEach((child) => _walk(child, depth + 1))
            if (after)
                cb.call(null, node, depth)
        }
        _walk(this, 0)
    }

    /*  dump the Tree recursively  */
    dump () {
        let out = ""
        this.walk((node, depth) => {
            for (let i = 0; i < depth; i++)
                out += "    "
            out += node.T + " "
            let keys = Object.keys(node.A)
            if (keys.length > 0) {
                out += "("
                let first = true
                keys.forEach((key) => {
                    if (!first)
                        out += ", "
                    else
                        first = false
                    out += key + ": "
                    let value = node.A[key]
                    switch (typeof value) {
                        case "string":
                            out += "\"" + value.replace(/\n/, "\\n").replace(/"/, "\\\"") + "\""
                            break
                        case "object":
                            if (value instanceof RegExp)
                                out += "/" +
                                    value.toString()
                                    .replace(/^\//, "")
                                    .replace(/\/$/, "")
                                    .replace(/\//g, "\\/") +
                                "/"
                            else
                                out += value ? value.toString() : "null"
                            break
                        default:
                            out += value ? value.toString() : "null"
                            break
                    }
                })
                out += ") "
            }
            out += "[" + node.P.L + "/" + node.P.C + "]\n"
        })
        return out
    }
}

/*  export class  */
_api.util.Tree = Tree
