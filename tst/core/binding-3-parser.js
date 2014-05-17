/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

describe("BindingJS DSL Parser", function () {
    var path  = require("path")
    var fs    = require("fs")
    var util  = require("util")
    var chalk = require("chalk")
    describe("parse()", function () {
        it("allows the binding DSL to be parsed", function () {
            var dsl = fs.readFileSync(
                path.join(__dirname, "/../../smp/foo-view.binding.bd"),
                { encoding: "utf8" })
            var ast = bd.parse(dsl, "spec")
            if (ast.error !== null) {
                var e = ast.error
                var prefix1 = "line " + e.line + " (col " + e.column + "): "
                var prefix2 = ""
                for (var i = 0; i < prefix1.length + e.location.prolog.length; i++)
                    prefix2 += "-"
                console.log(
                    chalk.black("ERROR: ") + prefix1 + e.location.prolog + chalk.bold(chalk.red(e.location.token)) + e.location.epilog + "\n" +
                    chalk.black("ERROR: ") + chalk.bold(chalk.red(prefix2 + "^")) + "\n" +
                    chalk.black("ERROR: ") + chalk.red(ast.error.message) + "\n"
                )
            }
            else {
                console.log(ast.ast.dump()
                    .replace(/([A-Z][a-zA-Z0-9_$]+)( [(\[])/g, function (all, id, e) { return chalk.blue(id) + e; })
                    .replace(/([a-zA-Z][a-zA-Z0-9_$]*)(:)/g, function (all, id, e) { return chalk.black(id) + e; })
                    .replace(/(: )(".+?"|\d+|true|false)/g, function (all, p,  s) { return p + chalk.yellow(s); })
                    .replace(/(\[\d+\/\d+\])/g, function (all, p) { return chalk.gray(p); })
                );
            }
            expect(ast).to.have.keys([ "ast", "error" ])
            expect(ast).to.be.a("object")
        })
    })
})
