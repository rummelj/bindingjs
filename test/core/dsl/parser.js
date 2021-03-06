/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

describe("dsl/parser.js", function () {
    let path  = require("path")
    let fs    = require("fs")
    let chalk = require("chalk")
    describe("parse", function () {
        it("Allows the binding DSL to be parsed", () => {
            let dsl = fs.readFileSync(
                path.join(__dirname, "parser.bind"),
                { encoding: "utf8" })
            let ast = BindingJS.internal().dsl.parser.parser(dsl, "spec")
            if (ast.error !== null) {
                let e = ast.error
                let prefix1 = "line " + e.line + " (col " + e.column + "): "
                let prefix2 = ""
                for (let i = 0; i < prefix1.length + e.location.prolog.length; i++)
                    prefix2 += "-"
                throw new Error("PARSING FAILED\n" +
                    chalk.black("ERROR: ") + prefix1 + e.location.prolog +
                        chalk.bold(chalk.red(e.location.token)) + e.location.epilog + "\n" +
                    chalk.black("ERROR: ") + chalk.bold(chalk.red(prefix2 + "^")) + "\n" +
                    chalk.black("ERROR: ") + chalk.red(e.message) + "\n"
                )
            }
            expect(ast).to.have.keys([ "ast", "error" ])
            expect(ast).to.be.a("object")
        })
    })
})
