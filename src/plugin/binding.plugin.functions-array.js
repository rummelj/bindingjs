/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

include("../umd/umd-plugins-prolog.js", { library: "bindingjs", plugin: "functions-array", deps: "" })

class FunctionsArrayFill {
    process (arr, value, begin, end) {
        if (!(typeof arr === "object" && arr instanceof Array))
            throw new Error("first argument has to be an array")
        return arr.fill(value, begin, end)
    }
}

class FunctionsArrayLength {
    process (arr) {
        if (!(typeof arr === "object" && arr instanceof Array))
            throw new Error("first argument has to be an array")
        return arr.length
    }
}

class FunctionsArraySlice {
    process (arr, begin, end) {
        if (!(typeof arr === "object" && arr instanceof Array))
            throw new Error("first argument has to be an array")
        return arr.slice(begin, end)
    }
}

class FunctionsArraySplice {
    process (arr, index, howMany, insert) {
        if (!(typeof arr === "object" && arr instanceof Array))
            throw new Error("first argument has to be an array")
        return arr.splice(index, howMany, insert)
    }
}

class FunctionsArraySort {
    process (arr) {
        if (!(typeof arr === "object" && arr instanceof Array))
            throw new Error("first argument has to be an array")
        return arr.sort()
    }
}

class FunctionsArrayReverse {
    process (arr) {
        if (!(typeof arr === "object" && arr instanceof Array))
            throw new Error("first argument has to be an array")
        return arr.reverse()
    }
}

class FunctionsArrayJoin {
    process (arr, sep) {
        if (!(typeof arr === "object" && arr instanceof Array))
            throw new Error("first argument has to be an array")
        return arr.join(sep)
    }
}

$api.defineFunction("fill",    FunctionsArrayFill)
$api.defineFunction("length",  FunctionsArrayLength)
$api.defineFunction("slice",   FunctionsArraySlice)
$api.defineFunction("splice",  FunctionsArraySplice)
$api.defineFunction("sort",    FunctionsArraySort)
$api.defineFunction("reverse", FunctionsArrayReverse)
$api.defineFunction("join",    FunctionsArrayJoin)

include("../umd/umd-plugins-epilog.js")

